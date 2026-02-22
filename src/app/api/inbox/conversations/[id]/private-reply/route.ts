import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/inbox/conversations/[id]/private-reply
 * Send a private DM to a Facebook comment author
 * Body: { commentExternalId: string, message: string }
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
    const { commentExternalId, message } = body

    if (!commentExternalId || !message?.trim()) {
        return NextResponse.json({ error: 'commentExternalId and message are required' }, { status: 400 })
    }

    // Get conversation and platform account
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { channelId: true, platform: true, platformAccountId: true, type: true },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (conversation.type !== 'comment') {
        return NextResponse.json({ error: 'Private reply only available for comment conversations' }, { status: 400 })
    }

    // Verify access
    const membership = await prisma.channelMember.findFirst({
        where: { channelId: conversation.channelId, userId: session.user.id },
    })

    if (!membership && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (conversation.platform !== 'facebook') {
        return NextResponse.json({ error: 'Private reply only supported for Facebook' }, { status: 400 })
    }

    const platformAccount = await prisma.channelPlatform.findUnique({
        where: { id: conversation.platformAccountId },
    })

    if (!platformAccount?.accessToken) {
        return NextResponse.json({ error: 'No access token' }, { status: 400 })
    }

    try {
        // Facebook Private Reply API: send a one-time DM to the comment author
        const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/me/messages`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { comment_id: commentExternalId },
                    message: { text: message.trim() },
                    access_token: platformAccount.accessToken,
                }),
            }
        )
        const fbData = await fbRes.json()

        if (fbData.message_id) {
            // Save the private reply as a message in the conversation
            await prisma.inboxMessage.create({
                data: {
                    conversationId: id,
                    externalId: fbData.message_id,
                    direction: 'outbound',
                    senderType: 'agent',
                    content: `[Private Reply] ${message.trim()}`,
                    senderName: session.user.name || null,
                    senderAvatar: session.user.image || null,
                },
            })

            // Update conversation
            await prisma.conversation.update({
                where: { id },
                data: {
                    lastMessageAt: new Date(),
                    mode: 'AGENT',
                    assignedTo: session.user.id,
                },
            })

            console.log(`[FB Private Reply] ✅ Sent to comment ${commentExternalId}: ${fbData.message_id}`)
            return NextResponse.json({ success: true, messageId: fbData.message_id })
        } else {
            console.warn(`[FB Private Reply] ⚠️ Failed:`, JSON.stringify(fbData))
            const errorMsg = fbData.error?.message || 'Private reply failed'
            return NextResponse.json({ error: errorMsg }, { status: 400 })
        }
    } catch (err) {
        console.error(`[FB Private Reply] ❌ Error:`, err)
        return NextResponse.json({ error: 'Failed to send private reply' }, { status: 500 })
    }
}
