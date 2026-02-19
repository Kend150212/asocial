import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cron/publish-scheduled
 *
 * Auto-publishes posts whose scheduledAt time has passed.
 * Call this on a regular interval (e.g. every minute via cron or Vercel Cron Jobs).
 *
 * Security: Requires a shared CRON_SECRET token in the Authorization header.
 * If CRON_SECRET is not set, only allow in development.
 *
 * Vercel cron.json example:
 * { "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "* * * * *" }] }
 */
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
        const auth = req.headers.get('authorization')
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    } else if (process.env.NODE_ENV === 'production') {
        // Block unauthenticated access in production when no secret is set
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 401 })
    }

    const now = new Date()

    // Find all scheduled posts that are due
    const duePosts = await prisma.post.findMany({
        where: {
            status: 'SCHEDULED',
            scheduledAt: { lte: now },
        },
        select: { id: true, scheduledAt: true },
    })

    if (duePosts.length === 0) {
        return NextResponse.json({ published: 0, message: 'No scheduled posts due' })
    }

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const post of duePosts) {
        try {
            // Mark as PUBLISHING first to prevent duplicate processing
            await prisma.post.update({
                where: { id: post.id },
                data: { status: 'PUBLISHING' },
            })

            // Call the publish endpoint
            const origin = req.nextUrl.origin
            const publishRes = await fetch(`${origin}/api/admin/posts/${post.id}/publish`, {
                method: 'POST',
                headers: {
                    'x-cron-token': cronSecret || 'dev',
                    'Content-Type': 'application/json',
                },
            })

            const data = await publishRes.json().catch(() => ({}))
            results.push({ id: post.id, success: publishRes.ok && data.success !== false })
        } catch (err) {
            console.error(`[cron] Failed to publish post ${post.id}:`, err)
            // Revert back to SCHEDULED so it retries next cycle
            await prisma.post.update({
                where: { id: post.id },
                data: { status: 'SCHEDULED' },
            }).catch(() => { })
            results.push({ id: post.id, success: false, error: String(err) })
        }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`[cron/publish-scheduled] Processed ${duePosts.length} posts, ${successCount} succeeded`)

    return NextResponse.json({
        published: successCount,
        failed: results.length - successCount,
        results,
    })
}
