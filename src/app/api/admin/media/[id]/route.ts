import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken } from '@/lib/gdrive'

// DELETE /api/admin/media/[id] — delete a media item + remove from Google Drive
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

    // Delete from Google Drive if storageFileId exists
    if (media.storageFileId) {
        try {
            const accessToken = await getGDriveAccessToken()
            await fetch(
                `https://www.googleapis.com/drive/v3/files/${media.storageFileId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            )

            // Also delete thumbnail if it was uploaded as a separate file
            // Thumbnail storageFileId is stored in aiMetadata
            const meta = (media.aiMetadata || {}) as Record<string, string>
            if (meta.thumbnailFileId) {
                await fetch(
                    `https://www.googleapis.com/drive/v3/files/${meta.thumbnailFileId}`,
                    {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                ).catch(() => { })
            }
        } catch (err) {
            console.warn('Failed to delete from Google Drive:', err)
            // Continue with DB deletion even if Drive delete fails
        }
    }

    // Delete from database — first remove post_media references, then the media item
    await prisma.postMedia.deleteMany({ where: { mediaItemId: id } })
    await prisma.mediaItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
