import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/channels/[id]/generate-vibe — AI-generate Vibe & Tone from short description
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const body = await req.json()
    const { channelName, description, language, provider: requestedProvider, model: requestedModel } = body

    if (!channelName || !description) {
        return NextResponse.json({ error: 'Channel name and description are required' }, { status: 400 })
    }

    // Find AI provider
    let aiIntegration
    if (requestedProvider) {
        aiIntegration = await prisma.apiIntegration.findFirst({
            where: { provider: requestedProvider, category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
        })
    }
    if (!aiIntegration) {
        aiIntegration = await prisma.apiIntegration.findFirst({
            where: { category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
            orderBy: { provider: 'asc' },
        })
    }

    if (!aiIntegration || !aiIntegration.apiKeyEncrypted) {
        return NextResponse.json(
            { error: 'No AI provider configured. Please set up an AI API key in API Hub first.' },
            { status: 400 }
        )
    }

    const apiKey = decrypt(aiIntegration.apiKeyEncrypted)
    const config = (aiIntegration.config as Record<string, string>) || {}
    const model = requestedModel || getDefaultModel(aiIntegration.provider, config)

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[language] || 'English'

    const systemPrompt = `You are a brand voice strategist and tone-of-voice expert. Generate comprehensive brand voice guidelines based on a channel description. Respond ONLY with valid JSON.`

    const userPrompt = `Create detailed Vibe & Tone (brand voice) guidelines for this channel:

Channel Name: ${channelName}
Description: ${description}
Language: ${langLabel}

Respond with this exact JSON structure:
{
  "vibeTone": {
    "personality": "3-4 sentences describing the brand personality. Include specific traits, emotional tone, and how the brand should feel to the audience. Be detailed and actionable.",
    "writingStyle": "3-4 sentences about writing style. Cover: formality level, sentence structure preference, humor usage, storytelling approach, use of emojis, punctuation style. Be specific.",
    "vocabulary": "3-4 sentences about vocabulary. Include: preferred words/phrases, words to avoid, technical level, industry jargon usage, tone markers. Give concrete examples.",
    "targetAudience": "3-4 sentences about target audience. Cover: demographics (age, gender, location), psychographics (interests, values, lifestyle), pain points, content consumption habits.",
    "brandValues": "3-4 sentences about brand values. Include: core mission, key differentiators, brand promise, emotional benefits, trust factors."
  }
}

Requirements:
- All content must be in ${langLabel}
- Be specific and actionable, not generic
- Include concrete examples where possible
- Each field should be detailed enough to guide content creation
- Reflect the unique identity of this specific brand`

    try {
        const result = await callAI(
            aiIntegration.provider,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            aiIntegration.baseUrl,
        )

        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)

        await prisma.apiIntegration.update({
            where: { id: aiIntegration.id },
            data: { usageCount: { increment: 1 } },
        })

        return NextResponse.json({ vibeTone: parsed.vibeTone })
    } catch (error) {
        console.error('AI Vibe & Tone error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate Vibe & Tone' },
            { status: 500 }
        )
    }
}
