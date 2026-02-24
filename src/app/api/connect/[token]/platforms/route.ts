import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/connect/[token]/platforms
// Public endpoint — returns connected platforms for the channel linked to this token.
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    const link = await prisma.easyConnectLink.findUnique({
        where: { token },
        select: { channelId: true, isEnabled: true, expiresAt: true },
    })

    if (!link || !link.isEnabled) {
        return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 410 })
    }

    const platforms = await prisma.channelPlatform.findMany({
        where: { channelId: link.channelId },
        select: {
            id: true,
            platform: true,
            accountName: true,
            accountId: true,
            isActive: true,
        },
        orderBy: [{ platform: 'asc' }, { accountName: 'asc' }],
    })

    return NextResponse.json(platforms)
}
