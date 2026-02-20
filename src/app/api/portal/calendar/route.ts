import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/portal/calendar — posts for the customer's channels within date range
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const channelId = searchParams.get('channelId')

    // Get customer's channel IDs
    const memberships = await prisma.channelMember.findMany({
        where: { userId: session.user.id, role: 'CUSTOMER' },
        select: { channelId: true },
    })
    const customerChannelIds = memberships.map((m) => m.channelId)
    if (customerChannelIds.length === 0) {
        return NextResponse.json({ posts: [] })
    }

    // Filter by selected channel or all customer channels
    const targetChannelIds = channelId && channelId !== 'all'
        ? customerChannelIds.filter((id) => id === channelId)
        : customerChannelIds

    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const posts = await prisma.post.findMany({
        where: {
            channelId: { in: targetChannelIds },
            status: { in: ['PUBLISHED', 'SCHEDULED', 'PENDING_APPROVAL'] },
            ...(Object.keys(dateFilter).length > 0
                ? {
                    OR: [
                        { scheduledAt: dateFilter },
                        { publishedAt: dateFilter },
                        ...(dateFilter.gte ? [{ createdAt: dateFilter }] : []),
                    ],
                }
                : {}),
        },
        include: {
            channel: { select: { id: true, displayName: true, name: true } },
            media: { include: { mediaItem: { select: { id: true, url: true, thumbnailUrl: true, type: true } } } },
            platformStatuses: { select: { platform: true, status: true } },
        },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
        take: 500,
    })

    return NextResponse.json({ posts })
}
