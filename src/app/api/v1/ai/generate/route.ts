import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

// ─── URL detection ─────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi

async function fetchArticleContent(url: string): Promise<string> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        const html = await res.text()
        const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        return text.slice(0, 3000)
    } catch {
        return ''
    }
}

/**
 * POST /api/v1/ai/generate — Generate content using app's AI
 * Body: { channelId, topic, platforms, provider?, model?, language?, tone? }
 */
export async function POST(req: NextRequest) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const body = await req.json()
    const { channelId, topic, platforms, provider: requestedProvider, model: requestedModel } = body

    if (!channelId || !topic) {
        return NextResponse.json(
            { success: false, error: { code: 'MISSING_FIELDS', message: 'channelId and topic are required' } },
            { status: 400 },
        )
    }

    // Get channel for context
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { knowledgeBase: { take: 5, orderBy: { updatedAt: 'desc' } }, hashtagGroups: true },
    })
    if (!channel) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } }, { status: 404 })
    }

    // Resolve AI provider key (same logic as admin/generate)
    const providerToUse = requestedProvider || channel.defaultAiProvider
    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null

    const ownerKey = await getChannelOwnerKey(channelId, providerToUse || null)

    if (!ownerKey.error) {
        apiKey = ownerKey.apiKey!
        providerName = ownerKey.provider!
    } else if (user.role === 'ADMIN') {
        const aiIntegration = providerToUse
            ? await prisma.apiIntegration.findFirst({ where: { provider: providerToUse, category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } } })
            : await prisma.apiIntegration.findFirst({ where: { category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } }, orderBy: { provider: 'asc' } })

        if (!aiIntegration?.apiKeyEncrypted) {
            return NextResponse.json(
                { success: false, error: { code: 'NO_AI_PROVIDER', message: 'No AI provider configured' } },
                { status: 400 },
            )
        }
        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        providerName = aiIntegration.provider
        config = (aiIntegration.config as Record<string, string>) || {}
        baseUrl = aiIntegration.baseUrl
    } else {
        return NextResponse.json(
            { success: false, error: { code: 'NO_AI_KEY', message: ownerKey.error || 'No AI API key found' } },
            { status: 400 },
        )
    }

    const model = requestedModel || ownerKey.model || channel.defaultAiModel || getDefaultModel(providerName, config)

    // Build context
    const kbContext = channel.knowledgeBase.map(kb => `[${kb.title}]: ${kb.content.slice(0, 500)}`).join('\n')
    const vibeTone = (channel.vibeTone as Record<string, string>) || {}
    const vibeStr = Object.entries(vibeTone).map(([k, v]) => `${k}: ${v}`).join(', ')
    const allHashtags = channel.hashtagGroups.flatMap(g => (g.hashtags as string[]) || []).slice(0, 20)

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[body.language || channel.language] || 'English'
    const platformList = (platforms as string[])?.join(', ') || 'all social media'

    // Fetch article content from URLs in topic
    const urls = topic.match(URL_REGEX) || []
    let articleContext = ''
    if (urls.length > 0) {
        const fetches = await Promise.allSettled(urls.slice(0, 3).map((u: string) => fetchArticleContent(u)))
        const articles = fetches
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
            .map(r => r.value)
        if (articles.length > 0) articleContext = `\n\nArticle(s):\n${articles.join('\n---\n')}`
    }

    const systemPrompt = `You are a world-class social media content creator. Write engaging, high-converting posts. Respond ONLY with valid JSON.`

    const userPrompt = `Create social media post content for these platforms: ${platformList}

Topic / Input: ${topic}
Brand: ${channel.displayName}
Language: ${langLabel}
${vibeStr ? `Tone & Style: ${vibeStr}` : ''}
${kbContext ? `\nBrand Context:\n${kbContext}` : ''}
${articleContext}
${allHashtags.length > 0 ? `\nAvailable hashtags: ${allHashtags.join(' ')}` : ''}

Respond with this exact JSON structure:
{
  "content": "The main post content (universal version)",
  "contentPerPlatform": {
    "facebook": "Facebook-optimized version (longer, professional)",
    "instagram": "Instagram version with hashtags",
    "tiktok": "TikTok version (short, trendy)",
    "youtube": "YouTube description version",
    "linkedin": "LinkedIn professional version",
    "x": "X/Twitter version (concise, <280 chars)",
    "pinterest": "Pinterest pin description"
  },
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "Attention-grabbing first line"
}

Rules:
- Write ENTIRELY in ${langLabel}
- Generate content for EACH platform listed: ${platformList}
- Each platform version should be optimized for that platform's style and length limits
- Only include platforms that were requested in contentPerPlatform
- If the user provided article link(s), summarize/discuss the article content
- Use emojis strategically (2-3 max)
- Include 3-8 relevant hashtags
- Sound authentic, NOT robotic`

    try {
        const result = await callAI(providerName, apiKey, model, systemPrompt, userPrompt, baseUrl)

        let cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0]

        let parsed: { content?: string; contentPerPlatform?: Record<string, string>; hashtags?: string[]; hook?: string }
        try {
            parsed = JSON.parse(cleaned)
        } catch {
            parsed = { content: result, contentPerPlatform: {}, hashtags: [], hook: '' }
        }

        return apiSuccess({
            content: parsed.content || result,
            contentPerPlatform: parsed.contentPerPlatform || {},
            hashtags: parsed.hashtags || [],
            hook: parsed.hook || '',
            provider: providerName,
            model,
        }, usage.apiCalls, plan.maxApiCallsPerMonth)
    } catch (error) {
        console.error('API v1 AI Generate error:', error)
        return NextResponse.json(
            { success: false, error: { code: 'AI_ERROR', message: error instanceof Error ? error.message : 'AI generation failed' } },
            { status: 500 },
        )
    }
}
