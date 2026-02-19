import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PostStatus } from '@prisma/client'

/**
 * PATCH /api/admin/posts/bulk
 * Body: { ids: string[], scheduledAt?: string | null, status?: PostStatus }
 * Bulk-update scheduledAt and/or status for multiple posts.
 *
 * DELETE /api/admin/posts/bulk
 * Body: { ids: string[] }
 * Bulk-delete multiple posts.
 */

export async function PATCH(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { ids, scheduledAt, status } = body as {
        ids: string[]
        scheduledAt?: string | null
        status?: PostStatus
    }

    if (!ids || ids.length === 0) {
        return NextResponse.json({ error: 'ids is required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if (scheduledAt !== undefined) {
        data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
        // Auto-set status based on scheduledAt
        if (scheduledAt) {
            data.status = 'SCHEDULED'
        } else if (!status) {
            data.status = 'DRAFT'
        }
    }

    if (status) {
        data.status = status
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const result = await prisma.post.updateMany({
        where: {
            id: { in: ids },
            // Non-admins can only update their own posts
            ...(session.user.role !== 'ADMIN'
                ? { authorId: session.user.id }
                : {}),
        },
        data,
    })

    return NextResponse.json({ updated: result.count })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { ids } = body as { ids: string[] }

    if (!ids || ids.length === 0) {
        return NextResponse.json({ error: 'ids is required' }, { status: 400 })
    }

    const result = await prisma.post.deleteMany({
        where: {
            id: { in: ids },
            ...(session.user.role !== 'ADMIN'
                ? { authorId: session.user.id }
                : {}),
        },
    })

    return NextResponse.json({ deleted: result.count })
}
