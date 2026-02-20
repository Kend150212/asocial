import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/usage — Current plan limits and usage
 */
export async function GET(req: NextRequest) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult

    const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
        include: {
            plan: true,
            usages: {
                where: { month: usage.month },
                take: 1,
            },
        },
    })

    if (!subscription) {
        return NextResponse.json({ success: false, error: { code: 'NO_SUBSCRIPTION', message: 'No subscription found' } }, { status: 404 })
    }

    const p = subscription.plan
    const u = subscription.usages[0]

    return apiSuccess({
        plan: {
            name: p.name,
            billingInterval: subscription.billingInterval,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
        },
        limits: {
            maxChannels: p.maxChannels,
            maxPostsPerMonth: p.maxPostsPerMonth,
            maxAiImagesPerMonth: p.maxAiImagesPerMonth,
            maxAiTextPerMonth: p.maxAiTextPerMonth,
            maxApiCallsPerMonth: p.maxApiCallsPerMonth,
            maxStorageMB: p.maxStorageMB,
        },
        usage: {
            month: usage.month,
            postsCreated: u?.postsCreated || 0,
            imagesGenerated: u?.imagesGenerated || 0,
            aiTextGenerated: u?.aiTextGenerated || 0,
            apiCalls: u?.apiCalls || 0,
        },
        features: {
            hasAutoSchedule: p.hasAutoSchedule,
            hasWebhooks: p.hasWebhooks,
            hasAdvancedReports: p.hasAdvancedReports,
            hasPrioritySupport: p.hasPrioritySupport,
            hasWhiteLabel: p.hasWhiteLabel,
        },
    }, usage.apiCalls, plan.maxApiCallsPerMonth)
}
