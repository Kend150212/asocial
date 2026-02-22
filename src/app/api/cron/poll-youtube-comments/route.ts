/**
 * YouTube Comment Polling
 *
 * GET /api/cron/poll-youtube-comments
 *
 * Polls YouTube Data API for new comments on published videos.
 * Creates inbox conversations for each comment thread.
 * Should be called via cron every 2-5 minutes.
 *
 * Usage:
 *   curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/poll-youtube-comments
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { botAutoReply, sendBotGreeting } from '@/lib/bot-auto-reply'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const CRON_SECRET = process.env.CRON_SECRET || ''
    if (CRON_SECRET) {
        const provided = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
        if (provided !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        const result = await pollYouTubeComments()
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[YT Comments] Polling error:', err)
        return NextResponse.json({ error: 'Polling failed' }, { status: 500 })
    }
}

async function pollYouTubeComments() {
    // Find all active YouTube platform accounts
    const ytAccounts = await prisma.channelPlatform.findMany({
        where: {
            platform: 'youtube',
            isActive: true,
        },
        include: {
            channel: {
                select: { id: true, name: true },
            },
        },
    })

    if (ytAccounts.length === 0) {
        return { message: 'No YouTube accounts connected', processed: 0 }
    }

    let totalComments = 0
    let newConversations = 0

    for (const account of ytAccounts) {
        try {
            let accessToken = account.accessToken

            // Refresh token if expired
            if (account.tokenExpiresAt && new Date() > account.tokenExpiresAt && account.refreshToken) {
                accessToken = await refreshYouTubeToken(account)
                if (!accessToken) {
                    console.warn(`[YT Comments] Failed to refresh token for ${account.accountName}`)
                    continue
                }
            }

            if (!accessToken) continue

            // Get recent videos from this channel (last 7 days)
            const videos = await getRecentVideos(accessToken, account.accountId)
            if (!videos.length) continue

            for (const video of videos) {
                const result = await pollVideoComments(
                    accessToken,
                    video,
                    account,
                )
                totalComments += result.total
                newConversations += result.newConvs
            }
        } catch (err) {
            console.error(`[YT Comments] Error for ${account.accountName}:`, err)
        }
    }

    console.log(`[YT Comments] Polled ${totalComments} comments, ${newConversations} new conversations`)
    return { processed: totalComments, newConversations }
}

/**
 * Refresh YouTube (Google) access token
 */
async function refreshYouTubeToken(account: any): Promise<string | null> {
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'youtube' },
    })

    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.youtubeClientId || process.env.GOOGLE_CLIENT_ID
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { /* use env */ }
    }

    if (!clientId || !clientSecret || !account.refreshToken) return null

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: account.refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        if (!res.ok) return null

        const data = await res.json()

        // Update token in DB
        await prisma.channelPlatform.update({
            where: { id: account.id },
            data: {
                accessToken: data.access_token,
                tokenExpiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
            },
        })

        return data.access_token
    } catch {
        return null
    }
}

/**
 * Get recent videos from a YouTube channel
 */
async function getRecentVideos(accessToken: string, channelId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('channelId', channelId)
    url.searchParams.set('type', 'video')
    url.searchParams.set('order', 'date')
    url.searchParams.set('publishedAfter', sevenDaysAgo)
    url.searchParams.set('maxResults', '10')

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
        console.warn(`[YT Comments] Failed to fetch videos:`, await res.text())
        return []
    }

    const data = await res.json()
    return (data.items || []).map((item: any) => ({
        id: item.id?.videoId,
        title: item.snippet?.title || 'Untitled Video',
        thumbnail: item.snippet?.thumbnails?.default?.url || null,
    })).filter((v: any) => v.id)
}

/**
 * Poll comments for a specific video
 */
async function pollVideoComments(
    accessToken: string,
    video: { id: string; title: string; thumbnail: string | null },
    account: any,
) {
    let total = 0
    let newConvs = 0

    const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('videoId', video.id)
    url.searchParams.set('order', 'time')
    url.searchParams.set('maxResults', '20')

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
        // Comments may be disabled for this video
        return { total: 0, newConvs: 0 }
    }

    const data = await res.json()
    const threads = data.items || []

    for (const thread of threads) {
        const snippet = thread.snippet?.topLevelComment?.snippet
        if (!snippet) continue

        const commentId = thread.snippet?.topLevelComment?.id || thread.id
        const authorName = snippet.authorDisplayName || 'YouTube User'
        const authorAvatar = snippet.authorProfileImageUrl || null
        const authorChannelId = snippet.authorChannelId?.value || commentId
        const content = snippet.textDisplay || ''
        const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date()

        // Skip own comments (from the channel owner)
        if (authorChannelId === account.accountId) continue

        // Check if we already have this comment by externalId
        const existing = await prisma.inboxMessage.findFirst({
            where: {
                externalId: commentId,
                conversation: {
                    channelId: account.channelId,
                    platform: 'youtube',
                },
            },
        })

        if (existing) {
            total++
            continue // Already processed
        }

        // Upsert conversation for this video's comment thread
        const externalUserId = `yt_video_${video.id}`
        const videoUrl = `https://youtube.com/watch?v=${video.id}`

        let isNewConversation = false
        let conversation = await prisma.conversation.findFirst({
            where: {
                channelId: account.channelId,
                platform: 'youtube',
                externalUserId,
                type: 'comment',
            },
        })

        if (!conversation) {
            isNewConversation = true

            // Check bot settings
            let convMode: 'BOT' | 'AGENT' = 'AGENT'
            const pageConfig = (account.config as any) || {}
            if (pageConfig.botEnabled === true) {
                const botConfig = await prisma.botConfig.findUnique({
                    where: { channelId: account.channelId },
                    select: { isEnabled: true },
                })
                if (botConfig?.isEnabled) convMode = 'BOT'
            }

            conversation = await prisma.conversation.create({
                data: {
                    channelId: account.channelId,
                    platformAccountId: account.id,
                    platform: 'youtube',
                    externalUserId,
                    externalUserName: `📺 ${video.title}`,
                    status: 'new',
                    mode: convMode,
                    type: 'comment',
                    metadata: {
                        videoId: video.id,
                        videoTitle: video.title,
                        videoUrl,
                        thumbnail: video.thumbnail,
                    },
                    unreadCount: 1,
                    lastMessageAt: publishedAt,
                    tags: [],
                },
            })

            newConvs++
        } else {
            // Update existing
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageAt: publishedAt,
                    unreadCount: { increment: 1 },
                    ...(conversation.status === 'done' || conversation.status === 'archived'
                        ? { status: 'new' }
                        : {}),
                },
            })
        }

        // Save the comment as an inbox message
        await prisma.inboxMessage.create({
            data: {
                conversationId: conversation.id,
                externalId: commentId,
                direction: 'inbound',
                senderType: 'customer',
                content: stripHtml(content),
                senderName: authorName,
                senderAvatar: authorAvatar,
                sentAt: publishedAt,
            },
        })

        total++

        // Trigger bot auto-reply if in BOT mode
        if (conversation.mode === 'BOT') {
            try {
                if (isNewConversation) {
                    await sendBotGreeting(conversation.id, 'youtube')
                }
                await botAutoReply(conversation.id, stripHtml(content), 'youtube')
            } catch (err) {
                console.error(`[YT Comments] Bot reply failed for comment ${commentId}:`, err)
            }
        }
    }

    return { total, newConvs }
}

/**
 * Strip basic HTML tags from YouTube comment text
 */
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
}
