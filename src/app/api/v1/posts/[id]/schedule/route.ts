import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/v1/posts/[id]/schedule — Schedule a post
 * Body: { scheduledAt: string (ISO date) }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params
    const body = await req.json()

    if (!body.scheduledAt) {
        return NextResponse.json(
            { success: false, error: { code: 'MISSING_DATE', message: 'scheduledAt is required (ISO 8601 format)' } },
            { status: 400 },
        )
    }

    const scheduledAt = new Date(body.scheduledAt)
    if (scheduledAt <= new Date()) {
        return NextResponse.json(
            { success: false, error: { code: 'PAST_DATE', message: 'scheduledAt must be in the future' } },
            { status: 400 },
        )
    }

    const post = await prisma.post.findFirst({
        where: { id, ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}) },
    })
    if (!post) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    const updated = await prisma.post.update({
        where: { id },
        data: { status: 'SCHEDULED', scheduledAt },
        select: { id: true, status: true, scheduledAt: true },
    })

    return apiSuccess(updated, usage.apiCalls, plan.maxApiCallsPerMonth)
}
