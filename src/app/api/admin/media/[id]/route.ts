import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

// DELETE /api/admin/media/[id] — delete a media item
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const media = await prisma.mediaItem.findUnique({ where: { id } })
    if (!media) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete physical file if it's a local upload
    if (media.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', media.url)
        try {
            await unlink(filePath)
        } catch {
            // File might not exist, continue with DB deletion
        }
    }

    await prisma.mediaItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
