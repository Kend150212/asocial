/**
 * BullMQ Queue definitions — shared between Next.js API routes (producers)
 * and the standalone worker process (consumers).
 *
 * IMPORTANT: BullMQ bundles its own version of ioredis. To avoid type conflicts,
 * we pass the Redis URL string as the connection option instead of an IORedis instance.
 */

import { Queue, Worker, QueueEvents } from 'bullmq'

// ─── Redis URL ────────────────────────────────────────────────────────
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// ─── Queue Names ──────────────────────────────────────────────────────
export const QUEUE_NAMES = {
    AUTO_POST: 'auto-post',
    WEBHOOK: 'webhook-dispatch',
    GDRIVE: 'gdrive-sync',
    AI_CONTENT: 'ai-content',
} as const

// ─── Default Job Options ──────────────────────────────────────────────
export const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 5_000, // 5s → 25s → 125s
    },
    removeOnComplete: { age: 60 * 60 * 24 * 7 }, // keep 7 days
    removeOnFail: { age: 60 * 60 * 24 * 30 },    // keep 30 days
}

// ─── Connection Helper ────────────────────────────────────────────────
// Pass URL string directly — BullMQ handles its own IORedis internally
function getConn() {
    return { connection: { url: REDIS_URL } }
}

// ─── Queue Singletons ─────────────────────────────────────────────────
let _autoPostQueue: Queue | null = null
let _webhookQueue: Queue | null = null
let _gdriveQueue: Queue | null = null
let _aiContentQueue: Queue | null = null

export function getAutoPostQueue(): Queue {
    if (!_autoPostQueue) _autoPostQueue = new Queue(QUEUE_NAMES.AUTO_POST, getConn())
    return _autoPostQueue
}

export function getWebhookQueue(): Queue {
    if (!_webhookQueue) _webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, getConn())
    return _webhookQueue
}

export function getGdriveQueue(): Queue {
    if (!_gdriveQueue) _gdriveQueue = new Queue(QUEUE_NAMES.GDRIVE, getConn())
    return _gdriveQueue
}

export function getAiContentQueue(): Queue {
    if (!_aiContentQueue) _aiContentQueue = new Queue(QUEUE_NAMES.AI_CONTENT, getConn())
    return _aiContentQueue
}

// ─── Job Type Interfaces ──────────────────────────────────────────────
export interface AutoPostJobData {
    postId: string
    triggeredBy?: 'scheduler' | 'manual' | 'retry'
}

export interface WebhookJobData {
    postId: string
    channelId: string
    event: 'post.published' | 'post.failed' | 'post.scheduled'
}

export interface GdriveSyncJobData {
    channelId: string
    integrationId: string
    folderId: string
}

export interface AiContentJobData {
    channelId: string
    platforms: string[]
    prompt: string
    systemPrompt?: string
    scheduleAt: string // ISO date string
    templateId?: string
}

// Re-export BullMQ primitives
export { Queue, Worker, QueueEvents }
