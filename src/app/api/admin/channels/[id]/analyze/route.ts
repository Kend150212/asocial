import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { callAI, getDefaultModel } from '@/lib/ai-caller'
import { getChannelOwnerKey } from '@/lib/channel-owner-key'
import { checkTextQuota, incrementTextUsage } from '@/lib/ai-quota'

// POST /api/admin/channels/[id]/analyze — AI analysis of channel
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

    const langLabel = language === 'vi' ? 'Vietnamese' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'zh' ? 'Chinese' : language === 'es' ? 'Spanish' : 'English'

    const systemPrompt = `You are a social media brand strategist. Analyze the following channel and generate comprehensive branding and content settings. Respond ONLY with valid JSON, no markdown, no explanation.`

    const userPrompt = `Analyze this social media channel and generate settings:

Channel Name: ${channelName}
Description: ${description}
Language: ${langLabel}

Generate a JSON response with this exact structure:
{
  "vibeTone": {
    "personality": "2-3 sentences describing the brand personality",
    "writingStyle": "2-3 sentences about writing style (formal/casual, humor level, etc)",
    "vocabulary": "Key words and phrases the brand uses, vocabulary level",
    "targetAudience": "Who is the target audience, demographics, interests",
    "brandValues": "Core values and mission of the brand"
  },
  "knowledgeBase": [
    {
      "title": "entry title",
      "content": "detailed content about this topic, 2-4 sentences"
    }
  ],
  "contentTemplates": [
    {
      "name": "template name",
      "templateContent": "Template with {{variable}} placeholders for dynamic content"
    }
  ],
  "hashtagGroups": [
    {
      "name": "group name",
      "hashtags": ["#tag1", "#tag2", "#tag3"]
    }
  ]
}

Requirements:
- Generate 3-5 knowledge base entries about the brand, products, industry
- Generate 3-4 content templates for different post types (promotional, educational, engagement, announcement)
- Generate 2-3 hashtag groups (brand, industry, trending) with 5-8 hashtags each
- All content should be in ${langLabel}
- Templates should use {{variable}} syntax for dynamic parts
- Hashtags should be relevant and commonly used`

    try {
        const result = await callAI(provider, apiKey, model, systemPrompt, userPrompt)

        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const analysis = JSON.parse(cleaned)

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

        return NextResponse.json(analysis)
    } catch (error) {
        console.error('AI Analysis error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'AI analysis failed' },
            { status: 500 }
        )
    }
}
