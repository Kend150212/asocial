import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/tiktok/callback — Handle TikTok OAuth callback with PKCE
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))
    }

    // Decode state (includes codeVerifier for PKCE)
    let state: { channelId: string; userId: string; codeVerifier: string }
    try {
        state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    } catch {
        return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin))
    }

    // Read credentials from database (API Hub)
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'tiktok' },
    })

    const config = (integration?.config || {}) as Record<string, string>
    const clientKey = config.tiktokClientKey || process.env.TIKTOK_CLIENT_KEY
    let clientSecret = process.env.TIKTOK_CLIENT_SECRET || ''

    // Client secret is stored encrypted as apiKeyEncrypted
    if (integration?.apiKeyEncrypted) {
        try {
            clientSecret = decrypt(integration.apiKeyEncrypted)
        } catch {
            clientSecret = integration.apiKeyEncrypted
        }
    }

    if (!clientKey || !clientSecret) {
        return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))
    }

    const host = req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/tiktok/callback`

    try {
        // Exchange code for tokens (with PKCE code_verifier)
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: state.codeVerifier,
            }),
        })

        if (!tokenRes.ok) {
            const err = await tokenRes.text()
            console.error('TikTok token exchange failed:', err)
            return NextResponse.redirect(
                new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin)
            )
        }

        const tokens = await tokenRes.json()
        const accessToken = tokens.access_token
        const refreshToken = tokens.refresh_token
        const expiresIn = tokens.expires_in
        const openId = tokens.open_id

        // Fetch TikTok user info
        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        let displayName = 'TikTok Account'
        if (userRes.ok) {
            const userData = await userRes.json()
            displayName = userData?.data?.user?.display_name || displayName
        }

        // Upsert the TikTok channel platform entry
        await prisma.channelPlatform.upsert({
            where: {
                channelId_platform_accountId: {
                    channelId: state.channelId,
                    platform: 'tiktok',
                    accountId: openId,
                },
            },
            update: {
                accountName: displayName,
                accessToken,
                refreshToken: refreshToken || undefined,
                tokenExpiresAt: expiresIn
                    ? new Date(Date.now() + expiresIn * 1000)
                    : null,
                connectedBy: state.userId,
                isActive: true,
            },
            create: {
                channelId: state.channelId,
                platform: 'tiktok',
                accountId: openId,
                accountName: displayName,
                accessToken,
                refreshToken: refreshToken || undefined,
                tokenExpiresAt: expiresIn
                    ? new Date(Date.now() + expiresIn * 1000)
                    : null,
                connectedBy: state.userId,
                isActive: true,
                config: { source: 'oauth' },
            },
        })

        // Redirect — close popup or redirect to channel page
        const successUrl = `/dashboard/channels/${state.channelId}?tab=platforms&oauth=tiktok&imported=1`

        // Return HTML that closes popup and notifies parent window
        return new NextResponse(
            `<!DOCTYPE html>
            <html><head><title>TikTok Connected</title></head>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'oauth-success', platform: 'tiktok' }, '*');
                        window.close();
                    } else {
                        window.location.href = '${successUrl}';
                    }
                </script>
                <p>TikTok connected! Redirecting...</p>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('TikTok OAuth callback error:', err)
        return NextResponse.redirect(
            new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin)
        )
    }
}
