import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/pinterest — Initiate Pinterest OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'pinterest' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.pinterestClientId || process.env.PINTEREST_CLIENT_ID

    if (!clientId) {
        return NextResponse.json({ error: 'Pinterest OAuth is not configured. Please add Pinterest App ID in API Hub.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/pinterest/callback`

    const state = Buffer.from(JSON.stringify({ channelId, userId: session.user.id })).toString('base64url')

    const authUrl = new URL('https://www.pinterest.com/oauth/')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'boards:read,boards:write,pins:read,pins:write,user_accounts:read')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
