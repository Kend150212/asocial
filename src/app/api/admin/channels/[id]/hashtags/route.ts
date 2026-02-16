import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id]/hashtags — list hashtag groups
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const groups = await prisma.hashtagGroup.findMany({
        where: { channelId: id },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json(groups)
}

// POST /api/admin/channels/[id]/hashtags — create hashtag group
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, hashtags } = body

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const group = await prisma.hashtagGroup.create({
        data: {
            channelId: id,
            name,
            hashtags: hashtags || [],
        },
    })

    return NextResponse.json(group, { status: 201 })
}

// PUT /api/admin/channels/[id]/hashtags — update hashtag group
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const body = await req.json()
    const { groupId, name, hashtags } = body

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    const group = await prisma.hashtagGroup.update({
        where: { id: groupId },
        data: {
            ...(name !== undefined && { name }),
            ...(hashtags !== undefined && { hashtags }),
        },
    })

    return NextResponse.json(group)
}

// DELETE /api/admin/channels/[id]/hashtags — delete hashtag group
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    await prisma.hashtagGroup.delete({ where: { id: groupId } })

    return NextResponse.json({ success: true })
}
