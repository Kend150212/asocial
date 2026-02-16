import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id] — single channel with all relations
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const channel = await prisma.channel.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    permission: true,
                },
            },
            platforms: true,
            knowledgeBase: { orderBy: { createdAt: 'desc' } },
            contentTemplates: { orderBy: { createdAt: 'desc' } },
            hashtagGroups: { orderBy: { name: 'asc' } },
            integrationOverrides: true,
            _count: { select: { posts: true, mediaItems: true } },
        },
    })

    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json(channel)
}

// PUT /api/admin/channels/[id] — update channel settings
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.channel.findUnique({ where: { id } })
    if (!existing) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Build update data — only update fields that are provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    const allowedFields = [
        'displayName', 'description', 'isActive', 'language',
        'descriptionsPerPlatform', 'vibeTone', 'seoTags',
        'colorPalette', 'logoPrompts', 'bannerPrompts',
        'notificationEmail', 'requireApproval',
        'storageProvider', 'storageConfig', 'useDefaultStorage',
        'webhookDiscord', 'webhookTelegram', 'webhookSlack',
        'webhookCustom', 'webhookEvents',
    ]

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updateData[field] = body[field]
        }
    }

    const channel = await prisma.channel.update({
        where: { id },
        data: updateData,
        include: {
            platforms: true,
            _count: { select: { members: true, posts: true, knowledgeBase: true } },
        },
    })

    return NextResponse.json(channel)
}

// DELETE /api/admin/channels/[id] — delete channel
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.channel.findUnique({ where: { id } })
    if (!existing) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    await prisma.channel.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
