/**
 * Stripe client — reads keys from the BILLING integration stored in the DB.
 * Falls back to env vars for backwards compatibility (local dev / cold start).
 */
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

// Get the installed Stripe API version dynamically
// eslint-disable-next-line @typescript-eslint/no-require-imports
const STRIPE_API_VERSION = (require('stripe').LATEST_API_VERSION || '2024-12-18.acacia') as Stripe.LatestApiVersion

let _cachedStripe: Stripe | null = null
let _cacheTs = 0
const CACHE_TTL_MS = 5 * 60 * 1000

async function getStripeRow() {
    try {
        return await prisma.apiIntegration.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: { category_provider: { category: 'BILLING' as any, provider: 'stripe' } },
        })
    } catch {
        return null
    }
}

export async function getStripe(): Promise<Stripe> {
    if (_cachedStripe && Date.now() - _cacheTs < CACHE_TTL_MS) {
        return _cachedStripe
    }

    const row = await getStripeRow()
    const secretKey = row?.apiKeyEncrypted || process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
        throw new Error('Stripe secret key not configured. Add it in Admin → API Hub → Stripe.')
    }

    const instance = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
    _cachedStripe = instance
    _cacheTs = Date.now()
    return instance
}

export async function getStripeWebhookSecret(): Promise<string> {
    const row = await getStripeRow()
    const config = row?.config as Record<string, string> | null
    return config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
}

export async function getStripePublishableKey(): Promise<string> {
    const row = await getStripeRow()
    const config = row?.config as Record<string, string> | null
    return config?.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}

/** @deprecated Use getStripe() instead. */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
    apiVersion: STRIPE_API_VERSION,
})
