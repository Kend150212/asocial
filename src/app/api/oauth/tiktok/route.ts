import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET /api/oauth/tiktok — Initiate TikTok OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    if (!clientKey) {
        return NextResponse.json(
            { error: 'TikTok OAuth is not configured. Please add TIKTOK_CLIENT_KEY to environment.' },
            { status: 400 }
        )
    }

    const host = req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/tiktok/callback`

    // state encodes channelId + userId for the callback
    const state = Buffer.from(JSON.stringify({
        channelId,
        userId: session.user.id,
    })).toString('base64url')

    // TikTok OAuth 2.0 authorization endpoint
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    authUrl.searchParams.set('client_key', clientKey)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'user.info.basic,video.list')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
