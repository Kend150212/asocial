import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/facebook — Initiate Facebook OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'facebook' },
    })

    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.facebookClientId || process.env.FACEBOOK_CLIENT_ID

    if (!clientId) {
        return NextResponse.json(
            { error: 'Facebook OAuth is not configured. Please add Facebook App ID in API Hub → Social Media → Facebook.' },
            { status: 400 }
        )
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/facebook/callback`

    const state = Buffer.from(JSON.stringify({
        channelId,
        userId: session.user.id,
    })).toString('base64url')

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement,pages_manage_posts')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
