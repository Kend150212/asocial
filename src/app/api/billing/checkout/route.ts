import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * POST /api/billing/checkout
 * Body: { planId, interval: 'monthly' | 'annual', couponCode? }
 *
 * Creates a Stripe Checkout session and returns the URL to redirect user.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, interval = 'monthly', couponCode } = await req.json()

    if (!planId) {
        return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const priceId = interval === 'annual'
        ? plan.stripePriceIdAnnual
        : plan.stripePriceIdMonthly

    if (!priceId) {
        return NextResponse.json({ error: 'This plan has no Stripe price configured' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined
    const existingSub = await db.subscription.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
    })

    if (existingSub?.stripeCustomerId) {
        stripeCustomerId = existingSub.stripeCustomerId
    } else {
        const customer = await stripe.customers.create({
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            metadata: { userId: session.user.id },
        })
        stripeCustomerId = customer.id
    }

    // Resolve coupon
    let discounts: Stripe.Checkout.SessionCreateParams['discounts'] | undefined
    if (couponCode) {
        try {
            const coupon = await stripe.coupons.retrieve(couponCode)
            if (coupon.valid) {
                discounts = [{ coupon: coupon.id }]
            }
        } catch {
            return NextResponse.json({ error: 'Invalid coupon code', errorVi: 'Mã giảm giá không hợp lệ' }, { status: 400 })
        }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        ...(discounts ? { discounts } : {}),
        success_url: `${APP_URL}/dashboard/billing?success=1`,
        cancel_url: `${APP_URL}/pricing?canceled=1`,
        metadata: {
            userId: session.user.id,
            planId,
            interval,
        },
        subscription_data: {
            metadata: { userId: session.user.id, planId },
        },
    })

    return NextResponse.json({ url: checkoutSession.url })
}
