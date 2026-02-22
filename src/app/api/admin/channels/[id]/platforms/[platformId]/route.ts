import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/channels/[id]/platforms/[platformId] — update platform config (e.g. botEnabled)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; platformId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, platformId } = await params
    const body = await req.json()

    // Fetch existing platform
    const platform = await prisma.channelPlatform.findUnique({
        where: { id: platformId },
    })

    if (!platform || platform.channelId !== id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Merge config
    const existingConfig = (platform.config as Record<string, unknown>) || {}
    const updatedConfig = { ...existingConfig }

    if ('botEnabled' in body) {
        updatedConfig.botEnabled = body.botEnabled
    }

    const updated = await prisma.channelPlatform.update({
        where: { id: platformId },
        data: { config: updatedConfig as any },
    })

    return NextResponse.json(updated)
}
