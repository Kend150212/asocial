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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const sub = await db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    })

    const month = getCurrentMonth()
    let postsThisMonth = 0
    let imagesThisMonth = 0

    if (sub) {
        const usage = await db.usage.findUnique({
            where: { subscriptionId_month: { subscriptionId: sub.id, month } },
        })
        postsThisMonth = usage?.postsCreated ?? 0
        imagesThisMonth = usage?.imagesGenerated ?? 0
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

    // Check BYOK — does user have any image provider key configured?
    const byokKey = await prisma.userApiKey.findFirst({
        where: { userId, provider: { in: ['runware', 'openai', 'gemini'] } },
        select: { provider: true },
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
            imagesThisMonth,
        },
        aiImage: {
            hasByokKey: !!byokKey,
            byokProvider: byokKey?.provider ?? null,
            maxPerMonth: sub?.plan?.maxAiImagesPerMonth ?? 0,
        },
    })
}
