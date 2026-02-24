import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/admin/billing/refund
 * Body: { subscriptionId, reason? }
 *
 * Admin-only. Refunds the latest invoice on Stripe, cancels the subscription,
 * and downgrades the user to the Free plan.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { subscriptionId, reason } = await req.json()

    if (!subscriptionId) {
        return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const sub = await db.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            user: { select: { id: true, name: true, email: true } },
            plan: { select: { id: true, name: true } },
        },
    })

    if (!sub) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let refundId: string | null = null
    let amountRefunded = 0

    // ─── Stripe Refund ──────────────────────────────────────────────────
    if (sub.stripeSubscriptionId) {
        try {
            const stripe = await getStripe()

            // Get the latest invoice for this subscription
            const invoices = await stripe.invoices.list({
                subscription: sub.stripeSubscriptionId,
                limit: 1,
                status: 'paid',
            })

            const latestInvoice = invoices.data[0] as any

            if (latestInvoice?.payment_intent) {
                // Refund the latest payment
                const refund = await stripe.refunds.create({
                    payment_intent: latestInvoice.payment_intent as string,
                    reason: 'requested_by_customer',
                    metadata: {
                        adminId: session.user.id,
                        userId: sub.user.id,
                        reason: reason || 'Admin refund',
                    },
                })
                refundId = refund.id
                amountRefunded = refund.amount / 100 // cents → dollars
            }

            // Cancel the Stripe subscription immediately
            await stripe.subscriptions.cancel(sub.stripeSubscriptionId, {
                prorate: false, // already refunded
            })
        } catch (err) {
            console.error('[Admin Refund] Stripe error:', err)
            return NextResponse.json(
                { error: 'Stripe refund failed. Check Stripe dashboard for details.' },
                { status: 500 }
            )
        }
    }

    // ─── Downgrade to Free plan ─────────────────────────────────────────
    const freePlan = await db.plan.findFirst({
        where: { priceMonthly: 0, isActive: true },
        select: { id: true },
        orderBy: { sortOrder: 'asc' },
    })

    await db.subscription.update({
        where: { id: subscriptionId },
        data: {
            planId: freePlan?.id ?? sub.planId,
            status: 'canceled',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
        },
    })

    return NextResponse.json({
        success: true,
        refundId,
        amountRefunded,
        user: sub.user,
        message: refundId
            ? `Refunded $${amountRefunded.toFixed(2)} to ${sub.user.email} and canceled subscription.`
            : `Subscription canceled for ${sub.user.email} (no Stripe payment to refund).`,
    })
}
