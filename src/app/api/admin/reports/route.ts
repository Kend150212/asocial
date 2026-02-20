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

    const where = channelId ? { channelId } : {}
    const whereWithDate = { ...where, createdAt: { gte: since } }

    // ── KPI Summary ──────────────────────────────────────────────────
    const [total, published, scheduled, failed, drafts, pendingApproval] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.count({ where: { ...where, status: 'PUBLISHED' } }),
        prisma.post.count({ where: { ...where, status: 'SCHEDULED' } }),
        prisma.post.count({ where: { ...where, status: 'FAILED' } }),
        prisma.post.count({ where: { ...where, status: 'DRAFT' } }),
        prisma.post.count({ where: { ...where, status: 'PENDING_APPROVAL' } }),
    ])

    // ── Posts over time (daily counts for last N days) ───────────────
    const recentPosts = await prisma.post.findMany({
        where: { ...where, createdAt: { gte: since } },
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
            ? { post: { channelId } }
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
        where: { ...where, status: 'PUBLISHED' },
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
