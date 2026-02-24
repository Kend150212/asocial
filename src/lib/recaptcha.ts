/**
 * Google reCAPTCHA v3 server-side verification.
 *
 * Usage:
 *   import { verifyRecaptcha } from '@/lib/recaptcha'
 *   const isHuman = await verifyRecaptcha(token)
 *   if (!isHuman) return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 403 })
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

interface RecaptchaResponse {
    success: boolean
    score: number
    action: string
    challenge_ts: string
    hostname: string
    'error-codes'?: string[]
}

/**
 * Get reCAPTCHA secret key from database (stored in ApiIntegration for 'recaptcha' provider)
 */
async function getRecaptchaSecretKey(): Promise<string | null> {
    try {
        const integration = await db.apiIntegration.findFirst({
            where: { provider: 'recaptcha' },
            select: { apiKeyEncrypted: true, isActive: true },
        })
        if (!integration?.isActive || !integration?.apiKeyEncrypted) return null
        return decrypt(integration.apiKeyEncrypted)
    } catch {
        return null
    }
}

/**
 * Verify a reCAPTCHA v3 token.
 * Returns true if reCAPTCHA is not configured (graceful degradation).
 * Returns true if verification passes with score >= 0.5.
 */
export async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
    const secretKey = await getRecaptchaSecretKey()

    // If reCAPTCHA is not configured, allow the request (graceful degradation)
    if (!secretKey) return true

    // If no token provided but reCAPTCHA is configured, block
    if (!token) return false

    try {
        const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
        })

        const data: RecaptchaResponse = await res.json()

        // Score threshold: 0.5 (0.0 = bot, 1.0 = human)
        return data.success && data.score >= 0.5
    } catch (err) {
        console.error('[reCAPTCHA] Verification error:', err)
        // On error, allow the request to avoid blocking legitimate users
        return true
    }
}
