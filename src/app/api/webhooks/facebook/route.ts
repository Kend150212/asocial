import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { botAutoReply, sendBotGreeting } from '@/lib/bot-auto-reply'

// ─── Webhook verify token ──────────────
const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN || 'asocial_webhook_2024'

/**
 * GET /api/webhooks/facebook
 * Facebook Webhook Verification (required during setup)
 */
export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode')
    const token = req.nextUrl.searchParams.get('hub.verify_token')
    const challenge = req.nextUrl.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[FB Webhook] ✅ Verified')
        return new NextResponse(challenge, { status: 200 })
    }

    console.warn('[FB Webhook] ❌ Verification failed')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST /api/webhooks/facebook
 * Receive Facebook events: comments (feed), messages (messaging)
 */
export async function POST(req: NextRequest) {
    const body = await req.json()

    console.log('[FB Webhook] Received:', JSON.stringify(body).substring(0, 500))

    // Facebook sends events grouped by object type
    if (body.object === 'page') {
        for (const entry of body.entry || []) {
            const pageId = entry.id

            // ── Feed changes (comments, reactions, posts) ──
            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed') {
                        try {
                            await handleFeedChange(pageId, change.value)
                        } catch (err) {
                            console.error(`[FB Webhook] ❌ Error processing feed change for page ${pageId}:`, err)
                        }
                    }
                }
            }

            // ── Messaging (DMs) ──
            if (entry.messaging) {
                for (const msgEvent of entry.messaging) {
                    try {
                        await handleMessaging(pageId, msgEvent)
                    } catch (err) {
                        console.error(`[FB Webhook] ❌ Error processing message for page ${pageId}:`, err)
                    }
                }
            }
        }
    }

    // Always return 200 to acknowledge
    return NextResponse.json({ status: 'ok' })
}

// ═══════════════════════════════════════
// HANDLE FEED CHANGES (Comments)
// ═══════════════════════════════════════
async function handleFeedChange(pageId: string, value: any) {
    // value.item can be: comment, reaction, post, share, etc.
    if (value.item !== 'comment') return

    const verb = value.verb // add, edit, remove
    if (verb === 'remove') {
        // Comment deleted — mark as hidden
        if (value.comment_id) {
            await prisma.socialComment.updateMany({
                where: { externalCommentId: value.comment_id },
                data: { status: 'hidden' },
            })
            console.log(`[FB Webhook] Comment removed: ${value.comment_id}`)
        }
        return
    }

    // Find the platform account (ChannelPlatform) for this page
    // Prefer active records with access tokens to avoid stale entries
    const platformAccount = await prisma.channelPlatform.findFirst({
        where: { platform: 'facebook', accountId: pageId, isActive: true, accessToken: { not: null } },
        orderBy: { updatedAt: 'desc' },
    }) || await prisma.channelPlatform.findFirst({
        where: { platform: 'facebook', accountId: pageId },
        orderBy: { updatedAt: 'desc' },
    })

    if (!platformAccount) {
        // Log all Facebook platform accounts for debugging
        const allFbAccounts = await prisma.channelPlatform.findMany({
            where: { platform: 'facebook' },
            select: { accountId: true, accountName: true, isActive: true },
        })
        console.warn(`[FB Webhook] ❌ No platform account for page ${pageId}. Available FB accounts:`,
            allFbAccounts.map(a => `${a.accountName}(${a.accountId}, active=${a.isActive})`).join(', ')
        )
        return
    }

    console.log(`[FB Webhook] ✅ Matched page ${pageId} → ${platformAccount.accountName} (${platformAccount.id})`)

    const externalPostId = value.post_id || ''
    const externalCommentId = value.comment_id || ''
    const parentCommentId = value.parent_id || null
    const authorName = value.from?.name || 'Unknown'
    const authorId = value.from?.id || ''
    const content = value.message || ''
    const commentedAt = value.created_time ? new Date(value.created_time * 1000) : new Date()

    // Skip if this is page's own comment
    if (authorId === pageId) {
        console.log(`[FB Webhook] Skipping own comment by page ${pageId}`)
        return
    }

    // Try to find matching post via PostPlatformStatus
    let postId: string | null = null
    if (externalPostId) {
        const platformStatus = await prisma.postPlatformStatus.findFirst({
            where: {
                externalId: externalPostId,
            },
            select: { postId: true },
        })
        postId = platformStatus?.postId || null
    }

    // ── Fetch post details from Graph API ──
    let postMetadata: any = null
    if (externalPostId && platformAccount.accessToken) {
        try {
            const postRes = await fetch(
                `https://graph.facebook.com/v19.0/${externalPostId}?fields=message,permalink_url,full_picture,attachments{media,media_type,url,subattachments}&access_token=${platformAccount.accessToken}`
            )
            if (postRes.ok) {
                const postData = await postRes.json()
                const images: string[] = []

                // Prefer attachment images (more accurate for multi-image posts)
                if (postData.attachments?.data) {
                    for (const att of postData.attachments.data) {
                        // Carousel / multi-photo posts
                        if (att.subattachments?.data) {
                            for (const sub of att.subattachments.data) {
                                if (sub.media?.image?.src) {
                                    images.push(sub.media.image.src)
                                }
                            }
                        } else if (att.media?.image?.src) {
                            images.push(att.media.image.src)
                        }
                    }
                }

                // Fallback to full_picture only if no attachment images found
                if (images.length === 0 && postData.full_picture) {
                    images.push(postData.full_picture)
                }

                postMetadata = {
                    externalPostId,
                    postContent: postData.message || '',
                    postImages: images.slice(0, 5), // max 5 images
                    postPermalink: postData.permalink_url || `https://facebook.com/${externalPostId}`,
                }
                console.log(`[FB Webhook] 📄 Post fetched: "${(postData.message || '').substring(0, 50)}" with ${images.length} images`)
            }
        } catch (err) {
            console.warn(`[FB Webhook] ⚠️ Failed to fetch post ${externalPostId}:`, err)
            postMetadata = {
                externalPostId,
                postContent: '',
                postImages: [],
                postPermalink: `https://facebook.com/${externalPostId}`,
            }
        }
    }

    // Upsert the comment
    await prisma.socialComment.upsert({
        where: { externalCommentId },
        update: {
            content,
            authorName,
        },
        create: {
            channelId: platformAccount.channelId,
            platformAccountId: platformAccount.id,
            postId: postId,
            platform: 'facebook',
            externalPostId,
            externalCommentId,
            parentCommentId,
            authorName,
            authorAvatar: value.from?.id ? `https://graph.facebook.com/${value.from.id}/picture?type=small` : null,
            content,
            status: 'new',
            commentedAt,
        },
    })

    console.log(`[FB Webhook] 💬 Comment saved: "${content.substring(0, 50)}" by ${authorName}`)

    // Create/update a conversation grouped by POST (not user) so all comments on same post are together
    const postLabel = postMetadata?.postContent
        ? postMetadata.postContent.substring(0, 60) + (postMetadata.postContent.length > 60 ? '...' : '')
        : `Post ${externalPostId}`

    await upsertConversation({
        channelId: platformAccount.channelId,
        platformAccountId: platformAccount.id,
        platform: 'facebook',
        externalUserId: `post_${externalPostId}`, // Group by post, not user
        externalUserName: postLabel,
        externalUserAvatar: null,
        content,
        direction: 'inbound',
        senderType: 'customer',
        senderName: authorName,
        senderAvatar: value.from?.id ? `https://graph.facebook.com/${value.from.id}/picture?type=small` : null,
        type: 'comment',
        metadata: postMetadata,
        externalId: externalCommentId,
    })
}

// ═══════════════════════════════════════
// HANDLE MESSAGING (DMs)
// ═══════════════════════════════════════
async function handleMessaging(pageId: string, event: any) {
    // Only handle text messages (skip delivery, read receipts, etc.)
    if (!event.message?.text && !event.message?.attachments) return

    const senderId = event.sender?.id
    const recipientId = event.recipient?.id
    if (!senderId || !recipientId) return

    // Determine direction: if sender is the page, it's outbound
    const isOutbound = senderId === pageId
    const externalUserId = isOutbound ? recipientId : senderId

    // Find the platform account
    const platformAccount = await prisma.channelPlatform.findFirst({
        where: { platform: 'facebook', accountId: pageId },
    })

    if (!platformAccount) {
        console.warn(`[FB Webhook] No platform account for page ${pageId}`)
        return
    }

    const content = event.message?.text || '[Attachment]'
    const mediaUrl = event.message?.attachments?.[0]?.payload?.url || null
    const mediaType = event.message?.attachments?.[0]?.type || null

    // Get sender name via Graph API (if inbound)
    let senderName = externalUserId
    if (!isOutbound && platformAccount.accessToken) {
        try {
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${externalUserId}?fields=name,profile_pic&access_token=${platformAccount.accessToken}`
            )
            if (res.ok) {
                const data = await res.json()
                senderName = data.name || senderName
            }
        } catch {
            // Silently fail — use ID as name
        }
    }

    // Upsert conversation and add message
    await upsertConversation({
        channelId: platformAccount.channelId,
        platformAccountId: platformAccount.id,
        platform: 'facebook',
        externalUserId,
        externalUserName: isOutbound ? undefined : senderName,
        externalUserAvatar: !isOutbound ? `https://graph.facebook.com/${externalUserId}/picture?type=small` : undefined,
        content,
        direction: isOutbound ? 'outbound' : 'inbound',
        senderType: isOutbound ? 'agent' : 'customer',
        mediaUrl,
        mediaType,
        externalId: event.message?.mid,
    })

    console.log(`[FB Webhook] 💬 Message ${isOutbound ? 'sent' : 'received'}: "${content.substring(0, 50)}" from ${senderName}`)
}

// ═══════════════════════════════════════
// SHARED: Upsert conversation + add message
// ═══════════════════════════════════════
async function upsertConversation(opts: {
    channelId: string
    platformAccountId: string
    platform: string
    externalUserId: string
    externalUserName?: string
    externalUserAvatar?: string | null
    content: string
    direction: string
    senderType: string
    senderName?: string | null
    senderAvatar?: string | null
    mediaUrl?: string | null
    mediaType?: string | null
    externalId?: string | null
    type?: string
    metadata?: any
}) {
    // Find or create conversation
    let isNewConversation = false
    let conversation = await prisma.conversation.findFirst({
        where: {
            channelId: opts.channelId,
            platform: opts.platform,
            externalUserId: opts.externalUserId,
        },
    })

    if (!conversation) {
        isNewConversation = true
        conversation = await prisma.conversation.create({
            data: {
                channelId: opts.channelId,
                platformAccountId: opts.platformAccountId,
                platform: opts.platform,
                externalUserId: opts.externalUserId,
                externalUserName: opts.externalUserName || opts.externalUserId,
                externalUserAvatar: opts.externalUserAvatar || null,
                status: 'new',
                mode: 'BOT',
                type: opts.type || 'message',
                metadata: opts.metadata || null,
                unreadCount: 1,
                lastMessageAt: new Date(),
                tags: [],
            },
        })
        console.log(`[FB Webhook] 🆕 New conversation: ${opts.externalUserName || opts.externalUserId}`)
    } else {
        // Update existing conversation
        const updateData: any = {
            lastMessageAt: new Date(),
        }
        if (opts.direction === 'inbound') {
            updateData.unreadCount = { increment: 1 }
            // Re-open if it was done/archived
            if (['done', 'archived'].includes(conversation.status)) {
                updateData.status = 'new'
            }
        }
        if (opts.externalUserName && !conversation.externalUserName) {
            updateData.externalUserName = opts.externalUserName
        }
        if (opts.externalUserAvatar && !conversation.externalUserAvatar) {
            updateData.externalUserAvatar = opts.externalUserAvatar
        }
        // Update metadata if we have post info and conversation doesn't have it yet
        if (opts.metadata && !conversation.metadata) {
            updateData.metadata = opts.metadata
            updateData.type = opts.type || conversation.type
        }
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: updateData,
        })
    }

    // Check for duplicate message
    if (opts.externalId) {
        const existing = await prisma.inboxMessage.findFirst({
            where: { externalId: opts.externalId },
        })
        if (existing) return // Skip duplicate
    }

    // Create message
    await prisma.inboxMessage.create({
        data: {
            conversationId: conversation.id,
            externalId: opts.externalId || null,
            direction: opts.direction,
            senderType: opts.senderType,
            content: opts.content,
            senderName: opts.senderName || null,
            senderAvatar: opts.senderAvatar || null,
            mediaUrl: opts.mediaUrl || null,
            mediaType: opts.mediaType || null,
            sentAt: new Date(),
        },
    })

    // ─── Bot Auto-Reply (fire-and-forget) ─────────────────────
    if (opts.direction === 'inbound' && conversation.mode === 'BOT') {
        if (isNewConversation) {
            // New conversation: send greeting first, then auto-reply
            sendBotGreeting(conversation.id, opts.platform)
                .then(() => botAutoReply(conversation.id, opts.content, opts.platform))
                .then(r => console.log(`[Bot Auto-Reply] Result:`, r))
                .catch(e => console.error(`[Bot Auto-Reply] ❌`, e))
        } else {
            // Existing conversation: just auto-reply
            botAutoReply(conversation.id, opts.content, opts.platform)
                .then(r => console.log(`[Bot Auto-Reply] Result:`, r))
                .catch(e => console.error(`[Bot Auto-Reply] ❌`, e))
        }
    }
}
