import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * GET /api/site-mode — public, lightweight
 * Returns the current site mode for middleware to check.
 */
export async function GET() {
    try {
        const settings = await db.siteSettings.findUnique({
            where: { id: 'default' },
            select: { siteMode: true },
        })
        return NextResponse.json(
            { mode: settings?.siteMode || 'live' },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
                },
            }
        )
    } catch {
        return NextResponse.json({ mode: 'live' })
    }
}
