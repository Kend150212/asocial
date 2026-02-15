import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption'

// GET /api/admin/integrations — list all integrations
export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await prisma.apiIntegration.findMany({
        orderBy: [{ category: 'asc' }, { provider: 'asc' }],
    })

    // Mask API keys for display
    const safe = integrations.map((i) => ({
        ...i,
        apiKeyEncrypted: undefined,
        hasApiKey: !!i.apiKeyEncrypted,
        apiKeyMasked: i.apiKeyEncrypted ? maskApiKey(decrypt(i.apiKeyEncrypted)) : null,
    }))

    return NextResponse.json(safe)
}

// PUT /api/admin/integrations — update integration
export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, apiKey, isActive, config, defaultTextModel, defaultImageModel, defaultVideoModel } = body

    if (!id) {
        return NextResponse.json({ error: 'Missing integration id' }, { status: 400 })
    }

    const integration = await prisma.apiIntegration.findUnique({ where: { id } })
    if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (apiKey !== undefined) {
        updateData.apiKeyEncrypted = apiKey ? encrypt(apiKey) : null
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive
        updateData.status = isActive ? 'ACTIVE' : 'INACTIVE'
    }

    if (config !== undefined) {
        updateData.config = config
    }

    // Store default models in config
    if (defaultTextModel || defaultImageModel || defaultVideoModel) {
        const existingConfig = (integration.config as Record<string, unknown>) || {}
        updateData.config = {
            ...existingConfig,
            ...(defaultTextModel !== undefined && { defaultTextModel }),
            ...(defaultImageModel !== undefined && { defaultImageModel }),
            ...(defaultVideoModel !== undefined && { defaultVideoModel }),
        }
    }

    const updated = await prisma.apiIntegration.update({
        where: { id },
        data: updateData,
    })

    return NextResponse.json({
        ...updated,
        apiKeyEncrypted: undefined,
        hasApiKey: !!updated.apiKeyEncrypted,
        apiKeyMasked: updated.apiKeyEncrypted ? maskApiKey(decrypt(updated.apiKeyEncrypted)) : null,
    })
}
