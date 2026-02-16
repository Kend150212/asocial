import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET /api/oauth/youtube — Initiate YouTube OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
        return NextResponse.json(
            { error: 'YouTube OAuth is not configured. Please add GOOGLE_CLIENT_ID to environment.' },
            { status: 400 }
        )
    }

    // Build the redirect URI based on the current host
    const host = req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/youtube/callback`

    // state encodes channelId + userId for the callback
    const state = Buffer.from(JSON.stringify({
        channelId,
        userId: session.user.id,
    })).toString('base64url')

    const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(authUrl.toString())
}
