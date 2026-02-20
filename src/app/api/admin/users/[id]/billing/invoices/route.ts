import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/admin/users/[id]/billing/invoices
 * Fetches Stripe invoices for a user
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get stripeCustomerId
    const sub = await db.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true },
    })

    if (!sub?.stripeCustomerId) {
        return NextResponse.json({ invoices: [] })
    }

    try {
        const stripe = await getStripe()
        const invoiceList = await stripe.invoices.list({
            customer: sub.stripeCustomerId,
            limit: 24,
        })

        const invoices = invoiceList.data.map((inv) => ({
            id: inv.id,
            number: inv.number,
            status: inv.status,
            amountPaid: inv.amount_paid,
            amountDue: inv.amount_due,
            currency: inv.currency,
            created: inv.created,
            hostedInvoiceUrl: inv.hosted_invoice_url,
            invoicePdf: inv.invoice_pdf,
            description: inv.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            periodStart: (inv as any).period_start,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            periodEnd: (inv as any).period_end,
        }))

        return NextResponse.json({ invoices })
    } catch (err) {
        console.error('[AdminInvoices] Stripe error:', err)
        return NextResponse.json({ invoices: [], error: 'Stripe fetch failed' })
    }
}
