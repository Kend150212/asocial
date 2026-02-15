import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

interface ModelInfo {
    id: string
    name: string
    type: 'text' | 'image' | 'video' | 'audio' | 'embedding' | 'other'
    description?: string
}

// POST /api/admin/integrations/models — fetch available models for a provider
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()

    const integration = await prisma.apiIntegration.findUnique({ where: { id } })
    if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    if (!integration.apiKeyEncrypted) {
        return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    const apiKey = decrypt(integration.apiKeyEncrypted)

    try {
        let models: ModelInfo[] = []

        switch (integration.provider) {
            case 'openai':
                models = await fetchOpenAIModels(apiKey)
                break
            case 'gemini':
                models = await fetchGeminiModels(apiKey)
                break
            case 'runware':
                models = getRunwareModels()
                break
            default:
                return NextResponse.json({ models: [], message: 'Model listing not supported for this provider' })
        }

        return NextResponse.json({ models })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 }
        )
    }
}

function classifyOpenAIModel(id: string): ModelInfo['type'] {
    if (id.includes('dall-e') || id.includes('image')) return 'image'
    if (id.includes('sora') || id.includes('video')) return 'video'
    if (id.includes('tts') || id.includes('whisper') || id.includes('audio')) return 'audio'
    if (id.includes('embedding')) return 'embedding'
    if (
        id.includes('gpt') ||
        id.includes('o1') ||
        id.includes('o3') ||
        id.includes('o4') ||
        id.includes('chatgpt')
    )
        return 'text'
    return 'other'
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status}`)
    }

    const data = await res.json()

    const models: ModelInfo[] = (data.data || [])
        .map((m: { id: string; owned_by?: string }) => ({
            id: m.id,
            name: m.id,
            type: classifyOpenAIModel(m.id),
            description: `by ${m.owned_by || 'openai'}`,
        }))
        .filter((m: ModelInfo) => ['text', 'image', 'video'].includes(m.type))
        .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id))

    return models
}

async function fetchGeminiModels(apiKey: string): Promise<ModelInfo[]> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`)
    }

    const data = await res.json()

    const models: ModelInfo[] = (data.models || [])
        .map((m: { name: string; displayName?: string; description?: string; supportedGenerationMethods?: string[] }) => {
            const id = m.name.replace('models/', '')
            let type: ModelInfo['type'] = 'text'

            if (id.includes('imagen') || id.includes('image')) type = 'image'
            else if (id.includes('veo') || id.includes('video')) type = 'video'
            else if (id.includes('embedding')) type = 'embedding'

            return {
                id,
                name: m.displayName || id,
                type,
                description: m.description?.slice(0, 100),
            }
        })
        .filter((m: ModelInfo) => ['text', 'image', 'video'].includes(m.type))

    return models
}

function getRunwareModels(): ModelInfo[] {
    // Runware models are predefined — they support hundreds of image models
    // We list the main architecture categories
    return [
        { id: 'runware:100@1', name: 'FLUX.1 [Dev]', type: 'image', description: 'Black Forest Labs — high quality' },
        { id: 'runware:101@1', name: 'FLUX.1 [Schnell]', type: 'image', description: 'Black Forest Labs — fast' },
        { id: 'civitai:133005@1', name: 'Juggernaut XL', type: 'image', description: 'SDXL architecture — photorealistic' },
        { id: 'civitai:101055@1', name: 'DreamShaper XL', type: 'image', description: 'SDXL architecture — versatile' },
        { id: 'runware:5@1', name: 'Stable Diffusion XL', type: 'image', description: 'Stability AI base model' },
        { id: 'runware:2@1', name: 'Stable Diffusion 1.5', type: 'image', description: 'Classic SD — lightweight' },
        { id: 'runware:6@1', name: 'DALL-E 3 via Runware', type: 'image', description: 'OpenAI DALL-E 3' },
        { id: 'runware:7@1', name: 'Ideogram 2.0', type: 'image', description: 'Ideogram — text rendering' },
        { id: 'kling:video-1.6-standard', name: 'Kling Video 1.6', type: 'video', description: 'Kling — video generation' },
        { id: 'minimax:video-01', name: 'Minimax Hailuo', type: 'video', description: 'Minimax — video generation' },
    ]
}
