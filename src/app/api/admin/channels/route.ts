import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels — list channels (admin: all, others: assigned only)
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'ADMIN'

    const channels = await prisma.channel.findMany({
        where: isAdmin ? {} : {
            members: { some: { userId: session.user.id, role: { notIn: ['CUSTOMER'] } } },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { members: true, posts: true, knowledgeBase: true, platforms: true } },
            platforms: {
                select: { id: true, platform: true, accountId: true, accountName: true, isActive: true },
            },
            members: {
                where: { role: 'ADMIN' },
                take: 1,
                include: {
                    user: { select: { name: true, email: true } },
                },
            },
        },
    })

    return NextResponse.json(channels)
}

// POST /api/admin/channels — create a new channel
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, displayName, language, description, defaultAiProvider, vibeTone } = body

    // Only ADMIN and OWNER can create channels
    const canCreateChannel = session.user.role === 'ADMIN' || session.user.role === 'OWNER'
    if (!canCreateChannel) {
        return NextResponse.json({ error: 'Only Admins and Owners can create channels' }, { status: 403 })
    }

    if (!name || !displayName) {
        return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    // Check unique name
    const existing = await prisma.channel.findUnique({ where: { name } })
    if (existing) {
        return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 409 })
    }

    const isAdmin = session.user.role === 'ADMIN'

    const channel = await prisma.channel.create({
        data: {
            name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            displayName,
            language: language || 'en',
            ...(description && { description }),
            ...(defaultAiProvider && { defaultAiProvider }),
            ...(vibeTone && { vibeTone }),
            // Auto-assign creator as member (non-admin)
            ...(!isAdmin ? {
                members: {
                    create: {
                        userId: session.user.id,
                        role: session.user.role || 'MANAGER',
                        permission: {
                            create: {
                                canCreatePost: true,
                                canEditPost: true,
                                canDeletePost: true,
                                canApprovePost: true,
                                canSchedulePost: true,
                                canUploadMedia: true,
                                canDeleteMedia: true,
                                canViewMedia: true,
                                canCreateEmail: true,
                                canManageContacts: true,
                                canViewReports: true,
                                canEditSettings: true,
                            },
                        },
                    },
                },
            } : {}),
        },
        include: {
            _count: { select: { members: true, posts: true, knowledgeBase: true, platforms: true } },
            platforms: {
                select: { id: true, platform: true, accountId: true, accountName: true, isActive: true },
            },
        },
    })

    return NextResponse.json(channel, { status: 201 })
}

