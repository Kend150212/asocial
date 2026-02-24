/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach per key (IP / email).
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit'
 *   const limiter = rateLimit({ interval: 60_000, maxRequests: 10 })
 *
 *   // In route handler:
 *   const ip = req.headers.get('x-forwarded-for') || 'unknown'
 *   const { success } = limiter.check(ip)
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitOptions {
    /** Time window in milliseconds */
    interval: number
    /** Max requests per window */
    maxRequests: number
}

interface RateLimitEntry {
    count: number
    resetAt: number
}

export function rateLimit({ interval, maxRequests }: RateLimitOptions) {
    const store = new Map<string, RateLimitEntry>()

    // Clean up expired entries every 5 minutes
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store) {
            if (now > entry.resetAt) store.delete(key)
        }
    }, 5 * 60 * 1000)

    return {
        check(key: string): { success: boolean; remaining: number; resetAt: number } {
            const now = Date.now()
            const entry = store.get(key)

            if (!entry || now > entry.resetAt) {
                // New window
                store.set(key, { count: 1, resetAt: now + interval })
                return { success: true, remaining: maxRequests - 1, resetAt: now + interval }
            }

            if (entry.count >= maxRequests) {
                return { success: false, remaining: 0, resetAt: entry.resetAt }
            }

            entry.count++
            return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
        },
    }
}

// ── Pre-configured limiters ──────────────────────────────────────

/** Auth routes: 10 requests per minute */
export const authLimiter = rateLimit({ interval: 60_000, maxRequests: 10 })

/** Billing routes: 20 requests per minute */
export const billingLimiter = rateLimit({ interval: 60_000, maxRequests: 20 })

/** General API: 60 requests per minute */
export const generalLimiter = rateLimit({ interval: 60_000, maxRequests: 60 })
