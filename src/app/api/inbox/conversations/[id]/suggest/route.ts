import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

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

    // Get conversation with recent messages
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            channel: { select: { defaultAiProvider: true, id: true } },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get recent messages for context
    const messages = await prisma.inboxMessage.findMany({
        where: { conversationId: id },
        orderBy: { sentAt: 'desc' },
        take: 10,
    })

    // Get AI config from channel or system
    const channel = conversation.channel
    const provider = channel?.defaultAiProvider || 'openai'

    // Get API key from channel config or system settings
    const aiConfig = await prisma.setting.findFirst({
        where: { key: 'ai_config' },
    })
    const config = (aiConfig?.value as Record<string, string>) || {}
    const apiKey = config[`${provider}ApiKey`] || config.openaiApiKey || process.env.OPENAI_API_KEY || ''

    if (!apiKey) {
        return NextResponse.json({ error: 'No AI API key configured' }, { status: 400 })
    }

    const model = getDefaultModel(provider, config)

    // Build conversation context
    const messageContext = messages
        .reverse()
        .map(m => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`)
        .join('\n')

    const systemPrompt = `You are a helpful customer service agent. Based on the conversation history, suggest a professional and friendly reply. Keep it concise and natural. Reply in the same language the customer is using. Do NOT include any prefix like "Agent:" — just the reply text.`

    const userPrompt = `Conversation type: ${conversation.type || 'message'}
Customer name: ${conversation.externalUserName || 'Customer'}

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
