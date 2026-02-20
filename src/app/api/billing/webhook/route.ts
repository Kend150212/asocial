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
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
                break
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
                break
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice)
                break
            default:
                // Ignore unhandled events
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
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)

    await prisma.subscription.upsert({
        where: { userId },
        update: {
            planId,
            stripeCustomerId,
            stripeSubscriptionId: stripeSubId,
            stripeCouponId: (stripeSub.discount?.coupon?.id) ?? null,
            billingInterval: interval,
            status: stripeSub.status,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
        create: {
            userId,
            planId,
            stripeCustomerId,
            stripeSubscriptionId: stripeSubId,
            stripeCouponId: (stripeSub.discount?.coupon?.id) ?? null,
            billingInterval: interval,
            status: stripeSub.status,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
    })

    console.log(`[BillingWebhook] Subscription activated for user ${userId}, plan ${planId}`)
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
    const userId = stripeSub.metadata?.userId
    if (!userId) return

    // Find new plan by Stripe price ID
    const priceId = stripeSub.items.data[0]?.price?.id
    let planId: string | undefined

    if (priceId) {
        const plan = await prisma.plan.findFirst({
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
        ? ((await prisma.plan.findFirst({
            where: { stripePriceIdAnnual: priceId },
            select: { id: true },
        })) ? 'annual' : 'monthly')
        : undefined

    await prisma.subscription.updateMany({
        where: { userId },
        data: {
            ...(planId ? { planId } : {}),
            ...(interval ? { billingInterval: interval } : {}),
            status: stripeSub.status,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
    })

    console.log(`[BillingWebhook] Subscription updated for user ${userId}`)
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
    const userId = stripeSub.metadata?.userId
    if (!userId) return

    // Find FREE plan to downgrade to
    const freePlan = await prisma.plan.findFirst({
        where: { priceMonthly: 0 },
        orderBy: { sortOrder: 'asc' },
    })

    if (freePlan) {
        await prisma.subscription.updateMany({
            where: { userId },
            data: {
                planId: freePlan.id,
                stripeSubscriptionId: null,
                stripeCouponId: null,
                status: 'canceled',
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
        })
    }

    console.log(`[BillingWebhook] Subscription canceled for user ${userId} — downgraded to Free`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string
    await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'past_due' },
    })
    console.log(`[BillingWebhook] Payment failed for customer ${customerId}`)
}
