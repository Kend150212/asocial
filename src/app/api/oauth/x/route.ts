import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// GET /api/oauth/x — Initiate X (Twitter) OAuth 2.0 with PKCE
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'x' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.xClientId || process.env.X_CLIENT_ID

    if (!clientId) {
        return NextResponse.json({ error: 'X (Twitter) OAuth is not configured. Please add X Client ID in API Hub.' }, { status: 400 })
    }

    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/x/callback`

    const state = Buffer.from(JSON.stringify({ channelId, userId: session.user.id, codeVerifier })).toString('base64url')

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(authUrl.toString())
}
