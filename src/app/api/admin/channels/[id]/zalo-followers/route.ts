import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/admin/channels/[id]/zalo-followers — Fetch Zalo OA followers
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: channelId } = await params

    // Get channel's Zalo config
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { webhookZalo: true },
    })

    const zaloConfig = (channel?.webhookZalo || {}) as Record<string, string>

    if (!zaloConfig.accessToken && !zaloConfig.refreshToken) {
        return NextResponse.json({ error: 'Zalo OA not connected' }, { status: 400 })
    }

    // Get a valid access token (refresh if needed)
    let accessToken = zaloConfig.accessToken
    if (!accessToken && zaloConfig.refreshToken) {
        // Fetch App ID + Secret from ApiIntegration
        const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'zalo' } })
        const config = (integration?.config || {}) as Record<string, string>
        const appId = config.zaloAppId || process.env.ZALO_APP_ID || ''
        let secretKey = process.env.ZALO_APP_SECRET || ''
        if (!secretKey && integration?.apiKeyEncrypted) {
            secretKey = decrypt(integration.apiKeyEncrypted)
        }

        if (appId && secretKey) {
            try {
                const res = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: secretKey },
                    body: new URLSearchParams({
                        refresh_token: zaloConfig.refreshToken,
                        app_id: appId,
                        grant_type: 'refresh_token',
                    }),
                })
                const data = await res.json()
                if (data.access_token) {
                    accessToken = data.access_token
                    // Update stored token
                    await prisma.channel.update({
                        where: { id: channelId },
                        data: {
                            webhookZalo: {
                                ...zaloConfig,
                                accessToken: data.access_token,
                                ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
                            },
                        },
                    })
                }
            } catch (err) {
                console.error('[Zalo Followers] Token refresh failed:', err)
            }
        }
    }

    if (!accessToken) {
        return NextResponse.json({ error: 'Cannot obtain access token' }, { status: 400 })
    }

    // Fetch followers
    try {
        const followersRes = await fetch('https://openapi.zalo.me/v2.0/oa/getfollowers?data={"offset":0,"count":50}', {
            headers: { access_token: accessToken },
        })

        const followersData = await followersRes.json()

        if (followersData.error && followersData.error !== 0) {
            return NextResponse.json({
                error: followersData.message || 'Failed to fetch followers',
                code: followersData.error,
            }, { status: 400 })
        }

        const followerIds: string[] = followersData.data?.followers || []

        // Fetch profile for each follower (max 50)
        const followers = await Promise.all(
            followerIds.slice(0, 50).map(async (item: unknown) => {
                const userId = typeof item === 'string' ? item : (item as { user_id: string }).user_id
                try {
                    const profileRes = await fetch(`https://openapi.zalo.me/v2.0/oa/getprofile?data={"user_id":"${userId}"}`, {
                        headers: { access_token: accessToken! },
                    })
                    const profile = await profileRes.json()
                    if (profile.data) {
                        return {
                            userId: profile.data.user_id || userId,
                            displayName: profile.data.display_name || 'Unknown',
                            avatar: profile.data.avatar || profile.data.avatars?.['120'] || '',
                        }
                    }
                    return { userId, displayName: 'Unknown', avatar: '' }
                } catch {
                    return { userId, displayName: 'Unknown', avatar: '' }
                }
            })
        )

        return NextResponse.json({
            total: followersData.data?.total || followers.length,
            followers,
        })
    } catch (err) {
        console.error('[Zalo Followers] Fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 })
    }
}
