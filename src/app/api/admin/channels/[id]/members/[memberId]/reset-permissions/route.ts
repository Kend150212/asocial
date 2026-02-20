import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getDefaultPermissions(role: string) {
    if (role === 'OWNER' || role === 'ADMIN') {
        return {
            canCreatePost: true, canEditPost: true, canDeletePost: true,
            canApprovePost: true, canSchedulePost: true, canUploadMedia: true,
            canDeleteMedia: true, canViewMedia: true, canCreateEmail: true,
            canManageContacts: true, canViewReports: true, canEditSettings: true,
        }
    }
    if (role === 'MANAGER') {
        return {
            canCreatePost: true, canEditPost: true, canDeletePost: true,
            canApprovePost: true, canSchedulePost: true, canUploadMedia: true,
            canDeleteMedia: false, canViewMedia: true, canCreateEmail: true,
            canManageContacts: true, canViewReports: true, canEditSettings: true,
        }
    }
    // STAFF
    return {
        canCreatePost: true, canEditPost: true, canDeletePost: false,
        canApprovePost: false, canSchedulePost: true, canUploadMedia: true,
        canDeleteMedia: false, canViewMedia: true, canCreateEmail: false,
        canManageContacts: false, canViewReports: true, canEditSettings: false,
    }
}

// POST /api/admin/channels/[id]/members/[memberId]/reset-permissions
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params

    // Get the member's current role
    const member = await prisma.channelMember.findUnique({
        where: { id: memberId },
        select: { role: true },
    })

    if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const defaults = getDefaultPermissions(member.role)

    await prisma.channelPermission.upsert({
        where: { channelMemberId: memberId },
        update: defaults,
        create: { channelMemberId: memberId, ...defaults },
    })

    const updated = await prisma.channelMember.findUnique({
        where: { id: memberId },
        include: {
            user: { select: { id: true, email: true, name: true, image: true, role: true, isActive: true } },
            permission: true,
        },
    })

    return NextResponse.json(updated)
}
