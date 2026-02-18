import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/posts/customize-content
// AI adapts master content for each selected platform's best practices
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, content, platforms } = body as {
        channelId: string
        content: string
        platforms: string[]
    }

    if (!channelId || !content || !platforms?.length) {
        return NextResponse.json({ error: 'Channel, content, and platforms are required' }, { status: 400 })
    }

    // Get channel context
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
            knowledgeBase: { take: 3, orderBy: { updatedAt: 'desc' } },
        },
    })
    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // ── Resolve AI provider (same logic as generate-metadata) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelData = channel as any
    const providerToUse = channel.defaultAiProvider
    const channelAiKey = channelData.aiApiKeyEncrypted
    const mustUseOwnKey = channelData.requireOwnApiKey === true
    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null

    let userApiKey = providerToUse
        ? await prisma.userApiKey.findFirst({
            where: { userId: session.user.id!, provider: providerToUse, isActive: true },
        })
        : null

    if (!userApiKey) {
        userApiKey = await prisma.userApiKey.findFirst({
            where: { userId: session.user.id!, isDefault: true, isActive: true },
        })
    }
    if (!userApiKey) {
        userApiKey = await prisma.userApiKey.findFirst({
            where: { userId: session.user.id!, isActive: true },
            orderBy: { provider: 'asc' },
        })
    }

    if (userApiKey) {
        apiKey = decrypt(userApiKey.apiKeyEncrypted)
        providerName = userApiKey.provider
    } else if (channelAiKey) {
        apiKey = decrypt(channelAiKey)
        providerName = providerToUse || 'gemini'
    } else if (mustUseOwnKey) {
        return NextResponse.json(
            { error: 'No API key found. Please set up your AI API Key.' },
            { status: 400 }
        )
    } else if (session.user.role === 'ADMIN') {
        let aiIntegration
        if (providerToUse) {
            aiIntegration = await prisma.apiIntegration.findFirst({
                where: { provider: providerToUse, category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
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
                { error: 'No AI provider configured.' },
                { status: 400 }
            )
        }

        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        providerName = aiIntegration.provider
        config = (aiIntegration.config as Record<string, string>) || {}
        baseUrl = aiIntegration.baseUrl
    } else {
        return NextResponse.json(
            { error: 'No AI API key found.' },
            { status: 400 }
        )
    }

    const model = userApiKey?.defaultModel || channel.defaultAiModel || getDefaultModel(providerName, config)

    // Detect language
    const langLabel = channel.language || 'Vietnamese'

    // Platform-specific rules
    const platformRules: Record<string, string> = {
        facebook: `Facebook: Write engaging, conversational content. Use emojis naturally. Include a call-to-action. Can be longer (1-3 paragraphs). Add line breaks for readability. Storytelling tone. No hashtags in body text — add 3-5 hashtags at the very end on a separate line. Language: ${langLabel}.`,
        instagram: `Instagram: Write concise, aesthetic caption. Heavy emoji usage. Break into short paragraphs. Include a CTA (comment, save, share). Add 20-30 relevant hashtags at the end (mixed popular + niche). Keep main caption under 200 words. Language: ${langLabel}.`,
        tiktok: `TikTok: Write short, punchy, trendy caption. Use Gen-Z/viral tone. Start with a hook. Keep under 150 characters if possible (max 2200). Add 3-5 trending hashtags. Use emojis sparingly. Language: ${langLabel}.`,
        x: `X (Twitter): Must be under 280 characters total. Be witty, concise, and impactful. Use 1-2 relevant hashtags max. No fluff. Can use thread-style if content is complex (but keep first tweet standalone). Language: ${langLabel}.`,
        linkedin: `LinkedIn: Professional, insightful tone. Can be longer (up to 3000 chars). Use line breaks for readability. Start with a hook. Share expertise or lessons learned. Include a question to drive engagement. Use 3-5 relevant hashtags. Language: ${langLabel}.`,
        pinterest: `Pinterest: Write SEO-rich description. Include relevant keywords naturally. Describe what the viewer will find. Keep it informative and searchable. 2-3 sentences. Add relevant hashtags. Language: ${langLabel}.`,
        youtube: `YouTube: Write engaging video description. Include key points, timestamps if relevant, CTA to subscribe. SEO-friendly with natural keywords. Can be longer. Add relevant links and hashtags at the end. Language: ${langLabel}.`,
    }

    // Build the prompt
    const selectedRules = platforms
        .filter(p => platformRules[p])
        .map(p => `- ${platformRules[p]}`)
        .join('\n')

    const systemPrompt = `You are a social media content expert. Your job is to adapt a single piece of content for different social media platforms, optimizing for each platform's unique audience, format, and best practices. Maintain the core message but adjust tone, length, format, hashtags, and style for maximum engagement on each platform.`

    const userPrompt = `Here is the ORIGINAL content to adapt:

---
${content}
---

Adapt this content for each of the following platforms. Each version should feel native to that platform — not just a copy-paste:

${selectedRules}

IMPORTANT RULES:
1. Keep the CORE MESSAGE the same across all platforms
2. Each version must feel native to its platform
3. DO NOT add placeholder text like [YOUR LINK] or [INSERT IMAGE]. Only include real, actionable content
4. Write in ${langLabel} unless the original content is in another language — then match that language
5. Return VALID JSON only, no markdown

Return JSON:
{
${platforms.map(p => `  "${p}": "The adapted content for ${p}"`).join(',\n')}
}`

    try {
        const result = await callAI(
            providerName,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            baseUrl || undefined,
        )

        // Parse JSON from AI response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
        }

        const parsed = JSON.parse(jsonMatch[0])

        // Build response with only requested platforms
        const contentPerPlatform: Record<string, string> = {}
        for (const p of platforms) {
            if (parsed[p] && typeof parsed[p] === 'string') {
                contentPerPlatform[p] = parsed[p]
            }
        }

        return NextResponse.json({ contentPerPlatform })
    } catch (err) {
        console.error('[customize-content] AI error:', err)
        return NextResponse.json(
            { error: 'AI content customization failed. Please try again.' },
            { status: 500 }
        )
    }
}
