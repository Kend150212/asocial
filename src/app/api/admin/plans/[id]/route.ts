import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/plans/[id] — get single plan
 * PUT /api/admin/plans/[id] — update plan
 * DELETE /api/admin/plans/[id] — delete plan
 */

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const plan = await prisma.plan.findUnique({
        where: { id },
        include: { _count: { select: { subscriptions: true } } },
    })

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    return NextResponse.json(plan)
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const {
        name, nameVi, description, descriptionVi,
        priceMonthly, priceAnnual,
        stripePriceIdMonthly, stripePriceIdAnnual,
        maxChannels, maxPostsPerMonth, maxMembersPerChannel,
        hasAutoSchedule, hasWebhooks, hasAdvancedReports,
        hasPrioritySupport, hasWhiteLabel,
        isActive, isPublic, sortOrder,
    } = body

    const plan = await prisma.plan.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(nameVi !== undefined && { nameVi }),
            ...(description !== undefined && { description }),
            ...(descriptionVi !== undefined && { descriptionVi }),
            ...(priceMonthly !== undefined && { priceMonthly }),
            ...(priceAnnual !== undefined && { priceAnnual }),
            ...(stripePriceIdMonthly !== undefined && { stripePriceIdMonthly }),
            ...(stripePriceIdAnnual !== undefined && { stripePriceIdAnnual }),
            ...(maxChannels !== undefined && { maxChannels }),
            ...(maxPostsPerMonth !== undefined && { maxPostsPerMonth }),
            ...(maxMembersPerChannel !== undefined && { maxMembersPerChannel }),
            ...(hasAutoSchedule !== undefined && { hasAutoSchedule }),
            ...(hasWebhooks !== undefined && { hasWebhooks }),
            ...(hasAdvancedReports !== undefined && { hasAdvancedReports }),
            ...(hasPrioritySupport !== undefined && { hasPrioritySupport }),
            ...(hasWhiteLabel !== undefined && { hasWhiteLabel }),
            ...(isActive !== undefined && { isActive }),
            ...(isPublic !== undefined && { isPublic }),
            ...(sortOrder !== undefined && { sortOrder }),
        },
    })

    return NextResponse.json(plan)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if any users are on this plan
    const subscriberCount = await prisma.subscription.count({ where: { planId: id } })
    if (subscriberCount > 0) {
        return NextResponse.json({
            error: `Cannot delete — ${subscriberCount} user(s) on this plan`,
            errorVi: `Không thể xóa — có ${subscriberCount} người dùng đang dùng gói này`,
        }, { status: 409 })
    }

    await prisma.plan.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
