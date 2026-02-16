import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// POST /api/admin/channels/[id]/generate-description — Generate SEO description from short input
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    const model = requestedModel || config.defaultTextModel || (aiIntegration.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash')

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[language] || 'English'

    const systemPrompt = `You are an expert social media SEO strategist. Generate a professional, SEO-optimized channel description. Respond ONLY with valid JSON.`

    const userPrompt = `Generate a professional, SEO-optimized description for this social media channel:

Channel Name: ${channelName}
Short Description: ${shortDescription}
Language: ${langLabel}

Respond with this exact JSON structure:
{
  "description": "A professional, compelling, SEO-optimized description for the channel (3-5 sentences). Should include relevant keywords, value propositions, and call-to-action. Written in ${langLabel}."
}

Requirements:
- Must be written entirely in ${langLabel}
- Include relevant SEO keywords naturally
- Be compelling and professional
- 3-5 sentences long
- Highlight the value proposition
- Include a subtle call-to-action`

    try {
        let result: string

        if (aiIntegration.provider === 'openai') {
            result = await callOpenAI(apiKey, model, systemPrompt, userPrompt)
        } else if (aiIntegration.provider === 'gemini') {
            result = await callGemini(apiKey, model, systemPrompt, userPrompt)
        } else {
            return NextResponse.json({ error: `Unsupported provider` }, { status: 400 })
        }

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

async function callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
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

async function callGemini(apiKey: string, model: string, system: string, user: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: user }] }],
            generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Gemini error: ${err.error?.message || res.statusText}`)
    }
    const data = await res.json()
    return data.candidates[0].content.parts[0].text
}
