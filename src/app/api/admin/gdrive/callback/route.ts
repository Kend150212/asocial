import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import {
    exchangeCodeForTokens,
    getGoogleUserEmail,
    storeGDriveTokens,
    getRedirectUri,
} from '@/lib/gdrive'

// GET /api/admin/gdrive/callback — Google OAuth2 callback
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectPage = `${baseUrl}/admin/integrations`

    if (error) {
        return NextResponse.redirect(
            `${redirectPage}?gdrive=error&message=${encodeURIComponent(error)}`
        )
    }

    if (!code) {
        return NextResponse.redirect(
            `${redirectPage}?gdrive=error&message=${encodeURIComponent('No authorization code received')}`
        )
    }

    try {
        const integration = await prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive' },
        })

        if (!integration) {
            return NextResponse.redirect(
                `${redirectPage}?gdrive=error&message=${encodeURIComponent('Integration not found')}`
            )
        }

        const config = (integration.config || {}) as Record<string, string>
        const clientId = config.gdriveClientId

        if (!clientId || !integration.apiKeyEncrypted) {
            return NextResponse.redirect(
                `${redirectPage}?gdrive=error&message=${encodeURIComponent('Client ID or Secret not configured')}`
            )
        }

        const clientSecret = decrypt(integration.apiKeyEncrypted)
        const redirectUri = getRedirectUri()

        // Exchange code for tokens
        const { accessToken, refreshToken } = await exchangeCodeForTokens(
            code,
            clientId,
            clientSecret,
            redirectUri
        )

        // Get user email
        const email = await getGoogleUserEmail(accessToken)

        // Store refresh token and email in config
        await storeGDriveTokens(integration.id, refreshToken, email)

        return NextResponse.redirect(`${redirectPage}?gdrive=connected`)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed'
        return NextResponse.redirect(
            `${redirectPage}?gdrive=error&message=${encodeURIComponent(message)}`
        )
    }
}
