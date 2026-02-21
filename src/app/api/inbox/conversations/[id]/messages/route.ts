import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inbox/conversations/[id]/messages
 * Returns messages for a specific conversation
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Verify user has access to this conversation's channel
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { channelId: true, id: true },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const membership = await prisma.channelMember.findFirst({
        where: { channelId: conversation.channelId, userId: session.user.id },
    })

    if (!membership && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [messages, total] = await Promise.all([
        prisma.inboxMessage.findMany({
            where: { conversationId: id },
            orderBy: { sentAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.inboxMessage.count({ where: { conversationId: id } }),
    ])

    // Mark conversation as read when agent opens it
    await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
    })

    return NextResponse.json({
        messages: messages.map(m => ({
            id: m.id,
            direction: m.direction,
            senderType: m.senderType,
            content: m.content,
            contentOriginal: m.contentOriginal,
            detectedLang: m.detectedLang,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            confidence: m.confidence,
            sentAt: m.sentAt.toISOString(),
        })),
        total,
        page,
        limit,
    })
}

/**
 * POST /api/inbox/conversations/[id]/messages
 * Send a reply to a conversation (as agent)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { content, senderType = 'agent' } = body

    if (!content?.trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify access
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { channelId: true, mode: true, platform: true, platformAccountId: true },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const membership = await prisma.channelMember.findFirst({
        where: { channelId: conversation.channelId, userId: session.user.id },
    })

    if (!membership && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.inboxMessage.create({
        data: {
            conversationId: id,
            direction: 'outbound',
            senderType,
            content: content.trim(),
        },
    })

    // Update conversation
    await prisma.conversation.update({
        where: { id },
        data: {
            lastMessageAt: new Date(),
            mode: 'AGENT', // Auto-switch to agent mode when agent replies
            assignedTo: conversation.mode === 'BOT' ? session.user.id : undefined,
            status: conversation.mode === 'BOT' ? 'open' : undefined,
        },
    })

    // ── Send reply via Facebook API ──
    if (conversation.platform === 'facebook') {
        const platformAccount = await prisma.channelPlatform.findUnique({
            where: { id: conversation.platformAccountId },
        })

        if (platformAccount?.accessToken) {
            const conv = await prisma.conversation.findUnique({
                where: { id },
                select: { type: true, metadata: true, externalUserId: true },
            })

            try {
                if (conv?.type === 'comment') {
                    // Reply to comment: find the latest inbound comment to reply to
                    const lastInbound = await prisma.inboxMessage.findFirst({
                        where: { conversationId: id, direction: 'inbound' },
                        orderBy: { sentAt: 'desc' },
                        select: { externalId: true },
                    })

                    // Also check social_comments for the external comment ID
                    const lastComment = await prisma.socialComment.findFirst({
                        where: {
                            channelId: conversation.channelId,
                            platform: 'facebook',
                        },
                        orderBy: { commentedAt: 'desc' },
                        select: { externalCommentId: true, externalPostId: true },
                    })

                    const commentId = lastComment?.externalCommentId
                    if (commentId) {
                        const fbRes = await fetch(
                            `https://graph.facebook.com/v19.0/${commentId}/comments`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: content.trim(),
                                    access_token: platformAccount.accessToken,
                                }),
                            }
                        )
                        const fbData = await fbRes.json()
                        if (fbData.id) {
                            // Update the message with external ID
                            await prisma.inboxMessage.update({
                                where: { id: message.id },
                                data: { externalId: fbData.id },
                            })
                            console.log(`[FB Reply] ✅ Comment reply posted: ${fbData.id}`)
                        } else {
                            console.warn(`[FB Reply] ⚠️ Comment reply failed:`, JSON.stringify(fbData))
                        }
                    }
                } else {
                    // Send DM via Send API
                    const fbRes = await fetch(
                        `https://graph.facebook.com/v19.0/me/messages?access_token=${platformAccount.accessToken}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                recipient: { id: conv?.externalUserId },
                                message: { text: content.trim() },
                                messaging_type: 'RESPONSE',
                            }),
                        }
                    )
                    const fbData = await fbRes.json()
                    if (fbData.message_id) {
                        await prisma.inboxMessage.update({
                            where: { id: message.id },
                            data: { externalId: fbData.message_id },
                        })
                        console.log(`[FB Reply] ✅ DM sent: ${fbData.message_id}`)
                    } else {
                        console.warn(`[FB Reply] ⚠️ DM send failed:`, JSON.stringify(fbData))
                    }
                }
            } catch (err) {
                console.error(`[FB Reply] ❌ Error sending reply:`, err)
                // Don't fail the API — message is still saved locally
            }
        }
    }

    return NextResponse.json({
        message: {
            id: message.id,
            direction: message.direction,
            senderType: message.senderType,
            content: message.content,
            mediaUrl: message.mediaUrl,
            confidence: message.confidence,
            sentAt: message.sentAt.toISOString(),
        },
    })
}
