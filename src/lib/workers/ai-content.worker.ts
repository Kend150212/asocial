/**
 * AI Content Worker — BullMQ consumer for 'ai-content' queue.
 * Generates content via AI and creates a scheduled Post.
 */

import { Worker } from 'bullmq'
import { QUEUE_NAMES, REDIS_URL } from '@/lib/queue'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-caller'
import { decrypt } from '@/lib/encryption'
import type { AiContentJobData } from '@/lib/queue'

async function processAiContent(data: AiContentJobData): Promise<void> {
    const { channelId, platforms, prompt, scheduleAt, templateId } = data
    console.log(`[AiContentWorker] Generating content for channel ${channelId}`)

    // Get channel AI settings
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
            id: true, name: true,
            defaultAiProvider: true,
            defaultAiModel: true,
            aiApiKeyEncrypted: true,
        },
    })

    if (!channel) throw new Error(`Channel ${channelId} not found`)
    if (!channel.aiApiKeyEncrypted) throw new Error(`Channel ${channelId} has no AI API key configured`)

    const apiKey = decrypt(channel.aiApiKeyEncrypted)

    // Get template system prompt if provided
    let systemPrompt = 'You are a social media content expert. Write engaging, platform-appropriate content.'
    if (templateId) {
        const template = await prisma.contentTemplate.findUnique({
            where: { id: templateId },
            select: { templateContent: true },
        })
        if (template) systemPrompt = template.templateContent
    }

    // Generate content with AI
    const generatedContent = await callAI(
        channel.defaultAiProvider || 'openai',
        apiKey,
        channel.defaultAiModel || 'gpt-4o-mini',
        systemPrompt,
        prompt,
    )

    const scheduleDate = new Date(scheduleAt)

    // Get active platform connections
    const platformConnections = await prisma.channelPlatform.findMany({
        where: { channelId, platform: { in: platforms }, isActive: true },
        select: { platform: true, accountId: true },
    })

    if (platformConnections.length === 0) {
        throw new Error(`No active platform connections for channel ${channelId}`)
    }

    // Get channel admin user to set as author
    const channelMember = await prisma.channelMember.findFirst({
        where: { channelId, role: 'ADMIN' },
        select: { userId: true },
    })

    if (!channelMember) throw new Error(`No admin/owner found for channel ${channelId}`)

    const post = await prisma.post.create({
        data: {
            channelId,
            authorId: channelMember.userId,
            content: generatedContent,
            status: 'SCHEDULED',
            scheduledAt: scheduleDate,
            platformStatuses: {
                create: platformConnections.map(pc => ({
                    platform: pc.platform,
                    accountId: pc.accountId,
                    status: 'pending',
                })),
            },
        },
    })

    console.log(`[AiContentWorker] Created scheduled post ${post.id} for ${scheduleDate.toISOString()}`)
    console.log(`[AiContentWorker] Preview: ${generatedContent.slice(0, 100)}...`)
}

export function startAiContentWorker(): Worker {
    const worker = new Worker<AiContentJobData>(
        QUEUE_NAMES.AI_CONTENT,
        async (job) => { await processAiContent(job.data) },
        { connection: { url: REDIS_URL }, concurrency: 2 }
    )

    worker.on('completed', j => console.log(`[AiContentWorker] Job ${j.id} completed`))
    worker.on('failed', (j, err) => console.error(`[AiContentWorker] Job ${j?.id} failed:`, err.message))
    worker.on('error', err => console.error('[AiContentWorker] Error:', err))

    console.log('[AiContentWorker] Started')
    return worker
}
