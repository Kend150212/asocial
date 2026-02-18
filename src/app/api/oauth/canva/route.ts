import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/canva — Initiate Canva OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.canvaClientId || process.env.CANVA_CLIENT_ID

    if (!clientId) {
        return NextResponse.json({ error: 'Canva OAuth is not configured. Please add Canva Client ID in API Hub.' }, { status: 400 })
    }

    // Get client secret for PKCE
    let clientSecret = process.env.CANVA_CLIENT_SECRET || ''
    if (!clientSecret && integration?.apiKeyEncrypted) {
        clientSecret = decrypt(integration.apiKeyEncrypted)
    }
    if (!clientSecret) {
        return NextResponse.json({ error: 'Canva Client Secret is not configured.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/canva/callback`

    const state = Buffer.from(JSON.stringify({
        channelId: channelId || '',
        userId: session.user.id,
    })).toString('base64url')

    // Canva uses standard OAuth 2.0 authorization code flow
    const authUrl = new URL('https://www.canva.com/api/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'design:content:read design:content:write design:meta:read asset:read asset:write profile:read')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
