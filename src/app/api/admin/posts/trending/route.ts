import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Google News RSS categories
const NEWS_CATEGORIES: Record<string, string> = {
    general: '',
    technology: 'technology',
    business: 'business',
    health: 'health',
    science: 'science',
    entertainment: 'entertainment',
    sports: 'sports',
}

// POST /api/admin/posts/trending — fetch trending news via Google News RSS
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, category, customKeyword } = await req.json()
    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const channel = await prisma.channel.findUnique({ where: { id: channelId } })
    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // ── Derive search keywords (priority chain) ──
    let searchQuery: string

    if (customKeyword?.trim()) {
        // Priority 1: User-provided custom keyword
        searchQuery = customKeyword.trim()
    } else if (category && category !== 'general' && NEWS_CATEGORIES[category]) {
        // Priority 2: Selected category
        searchQuery = NEWS_CATEGORIES[category]
    } else {
        // Priority 3: Channel newsTopics → auto-derive from description + seoTags
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channelData = channel as any
        const newsTopics = (channelData.newsTopics as string[]) || []

        if (newsTopics.length > 0) {
            searchQuery = newsTopics.slice(0, 3).join(' OR ')
        } else {
            // Auto-derive from channel data
            const seoTags = ((channel.seoTags as string[]) || []).slice(0, 3)
            const descWords = (channel.description || '')
                .split(/\s+/)
                .filter(w => w.length > 3)
                .slice(0, 3)

            const keywords = [...seoTags, ...descWords].filter(Boolean)
            searchQuery = keywords.length > 0
                ? keywords.slice(0, 3).join(' OR ')
                : channel.displayName
        }
    }

    // ── Language mapping for Google News ──
    const langGeo: Record<string, { hl: string; gl: string; ceid: string }> = {
        vi: { hl: 'vi', gl: 'VN', ceid: 'VN:vi' },
        en: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
        fr: { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
        de: { hl: 'de', gl: 'DE', ceid: 'DE:de' },
        ja: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
        ko: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
        zh: { hl: 'zh-TW', gl: 'TW', ceid: 'TW:zh-Hant' },
        es: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
    }
    const geo = langGeo[channel.language] || langGeo.en

    // ── Fetch Google News RSS ──
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`
    console.log('Trending news RSS URL:', rssUrl)

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch news', articles: [] })
        }

        const xml = await res.text()

        // ── Parse RSS XML ──
        const items: { title: string; source: string; link: string; publishedAt: string }[] = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match
        while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
            const itemXml = match[1]
            const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                || itemXml.match(/<title>(.*?)<\/title>/)?.[1]
                || ''
            const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1]
                || itemXml.match(/<link\/>(.*?)(?=<)/)?.[1]
                || ''
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || ''

            if (title && link) {
                items.push({
                    title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
                    source: source.replace(/&amp;/g, '&'),
                    link,
                    publishedAt: pubDate,
                })
            }
        }

        return NextResponse.json({
            articles: items,
            keywords: searchQuery,
            category: category || 'auto',
        })
    } catch (error) {
        console.error('Trending fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch trending news', articles: [] })
    }
}
