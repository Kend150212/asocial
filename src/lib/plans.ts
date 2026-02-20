/**
 * Billing & Plans library
 * - Get user's current plan + limits
 * - Check limits before creating resources
 */
import { prisma } from '@/lib/prisma'

// Default FREE plan limits (fallback when no subscription found)
export const FREE_PLAN_DEFAULTS = {
    maxChannels: 1,
    maxPostsPerMonth: 50,
    maxMembersPerChannel: 2,
    hasAutoSchedule: false,
    hasWebhooks: false,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
    hasWhiteLabel: false,
}

export type PlanLimits = typeof FREE_PLAN_DEFAULTS & {
    planName: string
    planNameVi: string
    priceMonthly: number
    priceAnnual: number
    billingInterval: string
    status: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
}

/**
 * Get user's current plan limits.
 * Falls back to FREE plan defaults if no active subscription.
 */
export async function getUserPlan(userId: string): Promise<PlanLimits> {
    const sub = await prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    })

    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
        return {
            ...FREE_PLAN_DEFAULTS,
            planName: 'Free',
            planNameVi: 'Miễn phí',
            priceMonthly: 0,
            priceAnnual: 0,
            billingInterval: 'monthly',
            status: sub?.status ?? 'active',
            currentPeriodEnd: sub?.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
        }
    }

    const p = sub.plan
    return {
        planName: p.name,
        planNameVi: p.nameVi,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        billingInterval: sub.billingInterval,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        maxChannels: p.maxChannels,
        maxPostsPerMonth: p.maxPostsPerMonth,
        maxMembersPerChannel: p.maxMembersPerChannel,
        hasAutoSchedule: p.hasAutoSchedule,
        hasWebhooks: p.hasWebhooks,
        hasAdvancedReports: p.hasAdvancedReports,
        hasPrioritySupport: p.hasPrioritySupport,
        hasWhiteLabel: p.hasWhiteLabel,
    }
}

/**
 * Get current month string: "2026-02"
 */
export function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get or create usage record for this month
 */
export async function getOrCreateUsage(subscriptionId: string) {
    const month = getCurrentMonth()
    return prisma.usage.upsert({
        where: { subscriptionId_month: { subscriptionId, month } },
        update: {},
        create: { subscriptionId, month, postsCreated: 0 },
    })
}
