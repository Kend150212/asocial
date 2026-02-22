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

// ─── Dedup cache: prevent duplicate Messenger sends ─────────
// Key: "recipientId" → timestamp of last bot send
// When same page is in multiple channels, only the first channel's
// bot actually sends to Messenger; others are saved to DB only.
const recentBotReplies = new Map<string, number>()
const DEDUP_TTL_MS = 30_000 // 30 seconds

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

        // ─── 2b. Check per-page bot enabled ───────────────────────
        // The same page can be in multiple channels — only reply if
        // this channel's per-page toggle is ON for this platform account
        if (conversation.platformAccountId) {
            const platformAccount = await prisma.channelPlatform.findUnique({
                where: { id: conversation.platformAccountId },
                select: { config: true },
            })
            const pageConfig = (platformAccount?.config as any) || {}
            if (pageConfig.botEnabled === false) {
                return { replied: false, reason: 'Bot disabled for this page in this channel' }
            }
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

        const langLabel = channel.language === 'vi' ? 'Vietnamese' : channel.language === 'en' ? 'English' : channel.language || 'auto-detect'
        systemPrompt += `\n\n## Rules:\n- Default language: ${langLabel}\n- IMPORTANT: If the customer writes in a different language, you MUST reply in THEIR language. Always match the customer's language.\n- Be concise, friendly, and professional\n- Do NOT say you are an AI unless directly asked\n- Do NOT prefix your reply with "Bot:" or any label\n- NEVER wrap your reply in JSON, arrays, code blocks, brackets, or any structured format\n- Do NOT use [ ] or { } in your response\n- Reply with PLAIN TEXT ONLY — no formatting wrappers\n- If you don't know the answer, say you'll connect them with a human agent`

        // ─── 10. Call AI ──────────────────────────────────────────
        const userPrompt = `Customer: ${conversation.externalUserName || 'Customer'}

Conversation history:
${messageHistory}

Generate a reply (plain text only, no JSON, no brackets):`

        const rawReply = await callAI(provider, apiKey, model, systemPrompt, userPrompt)
        let cleanReply = rawReply.trim()

        // AI sometimes wraps reply in JSON — extract text if so
        if (cleanReply.startsWith('{') || cleanReply.startsWith('[') || cleanReply.startsWith('```')) {
            try {
                // Strip markdown code fences if present
                let jsonStr = cleanReply
                    .replace(/^```(?:json)?\s*/i, '')
                    .replace(/\s*```$/i, '')
                    .trim()
                // Fix malformed JSON: replace *key* or **key** with "key"
                jsonStr = jsonStr.replace(/\*{1,2}(\w+)\*{1,2}\s*:/g, '"$1":')
                // Fix unquoted string keys
                jsonStr = jsonStr.replace(/(?<=\{|,)\s*(\w+)\s*:/g, '"$1":')
                const parsed = JSON.parse(jsonStr)
                // Handle JSON array: ["reply text"] or ["text1", "text2"]
                if (Array.isArray(parsed)) {
                    const textItems = parsed.filter((item: any) => typeof item === 'string')
                    if (textItems.length > 0) {
                        cleanReply = textItems.join('\n')
                    }
                } else {
                    // Try common keys: reply, response, message, text, content, answer
                    cleanReply = parsed.reply || parsed.response || parsed.message
                        || parsed.text || parsed.content || parsed.answer
                        || cleanReply // fallback to original if no known key
                }
            } catch {
                // JSON.parse failed — try regex extraction as last resort
                const valueMatch = cleanReply.match(/(?:reply|response|message|text|content|answer)["*]*\s*:\s*"([^"]+)"/i)
                    || cleanReply.match(/(?:reply|response|message|text|content|answer)["*]*\s*:\s*"([\s\S]+?)"\s*\}?$/i)
                if (valueMatch?.[1]) {
                    cleanReply = valueMatch[1]
                }
                // Also try extracting from array-like pattern: ["text"]
                if (!valueMatch) {
                    const arrayMatch = cleanReply.match(/^\[\s*"([\s\S]+?)"\s*\]$/)
                    if (arrayMatch?.[1]) {
                        cleanReply = arrayMatch[1]
                    }
                }
            }
        }
        cleanReply = cleanReply.trim()

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

        // ─── 13. Detect AI-decided escalation ─────────────────────
        // If the AI reply contains phrases indicating it's transferring
        // to a human agent, switch conversation mode to AGENT
        const escalationPatterns = [
            /connect(ing)?\s+(you\s+)?(with|to)\s+(a\s+)?(human|agent|team|staff|representative)/i,
            /transfer(ring)?\s+(you\s+)?(to|over)\s+(a\s+)?(human|agent|team|staff|representative)/i,
            /forward(ing)?\s+(you\s+)?to\s+(a\s+)?(human|agent|team|staff|representative)/i,
            /human\s+agent\s+(will|can|is\s+going\s+to)\s+(help|assist|take\s+over)/i,
            /let\s+me\s+(get|find|connect|transfer)/i,
            /kết\s*nối\s*(bạn\s*)?(với|đến)\s*(nhân\s*viên|agent|người)/i,
            /chuyển\s*(bạn\s*)?(cho|đến|qua)\s*(nhân\s*viên|agent|người|tư\s*vấn)/i,
            /nhân\s*viên\s*(sẽ|sẽ\s+sớm|đang)\s*(hỗ\s*trợ|liên\s*hệ|phục\s*vụ)/i,
        ]

        const lowerReply = textReply.toLowerCase()
        const isEscalation = escalationPatterns.some(p => p.test(textReply))

        if (isEscalation) {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { mode: 'AGENT', status: 'new' },
            })
            console.log(`[Bot Auto-Reply] 🔄 AI escalated → switched to AGENT mode`)
            return { replied: true, reason: 'Escalated to agent' }
        }

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

    if ((platform === 'facebook' || platform === 'instagram') && platformAccount?.accessToken) {
        const conversationType = conversation.type || 'message'

        if (conversationType === 'message') {
            // Dedup: prevent sending duplicate Messenger messages when same page is in multiple channels
            const dedupKey = conversation.externalUserId
            const lastSent = recentBotReplies.get(dedupKey)
            const now = Date.now()

            if (lastSent && (now - lastSent) < DEDUP_TTL_MS) {
                console.log(`[Bot] ⏭️ Skipping Messenger send (dedup) for ${dedupKey} - saving to DB only`)
            } else {
                recentBotReplies.set(dedupKey, now)
                // Clean old entries periodically
                if (recentBotReplies.size > 100) {
                    for (const [key, ts] of recentBotReplies) {
                        if (now - ts > DEDUP_TTL_MS) recentBotReplies.delete(key)
                    }
                }
                await sendFacebookMessage(
                    platformAccount.accessToken,
                    conversation.externalUserId,
                    text,
                    imageUrls
                )
            }
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

        // Check per-page bot enabled for this channel
        if (conversation.platformAccountId) {
            const platformAccount = await prisma.channelPlatform.findUnique({
                where: { id: conversation.platformAccountId },
                select: { config: true },
            })
            const pageConfig = (platformAccount?.config as any) || {}
            if (pageConfig.botEnabled === false) return
        }

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
                        'You are a greeting message generator. Reply with ONLY the greeting text, no JSON, no quotes, no formatting.', prompt
                    )
                    greetingText = greetingText.trim()
                    // Strip markdown code fences
                    greetingText = greetingText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
                    // Strip JSON wrapper: {"greeting": "..."}, ["text1", "text2"], etc.
                    if ((greetingText.startsWith('{') && greetingText.endsWith('}')) ||
                        (greetingText.startsWith('[') && greetingText.endsWith(']'))) {
                        try {
                            const parsed = JSON.parse(greetingText)
                            if (Array.isArray(parsed)) {
                                // Take first string from array
                                const first = parsed.find((item: any) => typeof item === 'string')
                                if (first) greetingText = first
                            } else if (typeof parsed === 'object') {
                                greetingText = parsed.greeting || parsed.message || parsed.text || parsed.content || Object.values(parsed)[0] as string || greetingText
                            }
                        } catch { /* not valid JSON, use as-is */ }
                    }
                    // Strip surrounding quotes
                    if ((greetingText.startsWith('"') && greetingText.endsWith('"')) ||
                        (greetingText.startsWith("'") && greetingText.endsWith("'"))) {
                        greetingText = greetingText.slice(1, -1)
                    }
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
