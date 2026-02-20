import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/posts/duplicates — find posts sharing the same contentHash
 */
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Find contentHash values that appear more than once
    const dupes = await prisma.post.groupBy({
        by: ['contentHash'],
        _count: { contentHash: true },
        where: { contentHash: { not: null } },
        having: { contentHash: { _count: { gt: 1 } } },
        orderBy: { _count: { contentHash: 'desc' } },
        take: 50,
    })

    // Fetch actual posts for each duplicate hash
    const hashes = dupes.map(d => d.contentHash!).filter(Boolean)
    const posts = hashes.length > 0
        ? await prisma.post.findMany({
            where: { contentHash: { in: hashes } },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                content: true,
                contentHash: true,
                status: true,
                createdAt: true,
                channel: { select: { id: true, name: true, displayName: true } },
                author: { select: { id: true, name: true, email: true } },
            },
        })
        : []

    // Group by hash
    const groups: Record<string, typeof posts> = {}
    for (const p of posts) {
        const h = p.contentHash!
        if (!groups[h]) groups[h] = []
        groups[h].push(p)
    }

    return NextResponse.json({
        totalDuplicateGroups: dupes.length,
        groups: Object.entries(groups).map(([hash, posts]) => ({
            hash,
            count: posts.length,
            posts,
        })),
    })
}
