import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan, getCurrentMonth } from '@/lib/plans'

/**
 * GET /api/dashboard — overview stats for the current user
 */
export async function GET(_req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Channels the user manages / owns
    const channelMembers = await prisma.channelMember.findMany({
        where: { userId, role: { in: ['ADMIN', 'OWNER'] } },
        select: { channelId: true },
    })
    const channelIds = channelMembers.map(cm => cm.channelId)

    // This month boundaries
    const month = getCurrentMonth()
    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`)
    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)

    // Post stats across all managed channels
    const [totalPosts, postsThisMonth, publishedTotal, scheduledTotal, failedTotal, draftTotal, pendingApprovalTotal] =
        await Promise.all([
            prisma.post.count({ where: { channelId: { in: channelIds } } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, createdAt: { gte: startOfMonth } } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, status: 'PUBLISHED' } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, status: 'SCHEDULED' } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, status: 'FAILED' } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, status: 'DRAFT' } }),
            prisma.post.count({ where: { channelId: { in: channelIds }, status: 'PENDING_APPROVAL' } }),
        ])

    // Team member count across user's channels
    const teamMemberCount = await prisma.channelMember.count({
        where: { channelId: { in: channelIds } },
    })

    // Unread notifications
    const unreadNotifications = await prisma.notification.count({
        where: { userId, isRead: false },
    })

    // Recent 5 posts
    const recentPosts = await prisma.post.findMany({
        where: { channelId: { in: channelIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            content: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
            createdAt: true,
            channel: { select: { id: true, name: true, displayName: true } },
        },
    })

    // Posts over last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const last7dayPosts = await prisma.post.findMany({
        where: { channelId: { in: channelIds }, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true },
    })

    // Build daily chart data
    const dayMap: Record<string, { date: string; total: number; published: number; scheduled: number; failed: number }> = {}
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dayMap[key] = { date: key, total: 0, published: 0, scheduled: 0, failed: 0 }
    }
    for (const p of last7dayPosts) {
        const key = p.createdAt.toISOString().slice(0, 10)
        if (dayMap[key]) {
            dayMap[key].total++
            if (p.status === 'PUBLISHED') dayMap[key].published++
            else if (p.status === 'SCHEDULED') dayMap[key].scheduled++
            else if (p.status === 'FAILED') dayMap[key].failed++
        }
    }
    const dailyChart = Object.values(dayMap)

    // Plan info
    const plan = await getUserPlan(userId)

    // Upcoming scheduled posts (next 5)
    const upcoming = await prisma.post.findMany({
        where: {
            channelId: { in: channelIds },
            status: 'SCHEDULED',
            scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        select: {
            id: true,
            content: true,
            scheduledAt: true,
            channel: { select: { id: true, name: true, displayName: true } },
        },
    })

    return NextResponse.json({
        stats: {
            channels: channelIds.length,
            totalPosts,
            postsThisMonth,
            published: publishedTotal,
            scheduled: scheduledTotal,
            failed: failedTotal,
            drafts: draftTotal,
            pendingApproval: pendingApprovalTotal,
            teamMembers: teamMemberCount,
            unreadNotifications,
        },
        recentPosts,
        upcoming,
        dailyChart,
        plan: {
            planName: plan.planName,
            planNameVi: plan.planNameVi,
            isInTrial: plan.isInTrial,
            daysLeftInTrial: plan.daysLeftInTrial,
            maxPostsPerMonth: plan.maxPostsPerMonth,
            postsThisMonth,
        },
    })
}
