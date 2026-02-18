import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/posts/generate-metadata
// AI-generates platform-specific metadata: first comment, Pinterest title/link,
// YouTube title/tags/category/thumbnail prompt
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, content, platforms } = body as {
        channelId: string
        content: string
        platforms: string[] // e.g. ['facebook', 'pinterest', 'youtube']
    }

    if (!channelId || !content) {
        return NextResponse.json({ error: 'Channel and content are required' }, { status: 400 })
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

    // ── Resolve AI provider (same logic as generate route) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelData = channel as any
    const providerToUse = channel.defaultAiProvider
    const channelAiKey = channelData.aiApiKeyEncrypted
    const mustUseOwnKey = channelData.requireOwnApiKey === true
    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null

    // Priority 1: User's own API key
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

    // Build brand context
    const vibeTone = (channel.vibeTone as Record<string, string>) || {}
    const vibeStr = Object.entries(vibeTone).map(([k, v]) => `${k}: ${v}`).join(', ')
    const kbContext = channel.knowledgeBase
        .map((kb) => `[${kb.title}]: ${kb.content.slice(0, 300)}`)
        .join('\n')

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[channel.language] || 'English'

    // YouTube categories for auto-selection
    const ytCategories = [
        'Film & Animation', 'Autos & Vehicles', 'Music', 'Pets & Animals',
        'Sports', 'Short Movies', 'Travel & Events', 'Gaming', 'Videoblogging',
        'People & Blogs', 'Comedy', 'Entertainment', 'News & Politics',
        'Howto & Style', 'Education', 'Science & Technology', 'Nonprofits & Activism',
    ]

    // Build the prompt
    const requestedPlatforms = platforms || []
    const hasFacebook = requestedPlatforms.includes('facebook')
    const hasPinterest = requestedPlatforms.includes('pinterest')
    const hasYouTube = requestedPlatforms.includes('youtube')

    const systemPrompt = `You are a world-class social media strategist. Generate platform-specific metadata for a post. Respond ONLY with valid JSON.`

    const userPrompt = `Given this post content for the brand "${channel.displayName}" (${langLabel}):

---
${content.slice(0, 1500)}
---

${vibeStr ? `Brand tone: ${vibeStr}` : ''}
${kbContext ? `Brand context:\n${kbContext}` : ''}

Generate the following metadata as JSON. Write ENTIRELY in ${langLabel} unless noted otherwise:

{
${hasFacebook ? `  "firstComment": "A relevant first comment for the Facebook post — should be engaging, add value (e.g. a question, extra tip, or CTA). 1-2 sentences. Don't repeat the post content.",` : ''}
${hasPinterest ? `  "pinTitle": "A catchy, SEO-optimized pin title (max 100 chars) that describes the content. In ${langLabel}.",
  "pinLink": "A suggested destination URL if the post mentions any link or website. Empty string if no link context.",` : ''}
${hasYouTube ? `  "ytTitle": "A compelling, clickbait-worthy video title (max 100 chars) that drives clicks. In ${langLabel}.",
  "ytTags": "Comma-separated relevant video tags (8-15 tags) for YouTube SEO. Mix of broad and specific. In ${langLabel}.",
  "ytCategory": "The most relevant category from this list: [${ytCategories.join(', ')}]. Return the exact category name.",
  "ytThumbnailPrompt": "A detailed prompt for generating a YouTube thumbnail image. Describe the visual composition, text overlay suggestions, colors, style, and mood. Be specific and vivid. Write in English for image generation.",` : ''}
}

Rules:
- ALL text fields in ${langLabel} (except ytThumbnailPrompt which should be in English)
- Make titles catchy and attention-grabbing  
- First comment should feel natural, not promotional
- YouTube tags should be comma-separated and SEO-optimized
- Thumbnail prompt should describe a visually striking, clickable thumbnail
- Return ONLY valid JSON, no extra text`

    try {
        const result = await callAI(providerName, apiKey, model, systemPrompt, userPrompt, baseUrl)

        // Parse JSON response
        let cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0]

        let parsed: Record<string, string>
        try {
            parsed = JSON.parse(cleaned)
        } catch {
            parsed = {}
        }

        return NextResponse.json({
            ...(hasFacebook ? { firstComment: parsed.firstComment || '' } : {}),
            ...(hasPinterest ? {
                pinTitle: parsed.pinTitle || '',
                pinLink: parsed.pinLink || '',
            } : {}),
            ...(hasYouTube ? {
                ytTitle: parsed.ytTitle || '',
                ytTags: parsed.ytTags || '',
                ytCategory: parsed.ytCategory || '',
                ytThumbnailPrompt: parsed.ytThumbnailPrompt || '',
            } : {}),
            provider: providerName,
            model,
        })
    } catch (error) {
        console.error('AI Generate metadata error:', error)
        const msg = error instanceof Error ? error.message : 'Failed to generate metadata'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
