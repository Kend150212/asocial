import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/threads/callback — Threads OAuth Callback
// Exchanges code for access token and stores Threads account info
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'threads' } })
    if (!integration) {
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=not_configured`, req.nextUrl.origin))
    }

    const config = (integration.config || {}) as Record<string, string>
    const clientId = config.threadsClientId
    const clientSecret = integration.apiKeyEncrypted ? (() => { try { return decrypt(integration.apiKeyEncrypted!) } catch { return integration.apiKeyEncrypted! } })() : ''

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=not_configured`, req.nextUrl.origin))
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/threads/callback`

    try {
        // Step 1: Exchange short-lived code for short-lived token
        const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        })

        if (!tokenRes.ok) {
            console.error('[Threads OAuth] Short-lived token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }

        const shortToken = await tokenRes.json()
        const shortAccessToken = shortToken.access_token
        const userId = shortToken.user_id

        // Step 2: Exchange for long-lived token (valid 60 days)
        const longTokenRes = await fetch(
            `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${shortAccessToken}`
        )
        const longToken = await longTokenRes.json()
        const accessToken = longToken.access_token || shortAccessToken

        // Step 3: Get user profile via /me (resolves correct Threads user ID from token)
        const profileRes = await fetch(
            `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${accessToken}`
        )
        const profile = await profileRes.json()
        if (!profileRes.ok || profile.error) {
            console.error('[Threads OAuth] Profile fetch failed:', JSON.stringify(profile))
        }

        const accountId = profile.id || String(userId)
        // Use username first, then name, then bare numeric ID (no prefix)
        const accountName = profile.username || profile.name || String(userId)

        // Step 4: Upsert into channelPlatform
        await prisma.channelPlatform.upsert({
            where: {
                channelId_platform_accountId: {
                    channelId: state.channelId,
                    platform: 'threads',
                    accountId,
                },
            },
            update: {
                accountName,
                accessToken,
                connectedBy: state.userId,
                isActive: true,
                config: {
                    source: 'oauth',
                    profilePictureUrl: profile.threads_profile_picture_url || null,
                    biography: profile.threads_biography || null,
                },
            },
            create: {
                channelId: state.channelId,
                platform: 'threads',
                accountId,
                accountName,
                accessToken,
                connectedBy: state.userId,
                isActive: true,
                config: {
                    source: 'oauth',
                    profilePictureUrl: profile.threads_profile_picture_url || null,
                    biography: profile.threads_biography || null,
                },
            },
        })

        console.log(`[Threads OAuth] ✅ Connected: @${accountName} (${accountId})`)

        return new NextResponse(
            `<!DOCTYPE html><html><head><title>Threads Connected</title></head><body>
            <script>
                if (window.opener) { window.opener.postMessage({ type: 'oauth-success', platform: 'threads' }, '*'); window.close(); }
                else { window.location.href = '/dashboard/channels/${state.channelId}?tab=platforms&oauth=threads'; }
            </script><p>Threads connected! Redirecting...</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('[Threads OAuth] Callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
