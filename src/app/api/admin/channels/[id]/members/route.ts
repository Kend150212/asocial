import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id]/members — list channel members with permissions
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const members = await prisma.channelMember.findMany({
        where: { channelId: id },
        include: {
            user: { select: { id: true, email: true, name: true, image: true, role: true, isActive: true } },
            permission: true,
        },
        orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json(members)
}

// POST /api/admin/channels/[id]/members — add a member to channel
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { userId, role } = body

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if already a member
    const existing = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId: id } },
    })
    if (existing) {
        return NextResponse.json({ error: 'User is already a member of this channel' }, { status: 409 })
    }

    // Create member with default permissions
    const member = await prisma.channelMember.create({
        data: {
            userId,
            channelId: id,
            role: role || 'MANAGER',
            permission: {
                create: {
                    canCreatePost: true,
                    canEditPost: true,
                    canDeletePost: false,
                    canApprovePost: false,
                    canSchedulePost: true,
                    canUploadMedia: true,
                    canDeleteMedia: false,
                    canViewMedia: true,
                    canCreateEmail: false,
                    canManageContacts: false,
                    canViewReports: true,
                    canEditSettings: false,
                },
            },
        },
        include: {
            user: { select: { id: true, email: true, name: true, image: true, role: true, isActive: true } },
            permission: true,
        },
    })

    return NextResponse.json(member, { status: 201 })
}

// DELETE /api/admin/channels/[id]/members — remove a member
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
        return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    await prisma.channelMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true })
}
