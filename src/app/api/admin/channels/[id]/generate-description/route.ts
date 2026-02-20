import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'
import { checkTextQuota, incrementTextUsage } from '@/lib/ai-quota'

// POST /api/admin/channels/[id]/generate-description — Generate YouTube-style SEO description
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
    const { channelName, shortDescription, language, provider: requestedProvider, model: requestedModel } = body

    if (!channelName || !shortDescription) {
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

    const systemPrompt = `You are a world-class YouTube SEO expert and social media copywriter. You write channel descriptions that rank high in search results and convert viewers into subscribers. Respond ONLY with valid JSON.`

    const userPrompt = `Write a professional YouTube-style SEO channel description for this brand:

Channel Name: ${channelName}
Brand Info: ${shortDescription}
Language: ${langLabel}

Respond with this exact JSON structure:
{
  "description": "The full channel description"
}

Write the description as a PROFESSIONAL YouTube channel "About" section with this exact format:
1. **Opening Hook** (1-2 lines): A bold, compelling opening that grabs attention and clearly states what the channel/brand offers
2. **Value Proposition** (2-3 lines): What makes this brand unique? What will viewers/followers gain?
3. **Content/Service Overview** (2-3 lines): Key services, products, or content categories with bullet-style formatting using ✅ or 📌 emoji
4. **Social Proof / Stats** (1 line): Any credibility indicators (years in business, customers served, etc.)
5. **Call to Action** (1-2 lines): Subscribe/follow CTA with emoji like 🔔 or 👉
6. **Contact / Links** (1 line): Professional sign-off with contact info placeholder

Rules:
- Write ENTIRELY in ${langLabel}
- Use emojis strategically (not excessively) for visual breaks
- Include relevant SEO keywords naturally
- Use line breaks (\\n) for readability — this should look like a real YouTube description, NOT a paragraph
- Make it 8-15 lines total
- Sound authentic and professional, NOT generic or robotic
- Include hashtags at the end if relevant`

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

        return NextResponse.json({ description: parsed.description })
    } catch (error) {
        console.error('AI Description error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate description' },
            { status: 500 }
        )
    }
}
