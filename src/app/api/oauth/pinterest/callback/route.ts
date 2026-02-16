import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/pinterest/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'pinterest' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.pinterestClientId || process.env.PINTEREST_CLIENT_ID
    let clientSecret = process.env.PINTEREST_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/pinterest/callback`

    try {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        })
        if (!tokenRes.ok) {
            console.error('Pinterest token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const accessToken = tokens.access_token
        const refreshToken = tokens.refresh_token
        const expiresIn = tokens.expires_in

        // Get Pinterest user info
        const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        let username = 'Pinterest Account'
        let userId = 'unknown'
        if (userRes.ok) {
            const userData = await userRes.json()
            username = userData.username || userData.business_name || username
            userId = userData.id || userId
        }

        await prisma.channelPlatform.upsert({
            where: {
                channelId_platform_accountId: {
                    channelId: state.channelId,
                    platform: 'pinterest',
                    accountId: userId,
                },
            },
            update: { accountName: username, accessToken, refreshToken: refreshToken || undefined, tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null, connectedBy: state.userId, isActive: true },
            create: {
                channelId: state.channelId, platform: 'pinterest', accountId: userId, accountName: username,
                accessToken, refreshToken: refreshToken || undefined, tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                connectedBy: state.userId, isActive: true, config: { source: 'oauth' },
            },
        })

        const successUrl = `/dashboard/channels/${state.channelId}?tab=platforms&oauth=pinterest&imported=1`
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>Pinterest Connected</title></head><body>
            <script>
                if (window.opener) { window.opener.postMessage({ type: 'oauth-success', platform: 'pinterest' }, '*'); window.close(); }
                else { window.location.href = '${successUrl}'; }
            </script><p>Pinterest connected! Redirecting...</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('Pinterest OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
