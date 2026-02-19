import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/media/folders — list folders for a channel
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const parentId = searchParams.get('parentId') // null = root folders

    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const folders = await prisma.mediaFolder.findMany({
        where: {
            channelId,
            parentId: parentId || null,
        },
        include: {
            _count: { select: { media: true, children: true } },
        },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ folders })
}

// POST /api/admin/media/folders — create a folder
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, name, parentId } = body

    if (!channelId || !name?.trim()) {
        return NextResponse.json({ error: 'channelId and name are required' }, { status: 400 })
    }

    // Check for duplicate name in same parent
    const existing = await prisma.mediaFolder.findFirst({
        where: { channelId, parentId: parentId || null, name: name.trim() },
    })
    if (existing) {
        return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 409 })
    }

    const folder = await prisma.mediaFolder.create({
        data: {
            channelId,
            name: name.trim(),
            parentId: parentId || null,
        },
        include: {
            _count: { select: { media: true, children: true } },
        },
    })

    return NextResponse.json({ folder }, { status: 201 })
}
