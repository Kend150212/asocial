import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/integrations/[id]/canva-disconnect — Remove ALL Canva OAuth tokens
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const integration = await prisma.apiIntegration.findUnique({ where: { id } })
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Remove ALL per-user Canva token fields from config
    const config = (integration.config || {}) as Record<string, string>
    const cleanedConfig: Record<string, string> = {}
    for (const [key, value] of Object.entries(config)) {
        if (key.startsWith('canvaToken_') || key.startsWith('canvaRefresh_') ||
            key.startsWith('canvaUser_') || key.startsWith('canvaConnectedAt_')) {
            continue // skip canva per-user keys
        }
        // Also remove old global keys if they exist
        if (['canvaAccessToken', 'canvaRefreshToken', 'canvaUserName', 'canvaConnectedAt', 'canvaConnectedBy'].includes(key)) {
            continue
        }
        cleanedConfig[key] = value
    }

    await prisma.apiIntegration.update({
        where: { id },
        data: { config: cleanedConfig },
    })

    return NextResponse.json({ success: true })
}
