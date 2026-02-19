import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/media/folders/[id] — rename folder
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name } = body

    if (!name?.trim()) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const folder = await prisma.mediaFolder.findUnique({ where: { id } })
    if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check for duplicate
    const existing = await prisma.mediaFolder.findFirst({
        where: { channelId: folder.channelId, parentId: folder.parentId, name: name.trim(), id: { not: id } },
    })
    if (existing) {
        return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 409 })
    }

    const updated = await prisma.mediaFolder.update({
        where: { id },
        data: { name: name.trim() },
        include: { _count: { select: { media: true, children: true } } },
    })

    return NextResponse.json({ folder: updated })
}

// DELETE /api/admin/media/folders/[id] — delete folder (move media to parent)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const folder = await prisma.mediaFolder.findUnique({ where: { id } })
    if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Move all media in this folder to parent folder (or root)
    await prisma.mediaItem.updateMany({
        where: { folderId: id },
        data: { folderId: folder.parentId },
    })

    // Move all child folders to parent
    await prisma.mediaFolder.updateMany({
        where: { parentId: id },
        data: { parentId: folder.parentId },
    })

    // Delete the folder
    await prisma.mediaFolder.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
