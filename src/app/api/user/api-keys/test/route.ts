import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// POST /api/user/api-keys/test — test user's API key for a provider
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await req.json()
    if (!provider) {
        return NextResponse.json({ error: 'Provider required' }, { status: 400 })
    }

    // Get user's key
    const userKey = await prisma.userApiKey.findFirst({
        where: { userId: session.user.id, provider },
    })

    if (!userKey) {
        return NextResponse.json({ success: false, message: 'No API key saved for this provider' })
    }

    const apiKey = decrypt(userKey.apiKeyEncrypted)

    try {
        let result: { success: boolean; message: string }

        switch (provider) {
            case 'openai':
                result = await testOpenAI(apiKey)
                break
            case 'gemini':
                result = await testGemini(apiKey)
                break
            case 'openrouter':
                result = await testOpenRouter(apiKey)
                break
            case 'anthropic':
                result = await testAnthropic(apiKey)
                break
            case 'runware':
                result = await testRunware(apiKey)
                break
            case 'synthetic':
                result = await testSynthetic(apiKey)
                break
            default:
                result = { success: true, message: `${provider} — API key configured` }
        }

        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed',
        })
    }
}

async function testOpenAI(apiKey: string) {
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) {
        const data = await res.json()
        return { success: true, message: `OpenAI connected — ${data.data?.length || 0} models available` }
    }
    const error = await res.json().catch(() => ({}))
    return { success: false, message: error?.error?.message || `OpenAI error: ${res.status}` }
}

async function testGemini(apiKey: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (res.ok) {
        const data = await res.json()
        return { success: true, message: `Gemini connected — ${data.models?.length || 0} models available` }
    }
    const error = await res.json().catch(() => ({}))
    return { success: false, message: error?.error?.message || `Gemini error: ${res.status}` }
}

async function testOpenRouter(apiKey: string) {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) {
        const data = await res.json()
        return { success: true, message: `OpenRouter connected — ${data.data?.length || 0} models available` }
    }
    return { success: false, message: `OpenRouter error: ${res.status}` }
}

async function testAnthropic(apiKey: string) {
    const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
    })
    if (res.ok) {
        return { success: true, message: 'Anthropic connected — API key valid' }
    }
    const error = await res.json().catch(() => ({}))
    return { success: false, message: error?.error?.message || `Anthropic error: ${res.status}` }
}

async function testRunware(apiKey: string) {
    const res = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify([{ taskType: 'authentication', apiKey }]),
    })
    if (res.ok) return { success: true, message: 'Runware connection successful' }
    return { success: false, message: `Runware error: ${res.status}` }
}

async function testSynthetic(apiKey: string) {
    const res = await fetch('https://api.synthetic.new/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { success: true, message: 'Synthetic connected — API key valid' }
    return { success: false, message: `Synthetic error: ${res.status}` }
}
