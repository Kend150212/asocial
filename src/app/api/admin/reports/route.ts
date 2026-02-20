import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const range = parseInt(searchParams.get('range') || '30')

    const since = new Date()
    since.setDate(since.getDate() - range)

    const isAdmin = session.user.role === 'ADMIN'
    const userId = session.user.id

    // ── Determine channel scope for this user ────────────────────────
    // Admin: all channels (or specific channelId)
    // Non-admin: only channels they are a member of
    let userChannelIds: string[] | null = null // null = all (admin only)
    if (!isAdmin) {
        const memberships = await prisma.channelMember.findMany({
            where: { userId, role: { notIn: ['CUSTOMER'] } },
            select: { channelId: true },
        })
        userChannelIds = memberships.map(m => m.channelId)
    }

    // Build the base Prisma where clause for Post queries
    const buildWhere = (extra?: Record<string, unknown>) => {
        const base: Record<string, unknown> = {}
        if (channelId) {
            // If a specific channelId is requested, verify user has access
            if (userChannelIds !== null && !userChannelIds.includes(channelId)) {
                // User doesn't have access to this channel — return empty scope
                base.channelId = 'FORBIDDEN_NO_ACCESS'
            } else {
                base.channelId = channelId
            }
        } else if (userChannelIds !== null) {
            // No specific channel — scope to user's channels
            base.channelId = { in: userChannelIds }
        }
        // else: admin, no channelId → no filter (all channels)
        return { ...base, ...extra }
    }

    const where = buildWhere()
    const whereWithDate = buildWhere({ createdAt: { gte: since } })

    // ── KPI Summary ──────────────────────────────────────────────────
    const [total, published, scheduled, failed, drafts, pendingApproval] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.count({ where: buildWhere({ status: 'PUBLISHED' }) }),
        prisma.post.count({ where: buildWhere({ status: 'SCHEDULED' }) }),
        prisma.post.count({ where: buildWhere({ status: 'FAILED' }) }),
        prisma.post.count({ where: buildWhere({ status: 'DRAFT' }) }),
        prisma.post.count({ where: buildWhere({ status: 'PENDING_APPROVAL' }) }),
    ])

    // ── Posts over time (daily counts for last N days) ───────────────
    const recentPosts = await prisma.post.findMany({
        where: whereWithDate,
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
    })

    // Build daily buckets
    const dailyMap: Record<string, { date: string; total: number; published: number; scheduled: number }> = {}
    for (let i = 0; i < range; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (range - 1 - i))
        const key = d.toISOString().split('T')[0]
        dailyMap[key] = { date: key, total: 0, published: 0, scheduled: 0 }
    }
    for (const post of recentPosts) {
        const key = post.createdAt.toISOString().split('T')[0]
        if (dailyMap[key]) {
            dailyMap[key].total++
            if (post.status === 'PUBLISHED') dailyMap[key].published++
            if (post.status === 'SCHEDULED') dailyMap[key].scheduled++
        }
    }
    const postsOverTime = Object.values(dailyMap)

    // ── Platform breakdown (published posts per platform) ────────────
    const platformStatuses = await prisma.postPlatformStatus.groupBy({
        by: ['platform', 'status'],
        where: channelId
            ? (userChannelIds !== null && !userChannelIds.includes(channelId))
                ? { post: { channelId: 'FORBIDDEN_NO_ACCESS' } }
                : { post: { channelId } }
            : userChannelIds !== null
                ? { post: { channelId: { in: userChannelIds } } }
                : {},
        _count: { id: true },
    })

    const platformMap: Record<string, { platform: string; published: number; failed: number; total: number }> = {}
    for (const ps of platformStatuses) {
        if (!platformMap[ps.platform]) {
            platformMap[ps.platform] = { platform: ps.platform, published: 0, failed: 0, total: 0 }
        }
        platformMap[ps.platform].total += ps._count.id
        if (ps.status === 'published') platformMap[ps.platform].published += ps._count.id
        if (ps.status === 'failed') platformMap[ps.platform].failed += ps._count.id
    }
    const platformBreakdown = Object.values(platformMap).sort((a, b) => b.total - a.total)

    // ── Status breakdown for Pie chart ───────────────────────────────
    const statusBreakdown = [
        { name: 'PUBLISHED', value: published },
        { name: 'SCHEDULED', value: scheduled },
        { name: 'DRAFT', value: drafts },
        { name: 'FAILED', value: failed },
        { name: 'PENDING_APPROVAL', value: pendingApproval },
    ].filter(s => s.value > 0)

    // ── Recent published posts ───────────────────────────────────────
    const recentPublished = await prisma.post.findMany({
        where: buildWhere({ status: 'PUBLISHED' }),
        select: {
            id: true,
            content: true,
            publishedAt: true,
            createdAt: true,
            media: {
                take: 1,
                select: {
                    mediaItem: {
                        select: { url: true, type: true, thumbnailUrl: true },
                    },
                },
            },
            platformStatuses: {
                select: {
                    platform: true,
                    status: true,
                    publishedAt: true,
                    config: true,
                },
            },
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
    })

    return NextResponse.json({
        kpi: { total, published, scheduled, failed, drafts, pendingApproval },
        postsOverTime,
        platformBreakdown,
        statusBreakdown,
        recentPublished,
    })
}
