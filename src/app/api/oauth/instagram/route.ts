import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/instagram — Initiate Instagram OAuth (via Facebook/Meta)
// Instagram Business/Creator accounts are linked through Facebook Pages
// Uses the SAME Facebook App — same App ID and Secret
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    // Instagram uses the SAME Facebook App (App ID + Secret)
    // Check both 'instagram' and 'facebook' integrations for the App ID
    let integration = await prisma.apiIntegration.findFirst({ where: { provider: 'instagram' } })
    let clientId = ''

    if (integration) {
        const config = (integration.config || {}) as Record<string, string>
        clientId = config.instagramClientId || ''
    }

    // Fallback: use Facebook App ID (since Instagram API uses the same app)
    if (!clientId) {
        const fbIntegration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
        const fbConfig = (fbIntegration?.config || {}) as Record<string, string>
        clientId = fbConfig.facebookClientId || process.env.FACEBOOK_CLIENT_ID || ''
    }

    if (!clientId) {
        return NextResponse.json({
            error: 'Instagram OAuth is not configured. Instagram uses the same Facebook App — please add Facebook App ID in API Hub → Social Media → Facebook first.',
        }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/instagram/callback`

    const state = Buffer.from(JSON.stringify({ channelId, userId: session.user.id })).toString('base64url')

    // Instagram Business API uses Facebook OAuth with Instagram-specific scopes
    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    // instagram_basic = read IG profile + media (Facebook Login scope)
    // instagram_content_publish = post to IG (Facebook Login scope)
    // pages_show_list = list Facebook pages (needed to find linked IG accounts)
    // pages_read_engagement = read page content
    authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish,instagram_manage_messages,instagram_manage_comments,pages_show_list,pages_read_engagement')
    authUrl.searchParams.set('auth_type', 'rerequest')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
