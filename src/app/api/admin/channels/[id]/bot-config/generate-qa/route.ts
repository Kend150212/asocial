import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

/**
 * POST /api/admin/channels/[id]/bot-config/generate-qa
 * Use AI to auto-generate Q&A training pairs from channel context
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: channelId } = await params

    // Load channel data
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
            name: true,
            displayName: true,
            description: true,
            language: true,
            vibeTone: true,
            businessInfo: true,
            brandProfile: true,
        },
    })

    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Load knowledge base
    const knowledgeEntries = await prisma.knowledgeBase.findMany({
        where: { channelId },
        select: { title: true, content: true },
        take: 20,
    })

    // Load existing bot config
    const botConfig = await prisma.botConfig.findUnique({
        where: { channelId },
    })

    const existingPairs = (botConfig?.trainingPairs as Array<{ q: string; a: string }>) || []

    // Get AI key
    const ownerKey = await getChannelOwnerKey(channelId, channel.language === 'vi' ? undefined : undefined)
    if (!ownerKey.apiKey || !ownerKey.provider) {
        return NextResponse.json({ error: 'No AI API key configured. Ask channel owner to add one.' }, { status: 400 })
    }

    const model = ownerKey.model || getDefaultModel(ownerKey.provider, {})

    // Build context for AI
    const vibeTone = (channel.vibeTone as Record<string, string>) || {}
    const businessInfo = (channel.businessInfo as Record<string, any>) || {}
    const brandProfile = (channel.brandProfile as Record<string, string>) || {}

    let context = `Business: "${channel.displayName || channel.name}"\n`
    if (channel.description) context += `Description: ${channel.description}\n`
    if (vibeTone.personality) context += `Brand personality: ${vibeTone.personality}\n`
    if (vibeTone.writingStyle) context += `Writing style: ${vibeTone.writingStyle}\n`
    if (businessInfo.phone) context += `Phone: ${businessInfo.phone}\n`
    if (businessInfo.address) context += `Address: ${businessInfo.address}\n`
    if (businessInfo.website) context += `Website: ${businessInfo.website}\n`
    if (businessInfo.openingHours) context += `Opening hours: ${businessInfo.openingHours}\n`
    if (brandProfile.targetAudience) context += `Target audience: ${brandProfile.targetAudience}\n`
    if (brandProfile.uniqueSellingPoints) context += `USP: ${brandProfile.uniqueSellingPoints}\n`

    if (knowledgeEntries.length > 0) {
        context += `\n--- KNOWLEDGE BASE ---\n`
        for (const entry of knowledgeEntries) {
            context += `\n### ${entry.title}\n${entry.content.substring(0, 1500)}\n`
        }
        context += `--- END KNOWLEDGE BASE ---\n`
    }

    const existingQuestionsStr = existingPairs.length > 0
        ? `\n\nExisting Q&A pairs (DO NOT duplicate these):\n${existingPairs.map(p => `Q: ${p.q}`).join('\n')}`
        : ''

    const lang = channel.language === 'vi' ? 'Vietnamese' : channel.language === 'en' ? 'English' : channel.language || 'Vietnamese'

    const systemPrompt = `You are a Q&A training data generator. Generate realistic customer FAQ Q&A pairs for a customer service chatbot. 
Output ONLY a valid JSON array of objects with "q" and "a" fields.
Each Q&A should be practical, realistic, and based on the provided business context.
Generate diverse questions covering: general info, products/services, policies, contact, hours, pricing, etc.
Reply in ${lang}.
Do NOT include any explanation or markdown formatting — only the JSON array.`

    const userPrompt = `Generate 8 unique Q&A training pairs for this business:

${context}${existingQuestionsStr}

Output format: [{"q": "question", "a": "answer"}, ...]`

    try {
        let aiResponse = await callAI(
            ownerKey.provider,
            ownerKey.apiKey,
            model,
            systemPrompt,
            userPrompt
        )

        // Clean up response — handle markdown code blocks
        aiResponse = aiResponse.trim()
        if (aiResponse.startsWith('```')) {
            aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const pairs = JSON.parse(aiResponse) as Array<{ q: string; a: string }>

        if (!Array.isArray(pairs)) {
            return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
        }

        // Filter out any duplicates of existing questions
        const existingQuestions = new Set(existingPairs.map(p => p.q.toLowerCase().trim()))
        const newPairs = pairs.filter(p =>
            p.q && p.a && !existingQuestions.has(p.q.toLowerCase().trim())
        )

        return NextResponse.json({ pairs: newPairs })
    } catch (err) {
        console.error('[Generate Q&A] Error:', err)
        return NextResponse.json(
            { error: `Failed to generate Q&A: ${(err as Error).message}` },
            { status: 500 }
        )
    }
}
