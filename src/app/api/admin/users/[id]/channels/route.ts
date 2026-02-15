import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ChannelAssignment {
    channelId: string
    role: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
    permissions: {
        canCreatePost: boolean
        canEditPost: boolean
        canDeletePost: boolean
        canApprovePost: boolean
        canSchedulePost: boolean
        canUploadMedia: boolean
        canDeleteMedia: boolean
        canViewMedia: boolean
        canCreateEmail: boolean
        canManageContacts: boolean
        canViewReports: boolean
        canEditSettings: boolean
    }
}

// PUT /api/admin/users/[id]/channels — bulk update channel assignments + permissions
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await req.json()
    const { channels } = body as { channels: ChannelAssignment[] }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current memberships
    const currentMembers = await prisma.channelMember.findMany({
        where: { userId },
        select: { id: true, channelId: true },
    })

    const newChannelIds = new Set(channels.map((c) => c.channelId))
    const toRemove = currentMembers.filter((m) => !newChannelIds.has(m.channelId))

    // Remove unassigned channels
    if (toRemove.length > 0) {
        await prisma.channelMember.deleteMany({
            where: { id: { in: toRemove.map((m) => m.id) } },
        })
    }

    // Upsert each channel assignment + permissions
    for (const ch of channels) {
        const member = await prisma.channelMember.upsert({
            where: {
                userId_channelId: { userId, channelId: ch.channelId },
            },
            create: {
                userId,
                channelId: ch.channelId,
                role: ch.role,
            },
            update: {
                role: ch.role,
            },
        })

        // Upsert permissions
        await prisma.channelPermission.upsert({
            where: { channelMemberId: member.id },
            create: {
                channelMemberId: member.id,
                ...ch.permissions,
            },
            update: ch.permissions,
        })
    }

    // Return updated user with channels
    const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            channelMembers: {
                include: {
                    channel: { select: { id: true, name: true, displayName: true } },
                    permission: true,
                },
            },
        },
    })

    return NextResponse.json(updated)
}
