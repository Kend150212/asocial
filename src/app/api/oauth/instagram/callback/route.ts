import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/instagram/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'instagram' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.instagramClientId || process.env.INSTAGRAM_CLIENT_ID
    let clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/instagram/callback`

    try {
        // Exchange code for token
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
        tokenUrl.searchParams.set('client_id', clientId)
        tokenUrl.searchParams.set('client_secret', clientSecret)
        tokenUrl.searchParams.set('code', code)
        tokenUrl.searchParams.set('redirect_uri', redirectUri)

        const tokenRes = await fetch(tokenUrl.toString())
        if (!tokenRes.ok) {
            console.error('Instagram token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const userAccessToken = tokens.access_token

        // Get pages, then get Instagram Business accounts linked to pages
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${userAccessToken}`)
        const pagesData = await pagesRes.json()
        const pages = pagesData.data || []

        let imported = 0
        for (const page of pages) {
            const igAccount = page.instagram_business_account
            if (!igAccount) continue

            // Get IG username
            const igRes = await fetch(`https://graph.facebook.com/v19.0/${igAccount.id}?fields=id,username,name&access_token=${userAccessToken}`)
            const igData = await igRes.json()

            await prisma.channelPlatform.upsert({
                where: {
                    channelId_platform_accountId: {
                        channelId: state.channelId,
                        platform: 'instagram',
                        accountId: igData.id,
                    },
                },
                update: {
                    accountName: igData.username || igData.name || page.name,
                    accessToken: userAccessToken,
                    connectedBy: state.userId,
                    isActive: true,
                },
                create: {
                    channelId: state.channelId,
                    platform: 'instagram',
                    accountId: igData.id,
                    accountName: igData.username || igData.name || page.name,
                    accessToken: userAccessToken,
                    connectedBy: state.userId,
                    isActive: true,
                    config: { source: 'oauth', pageId: page.id },
                },
            })
            imported++
        }

        if (imported === 0) {
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=no_ig_accounts`, req.nextUrl.origin))
        }

        const successUrl = `/dashboard/channels/${state.channelId}?tab=platforms&oauth=instagram&imported=${imported}`
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>Instagram Connected</title></head><body>
            <script>
                if (window.opener) { window.opener.postMessage({ type: 'oauth-success', platform: 'instagram' }, '*'); window.close(); }
                else { window.location.href = '${successUrl}'; }
            </script><p>Instagram connected! Redirecting...</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('Instagram OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
