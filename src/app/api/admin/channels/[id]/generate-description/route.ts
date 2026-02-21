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
    const {
        channelName, shortDescription, language,
        targetAudience, contentTypes, brandValues, communicationStyle,
        provider: requestedProvider, model: requestedModel,
    } = body

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

    const systemPrompt = `You are a world-class brand copywriter, SEO expert, and social media strategist. You write channel/brand descriptions that are compelling, keyword-rich, and convert visitors into followers and customers. Your descriptions feel human, specific, and powerful — NEVER generic or robotic. Respond ONLY with valid JSON.`

    const userPrompt = `Write a PREMIUM, highly compelling brand/channel description for:

Brand Name: ${channelName}
Brand Info: ${shortDescription}
Language: ${langLabel}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${contentTypes ? `Content Types: ${contentTypes}` : ''}
${brandValues ? `Core Brand Values: ${brandValues}` : ''}
${communicationStyle ? `Communication Style: ${communicationStyle}` : ''}

Respond with this exact JSON structure:
{
  "description": "The full channel/brand description with \\n for line breaks"
}

Write the description with this EXACT structure (use \\n between sections):

**Section 1 — Brand Story Hook (2-3 lines):**
Start with a bold, emotionally resonant opening that tells the brand's story or addresses the audience's pain point. Use vivid, specific language. Do NOT start with generic phrases like "Welcome to..." or "Stop juggling...". Instead, open with something unique to THIS specific brand — a mission statement, a provocative question, or a bold claim.

**Section 2 — What We Do & Why It Matters (3-4 lines):**
Describe what the brand does in a way that highlights TRANSFORMATION — what changes for the customer/follower? Be specific about outcomes, not just features. Use concrete details, numbers, or scenarios when possible.

**Section 3 — Content/Service Categories (4-6 bullet points):**
Use emoji bullets (✅, 🎯, 💡, 🔥, 📊, etc.) to list specific content pillars, services, or product categories. Each bullet should be descriptive (not just 2-3 words) — explain the VALUE of each item briefly.

**Section 4 — Who Is This For? (2-3 lines):**
Speak DIRECTLY to the target audience. Use "you" language. Make them feel like this channel was built specifically for them. Mention their goals, challenges, or aspirations.

**Section 5 — Trust & Credibility (1-2 lines):**
Include social proof, credentials, experience, or community size. If no specific data is available, focus on the brand's commitment, methodology, or unique approach.

**Section 6 — Call to Action (2-3 lines):**
Strong CTA with urgency or emotion. Use emojis like 🔔 👉 ⭐ 🚀. Encourage subscribing, following, or engaging. Include a secondary CTA (enable notifications, share with a friend, etc.)

**Section 7 — Contact & Links (1-2 lines):**
Professional sign-off with contact email/inquiry info.

**Section 8 — Hashtags (1 line):**
5-8 SEO-optimized hashtags that are specific to the niche (avoid ultra-generic ones like #content #social).

CRITICAL RULES:
- Write ENTIRELY in ${langLabel}
- NEVER use generic filler phrases. Every sentence must be SPECIFIC to this brand.
- Use line breaks (\\n) between sections for clean formatting
- Use emojis strategically for visual hierarchy — not excessively
- Include SEO keywords naturally throughout (think about what people would search for)
- The description should be 15-25 lines total (not too short, not too long)
- Sound like a premium brand, not a student project
- Write with CONFIDENCE and AUTHORITY
- Avoid: "Welcome to...", "We are a...", "Our mission is...", clichés
- Instead: tell a story, paint a picture, make a promise`

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
