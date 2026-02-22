/**
 * TikTok Comment Polling
 *
 * GET /api/cron/poll-tiktok-comments
 *
 * Polls TikTok API for new comments on published videos.
 * Creates inbox conversations for each video's comment thread.
 * Should be called via cron every 2-5 minutes.
 *
 * Usage:
 *   curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/poll-tiktok-comments
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
        const result = await pollTikTokComments()
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[TT Comments] Polling error:', err)
        return NextResponse.json({ error: 'Polling failed' }, { status: 500 })
    }
}

async function pollTikTokComments() {
    // Find all active TikTok platform accounts
    const ttAccounts = await prisma.channelPlatform.findMany({
        where: {
            platform: 'tiktok',
            isActive: true,
        },
        include: {
            channel: { select: { id: true, name: true } },
        },
    })

    if (ttAccounts.length === 0) {
        return { message: 'No TikTok accounts connected', processed: 0 }
    }

    let totalComments = 0
    let newConversations = 0

    for (const account of ttAccounts) {
        try {
            let accessToken = account.accessToken

            // Refresh token if expired
            if (account.tokenExpiresAt && new Date() > account.tokenExpiresAt && account.refreshToken) {
                accessToken = await refreshTikTokToken(account)
                if (!accessToken) {
                    console.warn(`[TT Comments] Failed to refresh token for ${account.accountName}`)
                    continue
                }
            }

            if (!accessToken) continue

            // Get recently published TikTok videos (from PostPlatformStatus)
            const recentPosts = await prisma.postPlatformStatus.findMany({
                where: {
                    platform: 'tiktok',
                    accountId: account.accountId,
                    status: 'PUBLISHED',
                    publishedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
                    },
                },
                select: {
                    externalId: true,
                    post: { select: { content: true } },
                },
            })

            const videoIds = recentPosts
                .filter(p => p.externalId)
                .map(p => ({
                    id: p.externalId!,
                    title: (p.post?.content || 'TikTok Video').substring(0, 60),
                }))

            for (const video of videoIds) {
                const result = await pollVideoComments(
                    accessToken,
                    video,
                    account,
                )
                totalComments += result.total
                newConversations += result.newConvs
            }
        } catch (err) {
            console.error(`[TT Comments] Error for ${account.accountName}:`, err)
        }
    }

    console.log(`[TT Comments] Polled ${totalComments} comments, ${newConversations} new conversations`)
    return { processed: totalComments, newConversations }
}

/**
 * Refresh TikTok access token
 */
async function refreshTikTokToken(account: any): Promise<string | null> {
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'tiktok' },
    })

    const config = (integration?.config || {}) as Record<string, string>
    const clientKey = config.tiktokClientKey || process.env.TIKTOK_CLIENT_KEY
    let clientSecret = process.env.TIKTOK_CLIENT_SECRET || ''

    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { /* use env */ }
    }

    if (!clientKey || !clientSecret || !account.refreshToken) return null

    try {
        const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: account.refreshToken,
            }),
        })

        if (!res.ok) return null

        const data = await res.json()

        // Update token in DB
        await prisma.channelPlatform.update({
            where: { id: account.id },
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || account.refreshToken,
                tokenExpiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
            },
        })

        return data.access_token
    } catch {
        return null
    }
}

/**
 * Poll comments for a specific TikTok video
 */
async function pollVideoComments(
    accessToken: string,
    video: { id: string; title: string },
    account: any,
) {
    let total = 0
    let newConvs = 0

    try {
        const res = await fetch('https://open.tiktokapis.com/v2/video/comment/list/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_id: video.id,
                max_count: 20,
            }),
        })

        if (!res.ok) {
            // Comments may be restricted
            return { total: 0, newConvs: 0 }
        }

        const data = await res.json()
        const comments = data?.data?.comments || []

        for (const comment of comments) {
            const commentId = comment.comment_id || comment.id
            const authorName = comment.user?.display_name || comment.user?.nickname || 'TikTok User'
            const authorAvatar = comment.user?.avatar_url || null
            const content = comment.text || ''
            const publishedAt = comment.create_time
                ? new Date(comment.create_time * 1000)
                : new Date()

            if (!commentId || !content) continue

            // Check if already processed
            const existing = await prisma.inboxMessage.findFirst({
                where: {
                    externalId: `tt_${commentId}`,
                    conversation: {
                        channelId: account.channelId,
                        platform: 'tiktok',
                    },
                },
            })

            if (existing) {
                total++
                continue
            }

            // Upsert conversation for this video
            const externalUserId = `tt_video_${video.id}`

            let isNewConversation = false
            let conversation = await prisma.conversation.findFirst({
                where: {
                    channelId: account.channelId,
                    platform: 'tiktok',
                    externalUserId,
                    type: 'comment',
                },
            })

            if (!conversation) {
                isNewConversation = true

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
                        platform: 'tiktok',
                        externalUserId,
                        externalUserName: `🎵 ${video.title}`,
                        status: 'new',
                        mode: convMode,
                        type: 'comment',
                        metadata: {
                            videoId: video.id,
                            videoTitle: video.title,
                        },
                        unreadCount: 1,
                        lastMessageAt: publishedAt,
                        tags: [],
                    },
                })

                newConvs++
            } else {
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

            // Save comment as inbox message
            await prisma.inboxMessage.create({
                data: {
                    conversationId: conversation.id,
                    externalId: `tt_${commentId}`,
                    direction: 'inbound',
                    senderType: 'customer',
                    content,
                    senderName: authorName,
                    senderAvatar: authorAvatar,
                    sentAt: publishedAt,
                },
            })

            total++

            // Bot auto-reply if in BOT mode
            if (conversation.mode === 'BOT') {
                try {
                    if (isNewConversation) {
                        await sendBotGreeting(conversation.id, 'tiktok')
                    }
                    await botAutoReply(conversation.id, content, 'tiktok')
                } catch (err) {
                    console.error(`[TT Comments] Bot reply failed for ${commentId}:`, err)
                }
            }
        }
    } catch (err) {
        console.error(`[TT Comments] Failed to fetch comments for video ${video.id}:`, err)
    }

    return { total, newConvs }
}
