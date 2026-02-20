import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/posts/suggest — AI-generate topic suggestions for a channel
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await req.json()
    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    // Verify user has access to this channel (session ADMIN bypasses; channel OWNER/MANAGER/ADMIN allowed)
    if (session.user.role !== 'ADMIN') {
        const membership = await prisma.channelMember.findFirst({
            where: { channelId, userId: session.user.id, role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER] } },
        })
        if (!membership) {
            return NextResponse.json({ error: 'Access denied to this channel' }, { status: 403 })
        }
    }

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
            knowledgeBase: { take: 3, orderBy: { updatedAt: 'desc' } },
            hashtagGroups: true,
        },
    })
    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // ── Resolve AI provider/key (same priority chain as generate) ──
    const providerToUse = channel.defaultAiProvider
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelData = channel as any
    const channelAiKey = channelData.aiApiKeyEncrypted
    const mustUseOwnKey = channelData.requireOwnApiKey === true
    let apiKey: string
    let providerName: string
    let config: Record<string, string> = {}
    let baseUrl: string | undefined | null

    // Try user key → channel key → global integration (admin)
    let userApiKey = providerToUse
        ? await prisma.userApiKey.findFirst({ where: { userId: session.user.id!, provider: providerToUse, isActive: true } })
        : null
    if (!userApiKey) userApiKey = await prisma.userApiKey.findFirst({ where: { userId: session.user.id!, isDefault: true, isActive: true } })
    if (!userApiKey) userApiKey = await prisma.userApiKey.findFirst({ where: { userId: session.user.id!, isActive: true }, orderBy: { provider: 'asc' } })

    if (userApiKey) {
        apiKey = decrypt(userApiKey.apiKeyEncrypted)
        providerName = userApiKey.provider
    } else if (channelAiKey) {
        apiKey = decrypt(channelAiKey)
        providerName = providerToUse || 'gemini'
    } else if (mustUseOwnKey) {
        return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    } else if (session.user.role === 'ADMIN') {
        const aiIntegration = await prisma.apiIntegration.findFirst({
            where: { category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
            orderBy: { provider: 'asc' },
        })
        if (!aiIntegration?.apiKeyEncrypted) {
            return NextResponse.json({ error: 'No AI provider configured' }, { status: 400 })
        }
        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        providerName = aiIntegration.provider
        config = (aiIntegration.config as Record<string, string>) || {}
        baseUrl = aiIntegration.baseUrl
    } else {
        return NextResponse.json({ error: 'No AI API key found' }, { status: 400 })
    }

    const model = userApiKey?.defaultModel || channel.defaultAiModel || getDefaultModel(providerName, config)

    // Build channel context for suggestion
    const kbTitles = channel.knowledgeBase.map(kb => kb.title).join(', ')
    const seoTags = ((channel.seoTags as string[]) || []).join(', ')
    const hashtags = channel.hashtagGroups.flatMap(g => (g.hashtags as string[]) || []).slice(0, 15).join(' ')
    const langMap: Record<string, string> = { vi: 'Vietnamese', en: 'English', fr: 'French', de: 'German', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', es: 'Spanish' }
    const langLabel = langMap[channel.language] || 'English'

    const systemPrompt = `You are a social media content strategist. Suggest engaging post topics. Respond ONLY with valid JSON.`
    const userPrompt = `Suggest 6 diverse, engaging social media post topics for this brand:

Brand: ${channel.displayName}
Description: ${channel.description || 'N/A'}
Language: ${langLabel}
SEO Tags: ${seoTags || 'N/A'}
Knowledge Base Topics: ${kbTitles || 'N/A'}
Hashtags: ${hashtags || 'N/A'}

Return JSON: { "suggestions": [{ "topic": "short topic text", "emoji": "relevant emoji" }] }

Rules:
- Topics should be diverse (mix of educational, engaging, promotional, trending)
- Each topic: 3-8 words, actionable, specific
- Use ${langLabel} language
- Include seasonal/timely topics where relevant
- Make topics that would work well on social media`

    try {
        const result = await callAI(providerName, apiKey, model, systemPrompt, userPrompt, baseUrl)
        let cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0]

        let parsed: { suggestions?: { topic: string; emoji: string }[] }
        try { parsed = JSON.parse(cleaned) } catch { parsed = { suggestions: [] } }

        return NextResponse.json({ suggestions: parsed.suggestions || [] })
    } catch (error) {
        console.error('Suggest error:', error)
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }
}
