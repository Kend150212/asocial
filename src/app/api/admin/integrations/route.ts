import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
    const safe = integrations.map((i) => {
        const config = (i.config as Record<string, unknown>) || {}
        // Mask R2 secret key in config for display
        const safeConfig = { ...config }
        if (safeConfig.r2SecretAccessKey && typeof safeConfig.r2SecretAccessKey === 'string') {
            safeConfig.r2HasSecret = true
            safeConfig.r2SecretAccessKey = undefined // Don't expose encrypted value
        }
        return {
            ...i,
            config: safeConfig,
            apiKeyEncrypted: undefined,
            hasApiKey: !!i.apiKeyEncrypted,
            apiKeyMasked: i.apiKeyEncrypted ? maskApiKey(decrypt(i.apiKeyEncrypted)) : null,
        }
    })

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
    const existingConfig = (integration.config as Record<string, unknown>) || {}

    // Only update API key if a non-empty value is explicitly provided
    if (apiKey && apiKey.trim() !== '') {
        updateData.apiKeyEncrypted = encrypt(apiKey)
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive
        updateData.status = isActive ? 'ACTIVE' : 'INACTIVE'
    }

    // Merge config — never overwrite existing config, always merge
    if (config !== undefined) {
        const mergedConfig = {
            ...existingConfig,
            ...config,
        }
        // Encrypt R2 Secret Access Key if present and non-empty
        if (config.r2SecretAccessKey && config.r2SecretAccessKey.trim() !== '') {
            mergedConfig.r2SecretAccessKey = encrypt(config.r2SecretAccessKey)
        } else {
            // Preserve existing encrypted secret if not provided
            if (existingConfig.r2SecretAccessKey) {
                mergedConfig.r2SecretAccessKey = existingConfig.r2SecretAccessKey
            }
        }
        updateData.config = mergedConfig
    }

    // Store default models in config (merge with existing)
    if (defaultTextModel || defaultImageModel || defaultVideoModel) {
        updateData.config = {
            ...existingConfig,
            ...(updateData.config || {}),
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
