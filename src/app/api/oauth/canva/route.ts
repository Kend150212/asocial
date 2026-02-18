import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import crypto from 'crypto'

// Generate PKCE code verifier and challenge
function generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url')
    const challenge = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url')
    return { verifier, challenge }
}

// GET /api/oauth/canva — Initiate Canva OAuth flow with PKCE
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    const returnUrl = req.nextUrl.searchParams.get('returnUrl') || '/admin/integrations'

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.canvaClientId || process.env.CANVA_CLIENT_ID

    if (!clientId) {
        return NextResponse.json({ error: 'Canva OAuth is not configured. Please add Canva Client ID in API Hub.' }, { status: 400 })
    }

    // Verify client secret exists
    let clientSecret = process.env.CANVA_CLIENT_SECRET || ''
    if (!clientSecret && integration?.apiKeyEncrypted) {
        clientSecret = decrypt(integration.apiKeyEncrypted)
    }
    if (!clientSecret) {
        return NextResponse.json({ error: 'Canva Client Secret is not configured.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/canva/callback`

    // Generate PKCE pair
    const { verifier, challenge } = generatePKCE()

    // Include code_verifier and returnUrl in state so callback can retrieve them
    const state = Buffer.from(JSON.stringify({
        channelId: channelId || '',
        userId: session.user.id,
        codeVerifier: verifier,
        returnUrl,
    })).toString('base64url')

    // Canva OAuth 2.0 with PKCE
    const authUrl = new URL('https://www.canva.com/api/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'profile:read design:content:read design:content:write design:meta:read asset:read asset:write brandtemplate:meta:read brandtemplate:content:read')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('code_challenge', challenge)

    return NextResponse.redirect(authUrl.toString())
}
