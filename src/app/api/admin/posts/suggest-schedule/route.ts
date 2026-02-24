import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'

// POST /api/admin/posts/suggest-schedule — AI-suggest optimal posting times
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, platforms, content, timezone } = body

    if (!channelId || !platforms?.length) {
        return NextResponse.json({ error: 'Channel and platforms are required' }, { status: 400 })
    }

    // Get channel
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
    })
    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // ─── Key resolution: same pattern as generate route ───
    const providerToUse = channel.defaultAiProvider
    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null

    // 1. Try channel owner's BYOK key first
    const ownerKey = await getChannelOwnerKey(channelId, providerToUse || null)

    if (!ownerKey.error) {
        apiKey = ownerKey.apiKey!
        providerName = ownerKey.provider!
    } else if (session.user.role === 'ADMIN') {
        // 2. Admin fallback: global API Hub
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
                { error: 'No AI provider configured. Set up an AI API key in API Hub first.' },
                { status: 400 }
            )
        }
        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        providerName = aiIntegration.provider
        config = (aiIntegration.config as Record<string, string>) || {}
        baseUrl = aiIntegration.baseUrl
    } else {
        return NextResponse.json(
            { error: ownerKey.error ?? 'No API key found. Please ask the channel owner to add an AI API key.' },
            { status: 400 }
        )
    }

    const model = ownerKey.model || channel.defaultAiModel || getDefaultModel(providerName, config)

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[channel.language] || 'English'

    // Get current date/time info
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
    const userTz = timezone || 'UTC'

    // Get past post performance data for smarter suggestions
    const pastPosts = await prisma.post.findMany({
        where: {
            channelId,
            status: 'PUBLISHED',
            publishedAt: { not: null },
        },
        select: {
            publishedAt: true,
            platformStatuses: {
                select: { platform: true, externalId: true },
            },
        },
        orderBy: { publishedAt: 'desc' },
        take: 50,
    })

    // Build posting history context
    let historyContext = ''
    if (pastPosts.length > 0) {
        const postTimes = pastPosts
            .filter(p => p.publishedAt)
            .map(p => {
                const d = new Date(p.publishedAt!)
                return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
            })
            .slice(0, 20)
        historyContext = `\nPast posting times (most recent ${postTimes.length}): ${postTimes.join(', ')}`
    }

    const systemPrompt = `You are a social media strategy expert with deep knowledge of platform algorithms and audience behavior. Analyze the context and suggest optimal posting times that maximize engagement. Respond ONLY with valid JSON.`

    const userPrompt = `Suggest 4 optimal posting times for maximum engagement:

Context:
- Channel: ${channel.displayName}
- Language: ${langLabel} (target audience is ${langLabel}-speaking)
- Platforms: ${(platforms as string[]).join(', ')}
- Content preview: ${content ? content.slice(0, 200) : '(no content yet)'}
- Today: ${dayOfWeek}, ${todayStr}
- User timezone: ${userTz}
${historyContext}

Platform-specific peak times research:
- Facebook: Tue-Thu 9-12 AM, Wed 11 AM-1 PM (peak engagement)
- Instagram: Mon-Fri 11 AM-1 PM, Tue-Wed peak, Stories best 7-9 AM
- TikTok: Tue-Thu 2-5 PM, Fri-Sat 7-11 PM (younger audience active)
- X/Twitter: Mon-Fri 8 AM-4 PM, Wed-Thu best for B2B
- LinkedIn: Tue-Thu 7-8 AM, 12 PM, 5-6 PM (business hours)
- YouTube: Thu-Fri 2-4 PM for publishing, Sat-Sun morning for organic reach
- Pinterest: Fri-Sun peak, 8-11 PM best for saves
- Bluesky: Similar to Twitter patterns, weekday mornings

Rules:
1. Suggest times WITHIN THE NEXT 7 DAYS starting from today
2. Each suggestion at a DIFFERENT day/time for variety
3. Consider the specific platforms selected — weight toward platform-specific peaks
4. Account for the audience language/region timezone
5. Avoid weekends for B2B content (LinkedIn), prefer weekends for lifestyle (Instagram/TikTok)
6. Time format must be in the user's timezone (${userTz})

Respond with ONLY this JSON (no markdown, no backticks):
{
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "label": "🌅 Best for [Platform] - [Time Description]",
      "reason": "Short reason why (mention platform algorithm or audience behavior)",
      "score": 95
    }
  ]
}`

    try {
        const result = await callAI(
            providerName,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            baseUrl || (config as Record<string, string>).baseUrl || null,
        )

        // Parse JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
        }

        const parsed = JSON.parse(jsonMatch[0])

        // Sort suggestions by score (highest first)
        const suggestions = (parsed.suggestions || [])
            .sort((a: { score?: number }, b: { score?: number }) => (b.score || 0) - (a.score || 0))

        return NextResponse.json({ suggestions })
    } catch (err) {
        console.error('AI schedule suggestion error:', err)
        return NextResponse.json({ error: 'AI suggestion failed' }, { status: 500 })
    }
}
