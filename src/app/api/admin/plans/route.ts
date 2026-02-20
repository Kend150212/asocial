import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/plans — list all plans
 * POST /api/admin/plans — create a new plan
 */

export async function GET(_req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.plan.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { subscriptions: true } } },
    })

    return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
        name, nameVi = '', description, descriptionVi,
        priceMonthly = 0, priceAnnual = 0,
        stripePriceIdMonthly, stripePriceIdAnnual,
        maxChannels = 1, maxPostsPerMonth = 50, maxMembersPerChannel = 2,
        hasAutoSchedule = false, hasWebhooks = false, hasAdvancedReports = false,
        hasPrioritySupport = false, hasWhiteLabel = false,
        isActive = true, isPublic = true, sortOrder = 0,
    } = body

    if (!name) {
        return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    const plan = await prisma.plan.create({
        data: {
            name, nameVi, description, descriptionVi,
            priceMonthly, priceAnnual,
            stripePriceIdMonthly, stripePriceIdAnnual,
            maxChannels, maxPostsPerMonth, maxMembersPerChannel,
            hasAutoSchedule, hasWebhooks, hasAdvancedReports,
            hasPrioritySupport, hasWhiteLabel,
            isActive, isPublic, sortOrder,
        },
    })

    return NextResponse.json(plan, { status: 201 })
}
