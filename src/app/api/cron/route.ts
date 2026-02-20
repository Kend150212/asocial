/**
 * Cron trigger endpoint — called by system cron or pm2 every minute.
 *
 * Protected by CRON_SECRET header.
 * Can also be triggered manually to check for due posts immediately.
 *
 * Usage:
 *   Linux cron: * * * * * curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron
 *   Manual:     curl -s -H "x-cron-secret: <secret>" https://app.example.com/api/cron
 */

import { NextRequest, NextResponse } from 'next/server'
import { pollScheduledPosts } from '@/lib/scheduler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET || ''

    // Require secret if configured
    if (cronSecret) {
        const provided = req.headers.get('x-cron-secret')
        if (provided !== cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const result = await pollScheduledPosts()

    return NextResponse.json({
        ok: true,
        enqueued: result.enqueued,
        timestamp: new Date().toISOString(),
    })
}
