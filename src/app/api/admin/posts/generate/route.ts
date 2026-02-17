import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'

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
    const model = requestedModel || channel.defaultAiModel || getDefaultModel(aiIntegration.provider, config)

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

    const systemPrompt = `You are a world-class social media content creator. Write engaging, high-converting posts. Respond ONLY with valid JSON.`

    const userPrompt = `Create social media post content for these platforms: ${platformList}

Topic: ${topic}
Brand: ${channel.displayName}
Language: ${langLabel}
${vibeStr ? `Tone & Style: ${vibeStr}` : ''}
${kbContext ? `\nBrand Context:\n${kbContext}` : ''}
${allHashtags.length > 0 ? `\nAvailable hashtags: ${allHashtags.join(' ')}` : ''}

Respond with this exact JSON structure:
{
  "content": "The main post content (write a single version that works across platforms)",
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "A short attention-grabbing first line"
}

Rules:
- Write ENTIRELY in ${langLabel}
- Start with a hook/attention grabber
- Include a clear call-to-action
- Keep it concise but engaging
- Use emojis strategically (2-3 max)
- Include 3-8 relevant hashtags
- Sound authentic, NOT robotic
- Make the content between 50-500 characters for cross-platform compatibility`

    try {
        const result = await callAI(
            aiIntegration.provider,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            aiIntegration.baseUrl,
        )

        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)

        // Increment usage
        await prisma.apiIntegration.update({
            where: { id: aiIntegration.id },
            data: { usageCount: { increment: 1 } },
        })

        // Combine content with hashtags
        const hashtags = (parsed.hashtags || []).join(' ')
        const fullContent = hashtags
            ? `${parsed.content}\n\n${hashtags}`
            : parsed.content

        return NextResponse.json({
            content: fullContent,
            hook: parsed.hook || '',
            hashtags: parsed.hashtags || [],
            provider: aiIntegration.provider,
            model,
        })
    } catch (error) {
        console.error('AI Generate error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate content' },
            { status: 500 }
        )
    }
}
