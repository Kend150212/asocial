import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-caller'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/inbox/conversations/[id]/suggest
 * Generate an AI-suggested reply based on conversation history
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get conversation with channel AI config
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            channel: {
                select: {
                    id: true,
                    defaultAiProvider: true,
                    defaultAiModel: true,
                    aiApiKeyEncrypted: true,
                },
            },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const channel = conversation.channel
    if (!channel?.aiApiKeyEncrypted) {
        return NextResponse.json({ error: 'No AI API key configured for this channel. Go to Channel Settings → AI to add one.' }, { status: 400 })
    }

    const provider = channel.defaultAiProvider || 'openai'
    const apiKey = decrypt(channel.aiApiKeyEncrypted)
    const model = channel.defaultAiModel || (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini')

    // Get recent messages for context
    const messages = await prisma.inboxMessage.findMany({
        where: { conversationId: id },
        orderBy: { sentAt: 'desc' },
        take: 10,
    })

    // Build conversation context
    const messageContext = messages
        .reverse()
        .map(m => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`)
        .join('\n')

    const systemPrompt = `You are a helpful customer service agent. Based on the conversation history, suggest a professional and friendly reply. Keep it concise and natural. Reply in the same language the customer is using. Do NOT include any prefix like "Agent:" — just the reply text.`

    const userPrompt = `Customer name: ${conversation.externalUserName || 'Customer'}

Recent messages:
${messageContext}

Suggest a professional reply:`

    try {
        const suggestion = await callAI(provider, apiKey, model, systemPrompt, userPrompt)
        return NextResponse.json({ suggestion: suggestion.trim() })
    } catch (err: any) {
        console.error('[AI Suggest] Error:', err)
        return NextResponse.json({ error: err.message || 'AI error' }, { status: 500 })
    }
}
