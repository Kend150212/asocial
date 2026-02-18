import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/posts/[id] — single post with full relations
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            channel: {
                select: {
                    id: true,
                    displayName: true,
                    name: true,
                    language: true,
                    vibeTone: true,
                    defaultAiProvider: true,
                    defaultAiModel: true,
                    platforms: {
                        where: { isActive: true },
                        select: { id: true, platform: true, accountId: true, accountName: true },
                    },
                },
            },
            author: { select: { id: true, name: true, email: true } },
            media: {
                include: {
                    mediaItem: true,
                },
                orderBy: { sortOrder: 'asc' },
            },
            platformStatuses: true,
            approvals: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Access check for non-admin
    if (session.user.role !== 'ADMIN') {
        const member = await prisma.channelMember.findFirst({
            where: { channelId: post.channelId, userId: session.user.id },
        })
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    return NextResponse.json(post)
}

// PUT /api/admin/posts/[id] — update post
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
        content,
        contentPerPlatform,
        status,
        scheduledAt,
        mediaIds,
        platforms,
    } = body

    // Verify post exists
    const existing = await prisma.post.findUnique({
        where: { id },
        include: { channel: true },
    })
    if (!existing) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Access check
    if (session.user.role !== 'ADMIN' && existing.authorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot edit published posts (only allow re-scheduling failed ones)
    if (existing.status === 'PUBLISHED' || existing.status === 'PUBLISHING') {
        return NextResponse.json(
            { error: 'Cannot edit a published or publishing post' },
            { status: 400 }
        )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (contentPerPlatform !== undefined) updateData.contentPerPlatform = contentPerPlatform
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null

    if (status) {
        // If channel requires approval and moving from draft
        if (existing.channel.requireApproval && status !== 'DRAFT' && existing.status === 'DRAFT') {
            updateData.status = 'PENDING_APPROVAL'
        } else {
            updateData.status = status
        }
    }

    // Update content hash
    if (content) {
        updateData.contentHash = Buffer.from(content).toString('base64').slice(0, 32)
    }

    // Transaction: update post + media + platforms
    const post = await prisma.$transaction(async (tx) => {
        // Update media if provided
        if (mediaIds !== undefined) {
            await tx.postMedia.deleteMany({ where: { postId: id } })
            if (mediaIds.length > 0) {
                await tx.postMedia.createMany({
                    data: mediaIds.map((mediaItemId: string, index: number) => ({
                        postId: id,
                        mediaItemId,
                        sortOrder: index,
                    })),
                })
            }
        }

        // Update platform statuses if provided
        if (platforms !== undefined) {
            await tx.postPlatformStatus.deleteMany({ where: { postId: id } })
            if (platforms.length > 0) {
                await tx.postPlatformStatus.createMany({
                    data: platforms.map((p: { platform: string; accountId: string }) => ({
                        postId: id,
                        platform: p.platform,
                        accountId: p.accountId,
                        status: 'pending',
                    })),
                })
            }
        }

        return tx.post.update({
            where: { id },
            data: updateData,
            include: {
                channel: { select: { id: true, displayName: true, name: true } },
                author: { select: { id: true, name: true, email: true } },
                media: {
                    include: {
                        mediaItem: {
                            select: { id: true, url: true, thumbnailUrl: true, type: true, originalName: true },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                platformStatuses: true,
            },
        })
    })

    return NextResponse.json(post)
}

// DELETE /api/admin/posts/[id] — delete post
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only admin or author can delete
    if (session.user.role !== 'ADMIN' && post.authorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete related records first, then the post
    await prisma.$transaction([
        prisma.postMedia.deleteMany({ where: { postId: id } }),
        prisma.postPlatformStatus.deleteMany({ where: { postId: id } }),
        prisma.postApproval.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
}
