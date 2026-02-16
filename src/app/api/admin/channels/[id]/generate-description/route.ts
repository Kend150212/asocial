import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/channels/[id]/generate-description — Generate YouTube-style SEO description
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
    const { channelName, shortDescription, language, provider: requestedProvider, model: requestedModel } = body

    if (!channelName || !shortDescription) {
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

    const systemPrompt = `You are a world-class YouTube SEO expert and social media copywriter. You write channel descriptions that rank high in search results and convert viewers into subscribers. Respond ONLY with valid JSON.`

    const userPrompt = `Write a professional YouTube-style SEO channel description for this brand:

Channel Name: ${channelName}
Brand Info: ${shortDescription}
Language: ${langLabel}

Respond with this exact JSON structure:
{
  "description": "The full channel description"
}

Write the description as a PROFESSIONAL YouTube channel "About" section with this exact format:
1. **Opening Hook** (1-2 lines): A bold, compelling opening that grabs attention and clearly states what the channel/brand offers
2. **Value Proposition** (2-3 lines): What makes this brand unique? What will viewers/followers gain?
3. **Content/Service Overview** (2-3 lines): Key services, products, or content categories with bullet-style formatting using ✅ or 📌 emoji
4. **Social Proof / Stats** (1 line): Any credibility indicators (years in business, customers served, etc.)
5. **Call to Action** (1-2 lines): Subscribe/follow CTA with emoji like 🔔 or 👉
6. **Contact / Links** (1 line): Professional sign-off with contact info placeholder

Rules:
- Write ENTIRELY in ${langLabel}
- Use emojis strategically (not excessively) for visual breaks
- Include relevant SEO keywords naturally
- Use line breaks (\\n) for readability — this should look like a real YouTube description, NOT a paragraph
- Make it 8-15 lines total
- Sound authentic and professional, NOT generic or robotic
- Include hashtags at the end if relevant`

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

        return NextResponse.json({ description: parsed.description })
    } catch (error) {
        console.error('AI Description error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate description' },
            { status: 500 }
        )
    }
}
