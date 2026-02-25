import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    return session.user
}

/**
 * GET /api/admin/addons — list all add-ons (including inactive)
 */
export async function GET() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const addons = await db.addon.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
            _count: { select: { subscriptionAddons: true } },
        },
    })

    return NextResponse.json(addons)
}

/**
 * POST /api/admin/addons — create a new add-on
 */
export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const addon = await db.addon.create({ data: body })
    return NextResponse.json(addon, { status: 201 })
}
