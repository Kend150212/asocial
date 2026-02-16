import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/facebook/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.facebookClientId || process.env.FACEBOOK_CLIENT_ID
    let clientSecret = process.env.FACEBOOK_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/facebook/callback`

    try {
        // Exchange code for user access token
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
        tokenUrl.searchParams.set('client_id', clientId)
        tokenUrl.searchParams.set('client_secret', clientSecret)
        tokenUrl.searchParams.set('code', code)
        tokenUrl.searchParams.set('redirect_uri', redirectUri)

        const tokenRes = await fetch(tokenUrl.toString())
        if (!tokenRes.ok) {
            console.error('Facebook token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const userAccessToken = tokens.access_token

        // Get user's Facebook pages
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`)
        const pagesData = await pagesRes.json()
        const pages = pagesData.data || []

        let imported = 0
        for (const page of pages) {
            await prisma.channelPlatform.upsert({
                where: {
                    channelId_platform_accountId: {
                        channelId: state.channelId,
                        platform: 'facebook',
                        accountId: page.id,
                    },
                },
                update: {
                    accountName: page.name,
                    accessToken: page.access_token, // page-level token
                    connectedBy: state.userId,
                    isActive: true,
                },
                create: {
                    channelId: state.channelId,
                    platform: 'facebook',
                    accountId: page.id,
                    accountName: page.name,
                    accessToken: page.access_token,
                    connectedBy: state.userId,
                    isActive: true,
                    config: { source: 'oauth' },
                },
            })
            imported++
        }

        // If no pages, store user profile
        if (imported === 0) {
            const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userAccessToken}`)
            const me = await meRes.json()
            await prisma.channelPlatform.upsert({
                where: {
                    channelId_platform_accountId: {
                        channelId: state.channelId,
                        platform: 'facebook',
                        accountId: me.id,
                    },
                },
                update: { accountName: me.name, accessToken: userAccessToken, connectedBy: state.userId, isActive: true },
                create: {
                    channelId: state.channelId, platform: 'facebook', accountId: me.id, accountName: me.name,
                    accessToken: userAccessToken, connectedBy: state.userId, isActive: true, config: { source: 'oauth' },
                },
            })
            imported = 1
        }

        const successUrl = `/dashboard/channels/${state.channelId}?tab=platforms&oauth=facebook&imported=${imported}`
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>Facebook Connected</title></head><body>
            <script>
                if (window.opener) { window.opener.postMessage({ type: 'oauth-success', platform: 'facebook' }, '*'); window.close(); }
                else { window.location.href = '${successUrl}'; }
            </script><p>Facebook connected! Redirecting...</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('Facebook OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
