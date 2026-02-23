import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET /api/oauth/gbp — Initiate Google Business Profile OAuth
// Uses Google OAuth 2.0 with Business Profile API scope
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
        return NextResponse.json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to your environment.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/gbp/callback`

    const state = Buffer.from(JSON.stringify({ channelId, userId: session.user.id })).toString('base64url')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/plus.business.manage',
        'profile',
        'email',
    ].join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')  // Force refresh token
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
