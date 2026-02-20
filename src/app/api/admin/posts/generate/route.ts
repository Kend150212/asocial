import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

// ─── URL detection & article scraping ────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi

async function fetchArticleContent(url: string): Promise<string> {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) return ''
        const html = await res.text()

        // Strip HTML tags, scripts, styles to get text content
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim()

        // Extract title from meta or title tag
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
        const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
        const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)

        const title = ogTitle?.[1] || titleMatch?.[1] || ''
        const description = ogDesc?.[1] || metaDesc?.[1] || ''

        // Return structured article info, limited to ~3000 chars
        const articleBody = text.slice(0, 2500)
        return [
            title ? `Title: ${title}` : '',
            description ? `Summary: ${description}` : '',
            `Content: ${articleBody}`,
        ].filter(Boolean).join('\n')
    } catch {
        return ''
    }
}

// POST /api/admin/posts/generate — AI-generate post content
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, topic, platforms, provider: requestedProvider, model: requestedModel } = body

    if (!channelId || !topic) {
        return NextResponse.json({ error: 'Channel and topic are required' }, { status: 400 })
    }

    // Get channel for context
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
            knowledgeBase: { take: 5, orderBy: { updatedAt: 'desc' } },
            hashtagGroups: true,
        },
    })
    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Find AI provider
    const providerToUse = requestedProvider || channel.defaultAiProvider

    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null
    let integrationId: string | null = null

    // ─── Key resolution: Channel Owner's BYOK (staff/manager share owner key) ───
    const ownerKey = await getChannelOwnerKey(channelId, providerToUse || null)

    if (!ownerKey.error) {
        // Owner has a key — use it
        apiKey = ownerKey.apiKey!
        providerName = ownerKey.provider!
    } else if (session.user.role === 'ADMIN') {
        // Admin users only: fall back to global API Hub
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
        if (!aiIntegration?.apiKeyEncrypted) {
            return NextResponse.json(
                { error: 'No AI provider configured in API Hub. Set up a provider in the Admin API Hub.' },
                { status: 400 }
            )
        }
        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        providerName = aiIntegration.provider
        config = (aiIntegration.config as Record<string, string>) || {}
        baseUrl = aiIntegration.baseUrl
        integrationId = aiIntegration.id
    } else {
        // No key found — tell user the owner must configure a key
        return NextResponse.json(
            { error: ownerKey.error ?? 'No API key found. Please ask the channel owner to add an AI API key in Settings → AI API Keys.' },
            { status: 400 }
        )
    }


    const model = requestedModel || ownerKey.model || channel.defaultAiModel || getDefaultModel(providerName, config)

    // Build context from knowledge base
    const kbContext = channel.knowledgeBase
        .map((kb) => `[${kb.title}]: ${kb.content.slice(0, 500)}`)
        .join('\n')

    // Vibe & tone
    const vibeTone = (channel.vibeTone as Record<string, string>) || {}
    const vibeStr = Object.entries(vibeTone)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

    // Hashtags
    const allHashtags = channel.hashtagGroups
        .flatMap((g) => (g.hashtags as string[]) || [])
        .slice(0, 20)

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[channel.language] || 'English'

    const platformList = (platforms as string[])?.join(', ') || 'all social media'

    // ── Detect URLs in topic and fetch article content ──
    const urls = topic.match(URL_REGEX) || []
    let articleContext = ''
    if (urls.length > 0) {
        const fetches = await Promise.allSettled(
            urls.slice(0, 3).map((u: string) => fetchArticleContent(u))
        )
        const articles = fetches
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
            .map((r) => r.value)
        if (articles.length > 0) {
            articleContext = `\n\nArticle(s) referenced by the user:\n${articles.join('\n---\n')}`
        }
    }

    // Clean topic: keep the user's text but note what URLs were fetched
    const cleanTopic = topic

    const systemPrompt = `You are a world-class social media content creator. Write engaging, high-converting posts. Respond ONLY with valid JSON.`

    const userPrompt = `Create social media post content for these platforms: ${platformList}

Topic / Input: ${cleanTopic}
Brand: ${channel.displayName}
Language: ${langLabel}
${vibeStr ? `Tone & Style: ${vibeStr}` : ''}
${kbContext ? `\nBrand Context:\n${kbContext}` : ''}
${articleContext}
${allHashtags.length > 0 ? `\nAvailable hashtags: ${allHashtags.join(' ')}` : ''}

Respond with this exact JSON structure:
{
  "content": "The main post content (write a single version that works across platforms)",
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "A short attention-grabbing first line"
}

Rules:
- Write ENTIRELY in ${langLabel}
- If the user provided article link(s), USE the article content to create an engaging social media post summarizing or discussing the article
- Start with a hook/attention grabber
- Include a clear call-to-action
- Keep it concise but engaging
- Use emojis strategically (2-3 max)
- Include 3-8 relevant hashtags
- Sound authentic, NOT robotic
- Make the content between 100-800 characters for cross-platform compatibility`

    try {
        const result = await callAI(
            providerName,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            baseUrl,
        )

        // Robust JSON parsing — handle markdown code fences and partial JSON
        let cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        // Try to extract JSON object if there's extra text around it
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0]

        let parsed: { content?: string; hashtags?: string[]; hook?: string }
        try {
            parsed = JSON.parse(cleaned)
        } catch {
            // Fallback: use the raw AI text as content
            parsed = { content: result, hashtags: [], hook: '' }
        }

        // Increment usage (only if using global integration)
        if (integrationId) {
            await prisma.apiIntegration.update({
                where: { id: integrationId },
                data: { usageCount: { increment: 1 } },
            })
        }

        // Combine content with hashtags
        const hashtags = (parsed.hashtags || []).join(' ')
        const fullContent = hashtags
            ? `${parsed.content}\n\n${hashtags}`
            : (parsed.content || result)

        return NextResponse.json({
            content: fullContent,
            hook: parsed.hook || '',
            hashtags: parsed.hashtags || [],
            provider: providerName,
            model,
            articlesFetched: urls.length,
        })
    } catch (error) {
        console.error('AI Generate error:', error)
        const msg = error instanceof Error ? error.message : 'Failed to generate content'
        return NextResponse.json(
            { error: msg, details: String(error) },
            { status: 500 }
        )
    }
}
