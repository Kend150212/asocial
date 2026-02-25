import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * POST /api/billing/addon — purchase or cancel an add-on
 *
 * Body: { addonId, action: 'purchase' | 'cancel', quantity?: number }
 *
 * NOTE: For now, this records the add-on directly in the DB.
 * Stripe integration can be added later to handle payment.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { addonId, action, quantity = 1 } = await req.json()

    if (!addonId || !action) {
        return NextResponse.json({ error: 'addonId and action are required' }, { status: 400 })
    }

    // Verify addon exists
    const addon = await db.addon.findUnique({ where: { id: addonId } })
    if (!addon || !addon.isActive) {
        return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Get or check subscription
    const sub = await db.subscription.findUnique({
        where: { userId: session.user.id },
    })

    if (!sub) {
        return NextResponse.json(
            { error: 'You need an active subscription to purchase add-ons' },
            { status: 400 }
        )
    }

    if (action === 'purchase') {
        // Upsert the subscription addon
        const sa = await db.subscriptionAddon.upsert({
            where: {
                subscriptionId_addonId: {
                    subscriptionId: sub.id,
                    addonId,
                },
            },
            update: {
                quantity,
                status: 'active',
            },
            create: {
                subscriptionId: sub.id,
                addonId,
                quantity,
                status: 'active',
            },
            include: { addon: true },
        })

        return NextResponse.json({
            success: true,
            action: 'purchased',
            addon: sa.addon,
            quantity: sa.quantity,
        })
    }

    if (action === 'cancel') {
        await db.subscriptionAddon.updateMany({
            where: {
                subscriptionId: sub.id,
                addonId,
            },
            data: { status: 'canceled' },
        })

        return NextResponse.json({
            success: true,
            action: 'canceled',
            addonId,
        })
    }

    return NextResponse.json({ error: 'Invalid action. Use "purchase" or "cancel".' }, { status: 400 })
}
