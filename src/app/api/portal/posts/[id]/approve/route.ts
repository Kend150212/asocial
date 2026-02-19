import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/portal/posts/[id]/approve
// Body: { action: 'APPROVED' | 'REJECTED', comment?: string }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id: postId } = await params
    const { action, comment } = await req.json()

    if (!['APPROVED', 'REJECTED'].includes(action)) {
        return NextResponse.json({ error: 'action must be APPROVED or REJECTED' }, { status: 400 })
    }

    // Verify customer has access to this post's channel
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { channelId: true, status: true },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const membership = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId: session.user.id, channelId: post.channelId } },
    })
    if (!membership) return NextResponse.json({ error: 'Not authorized for this channel' }, { status: 403 })

    // Upsert approval record
    await prisma.postApproval.create({
        data: {
            postId,
            userId: session.user.id,
            action,
            comment: comment || null,
        },
    })

    // Update post status
    if (action === 'APPROVED') {
        await prisma.post.update({
            where: { id: postId },
            data: { status: 'APPROVED' },
        })
    } else {
        await prisma.post.update({
            where: { id: postId },
            data: { status: 'REJECTED' },
        })
    }

    return NextResponse.json({ ok: true, action })
}
