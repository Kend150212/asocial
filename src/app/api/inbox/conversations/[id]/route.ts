import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/inbox/conversations/[id]
 * Update conversation: status, mode, assignedTo, tags
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verify access
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { channelId: true, mode: true },
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

    // Build update data
    const data: any = {}
    if (body.status !== undefined) data.status = body.status
    if (body.mode !== undefined) data.mode = body.mode
    if (body.tags !== undefined) data.tags = body.tags
    if (body.sentiment !== undefined) data.sentiment = body.sentiment
    if (body.intent !== undefined) data.intent = body.intent
    if (body.priority !== undefined) data.priority = body.priority

    // Handle assignment
    if (body.assignedTo !== undefined) {
        data.assignedTo = body.assignedTo
        if (body.assignedTo) {
            data.status = 'open' // Auto-set to open when assigned
        }
    }

    // Handle "take over" action
    if (body.action === 'takeover') {
        data.mode = 'AGENT'
        data.assignedTo = session.user.id
        data.status = 'open'
    }

    // Handle "transfer to bot"
    if (body.action === 'transferToBot') {
        data.mode = 'BOT'
    }

    const updated = await prisma.conversation.update({
        where: { id },
        data,
        include: {
            platformAccount: {
                select: { id: true, platform: true, accountName: true },
            },
            agent: {
                select: { id: true, name: true, email: true },
            },
        },
    })

    return NextResponse.json({
        conversation: {
            id: updated.id,
            status: updated.status,
            mode: updated.mode,
            assignedTo: updated.assignedTo,
            agent: updated.agent,
            tags: updated.tags,
            sentiment: updated.sentiment,
            intent: updated.intent,
            priority: updated.priority,
        },
    })
}

/**
 * GET /api/inbox/conversations/[id]
 * Get a single conversation with full details
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

    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            platformAccount: {
                select: { id: true, platform: true, accountName: true },
            },
            agent: {
                select: { id: true, name: true, email: true },
            },
            channel: {
                select: { id: true, displayName: true },
            },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Verify access
    const membership = await prisma.channelMember.findFirst({
        where: { channelId: conversation.channelId, userId: session.user.id },
    })

    if (!membership && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
        conversation: {
            ...conversation,
            tags: (conversation.tags as string[]) || [],
            lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
        },
    })
}
