import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/channels/[id]/analyze — AI analysis of channel
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { channelName, description, language, provider: requestedProvider, model: requestedModel } = body

    if (!channelName || !description) {
        return NextResponse.json({ error: 'Channel name and description are required' }, { status: 400 })
    }

    // Find the requested or any active AI provider
    let aiIntegration
    if (requestedProvider) {
        aiIntegration = await prisma.apiIntegration.findFirst({
            where: {
                provider: requestedProvider,
                category: 'AI',
                status: 'ACTIVE',
                apiKeyEncrypted: { not: null },
            },
        })
    }
    if (!aiIntegration) {
        aiIntegration = await prisma.apiIntegration.findFirst({
            where: {
                category: 'AI',
                status: 'ACTIVE',
                apiKeyEncrypted: { not: null },
            },
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

    const langLabel = language === 'vi' ? 'Vietnamese' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'zh' ? 'Chinese' : language === 'es' ? 'Spanish' : 'English'

    const systemPrompt = `You are a social media brand strategist. Analyze the following channel and generate comprehensive branding and content settings. Respond ONLY with valid JSON, no markdown, no explanation.`

    const userPrompt = `Analyze this social media channel and generate settings:

Channel Name: ${channelName}
Description: ${description}
Language: ${langLabel}

Generate a JSON response with this exact structure:
{
  "vibeTone": {
    "personality": "2-3 sentences describing the brand personality",
    "writingStyle": "2-3 sentences about writing style (formal/casual, humor level, etc)",
    "vocabulary": "Key words and phrases the brand uses, vocabulary level",
    "targetAudience": "Who is the target audience, demographics, interests",
    "brandValues": "Core values and mission of the brand"
  },
  "knowledgeBase": [
    {
      "title": "entry title",
      "content": "detailed content about this topic, 2-4 sentences"
    }
  ],
  "contentTemplates": [
    {
      "name": "template name",
      "templateContent": "Template with {{variable}} placeholders for dynamic content"
    }
  ],
  "hashtagGroups": [
    {
      "name": "group name",
      "hashtags": ["#tag1", "#tag2", "#tag3"]
    }
  ]
}

Requirements:
- Generate 3-5 knowledge base entries about the brand, products, industry
- Generate 3-4 content templates for different post types (promotional, educational, engagement, announcement)
- Generate 2-3 hashtag groups (brand, industry, trending) with 5-8 hashtags each
- All content should be in ${langLabel}
- Templates should use {{variable}} syntax for dynamic parts
- Hashtags should be relevant and commonly used`

    try {
        const result = await callAI(
            aiIntegration.provider,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            aiIntegration.baseUrl,
        )

        // Parse the JSON response
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const analysis = JSON.parse(cleaned)

        // Increment usage count
        await prisma.apiIntegration.update({
            where: { id: aiIntegration.id },
            data: { usageCount: { increment: 1 } },
        })

        return NextResponse.json(analysis)
    } catch (error) {
        console.error('AI Analysis error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'AI analysis failed' },
            { status: 500 }
        )
    }
}
