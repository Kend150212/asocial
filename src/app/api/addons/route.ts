import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * GET /api/addons — list all available add-ons
 * Returns active add-ons grouped by category, plus user's active add-ons
 */
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [addons, sub] = await Promise.all([
        db.addon.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        }),
        db.subscription.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                addons: {
                    where: { status: 'active' },
                    select: { addonId: true, quantity: true },
                },
            },
        }),
    ])

    // Map user's active add-ons for easy lookup
    const activeMap: Record<string, number> = {}
    for (const sa of (sub?.addons ?? [])) {
        activeMap[sa.addonId] = sa.quantity
    }

    return NextResponse.json({
        addons,
        activeAddons: activeMap,
        hasSubscription: !!sub,
    })
}
