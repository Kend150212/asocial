/**
 * Billing limit enforcement helpers.
 * Call these before creating resources — return 402 if limit reached.
 */
import { prisma } from '@/lib/prisma'
import { getUserPlan, getCurrentMonth } from '@/lib/plans'

export type LimitError = {
    code: 'LIMIT_REACHED'
    feature: string
    limit: number
    current: number
    message: string
    messageVi: string
}

// ─── Posts per month ──────────────────────────────────────────────────────────

export async function checkPostLimit(
    userId: string,
): Promise<LimitError | null> {
    const plan = await getUserPlan(userId)

    // -1 = unlimited
    if (plan.maxPostsPerMonth === -1) return null

    const sub = await prisma.subscription.findUnique({ where: { userId } })

    // No subscription = FREE user, still apply limit
    const month = getCurrentMonth()
    let postsThisMonth = 0

    if (sub) {
        const usage = await prisma.usage.findUnique({
            where: { subscriptionId_month: { subscriptionId: sub.id, month } },
        })
        postsThisMonth = usage?.postsCreated ?? 0
    } else {
        // Count directly from DB for FREE users with no subscription record
        const startOfMonth = new Date(`${month}-01T00:00:00.000Z`)
        postsThisMonth = await prisma.post.count({
            where: {
                authorId: userId,
                createdAt: { gte: startOfMonth },
            },
        })
    }

    if (postsThisMonth >= plan.maxPostsPerMonth) {
        return {
            code: 'LIMIT_REACHED',
            feature: 'posts',
            limit: plan.maxPostsPerMonth,
            current: postsThisMonth,
            message: `You've reached your monthly post limit (${plan.maxPostsPerMonth}). Upgrade to continue.`,
            messageVi: `Bạn đã đạt giới hạn bài đăng tháng này (${plan.maxPostsPerMonth}). Nâng cấp để tiếp tục.`,
        }
    }

    return null
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function checkChannelLimit(
    userId: string,
): Promise<LimitError | null> {
    const plan = await getUserPlan(userId)
    if (plan.maxChannels === -1) return null

    const currentChannels = await prisma.channelMember.count({
        where: { userId, role: { in: ['ADMIN', 'OWNER'] } },
    })

    if (currentChannels >= plan.maxChannels) {
        return {
            code: 'LIMIT_REACHED',
            feature: 'channels',
            limit: plan.maxChannels,
            current: currentChannels,
            message: `You've reached your channel limit (${plan.maxChannels}). Upgrade to create more channels.`,
            messageVi: `Bạn đã đạt giới hạn kênh (${plan.maxChannels}). Nâng cấp để tạo thêm.`,
        }
    }

    return null
}

// ─── Members per channel ──────────────────────────────────────────────────────

export async function checkMemberLimit(
    channelId: string,
    userId: string,
): Promise<LimitError | null> {
    const plan = await getUserPlan(userId)
    if (plan.maxMembersPerChannel === -1) return null

    const currentMembers = await prisma.channelMember.count({
        where: { channelId },
    })

    if (currentMembers >= plan.maxMembersPerChannel) {
        return {
            code: 'LIMIT_REACHED',
            feature: 'members',
            limit: plan.maxMembersPerChannel,
            current: currentMembers,
            message: `This channel has reached its member limit (${plan.maxMembersPerChannel}). Upgrade to add more.`,
            messageVi: `Kênh đã đạt giới hạn thành viên (${plan.maxMembersPerChannel}). Nâng cấp để thêm.`,
        }
    }

    return null
}

// ─── Feature flags ────────────────────────────────────────────────────────────

export async function checkFeature(
    userId: string,
    feature: 'autoSchedule' | 'webhooks' | 'advancedReports' | 'prioritySupport' | 'whiteLabel',
): Promise<LimitError | null> {
    const plan = await getUserPlan(userId)

    const featureMap: Record<string, boolean> = {
        autoSchedule: plan.hasAutoSchedule,
        webhooks: plan.hasWebhooks,
        advancedReports: plan.hasAdvancedReports,
        prioritySupport: plan.hasPrioritySupport,
        whiteLabel: plan.hasWhiteLabel,
    }

    const featureLabels: Record<string, string> = {
        autoSchedule: 'Auto Scheduling',
        webhooks: 'Webhooks',
        advancedReports: 'Advanced Reports',
        prioritySupport: 'Priority Support',
        whiteLabel: 'White Label',
    }

    if (!featureMap[feature]) {
        return {
            code: 'LIMIT_REACHED',
            feature,
            limit: 0,
            current: 0,
            message: `${featureLabels[feature]} is not available on your plan. Upgrade to unlock.`,
            messageVi: `${featureLabels[feature]} không có trong gói hiện tại. Nâng cấp để sử dụng.`,
        }
    }

    return null
}

// ─── Increment usage counter ──────────────────────────────────────────────────

export async function incrementPostUsage(userId: string): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    if (!sub) return

    const month = getCurrentMonth()
    await prisma.usage.upsert({
        where: { subscriptionId_month: { subscriptionId: sub.id, month } },
        update: { postsCreated: { increment: 1 } },
        create: { subscriptionId: sub.id, month, postsCreated: 1 },
    })
}
