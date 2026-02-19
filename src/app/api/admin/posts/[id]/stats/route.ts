import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/posts/[id]/stats
 * Returns aggregated analytics for each platform of a post (from platformStatuses).
 * Currently returns stored stats from the config JSON field.
 * In the future this can be extended to fetch live data from platform APIs.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const platformStatuses = await prisma.postPlatformStatus.findMany({
        where: { postId: id },
        select: {
            platform: true,
            status: true,
            externalId: true,
            publishedAt: true,
            config: true,
        },
    })

    // Extract stored stats from config JSON (saved during/after publish)
    const stats = platformStatuses.map(ps => {
        const config = (ps.config as Record<string, unknown>) || {}
        return {
            platform: ps.platform,
            status: ps.status,
            externalId: ps.externalId,
            publishedAt: ps.publishedAt,
            // Stats stored in config
            views: config.views ?? null,
            likes: config.likes ?? null,
            comments: config.comments ?? null,
            shares: config.shares ?? null,
            reach: config.reach ?? null,
            impressions: config.impressions ?? null,
        }
    })

    return NextResponse.json({ stats })
}
