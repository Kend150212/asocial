import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

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
    const { channelName, description, language } = body

    if (!channelName || !description) {
        return NextResponse.json({ error: 'Channel name and description are required' }, { status: 400 })
    }

    // Find an active AI provider
    const aiIntegration = await prisma.apiIntegration.findFirst({
        where: {
            category: 'AI',
            status: 'ACTIVE',
            apiKeyEncrypted: { not: null },
        },
        orderBy: { provider: 'asc' }, // gemini first (free tier), then openai
    })

    if (!aiIntegration || !aiIntegration.apiKeyEncrypted) {
        return NextResponse.json(
            { error: 'No AI provider configured. Please set up an AI API key in API Hub first.' },
            { status: 400 }
        )
    }

    const apiKey = decrypt(aiIntegration.apiKeyEncrypted)
    const config = (aiIntegration.config as Record<string, string>) || {}
    const model = config.defaultTextModel || (aiIntegration.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash')

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
        let result: string

        if (aiIntegration.provider === 'openai') {
            result = await callOpenAI(apiKey, model, systemPrompt, userPrompt)
        } else if (aiIntegration.provider === 'gemini') {
            result = await callGemini(apiKey, model, systemPrompt, userPrompt)
        } else {
            return NextResponse.json({ error: `Unsupported AI provider: ${aiIntegration.provider}` }, { status: 400 })
        }

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

// ─── OpenAI Chat Completion ─────────────────────────
async function callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    return data.choices[0].message.content
}

// ─── Google Gemini ──────────────────────────────────
async function callGemini(apiKey: string, model: string, system: string, user: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: user }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            },
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Gemini error: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    return data.candidates[0].content.parts[0].text
}
