import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken } from '@/lib/gdrive'

// POST /api/admin/media/bulk — bulk operations (delete, move)
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, ids, folderId } = body as {
        action: 'delete' | 'move'
        ids: string[]
        folderId?: string | null
    }

    if (!action || !ids?.length) {
        return NextResponse.json({ error: 'action and ids are required' }, { status: 400 })
    }

    if (action === 'delete') {
        // Get all media items to delete from Drive
        const mediaItems = await prisma.mediaItem.findMany({
            where: { id: { in: ids } },
        })

        // Delete from Google Drive
        try {
            const accessToken = await getGDriveAccessToken()
            await Promise.allSettled(
                mediaItems
                    .filter((m) => m.storageFileId)
                    .map((m) =>
                        fetch(`https://www.googleapis.com/drive/v3/files/${m.storageFileId}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${accessToken}` },
                        })
                    )
            )
        } catch (err) {
            console.warn('Bulk Drive delete partial failure:', err)
        }

        // Delete post_media references first
        await prisma.postMedia.deleteMany({ where: { mediaItemId: { in: ids } } })
        // Delete media items
        const result = await prisma.mediaItem.deleteMany({ where: { id: { in: ids } } })

        return NextResponse.json({ success: true, deletedCount: result.count })
    }

    if (action === 'move') {
        const result = await prisma.mediaItem.updateMany({
            where: { id: { in: ids } },
            data: { folderId: folderId || null },
        })

        return NextResponse.json({ success: true, movedCount: result.count })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
