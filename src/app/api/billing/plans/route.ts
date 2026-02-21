import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/billing/plans — public list of active plans (for pricing page + upgrade modal)
 */
export async function GET(_req: NextRequest) {
    const plans = await prisma.plan.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            name: true,
            nameVi: true,
            description: true,
            descriptionVi: true,
            priceMonthly: true,
            priceAnnual: true,
            maxChannels: true,
            maxPostsPerMonth: true,
            maxMembersPerChannel: true,
            maxAiImagesPerMonth: true,
            maxAiTextPerMonth: true,
            maxStorageMB: true,
            maxApiCallsPerMonth: true,
            hasAutoSchedule: true,
            hasWebhooks: true,
            hasAdvancedReports: true,
            hasPrioritySupport: true,
            hasWhiteLabel: true,
            stripePriceIdMonthly: true,
            stripePriceIdAnnual: true,
        },
    })

    return NextResponse.json(plans)
}
