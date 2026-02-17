import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/posts/[id]/publish — Publish post to platforms
export async function POST(
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
                include: {
                    platforms: { where: { isActive: true } },
                },
            },
            media: {
                include: { mediaItem: true },
                orderBy: { sortOrder: 'asc' },
            },
            platformStatuses: true,
        },
    })

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Update status to PUBLISHING
    await prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHING' },
    })

    const results: { platform: string; accountId: string; success: boolean; error?: string; externalId?: string }[] = []

    // Get pending platform statuses
    const pendingStatuses = post.platformStatuses.filter((ps) => ps.status === 'pending')

    for (const ps of pendingStatuses) {
        try {
            // Find the platform connection
            const platformConn = post.channel.platforms.find(
                (p) => p.platform === ps.platform && p.accountId === ps.accountId
            )

            if (!platformConn) {
                await prisma.postPlatformStatus.update({
                    where: { id: ps.id },
                    data: { status: 'failed', errorMsg: 'Platform connection not found' },
                })
                results.push({ platform: ps.platform, accountId: ps.accountId, success: false, error: 'Connection not found' })
                continue
            }

            // TODO: Implement actual platform publishing via their APIs
            // For now, mark as published (placeholder)
            // In production, this would call:
            // - Facebook Graph API (POST /{page-id}/feed)
            // - Instagram Content Publishing API
            // - TikTok Content Posting API
            // - YouTube Data API (videos.insert)
            // - LinkedIn UGC Post API
            // - Pinterest Pins API
            // - X/Twitter v2 POST /2/tweets

            const externalId = `pub_${Date.now()}_${ps.platform}`

            await prisma.postPlatformStatus.update({
                where: { id: ps.id },
                data: {
                    status: 'published',
                    externalId,
                    publishedAt: new Date(),
                },
            })

            results.push({ platform: ps.platform, accountId: ps.accountId, success: true, externalId })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            await prisma.postPlatformStatus.update({
                where: { id: ps.id },
                data: { status: 'failed', errorMsg },
            })
            results.push({ platform: ps.platform, accountId: ps.accountId, success: false, error: errorMsg })
        }
    }

    // Determine final post status
    const allPublished = results.every((r) => r.success)
    const anyPublished = results.some((r) => r.success)

    await prisma.post.update({
        where: { id },
        data: {
            status: allPublished ? 'PUBLISHED' : anyPublished ? 'PUBLISHED' : 'FAILED',
            publishedAt: anyPublished ? new Date() : null,
        },
    })

    return NextResponse.json({
        success: anyPublished,
        results,
        allPublished,
    })
}
