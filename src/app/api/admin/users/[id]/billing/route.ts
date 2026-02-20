import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/users/[id]/billing
 * Returns user's subscription, plan, and usage
 *
 * PUT /api/admin/users/[id]/billing
 * Manually override plan for a user (no Stripe, admin action)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function requireAdmin() {
    const session = await auth()
    if (!session?.user?.id) return null
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (user?.role !== 'ADMIN') return null
    return session
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: userId } = await params

    const sub = await db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    })

    // Calculate usage this month
    const month = new Date().toISOString().slice(0, 7)
    let postsThisMonth = 0
    if (sub) {
        const usage = await db.usage.findUnique({
            where: { subscriptionId_month: { subscriptionId: sub.id, month } },
        })
        postsThisMonth = usage?.postsCreated ?? 0
    } else {
        const startOfMonth = new Date(`${month}-01T00:00:00.000Z`)
        postsThisMonth = await prisma.post.count({
            where: { authorId: userId, createdAt: { gte: startOfMonth } },
        })
    }

    // Count channels owned
    const channelCount = await prisma.channelMember.count({
        where: { userId },
    })

    // All plans for dropdown
    const plans = await db.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, nameVi: true, priceMonthly: true },
    })

    return NextResponse.json({
        subscription: sub,
        plan: sub?.plan ?? null,
        usage: { postsThisMonth, channelCount, month },
        plans,
    })
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: userId } = await params
    const { planId, status, note } = await req.json()

    if (!planId) {
        return NextResponse.json({ error: 'planId required' }, { status: 400 })
    }

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Upsert subscription — admin override (no Stripe)
    const periodEnd = new Date()
    periodEnd.setFullYear(periodEnd.getFullYear() + 1) // 1 year from now

    try {
        const sub = await db.subscription.upsert({
            where: { userId },
            update: {
                planId,
                status: status ?? 'active',
                updatedAt: new Date(),
            },
            create: {
                userId,
                planId,
                status: status ?? 'active',
                billingInterval: 'monthly',
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
            },
        })

        console.log(`[AdminBilling] Plan overridden for user ${userId} → ${plan.name}. Note: ${note ?? '—'}`)
        return NextResponse.json({ subscription: sub, plan })
    } catch (err) {
        console.error('[AdminBilling] Failed to upsert subscription:', err)
        const msg = err instanceof Error ? err.message : 'Database error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
