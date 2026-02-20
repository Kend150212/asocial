import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/v1/posts/[id]/publish — Publish a post immediately
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params

    const post = await prisma.post.findFirst({
        where: { id, ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}) },
        include: { platformStatuses: true },
    })

    if (!post) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    if (!['DRAFT', 'SCHEDULED', 'APPROVED'].includes(post.status)) {
        return NextResponse.json(
            { success: false, error: { code: 'CANNOT_PUBLISH', message: `Cannot publish post with status ${post.status}` } },
            { status: 400 },
        )
    }

    // Update status to PUBLISHING — the worker will pick it up
    await prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHING' },
    })

    return apiSuccess({ id, status: 'PUBLISHING', message: 'Post queued for publishing' }, usage.apiCalls, plan.maxApiCallsPerMonth)
}
