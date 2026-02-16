import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/youtube/callback — Handle Google OAuth callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
        // User denied the request
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))
    }

    // Decode state
    let state: { channelId: string; userId: string }
    try {
        state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    } catch {
        return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))
    }

    const host = req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/youtube/callback`

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        if (!tokenRes.ok) {
            const err = await tokenRes.text()
            console.error('YouTube token exchange failed:', err)
            return NextResponse.redirect(
                new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin)
            )
        }

        const tokens = await tokenRes.json()
        const accessToken = tokens.access_token
        const refreshToken = tokens.refresh_token
        const expiresIn = tokens.expires_in // seconds

        // Fetch YouTube channels for this user
        const ytRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )

        if (!ytRes.ok) {
            console.error('YouTube API failed:', await ytRes.text())
            return NextResponse.redirect(
                new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=youtube_api_failed`, req.nextUrl.origin)
            )
        }

        const ytData = await ytRes.json()
        const channels = ytData.items || []

        let imported = 0
        for (const ch of channels) {
            const channelId = ch.id
            const channelTitle = ch.snippet?.title || 'YouTube Channel'

            // Upsert — update tokens if already exists, create if not
            await prisma.channelPlatform.upsert({
                where: {
                    channelId_platform_accountId: {
                        channelId: state.channelId,
                        platform: 'youtube',
                        accountId: channelId,
                    },
                },
                update: {
                    accountName: channelTitle,
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
                    platform: 'youtube',
                    accountId: channelId,
                    accountName: channelTitle,
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
            imported++
        }

        // Redirect back to channel page with success
        return NextResponse.redirect(
            new URL(
                `/dashboard/channels/${state.channelId}?tab=platforms&oauth=youtube&imported=${imported}`,
                req.nextUrl.origin
            )
        )
    } catch (err) {
        console.error('YouTube OAuth callback error:', err)
        return NextResponse.redirect(
            new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin)
        )
    }
}
