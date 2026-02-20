/**
 * Webhook Worker — BullMQ consumer for 'webhook-dispatch' queue.
 */

import { Worker } from 'bullmq'
import { QUEUE_NAMES, REDIS_URL } from '@/lib/queue'
import { prisma } from '@/lib/prisma'
import { sendPublishWebhooks } from '@/lib/webhook-notify'
import type { WebhookJobData } from '@/lib/queue'

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function processWebhook(data: WebhookJobData): Promise<void> {
    const { postId, event } = data

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            channel: { select: { name: true, webhookDiscord: true, webhookTelegram: true, webhookSlack: true, webhookCustom: true, webhookEvents: true } },
            platformStatuses: { select: { platform: true, accountId: true, status: true, errorMsg: true, externalId: true } },
            media: true,
        },
    })

    if (!post) {
        console.warn(`[WebhookWorker] Post ${postId} not found — skipping`)
        return
    }

    const channel = post.channel
    const webhookConfig = {
        webhookDiscord: channel.webhookDiscord as Record<string, string> | null,
        webhookTelegram: channel.webhookTelegram as Record<string, string> | null,
        webhookSlack: channel.webhookSlack as Record<string, string> | null,
        webhookCustom: channel.webhookCustom as Record<string, string> | null,
        webhookEvents: channel.webhookEvents as string[] | null,
    }

    if (event === 'post.published' || event === 'post.failed') {
        const results = post.platformStatuses.map(ps => ({
            platform: ps.platform,
            accountId: ps.accountId,
            success: ps.status === 'published',
            error: ps.errorMsg || undefined,
            externalId: ps.externalId || undefined,
        }))

        await sendPublishWebhooks(webhookConfig, {
            postId,
            content: post.content || '',
            publishedBy: 'Auto-Scheduler',
            publishedAt: post.publishedAt || new Date(),
            channelName: channel.name,
            results,
            mediaCount: post.media.length,
        })
    }
    // Note: post.scheduled events are handled inline in the scheduler for simplicity

    console.log(`[WebhookWorker] Dispatched '${event}' for post ${postId}`)
}

export function startWebhookWorker(): Worker {
    const worker = new Worker<WebhookJobData>(
        QUEUE_NAMES.WEBHOOK,
        async (job) => { await processWebhook(job.data) },
        { connection: { url: REDIS_URL }, concurrency: 5 }
    )

    worker.on('completed', j => console.log(`[WebhookWorker] Job ${j.id} completed`))
    worker.on('failed', (j, err) => console.error(`[WebhookWorker] Job ${j?.id} failed:`, err.message))
    worker.on('error', err => console.error('[WebhookWorker] Error:', err))

    console.log(`[WebhookWorker] Started (app: ${APP_URL})`)
    return worker
}
