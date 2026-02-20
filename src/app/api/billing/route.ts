import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan, getCurrentMonth } from '@/lib/plans'

/**
 * GET /api/billing — current user's plan, subscription, usage
 */
export async function GET(_req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const plan = await getUserPlan(userId)

    // Get usage this month
    const sub = await prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    })

    const month = getCurrentMonth()
    let postsThisMonth = 0

    if (sub) {
        const usage = await prisma.usage.findUnique({
            where: { subscriptionId_month: { subscriptionId: sub.id, month } },
        })
        postsThisMonth = usage?.postsCreated ?? 0
    } else {
        const startOfMonth = new Date(`${month}-01T00:00:00.000Z`)
        postsThisMonth = await prisma.post.count({
            where: { authorId: userId, createdAt: { gte: startOfMonth } },
        })
    }

    // Count channels
    const channelCount = await prisma.channelMember.count({
        where: { userId, role: { in: ['ADMIN', 'OWNER'] } },
    })

    return NextResponse.json({
        plan,
        subscription: sub
            ? {
                id: sub.id,
                status: sub.status,
                billingInterval: sub.billingInterval,
                currentPeriodEnd: sub.currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                hasStripeSubscription: !!sub.stripeSubscriptionId,
            }
            : null,
        usage: {
            postsThisMonth,
            channelCount,
            month,
        },
    })
}
