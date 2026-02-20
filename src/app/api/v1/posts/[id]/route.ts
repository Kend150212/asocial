import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/posts/[id] — Get post detail
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params

    const post = await prisma.post.findFirst({
        where: {
            id,
            ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}),
        },
        select: {
            id: true,
            content: true,
            contentPerPlatform: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            channel: { select: { id: true, displayName: true, name: true } },
            author: { select: { id: true, name: true, email: true } },
            platformStatuses: {
                select: { id: true, platform: true, accountId: true, status: true, externalId: true, errorMsg: true, config: true, publishedAt: true },
            },
            media: {
                select: { mediaItem: { select: { id: true, url: true, thumbnailUrl: true, mimeType: true, fileName: true } } },
                orderBy: { sortOrder: 'asc' },
            },
            approvals: {
                select: { id: true, action: true, comment: true, createdAt: true, user: { select: { name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!post) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    return apiSuccess(post, usage.apiCalls, plan.maxApiCallsPerMonth)
}

/**
 * PUT /api/v1/posts/[id] — Update post
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.post.findFirst({
        where: { id, ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}) },
    })
    if (!existing) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    // Only allow editing DRAFT or SCHEDULED posts
    if (!['DRAFT', 'SCHEDULED', 'REJECTED'].includes(existing.status)) {
        return NextResponse.json(
            { success: false, error: { code: 'CANNOT_EDIT', message: `Cannot edit post with status ${existing.status}` } },
            { status: 400 },
        )
    }

    const updated = await prisma.post.update({
        where: { id },
        data: {
            ...(body.content !== undefined ? { content: body.content } : {}),
            ...(body.contentPerPlatform !== undefined ? { contentPerPlatform: body.contentPerPlatform } : {}),
            ...(body.scheduledAt !== undefined ? { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null } : {}),
            ...(body.status ? { status: body.status } : {}),
        },
        select: { id: true, content: true, contentPerPlatform: true, status: true, scheduledAt: true, updatedAt: true },
    })

    return apiSuccess(updated, usage.apiCalls, plan.maxApiCallsPerMonth)
}

/**
 * DELETE /api/v1/posts/[id] — Delete post
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params

    const existing = await prisma.post.findFirst({
        where: { id, ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}) },
    })
    if (!existing) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    await prisma.post.delete({ where: { id } })

    return apiSuccess({ deleted: true }, usage.apiCalls, plan.maxApiCallsPerMonth)
}
