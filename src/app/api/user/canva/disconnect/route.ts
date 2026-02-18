import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/user/canva/disconnect — Disconnect current user's Canva account
export async function POST() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })

    if (!integration) {
        return NextResponse.json({ error: 'Canva integration not found' }, { status: 404 })
    }

    // Remove only THIS user's Canva tokens from config
    const config = (integration.config || {}) as Record<string, string>
    const keysToRemove = [
        `canvaToken_${userId}`,
        `canvaRefresh_${userId}`,
        `canvaUser_${userId}`,
        `canvaConnectedAt_${userId}`,
    ]

    const cleanedConfig: Record<string, string> = {}
    for (const [key, value] of Object.entries(config)) {
        if (!keysToRemove.includes(key)) {
            cleanedConfig[key] = value
        }
    }

    await prisma.apiIntegration.update({
        where: { id: integration.id },
        data: { config: cleanedConfig },
    })

    return NextResponse.json({ success: true })
}
