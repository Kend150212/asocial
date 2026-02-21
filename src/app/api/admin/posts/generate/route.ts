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

    const systemPrompt = `You are a world-class social media content creator who specializes in platform-specific content optimization. You understand the unique audience, format, and best practices of each social media platform. Write engaging, high-converting posts tailored to each platform. Respond ONLY with valid JSON.`

    // Build platform-specific instructions
    const platformInstructions: Record<string, string> = {
        facebook: `FACEBOOK: Write engaging, conversational content like a personal story or genuine share — NOT an advertisement. Use a storytelling approach. 1-3 paragraphs with line breaks. Include a community-building CTA (ask a question, invite comments). Use emojis naturally (3-5). Add 3-5 hashtags at the end. Suitable for sharing in groups naturally.`,
        instagram: `INSTAGRAM: Write aesthetic, visually-inspired caption. Start with a powerful hook line. Use emojis generously throughout. Break into short paragraphs with line breaks. Include a CTA (save this, share with a friend, comment below). Add 15-25 relevant hashtags at the end (mix popular + niche). Keep main caption under 200 words.`,
        tiktok: `TIKTOK: Write SHORT, punchy, viral caption. Must create curiosity to watch. Gen-Z/viral tone — trendy, authentic, relatable. Under 150 characters for the main caption. Start with a hook that stops scrolling. Add 3-5 trending hashtags. Minimal emojis (1-2 max). Include a CTA like "Follow for more" or "Watch till end".`,
        x: `X (TWITTER): Must be under 280 characters TOTAL including hashtags. Be witty, concise, and impactful. Use 1-2 relevant hashtags max. Strong opinion or insight format works best. No fluff, every word counts.`,
        linkedin: `LINKEDIN: Professional, thought-leadership tone. Start with a bold hook or contrarian take. Share expertise, lessons learned, or industry insights. Use line breaks between short paragraphs. End with a question to drive engagement. 3-5 relevant hashtags. Can be longer (500-1500 chars). NO emojis or maximum 1-2 professional ones.`,
        youtube: `YOUTUBE: Write SEO-rich video description. First 2 lines are critical (shown before "Show More"). Include key points and value proposition. Add timestamps if relevant. CTA to subscribe and engage. Natural keywords throughout. 300-800 chars.`,
        pinterest: `PINTEREST: Write keyword-rich, SEO-optimized description. Describe what the viewer will learn or find. Include relevant search terms naturally. 2-3 informative sentences. Add 3-5 hashtags. Focus on being discoverable.`,
    }

    const selectedPlatforms = (platforms as string[]) || []
    const uniquePlatforms = [...new Set(selectedPlatforms)]
    const platformRulesText = uniquePlatforms
        .filter(p => platformInstructions[p])
        .map(p => `- ${platformInstructions[p]}`)
        .join('\n')

    const contentPerPlatformJson = uniquePlatforms.length > 1
        ? `,\n  "contentPerPlatform": {\n${uniquePlatforms.map(p => `    "${p}": "Platform-optimized content for ${p}"`).join(',\n')}\n  }`
        : ''

    const userPrompt = `Create social media post content.

Topic / Input: ${cleanTopic}
Brand: ${channel.displayName}
Language: ${langLabel}
${vibeStr ? `Tone & Style: ${vibeStr}` : ''}
${kbContext ? `\nBrand Context:\n${kbContext}` : ''}
${articleContext}
${businessContext}
${allHashtags.length > 0 ? `\nAvailable hashtags: ${allHashtags.join(' ')}` : ''}

Target Platforms: ${platformList}

${platformRulesText ? `Platform-Specific Instructions:\n${platformRulesText}` : ''}

Respond with this exact JSON structure:
{
  "content": "The MAIN post content — a strong, universal version that works as a default"${contentPerPlatformJson},
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "A short attention-grabbing first line",
  "visualIdea": "1-2 sentence description of an ideal image or visual to accompany this post (for AI image generation)"
}

Rules:
- Write ENTIRELY in ${langLabel}
${isUrlTopic ? `- REWRITE the article content into an original, engaging post. Paraphrase creatively — do NOT copy verbatim.
- For article-based content: write between 500-2000 characters for the main content. Be thorough and insightful.` : '- Keep the main content concise but engaging (100-800 characters)'}
${uniquePlatforms.length > 1 ? `- For contentPerPlatform: write a DIFFERENT, platform-native version for EACH platform. Do NOT just copy the main content — each version must feel like it was written specifically for that platform.
- TikTok content MUST be under 150 chars. X/Twitter MUST be under 280 chars. Instagram should have lots of hashtags. LinkedIn should be professional.` : ''}
- Start with a powerful hook/attention grabber
- Include a clear call-to-action appropriate to each platform
- Use emojis strategically (vary by platform)
- Sound authentic, NOT robotic or like an advertisement
- The visualIdea should describe a compelling image concept (style, composition, mood, subject) that could be generated by AI
${businessContext ? `- Naturally incorporate business contact info — weave it in, don't list it. For TikTok/Instagram focus on social links, for Facebook/LinkedIn include phone/address/website.` : ''}
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

        let parsed: {
            content?: string
            contentPerPlatform?: Record<string, string>
            hashtags?: string[]
            hook?: string
            visualIdea?: string
        }
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

        // Combine main content with hashtags
        const hashtags = (parsed.hashtags || []).join(' ')
        const fullContent = hashtags
            ? `${parsed.content}\n\n${hashtags}`
            : (parsed.content || result)

        return NextResponse.json({
            content: fullContent,
            contentPerPlatform: parsed.contentPerPlatform || undefined,
            hook: parsed.hook || '',
            hashtags: parsed.hashtags || [],
            visualIdea: parsed.visualIdea || '',
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
