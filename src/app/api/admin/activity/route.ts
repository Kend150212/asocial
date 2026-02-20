import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/activity — paginated audit trail
 * Query params: page, limit, action, userId, from, to
 */
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))
    const action = searchParams.get('action') ?? undefined
    const userId = searchParams.get('userId') ?? undefined
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (action) where.action = action
    if (userId) where.userId = userId
    if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to) where.createdAt.lte = new Date(to)
    }

    const [total, logs] = await Promise.all([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        }),
    ])

    // Action type breakdown for chart
    const actionCounts = await prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { _count: { action: 'desc' } },
    })

    // Distinct action types for filter dropdown
    const actionTypes = await prisma.activityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
    })

    return NextResponse.json({
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count.action })),
        actionTypes: actionTypes.map(a => a.action),
    })
}
