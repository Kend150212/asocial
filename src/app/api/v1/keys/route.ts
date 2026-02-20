import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/api-auth'

/**
 * GET /api/v1/keys — List user's API keys
 */
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const keys = await prisma.appApiKey.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            scopes: true,
            isActive: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: keys })
}

/**
 * POST /api/v1/keys — Create a new API key
 * Body: { name: string, expiresAt?: string }
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const name = body.name || 'My API Key'

    // Limit: max 10 keys per user
    const count = await prisma.appApiKey.count({ where: { userId: session.user.id } })
    if (count >= 10) {
        return NextResponse.json(
            { success: false, error: { code: 'MAX_KEYS', message: 'Maximum 10 API keys per account' } },
            { status: 400 },
        )
    }

    const { rawKey, keyHash, keyPrefix } = await generateApiKey()

    const key = await prisma.appApiKey.create({
        data: {
            userId: session.user.id,
            name,
            keyHash,
            keyPrefix,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            createdAt: true,
        },
    })

    // rawKey is shown ONCE — never stored in plain text
    return NextResponse.json({
        success: true,
        data: { ...key, apiKey: rawKey },
        message: '⚠️ Save this API key now — it will not be shown again.',
    })
}

/**
 * DELETE /api/v1/keys — Revoke a key
 * Body: { keyId: string }
 */
export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { keyId } = await req.json()
    if (!keyId) return NextResponse.json({ error: 'keyId required' }, { status: 400 })

    // Verify ownership
    const key = await prisma.appApiKey.findFirst({
        where: { id: keyId, userId: session.user.id },
    })
    if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 })

    await prisma.appApiKey.update({
        where: { id: keyId },
        data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'API key revoked' })
}
