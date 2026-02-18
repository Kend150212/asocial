import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

// GET /api/user/api-keys — list user's API keys
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await prisma.userApiKey.findMany({
        where: { userId: session.user.id },
        orderBy: { provider: 'asc' },
        select: {
            id: true,
            provider: true,
            name: true,
            defaultModel: true,
            isDefault: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    return NextResponse.json(keys)
}

// POST /api/user/api-keys — add or update a provider key
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider, name, apiKey, defaultModel } = body

    if (!provider || !apiKey) {
        return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 })
    }

    const encrypted = encrypt(apiKey.trim())

    // Upsert — one key per provider per user
    const key = await prisma.userApiKey.upsert({
        where: {
            userId_provider: {
                userId: session.user.id,
                provider,
            },
        },
        update: {
            name: name || provider,
            apiKeyEncrypted: encrypted,
            defaultModel: defaultModel || null,
            isActive: true,
        },
        create: {
            userId: session.user.id,
            provider,
            name: name || provider,
            apiKeyEncrypted: encrypted,
            defaultModel: defaultModel || null,
        },
    })

    return NextResponse.json({
        id: key.id,
        provider: key.provider,
        name: key.name,
        defaultModel: key.defaultModel,
        isDefault: key.isDefault,
        isActive: key.isActive,
    })
}

// PATCH /api/user/api-keys — update default provider or model (without changing key)
export async function PATCH(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider, defaultModel, isDefault } = body

    if (!provider) {
        return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const existing = await prisma.userApiKey.findUnique({
        where: { userId_provider: { userId: session.user.id, provider } },
    })

    if (!existing) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    // If setting as default, unset all others first
    if (isDefault === true) {
        await prisma.userApiKey.updateMany({
            where: { userId: session.user.id, isDefault: true },
            data: { isDefault: false },
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (defaultModel !== undefined) updateData.defaultModel = defaultModel || null
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const key = await prisma.userApiKey.update({
        where: { id: existing.id },
        data: updateData,
    })

    return NextResponse.json({
        id: key.id,
        provider: key.provider,
        name: key.name,
        defaultModel: key.defaultModel,
        isDefault: key.isDefault,
        isActive: key.isActive,
    })
}

// DELETE /api/user/api-keys — delete a key by provider
export async function DELETE(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')

    if (!provider) {
        return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    await prisma.userApiKey.deleteMany({
        where: {
            userId: session.user.id,
            provider,
        },
    })

    return NextResponse.json({ success: true })
}
