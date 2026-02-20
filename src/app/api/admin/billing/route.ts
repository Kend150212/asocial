import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/billing — list all subscriptions + analytics data
 */
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const subs = await db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, email: true, trialEndsAt: true, createdAt: true } },
            plan: { select: { id: true, name: true, priceMonthly: true, priceAnnual: true } },
        },
    })

    // ── Trial stats ─────────────────────────────────────────────────
    const now = new Date()
    const usersInTrial = await prisma.user.count({
        where: { trialEndsAt: { gt: now } },
    })
    const usersTrialExpired = await prisma.user.count({
        where: { trialEndsAt: { lt: now, not: null } },
    })
    // Users who had trial and became paid (have active non-free sub)
    const trialConverted = subs.filter((s: { status: string; plan: { priceMonthly: number; priceAnnual: number }; user: { trialEndsAt: string | null } }) =>
        s.status === 'active' &&
        (s.plan.priceMonthly > 0 || s.plan.priceAnnual > 0) &&
        s.user.trialEndsAt !== null
    ).length

    // ── Plan distribution ────────────────────────────────────────────
    const planCounts: Record<string, number> = {}
    for (const s of subs) {
        const name = s.plan.name
        planCounts[name] = (planCounts[name] ?? 0) + 1
    }
    const planBreakdown = Object.entries(planCounts).map(([name, count]) => ({ name, count }))

    // ── MRR history — last 6 full months ────────────────────────────
    const mrrHistory: { month: string; mrr: number; subs: number }[] = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)

        // Subs that existed (created before end of that month) and were active
        const monthSubs = subs.filter((s: { createdAt: string; status: string }) => {
            const created = new Date(s.createdAt)
            return created < nextMonth && s.status === 'active'
        })
        const mrr = monthSubs.reduce((sum: number, s: { billingInterval: string; plan: { priceMonthly: number; priceAnnual: number } }) => {
            const price = s.billingInterval === 'annual' ? s.plan.priceAnnual / 12 : s.plan.priceMonthly
            return sum + price
        }, 0)
        mrrHistory.push({ month, mrr: Math.round(mrr), subs: monthSubs.length })
    }

    return NextResponse.json({
        subs,
        mrrHistory,
        planBreakdown,
        trialStats: {
            active: usersInTrial,
            expired: usersTrialExpired,
            converted: trialConverted,
            conversionRate: usersTrialExpired > 0 ? Math.round((trialConverted / usersTrialExpired) * 100) : 0,
        },
    })
}
