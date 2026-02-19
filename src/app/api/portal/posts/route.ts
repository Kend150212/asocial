import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/portal/posts
// Returns pending posts for all channels the customer belongs to
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get customer's channels
    const memberships = await prisma.channelMember.findMany({
        where: { userId: session.user.id, role: 'CUSTOMER' },
        select: { channelId: true },
    })
    const channelIds = memberships.map((m) => m.channelId)

    if (channelIds.length === 0) return NextResponse.json({ posts: [] })

    // Only channels with customer approval required
    const channels = await prisma.channel.findMany({
        where: { id: { in: channelIds } },
        select: { id: true, requireApproval: true },
    })
    const approvalChannelIds = channels
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c) => { const r = String((c as any).requireApproval); return r === 'customer' || r === 'customer_and_manager' })
        .map((c) => c.id)

    const posts = await prisma.post.findMany({
        where: {
            channelId: { in: approvalChannelIds },
            status: 'PENDING_APPROVAL',
        },
        include: {
            channel: { select: { id: true, displayName: true } },
            author: { select: { name: true, email: true } },
            media: {
                include: {
                    mediaItem: { select: { url: true, thumbnailUrl: true, type: true } },
                },
                orderBy: { sortOrder: 'asc' },
            },
            approvals: {
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            platformStatuses: { select: { platform: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ posts })
}
