import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/linkedin — Initiate LinkedIn OAuth flow
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'linkedin' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.linkedinClientId || process.env.LINKEDIN_CLIENT_ID

    if (!clientId) {
        return NextResponse.json({ error: 'LinkedIn OAuth is not configured. Please add LinkedIn Client ID in API Hub.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/linkedin/callback`

    const state = Buffer.from(JSON.stringify({ channelId, userId: session.user.id })).toString('base64url')

    // Base scopes for personal posting
    let scopes = 'openid profile w_member_social'
    // Add organization scopes if company is verified (set linkedinOrgEnabled in config)
    if (config.linkedinOrgEnabled === 'true') {
        scopes += ' w_organization_social r_organization_social'
    }

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
