import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

// POST /api/admin/posts/suggest-schedule — AI-suggest optimal posting times
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, platforms, content } = body

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

    // Find AI provider
    const providerToUse = channel.defaultAiProvider
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
            { error: 'No AI provider configured. Set up an AI API key in API Hub first.' },
            { status: 400 }
        )
    }

    const apiKey = decrypt(aiIntegration.apiKeyEncrypted)
    const config = (aiIntegration.config as Record<string, string>) || {}
    const model = channel.defaultAiModel || getDefaultModel(aiIntegration.provider, config)

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[channel.language] || 'English'

    // Get current date in user's likely timezone
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const systemPrompt = `You are a social media strategy expert. Analyze the given context and suggest optimal posting times. Respond ONLY with valid JSON.`

    const userPrompt = `Suggest 4 optimal posting times for the following:
- Channel: ${channel.displayName}
- Language: ${langLabel}
- Platforms: ${(platforms as string[]).join(', ')}
- Content preview: ${content || '(no content yet)'}
- Today's date: ${todayStr}

Consider:
1. Platform-specific best times (e.g., Instagram peaks at lunch/evening, LinkedIn is best during work hours, TikTok performs well in evening)
2. The channel's target audience based on language and description
3. Suggest times within the next 7 days
4. Each suggestion should be at a different time/day for variety

Respond with ONLY this JSON format (no markdown, no \`\`\`):
{
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "label": "🌅 Best for [Platform] - Morning Rush",
      "reason": "Short reason why this time is optimal"
    }
  ]
}`

    try {
        const result = await callAI({
            provider: aiIntegration.provider,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            config,
        })

        // Parse JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
        }

        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({ suggestions: parsed.suggestions || [] })
    } catch (err) {
        console.error('AI schedule suggestion error:', err)
        return NextResponse.json({ error: 'AI suggestion failed' }, { status: 500 })
    }
}
