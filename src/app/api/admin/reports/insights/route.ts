import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Facebook Graph API ──────────────────────────────────────────────
async function fetchFacebookInsights(channelPlatform: {
    accountId: string
    accountName: string
    accessToken: string | null
}) {
    if (!channelPlatform.accessToken) return null
    const token = channelPlatform.accessToken
    const pageId = channelPlatform.accountId

    try {
        // Page-level metrics (followers, likes)
        const pageRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=followers_count,fan_count,name&access_token=${token}`
        )
        const pageData = await pageRes.json()
        if (pageData.error) return null

        // Page insights (last 30 days)
        const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}/insights?metric=page_post_engagements,page_impressions,page_reach,page_fans_adds_unique&period=day&since=${Math.floor((Date.now() - 30 * 86400000) / 1000)}&until=${Math.floor(Date.now() / 1000)}&access_token=${token}`
        )
        const insightsData = await insightsRes.json()

        let totalEngagement = 0, totalImpressions = 0, totalReach = 0, newFollowers = 0
        if (insightsData.data) {
            for (const metric of insightsData.data) {
                const sum = metric.values?.reduce((acc: number, v: { value: number }) => acc + (v.value || 0), 0) || 0
                if (metric.name === 'page_post_engagements') totalEngagement = sum
                if (metric.name === 'page_impressions') totalImpressions = sum
                if (metric.name === 'page_reach') totalReach = sum
                if (metric.name === 'page_fans_adds_unique') newFollowers = sum
            }
        }

        return {
            platform: 'facebook',
            accountName: pageData.name || channelPlatform.accountName,
            followers: pageData.followers_count ?? pageData.fan_count ?? 0,
            newFollowers,
            engagement: totalEngagement,
            impressions: totalImpressions,
            reach: totalReach,
        }
    } catch {
        return null
    }
}

// ─── Instagram Graph API ─────────────────────────────────────────────
async function fetchInstagramInsights(channelPlatform: {
    accountId: string
    accountName: string
    accessToken: string | null
    config: unknown
}) {
    if (!channelPlatform.accessToken) return null
    const token = channelPlatform.accessToken
    const cfg = (channelPlatform.config as Record<string, string>) || {}
    // Instagram Business Account ID (stored in config.instagramAccountId or use accountId)
    const igAccountId = cfg.instagramAccountId || channelPlatform.accountId

    try {
        // Account info
        const accountRes = await fetch(
            `https://graph.facebook.com/v21.0/${igAccountId}?fields=followers_count,media_count,username&access_token=${token}`
        )
        const accountData = await accountRes.json()
        if (accountData.error) return null

        // Account-level insights
        const since = Math.floor((Date.now() - 30 * 86400000) / 1000)
        const until = Math.floor(Date.now() / 1000)
        const insightRes = await fetch(
            `https://graph.facebook.com/v21.0/${igAccountId}/insights?metric=impressions,reach,profile_views,follower_count&period=day&since=${since}&until=${until}&access_token=${token}`
        )
        const insightData = await insightRes.json()

        let totalImpressions = 0, totalReach = 0
        if (insightData.data) {
            for (const metric of insightData.data) {
                const sum = metric.values?.reduce((acc: number, v: { value: number }) => acc + (v.value || 0), 0) || 0
                if (metric.name === 'impressions') totalImpressions = sum
                if (metric.name === 'reach') totalReach = sum
            }
        }

        return {
            platform: 'instagram',
            accountName: accountData.username || channelPlatform.accountName,
            followers: accountData.followers_count ?? 0,
            mediaCount: accountData.media_count ?? 0,
            impressions: totalImpressions,
            reach: totalReach,
            engagement: 0, // calculated from posts below
        }
    } catch {
        return null
    }
}

// ─── YouTube Data API v3 ─────────────────────────────────────────────
async function fetchYouTubeInsights(channelPlatform: {
    accountId: string
    accountName: string
    accessToken: string | null
}) {
    if (!channelPlatform.accessToken) return null
    const token = channelPlatform.accessToken

    try {
        // Channel statistics
        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true&access_token=${token}`
        )
        const channelData = await channelRes.json()
        if (channelData.error || !channelData.items?.length) return null

        const stats = channelData.items[0].statistics
        const snippet = channelData.items[0].snippet

        // Recent videos (last 10)
        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelData.items[0].id}&maxResults=10&order=date&type=video&access_token=${token}`
        )
        const searchData = await searchRes.json()
        let totalViews = 0, totalLikes = 0, totalComments = 0
        if (searchData.items?.length) {
            const videoIds = searchData.items.map((i: { id: { videoId: string } }) => i.id.videoId).join(',')
            const videoRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&access_token=${token}`
            )
            const videoData = await videoRes.json()
            for (const v of videoData.items || []) {
                totalViews += parseInt(v.statistics?.viewCount || '0')
                totalLikes += parseInt(v.statistics?.likeCount || '0')
                totalComments += parseInt(v.statistics?.commentCount || '0')
            }
        }

        return {
            platform: 'youtube',
            accountName: snippet?.title || channelPlatform.accountName,
            followers: parseInt(stats?.subscriberCount || '0'),
            totalViews: parseInt(stats?.viewCount || '0'),
            videoCount: parseInt(stats?.videoCount || '0'),
            recentViews: totalViews,
            recentLikes: totalLikes,
            recentComments: totalComments,
            engagement: totalLikes + totalComments,
            impressions: totalViews,
            reach: totalViews,
        }
    } catch {
        return null
    }
}

// ─── Post-level insights (Facebook/Instagram per-post) ───────────────
async function fetchPostInsights(channelId: string | null) {
    const where = channelId
        ? { post: { channelId }, status: 'published' }
        : { status: 'published' }

    const publishedStatuses = await prisma.postPlatformStatus.findMany({
        where,
        select: {
            id: true,
            platform: true,
            externalId: true,
            publishedAt: true,
            config: true,
            post: {
                select: {
                    id: true,
                    content: true,
                    media: {
                        take: 1,
                        select: { mediaItem: { select: { url: true, thumbnailUrl: true } } },
                    },
                },
            },
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
    })

    // Return stored config stats (already saved during publish or periodic sync)
    return publishedStatuses.map(ps => {
        const cfg = (ps.config as Record<string, unknown>) || {}
        return {
            postId: ps.post.id,
            platform: ps.platform,
            externalId: ps.externalId,
            publishedAt: ps.publishedAt,
            content: ps.post.content?.slice(0, 100),
            thumbnail: ps.post.media[0]?.mediaItem?.thumbnailUrl || ps.post.media[0]?.mediaItem?.url || null,
            likes: cfg.likes ?? 0,
            comments: cfg.comments ?? 0,
            shares: cfg.shares ?? 0,
            reach: cfg.reach ?? 0,
            impressions: cfg.impressions ?? 0,
        }
    })
}

// ─── Main Handler ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    // Fetch connected platforms for this channel
    const platforms = await prisma.channelPlatform.findMany({
        where: channelId
            ? { channelId, isActive: true }
            : { isActive: true },
        select: {
            platform: true,
            accountId: true,
            accountName: true,
            accessToken: true,
            config: true,
        },
    })

    // Fetch insights in parallel per platform
    const insights = await Promise.all(
        platforms.map(async (cp) => {
            if (cp.platform === 'facebook') return fetchFacebookInsights(cp)
            if (cp.platform === 'instagram') return fetchInstagramInsights(cp)
            if (cp.platform === 'youtube') return fetchYouTubeInsights(cp)
            // Other platforms (tiktok, linkedin, pinterest) — pending API approval
            return {
                platform: cp.platform,
                accountName: cp.accountName,
                followers: null,
                engagement: null,
                impressions: null,
                reach: null,
                pendingApproval: true,
            }
        })
    )

    const postInsights = await fetchPostInsights(channelId)

    return NextResponse.json({
        platformInsights: insights.filter(Boolean),
        postInsights,
    })
}
