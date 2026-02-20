import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/v1/posts/[id]/approve — Approve a post
 * POST /api/v1/posts/[id]/reject — Reject a post (body: { comment? })
 * GET  /api/v1/posts/[id]/approvals — List approval history
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params

    const post = await prisma.post.findFirst({
        where: { id, ...(user.role !== 'ADMIN' ? { authorId: user.id } : {}) },
    })
    if (!post) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 })
    }

    const approvals = await prisma.postApproval.findMany({
        where: { postId: id },
        select: {
            id: true,
            action: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(approvals, usage.apiCalls, plan.maxApiCallsPerMonth)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult
    const { id } = await params
    const body = await req.json()
    const action = body.action?.toUpperCase() // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(action)) {
        return NextResponse.json(
            { success: false, error: { code: 'INVALID_ACTION', message: 'action must be APPROVED or REJECTED' } },
            { status: 400 },
        )
    }

    const post = await prisma.post.findFirst({
        where: { id, status: 'PENDING_APPROVAL' },
    })
    if (!post) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Post not found or not pending approval' } },
            { status: 404 },
        )
    }

    // Create approval record
    await prisma.postApproval.create({
        data: {
            postId: id,
            userId: user.id,
            action,
            comment: body.comment || null,
        },
    })

    // Update post status
    await prisma.post.update({
        where: { id },
        data: { status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
    })

    return apiSuccess(
        { postId: id, action, status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
        usage.apiCalls,
        plan.maxApiCallsPerMonth,
    )
}
