import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/channels/[id]/members/[memberId] — update role + permissions
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const body = await req.json()
    const { role, permissions } = body

    // Update role if provided
    if (role) {
        await prisma.channelMember.update({
            where: { id: memberId },
            data: { role },
        })
    }

    // Update permissions if provided
    if (permissions) {
        await prisma.channelPermission.upsert({
            where: { channelMemberId: memberId },
            update: {
                canCreatePost: permissions.canCreatePost ?? true,
                canEditPost: permissions.canEditPost ?? true,
                canDeletePost: permissions.canDeletePost ?? false,
                canApprovePost: permissions.canApprovePost ?? false,
                canSchedulePost: permissions.canSchedulePost ?? true,
                canUploadMedia: permissions.canUploadMedia ?? true,
                canDeleteMedia: permissions.canDeleteMedia ?? false,
                canViewMedia: permissions.canViewMedia ?? true,
                canCreateEmail: permissions.canCreateEmail ?? false,
                canManageContacts: permissions.canManageContacts ?? false,
                canViewReports: permissions.canViewReports ?? true,
                canEditSettings: permissions.canEditSettings ?? false,
            },
            create: {
                channelMemberId: memberId,
                canCreatePost: permissions.canCreatePost ?? true,
                canEditPost: permissions.canEditPost ?? true,
                canDeletePost: permissions.canDeletePost ?? false,
                canApprovePost: permissions.canApprovePost ?? false,
                canSchedulePost: permissions.canSchedulePost ?? true,
                canUploadMedia: permissions.canUploadMedia ?? true,
                canDeleteMedia: permissions.canDeleteMedia ?? false,
                canViewMedia: permissions.canViewMedia ?? true,
                canCreateEmail: permissions.canCreateEmail ?? false,
                canManageContacts: permissions.canManageContacts ?? false,
                canViewReports: permissions.canViewReports ?? true,
                canEditSettings: permissions.canEditSettings ?? false,
            },
        })
    }

    // Return updated member
    const member = await prisma.channelMember.findUnique({
        where: { id: memberId },
        include: {
            user: { select: { id: true, email: true, name: true, image: true, role: true, isActive: true } },
            permission: true,
        },
    })

    return NextResponse.json(member)
}
