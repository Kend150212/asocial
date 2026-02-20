import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'
import { checkTextQuota, incrementTextUsage } from '@/lib/ai-quota'

// POST /api/admin/channels/[id]/generate-vibe — AI-generate Vibe & Tone from short description
// API key priority:
//   1. Channel owner's UserApiKey (preferred provider → default → any)
//   2. Admin's shared ApiIntegration (fallback, subject to quota)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: channelId } = await params
    const body = await req.json()
    const { channelName, description, language, provider: requestedProvider, model: requestedModel } = body

    if (!channelName || !description) {
        return NextResponse.json({ error: 'Channel name and description are required' }, { status: 400 })
    }

    // ─── 1. Try channel owner's own key ───────────────────────────────────
    const ownerKey = await getChannelOwnerKey(channelId, requestedProvider)
    let apiKey: string
    let provider: string
    let model: string
    let usingByok = false
    let adminIntegrationId: string | null = null

    if (ownerKey.apiKey) {
        apiKey = ownerKey.apiKey
        provider = ownerKey.provider!
        model = requestedModel || ownerKey.model || getDefaultModel(provider, {})
        usingByok = true
    } else {
        // ─── 2. Fall back to admin's shared key, check quota first ───────
        const ownerId = ownerKey.ownerId ?? session.user.id
        const quota = await checkTextQuota(ownerId, false)
        if (!quota.allowed) {
            return NextResponse.json({ error: quota.reason }, { status: 429 })
        }

        let aiIntegration = null
        if (requestedProvider) {
            aiIntegration = await prisma.apiIntegration.findFirst({
                where: { provider: requestedProvider, category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
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
                { error: 'No AI key available. Please configure an AI API key in your AI API Keys page (/dashboard/api-keys) or ask your admin to set up a shared AI integration.' },
                { status: 400 }
            )
        }

        apiKey = decrypt(aiIntegration.apiKeyEncrypted)
        provider = aiIntegration.provider
        const config = (aiIntegration.config as Record<string, string>) || {}
        model = requestedModel || getDefaultModel(provider, config)
        adminIntegrationId = aiIntegration.id
    }

    const langMap: Record<string, string> = {
        vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', es: 'Spanish', en: 'English',
    }
    const langLabel = langMap[language] || 'English'

    const systemPrompt = `You are a brand voice strategist and tone-of-voice expert. Generate comprehensive brand voice guidelines based on a channel description. Respond ONLY with valid JSON.`

    const userPrompt = `Create detailed Vibe & Tone (brand voice) guidelines for this channel:

Channel Name: ${channelName}
Description: ${description}
Language: ${langLabel}

Respond with this exact JSON structure:
{
  "vibeTone": {
    "personality": "3-4 sentences describing the brand personality. Include specific traits, emotional tone, and how the brand should feel to the audience. Be detailed and actionable.",
    "writingStyle": "3-4 sentences about writing style. Cover: formality level, sentence structure preference, humor usage, storytelling approach, use of emojis, punctuation style. Be specific.",
    "vocabulary": "3-4 sentences about vocabulary. Include: preferred words/phrases, words to avoid, technical level, industry jargon usage, tone markers. Give concrete examples.",
    "targetAudience": "3-4 sentences about target audience. Cover: demographics (age, gender, location), psychographics (interests, values, lifestyle), pain points, content consumption habits.",
    "brandValues": "3-4 sentences about brand values. Include: core mission, key differentiators, brand promise, emotional benefits, trust factors."
  }
}

Requirements:
- All content must be in ${langLabel}
- Be specific and actionable, not generic
- Include concrete examples where possible
- Each field should be detailed enough to guide content creation
- Reflect the unique identity of this specific brand`

    try {
        const result = await callAI(provider, apiKey, model, systemPrompt, userPrompt)

        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)

        // Track usage
        if (adminIntegrationId) {
            const ownerId = ownerKey.ownerId ?? session.user.id
            await Promise.all([
                prisma.apiIntegration.update({
                    where: { id: adminIntegrationId },
                    data: { usageCount: { increment: 1 } },
                }),
                incrementTextUsage(ownerId, usingByok),
            ])
        }

        return NextResponse.json({ vibeTone: parsed.vibeTone })
    } catch (error) {
        console.error('AI Vibe & Tone error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate Vibe & Tone' },
            { status: 500 }
        )
    }
}
