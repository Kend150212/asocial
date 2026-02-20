import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

/**
 * POST /api/billing/webhook
 * Stripe sends events here. Verify signature then update subscriptions.
 */
export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature') ?? ''

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
    } catch (err) {
        console.error('[BillingWebhook] Invalid signature:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
                break
            case 'customer.subscription.updated':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await handleSubscriptionUpdated(event.data.object as any)
                break
            case 'customer.subscription.deleted':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await handleSubscriptionDeleted(event.data.object as any)
                break
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice)
                break
            default:
                break
        }
    } catch (err) {
        console.error(`[BillingWebhook] Error handling ${event.type}:`, err)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId
    const planId = session.metadata?.planId
    const interval = session.metadata?.interval ?? 'monthly'

    if (!userId || !planId) {
        console.error('[BillingWebhook] Missing metadata on checkout session', session.id)
        return
    }

    const stripeSubId = session.subscription as string
    const stripeCustomerId = session.customer as string

    // Fetch full subscription to get period dates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any
    const periodEnd = stripeSub.current_period_end ?? stripeSub.items?.data?.[0]?.current_period_end ?? 0
    const couponId = (stripeSub.discounts as Array<{ coupon?: { id?: string } }>)?.[0]?.coupon?.id ?? null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.subscription.upsert({
        where: { userId },
        update: {
            planId,
            stripeCustomerId,
            stripeSubscriptionId: stripeSubId,
            stripeCouponId: couponId,
            billingInterval: interval,
            status: stripeSub.status,
            currentPeriodEnd: new Date(periodEnd * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
        create: {
            userId,
            planId,
            stripeCustomerId,
            stripeSubscriptionId: stripeSubId,
            stripeCouponId: couponId,
            billingInterval: interval,
            status: stripeSub.status,
            currentPeriodEnd: new Date(periodEnd * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
    })

    console.log(`[BillingWebhook] Subscription activated for user ${userId}, plan ${planId}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(stripeSub: any) {
    const userId = stripeSub.metadata?.userId
    if (!userId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const priceId = stripeSub.items?.data?.[0]?.price?.id
    let planId: string | undefined

    if (priceId) {
        const plan = await db.plan.findFirst({
            where: {
                OR: [
                    { stripePriceIdMonthly: priceId },
                    { stripePriceIdAnnual: priceId },
                ],
            },
            select: { id: true, stripePriceIdAnnual: true },
        })
        planId = plan?.id
    }

    const interval = priceId
        ? ((await db.plan.findFirst({ where: { stripePriceIdAnnual: priceId }, select: { id: true } }))
            ? 'annual' : 'monthly')
        : undefined

    const periodEnd = stripeSub.current_period_end ?? stripeSub.items?.data?.[0]?.current_period_end ?? 0

    await db.subscription.updateMany({
        where: { userId },
        data: {
            ...(planId ? { planId } : {}),
            ...(interval ? { billingInterval: interval } : {}),
            status: stripeSub.status,
            currentPeriodEnd: new Date(periodEnd * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
    })

    console.log(`[BillingWebhook] Subscription updated for user ${userId}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(stripeSub: any) {
    const userId = stripeSub.metadata?.userId
    if (!userId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const freePlan = await db.plan.findFirst({
        where: { priceMonthly: 0 },
        orderBy: { sortOrder: 'asc' },
    })

    const periodEnd = stripeSub.current_period_end ?? stripeSub.items?.data?.[0]?.current_period_end ?? 0

    if (freePlan) {
        await db.subscription.updateMany({
            where: { userId },
            data: {
                planId: freePlan.id,
                stripeSubscriptionId: null,
                stripeCouponId: null,
                status: 'canceled',
                currentPeriodEnd: new Date(periodEnd * 1000),
            },
        })
    }

    console.log(`[BillingWebhook] Subscription canceled for user ${userId} — downgraded to Free`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'past_due' },
    })
    console.log(`[BillingWebhook] Payment failed for customer ${customerId}`)
}
