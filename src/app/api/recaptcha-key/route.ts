import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * GET /api/recaptcha-key — public
 * Returns the reCAPTCHA v3 site key (publishable, safe for client).
 */
export async function GET() {
    try {
        const integration = await db.apiIntegration.findFirst({
            where: { provider: 'recaptcha' },
            select: { isActive: true, config: true },
        })
        if (!integration?.isActive) {
            return NextResponse.json({ siteKey: null })
        }
        const config = (integration.config || {}) as Record<string, string>
        return NextResponse.json({ siteKey: config.siteKey || null })
    } catch {
        return NextResponse.json({ siteKey: null })
    }
}
