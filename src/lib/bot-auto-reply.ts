/**
 * Bot Auto-Reply Engine
 *
 * Triggered when an inbound message arrives and conversation.mode === 'BOT'.
 * Uses ALL channel context: vibeTone, businessInfo, brandProfile, knowledgeBase,
 * BotConfig (personality, training pairs, escalation, images, videos).
 */

import { prisma } from '@/lib/prisma'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

interface BotReplyResult {
    replied: boolean
    reason?: string
}

export async function botAutoReply(
    conversationId: string,
    inboundContent: string,
    platform: string
): Promise<BotReplyResult> {
    try {
        // ─── 1. Load conversation + channel ───────────────────────
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        description: true,
                        language: true,
                        defaultAiProvider: true,
                        defaultAiModel: true,
                        vibeTone: true,
                        businessInfo: true,
                        brandProfile: true,
                    },
                },
            },
        })

        if (!conversation || !conversation.channel) {
            return { replied: false, reason: 'No conversation/channel' }
        }

        if (conversation.mode !== 'BOT') {
            return { replied: false, reason: 'Not in BOT mode' }
        }

        const channel = conversation.channel

        // ─── 2. Load BotConfig ────────────────────────────────────
        const botConfig = await prisma.botConfig.findUnique({
            where: { channelId: channel.id },
        })

        if (botConfig && !botConfig.isEnabled) {
            return { replied: false, reason: 'Bot disabled' }
        }

        // ─── 3. Working Hours Check ───────────────────────────────
        if (botConfig?.workingHoursOnly && botConfig.workingHoursStart && botConfig.workingHoursEnd) {
            const now = new Date()
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            if (hhmm < botConfig.workingHoursStart || hhmm > botConfig.workingHoursEnd) {
                // Off-hours: send off-hours message
                if (botConfig.offHoursMessage) {
                    await sendAndSaveReply(
                        conversation,
                        botConfig.offHoursMessage,
                        platform
                    )
                    return { replied: true, reason: 'Off-hours message sent' }
                }
                return { replied: false, reason: 'Outside working hours, no off-hours message' }
            }
        }

        // ─── 4. Platform scope check ──────────────────────────────
        if (botConfig) {
            const enabledPlatforms = (botConfig.enabledPlatforms as string[]) || ['all']
            if (!enabledPlatforms.includes('all') && !enabledPlatforms.includes(platform)) {
                return { replied: false, reason: `Bot not enabled for ${platform}` }
            }

            const type = conversation.type || 'message'
            if (type === 'comment' && !botConfig.applyToComments) {
                return { replied: false, reason: 'Bot not enabled for comments' }
            }
            if (type === 'message' && !botConfig.applyToMessages) {
                return { replied: false, reason: 'Bot not enabled for messages' }
            }
        }

        // ─── 5. Count bot replies for max check ───────────────────
        if (botConfig?.maxBotReplies) {
            const botReplyCount = await prisma.inboxMessage.count({
                where: {
                    conversationId,
                    direction: 'outbound',
                    senderType: 'bot',
                },
            })
            if (botReplyCount >= botConfig.maxBotReplies) {
                // Escalate to agent
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { mode: 'AGENT' },
                })
                return { replied: false, reason: 'Max bot replies reached, escalated to agent' }
            }
        }

        // ─── 6. Escalation keyword check ──────────────────────────
        if (botConfig?.autoEscalateKeywords) {
            const keywords = (botConfig.autoEscalateKeywords as string[]) || []
            const lowerContent = inboundContent.toLowerCase()
            const triggered = keywords.some(kw => lowerContent.includes(kw.toLowerCase()))
            if (triggered) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { mode: 'AGENT' },
                })
                return { replied: false, reason: 'Escalation keyword detected' }
            }
        }

        // ─── 7. Resolve AI key ────────────────────────────────────
        const ownerKey = await getChannelOwnerKey(channel.id, channel.defaultAiProvider)
        if (!ownerKey.apiKey) {
            return { replied: false, reason: 'No AI API key available' }
        }

        const provider = ownerKey.provider!
        const apiKey = ownerKey.apiKey
        const model = channel.defaultAiModel || ownerKey.model || getDefaultModel(provider, {})

        // ─── 8. Load context ──────────────────────────────────────
        const knowledgeEntries = await prisma.knowledgeBase.findMany({
            where: { channelId: channel.id },
            select: { title: true, content: true },
            take: 20,
        })

        // Load recent conversation history
        const recentMessages = await prisma.inboxMessage.findMany({
            where: { conversationId },
            orderBy: { sentAt: 'desc' },
            take: 15,
        })

        const messageHistory = recentMessages
            .reverse()
            .map(m => `${m.direction === 'inbound' ? 'Customer' : 'Bot'}: ${m.content}`)
            .join('\n')

        // Load image library metadata
        let imageLibrary: { originalName: string | null; url: string }[] = []
        if (botConfig?.imageFolderId) {
            imageLibrary = await prisma.mediaItem.findMany({
                where: {
                    channelId: channel.id,
                    folderId: botConfig.imageFolderId,
                    type: 'image',
                },
                select: { originalName: true, url: true },
                take: 100,
            })
        }

        // ─── 9. Build system prompt ───────────────────────────────
        const vibeTone = (channel.vibeTone as Record<string, string>) || {}
        const businessInfo = (channel.businessInfo as Record<string, any>) || {}
        const brandProfile = (channel.brandProfile as Record<string, string>) || {}
        const trainingPairs = (botConfig?.trainingPairs as Array<{ q: string; a: string }>) || []
        const consultVideos = (botConfig?.consultVideos as Array<{ title: string; url: string; description: string }>) || []
        const forbiddenTopics = (botConfig?.forbiddenTopics as string[]) || []

        let systemPrompt = `You are ${botConfig?.botName || 'AI Assistant'}, an auto-reply customer service bot for "${channel.displayName || channel.name}".`

        if (botConfig?.personality) {
            systemPrompt += `\n\n## Your personality and instructions:\n${botConfig.personality}`
        }

        if (channel.description) {
            systemPrompt += `\n\n## About this business:\n${channel.description}`
        }

        if (vibeTone.personality || vibeTone.writingStyle) {
            systemPrompt += `\n\n## Brand voice:`
            if (vibeTone.personality) systemPrompt += `\n- Personality: ${vibeTone.personality}`
            if (vibeTone.writingStyle) systemPrompt += `\n- Writing style: ${vibeTone.writingStyle}`
            if (vibeTone.vocabulary) systemPrompt += `\n- Vocabulary: ${vibeTone.vocabulary}`
        }

        if (businessInfo.phone || businessInfo.address || businessInfo.website) {
            systemPrompt += `\n\n## Business contact:`
            if (businessInfo.phone) systemPrompt += `\n- Phone: ${businessInfo.phone}`
            if (businessInfo.address) systemPrompt += `\n- Address: ${businessInfo.address}`
            if (businessInfo.website) systemPrompt += `\n- Website: ${businessInfo.website}`
        }

        if (brandProfile.targetAudience) {
            systemPrompt += `\n\n## Target audience: ${brandProfile.targetAudience}`
        }

        if (knowledgeEntries.length > 0) {
            systemPrompt += `\n\n--- KNOWLEDGE BASE ---`
            for (const entry of knowledgeEntries) {
                systemPrompt += `\n\n### ${entry.title}\n${entry.content.substring(0, 2000)}`
            }
            systemPrompt += `\n--- END KNOWLEDGE BASE ---`
        }

        if (trainingPairs.length > 0) {
            systemPrompt += `\n\n--- TRAINING Q&A ---`
            for (const pair of trainingPairs.slice(0, 30)) {
                systemPrompt += `\nQ: ${pair.q}\nA: ${pair.a}`
            }
            systemPrompt += `\n--- END TRAINING Q&A ---`
        }

        if (imageLibrary.length > 0) {
            systemPrompt += `\n\n--- IMAGE LIBRARY ---`
            systemPrompt += `\nYou have access to the following images. If a customer asks to see something, find matching images and include their URLs in your reply.`
            systemPrompt += `\nFormat image links as: [IMAGE: url]`
            for (const img of imageLibrary) {
                systemPrompt += `\n- "${img.originalName || 'Untitled'}": ${img.url}`
            }
            systemPrompt += `\n--- END IMAGE LIBRARY ---`
        }

        if (consultVideos.length > 0) {
            systemPrompt += `\n\n--- CONSULTATION VIDEOS ---`
            systemPrompt += `\nYou can reference these videos when relevant. Include the URL in your reply.`
            for (const vid of consultVideos) {
                systemPrompt += `\n- "${vid.title}": ${vid.url}${vid.description ? ` (${vid.description})` : ''}`
            }
            systemPrompt += `\n--- END CONSULTATION VIDEOS ---`
        }

        if (forbiddenTopics.length > 0) {
            systemPrompt += `\n\n## FORBIDDEN TOPICS — DO NOT discuss these. If asked, say you need to forward to a human agent:\n${forbiddenTopics.join(', ')}`
        }

        const langLabel = channel.language === 'vi' ? 'Vietnamese' : channel.language === 'en' ? 'English' : channel.language || 'the same language the customer is using'
        systemPrompt += `\n\n## Rules:\n- Reply in ${langLabel}\n- Be concise, friendly, and professional\n- Do NOT say you are an AI unless directly asked\n- Do NOT prefix your reply with "Bot:" or any label\n- If you don't know the answer, say you'll connect them with a human agent`

        // ─── 10. Call AI ──────────────────────────────────────────
        const userPrompt = `Customer: ${conversation.externalUserName || 'Customer'}

Conversation history:
${messageHistory}

Generate a reply:`

        const reply = await callAI(provider, apiKey, model, systemPrompt, userPrompt)
        const cleanReply = reply.trim()

        if (!cleanReply) {
            return { replied: false, reason: 'Empty AI response' }
        }

        // ─── 11. Extract images from reply and send ───────────────
        // Extract [IMAGE: url] patterns
        const imageRegex = /\[IMAGE:\s*(https?:\/\/[^\]]+)\]/g
        const imageUrls: string[] = []
        let textReply = cleanReply
        let match
        while ((match = imageRegex.exec(cleanReply)) !== null) {
            imageUrls.push(match[1])
        }
        textReply = textReply.replace(/\[IMAGE:\s*https?:\/\/[^\]]+\]/g, '').trim()

        // ─── 12. Send reply via platform ──────────────────────────
        await sendAndSaveReply(conversation, textReply, platform, imageUrls)

        return { replied: true }
    } catch (err) {
        console.error('[Bot Auto-Reply] ❌ Error:', err)
        return { replied: false, reason: `Error: ${(err as Error).message}` }
    }
}

/**
 * Send reply via Facebook Graph API and save to DB
 */
async function sendAndSaveReply(
    conversation: any,
    text: string,
    platform: string,
    imageUrls?: string[]
) {
    // Get platform account for access token
    const platformAccount = conversation.platformAccountId
        ? await prisma.channelPlatform.findUnique({
            where: { id: conversation.platformAccountId },
            select: { accessToken: true, accountId: true },
        })
        : null

    if (platform === 'facebook' && platformAccount?.accessToken) {
        const conversationType = conversation.type || 'message'

        if (conversationType === 'message') {
            // Send DM via Messenger
            await sendFacebookMessage(
                platformAccount.accessToken,
                conversation.externalUserId,
                text,
                imageUrls
            )
        }
        // For comments, we could reply to the comment, but that requires the comment ID
        // which we'd need to track separately. Skipping for now.
    }

    // Save outbound message to DB
    await prisma.inboxMessage.create({
        data: {
            conversationId: conversation.id,
            direction: 'outbound',
            senderType: 'bot',
            content: text,
            senderName: 'Bot',
            mediaUrl: imageUrls?.[0] || null,
            mediaType: imageUrls?.[0] ? 'image' : null,
            sentAt: new Date(),
        },
    })
}

/**
 * Send a message via Facebook Messenger Send API
 */
async function sendFacebookMessage(
    accessToken: string,
    recipientId: string,
    text: string,
    imageUrls?: string[]
) {
    // Send text message
    if (text) {
        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        })
    }

    // Send images
    if (imageUrls?.length) {
        for (const url of imageUrls) {
            await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'image',
                            payload: { url, is_reusable: true },
                        },
                    },
                }),
            })
        }
    }
}

/**
 * Send greeting message when a new conversation starts in BOT mode
 */
export async function sendBotGreeting(
    conversationId: string,
    platform: string
) {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                channel: { select: { id: true, vibeTone: true, businessInfo: true } },
            },
        })

        if (!conversation?.channel) return

        const botConfig = await prisma.botConfig.findUnique({
            where: { channelId: conversation.channel.id },
        })

        if (!botConfig?.isEnabled) return

        const greetingMode = (botConfig as any).greetingMode || 'template'
        const greetingImages = (botConfig.greetingImages as string[]) || []
        let greetingText = botConfig.greeting || ''

        // Auto mode: generate greeting via AI
        if (greetingMode === 'auto') {
            try {
                const ownerKey = await getChannelOwnerKey(conversation.channel.id)
                if (ownerKey.apiKey) {
                    const vibeTone = (conversation.channel as any).vibeTone || ''
                    const businessInfo = (conversation.channel as any).businessInfo || ''
                    const prompt = `Generate a brief, friendly greeting message for a customer who just started a chat. 
Bot name: ${botConfig.botName || 'AI Assistant'}
${vibeTone ? `Brand voice/tone: ${vibeTone}` : ''}
${businessInfo ? `Business: ${businessInfo}` : ''}
${botConfig.personality ? `Personality: ${botConfig.personality}` : ''}
Language: ${botConfig.language || 'vi'}
Keep it short (1-2 sentences), warm, and professional. Reply with ONLY the greeting text.`
                    greetingText = await callAI(
                        ownerKey.provider!, ownerKey.apiKey!, ownerKey.model || getDefaultModel(ownerKey.provider || 'openai', {}),
                        'You are a greeting message generator.', prompt
                    )
                    greetingText = greetingText.trim()
                }
            } catch (err) {
                console.error('[Bot Greeting] AI greeting failed, using fallback:', err)
            }
            if (!greetingText) greetingText = `Xin chào! Tôi là ${botConfig.botName || 'AI Assistant'}. Tôi có thể giúp gì cho bạn?`
        }

        if (!greetingText) return

        await sendAndSaveReply(
            conversation,
            greetingText,
            platform,
            greetingImages.length > 0 ? greetingImages : undefined
        )

        console.log(`[Bot Greeting] ✅ Sent ${greetingMode} greeting for conversation ${conversationId}`)
    } catch (err) {
        console.error('[Bot Greeting] ❌ Error:', err)
    }
}
