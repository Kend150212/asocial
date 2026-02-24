import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/connect/[token]
// Public endpoint — no auth required. Returns link+channel info for the connect page.
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    const link = await prisma.easyConnectLink.findUnique({
        where: { token },
        include: {
            channel: {
                select: { id: true, displayName: true, description: true },
            },
        },
    })

    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    if (!link.isEnabled) return NextResponse.json({ error: 'This link has been disabled' }, { status: 403 })
    if (link.expiresAt && link.expiresAt < new Date()) {
        return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    return NextResponse.json({
        channelId: link.channelId,
        channelName: link.channel.displayName,
        channelDescription: link.channel.description,
        title: link.title,
        hasPassword: !!link.passwordHash,
    })
}
