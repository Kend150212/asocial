import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session.
 * User can manage/cancel/change subscription there.
 */
export async function POST(_req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sub = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
    })

    if (!sub?.stripeCustomerId) {
        return NextResponse.json({ error: 'No active subscription found', errorVi: 'Không tìm thấy gói đăng ký' }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
}
