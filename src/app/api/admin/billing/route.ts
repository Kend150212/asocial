import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/billing — list all subscriptions with user + plan
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
            user: { select: { id: true, name: true, email: true } },
            plan: { select: { id: true, name: true, priceMonthly: true, priceAnnual: true } },
        },
    })

    return NextResponse.json(subs)
}
