import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/integrations/[id]/canva-disconnect — Remove Canva OAuth tokens
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const integration = await prisma.apiIntegration.findUnique({ where: { id } })
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Remove Canva token fields from config
    const config = (integration.config || {}) as Record<string, unknown>
    delete config.canvaAccessToken
    delete config.canvaRefreshToken
    delete config.canvaUserName
    delete config.canvaConnectedAt
    delete config.canvaConnectedBy

    await prisma.apiIntegration.update({
        where: { id },
        data: { config: config as Record<string, string> },
    })

    return NextResponse.json({ success: true })
}
