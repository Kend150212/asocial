import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inbox/comments
 * Query params: channelId, status, platform, platformAccountId, postId, search, page, limit
 */
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const platformAccountId = searchParams.get('platformAccountId')
    const postId = searchParams.get('postId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (channelId) {
        where.channelId = channelId
    } else {
        const memberships = await prisma.channelMember.findMany({
            where: { userId: session.user.id },
            select: { channelId: true },
        })
        where.channelId = { in: memberships.map(m => m.channelId) }
    }

    if (status && status !== 'all') where.status = status
    if (platform) where.platform = platform
    if (platformAccountId) where.platformAccountId = platformAccountId
    if (postId) where.postId = postId

    if (search) {
        where.OR = [
            { authorName: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
        ]
    }

    const [comments, total] = await Promise.all([
        prisma.socialComment.findMany({
            where,
            orderBy: { commentedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                platformAccount: {
                    select: { id: true, platform: true, accountName: true },
                },
                post: {
                    select: { id: true, content: true },
                },
            },
        }),
        prisma.socialComment.count({ where }),
    ])

    // Count by status
    const baseWhere = { ...where }
    delete baseWhere.status
    const [countNew, countReplied, countHidden] = await Promise.all([
        prisma.socialComment.count({ where: { ...baseWhere, status: 'new' } }),
        prisma.socialComment.count({ where: { ...baseWhere, status: 'replied' } }),
        prisma.socialComment.count({ where: { ...baseWhere, status: 'hidden' } }),
    ])

    return NextResponse.json({
        comments: comments.map(c => ({
            id: c.id,
            channelId: c.channelId,
            platform: c.platform,
            externalPostId: c.externalPostId,
            externalCommentId: c.externalCommentId,
            parentCommentId: c.parentCommentId,
            authorName: c.authorName,
            authorAvatar: c.authorAvatar,
            content: c.content,
            sentiment: c.sentiment,
            isSpam: c.isSpam,
            status: c.status,
            replyContent: c.replyContent,
            repliedAt: c.repliedAt?.toISOString() || null,
            commentedAt: c.commentedAt.toISOString(),
            platformAccount: c.platformAccount,
            post: c.post ? { id: c.post.id, content: c.post.content?.substring(0, 100) } : null,
        })),
        total,
        page,
        limit,
        counts: { new: countNew, replied: countReplied, hidden: countHidden, all: total },
    })
}
