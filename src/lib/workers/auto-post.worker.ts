/**
 * Auto-Post Worker — BullMQ consumer for the 'auto-post' queue.
 *
 * Calls the existing POST /api/admin/posts/[id]/publish route internally
 * via authenticated server-to-server fetch. Reuses all platform API logic.
 */

import { Worker } from 'bullmq'
import { QUEUE_NAMES, REDIS_URL } from '@/lib/queue'
import { prisma } from '@/lib/prisma'
import type { AutoPostJobData } from '@/lib/queue'

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const WORKER_SECRET = process.env.WORKER_SECRET || ''

async function processAutoPost(data: AutoPostJobData): Promise<void> {
    const { postId, triggeredBy = 'scheduler' } = data
    console.log(`[AutoPostWorker] Processing post ${postId} (triggered: ${triggeredBy})`)

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, status: true, scheduledAt: true },
    })

    if (!post) throw new Error(`Post ${postId} not found`)

    if (post.status !== 'PUBLISHING') {
        console.log(`[AutoPostWorker] Post ${postId} status is '${post.status}' — skipping`)
        return
    }

    // Call existing publish route (reuses all 1270 lines of platform API logic)
    const res = await fetch(`${APP_URL}/api/admin/posts/${postId}/publish`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-worker-secret': WORKER_SECRET,
            'x-worker-trigger': triggeredBy,
        },
    })

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Publish API returned ${res.status}: ${body}`)
    }

    const result = await res.json()
    console.log(`[AutoPostWorker] Post ${postId} result:`, JSON.stringify(result))

    // Handle repeat posts after successful publish
    await handleRepeatPost(postId)
}

async function handleRepeatPost(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            media: true,
            platformStatuses: true,
        },
    })

    if (!post?.isRepeat || !post.repeatIntervalDays) return
    if (post.repeatCount !== null && post.repeatCount <= 0) return

    const nextSchedule = new Date(post.scheduledAt || new Date())
    nextSchedule.setDate(nextSchedule.getDate() + post.repeatIntervalDays)

    const newRepeatCount = post.repeatCount !== null ? post.repeatCount - 1 : null

    const cloned = await prisma.post.create({
        data: {
            channelId: post.channelId,
            authorId: post.authorId,
            content: post.content,
            contentPerPlatform: post.contentPerPlatform ?? {},
            status: 'SCHEDULED',
            scheduledAt: nextSchedule,
            isRepeat: newRepeatCount === null || newRepeatCount > 0,
            repeatCount: newRepeatCount,
            repeatIntervalDays: post.repeatIntervalDays,
            media: {
                create: post.media.map(m => ({
                    mediaItemId: m.mediaItemId,
                    sortOrder: m.sortOrder,
                })),
            },
            platformStatuses: {
                create: post.platformStatuses.map(ps => ({
                    platform: ps.platform,
                    accountId: ps.accountId,
                    status: 'pending',
                    config: ps.config ?? {},
                })),
            },
        },
    })

    console.log(`[AutoPostWorker] Repeat post ${cloned.id} scheduled for ${nextSchedule.toISOString()}`)
}

export function startAutoPostWorker(): Worker {
    const worker = new Worker<AutoPostJobData>(
        QUEUE_NAMES.AUTO_POST,
        async (job) => { await processAutoPost(job.data) },
        { connection: { url: REDIS_URL }, concurrency: 3 }
    )

    worker.on('completed', j => console.log(`[AutoPostWorker] Job ${j.id} completed`))
    worker.on('failed', (j, err) => console.error(`[AutoPostWorker] Job ${j?.id} failed:`, err.message))
    worker.on('error', err => console.error('[AutoPostWorker] Error:', err))

    console.log('[AutoPostWorker] Started')
    return worker
}
