import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

// ─── URL detection & article scraping ────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi

async function fetchArticleContent(url: string): Promise<{ text: string; images: string[] }> {
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
        if (!res.ok) return { text: '', images: [] }
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

        // Extract og:image and twitter:image
        const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
            || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)
        const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i)
            || html.match(/<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"/i)
        const images: string[] = []
        if (ogImage?.[1]) images.push(ogImage[1])
        else if (twitterImage?.[1]) images.push(twitterImage[1])

        const title = ogTitle?.[1] || titleMatch?.[1] || ''
        const description = ogDesc?.[1] || metaDesc?.[1] || ''

        // Return structured article info, limited to ~3000 chars
        const articleBody = text.slice(0, 2500)
        const articleText = [
            title ? `Title: ${title}` : '',
            description ? `Summary: ${description}` : '',
            `Content: ${articleBody}`,
        ].filter(Boolean).join('\n')

        return { text: articleText, images }
    } catch {
        return { text: '', images: [] }
    }
}

// POST /api/admin/posts/generate — AI-generate post content
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
        channelId, topic, platforms,
        provider: requestedProvider, model: requestedModel,
        includeSourceLink, includeBusinessInfo,
    } = body

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
    const imageUrls: string[] = []
    if (urls.length > 0) {
        const fetches = await Promise.allSettled(
            urls.slice(0, 3).map((u: string) => fetchArticleContent(u))
        )
        const articles = fetches
            .filter((r): r is PromiseFulfilledResult<{ text: string; images: string[] }> => r.status === 'fulfilled' && !!r.value.text)
            .map((r) => r.value)
        if (articles.length > 0) {
            articleContext = `\n\nArticle(s) referenced by the user:\n${articles.map(a => a.text).join('\n---\n')}`
            // Collect all og:image URLs
            for (const a of articles) {
                imageUrls.push(...a.images)
            }
        }
    }

    // Clean topic: keep the user's text but note what URLs were fetched
    const cleanTopic = topic

    // ── Build business info context ──
    const bizInfo = (channel as any).businessInfo as {
        phone?: string; address?: string; website?: string;
        socials?: Record<string, string>;
        custom?: { label: string; url: string }[]
    } | null
    let businessContext = ''
    if (includeBusinessInfo && bizInfo) {
        const parts: string[] = []
        if (bizInfo.phone) parts.push(`Phone: ${bizInfo.phone}`)
        if (bizInfo.address) parts.push(`Address: ${bizInfo.address}`)
        if (bizInfo.website) parts.push(`Website: ${bizInfo.website}`)
        // Social links
        const socialParts: string[] = []
        if (bizInfo.socials) {
            for (const [platform, url] of Object.entries(bizInfo.socials)) {
                if (url) socialParts.push(`${platform}: ${url}`)
            }
        }
        if (bizInfo.custom) {
            for (const c of bizInfo.custom) {
                if (c.label && c.url) socialParts.push(`${c.label}: ${c.url}`)
            }
        }
        if (socialParts.length > 0) parts.push(`Social Links: ${socialParts.join(', ')}`)
        if (parts.length > 0) {
            businessContext = `\nBusiness Contact Info:\n${parts.join('\n')}`
        }
    }

    // ── Source link instruction ──
    const isUrlTopic = urls.length > 0
    const sourceUrlText = isUrlTopic && includeSourceLink
        ? `\n- At the END of the post, append: "\n\n🔗 ${urls[0]}"`
        : ''

    const systemPrompt = `You are a world-class social media content creator. Write engaging, high-converting posts. Respond ONLY with valid JSON.`

    const userPrompt = `Create social media post content for these platforms: ${platformList}

Topic / Input: ${cleanTopic}
Brand: ${channel.displayName}
Language: ${langLabel}
${vibeStr ? `Tone & Style: ${vibeStr}` : ''}
${kbContext ? `\nBrand Context:\n${kbContext}` : ''}
${articleContext}
${businessContext}
${allHashtags.length > 0 ? `\nAvailable hashtags: ${allHashtags.join(' ')}` : ''}

Respond with this exact JSON structure:
{
  "content": "The main post content (write a single version that works across platforms)",
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "A short attention-grabbing first line"
}

Rules:
- Write ENTIRELY in ${langLabel}
- If the user provided article link(s), REWRITE the article content into an original, engaging social media post that is LONGER and MORE DETAILED than a typical post. Paraphrase and add your own creative flair — do NOT copy the article verbatim.
- Start with a powerful hook/attention grabber
- Include a clear call-to-action
${isUrlTopic ? '- For article-based content: write between 500-2000 characters. Be thorough, insightful, and add value beyond the original article.' : '- Keep it concise but engaging (100-800 characters)'}
- Use emojis strategically (2-5)
- Include 3-8 relevant hashtags
- Sound authentic, NOT robotic or like an advertisement
${businessContext ? `- Naturally incorporate the business contact information into the post in a way that fits the context. Do NOT just list the info — weave it naturally. For example, end with "Visit us at [address]" or "DM us or call [phone]". Pick the most relevant pieces based on the platform (${platformList}). For TikTok/Instagram focus on social links, for Facebook/LinkedIn include phone/address/website.` : ''}
${sourceUrlText}`

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
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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
