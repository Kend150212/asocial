import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, makeFilePublic } from '@/lib/gdrive'

/**
 * POST /api/admin/media/complete-upload
 * Called after the client finishes uploading directly to Google Drive.
 * Saves the metadata to the database and makes the file public.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, driveFileId, channelFolderId, originalName, mimeType, fileSize } = await req.json()

    if (!channelId || !driveFileId || !originalName || !mimeType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
        const accessToken = await getGDriveAccessToken()

        // Make file publicly accessible
        const publicUrl = await makeFilePublic(accessToken, driveFileId, mimeType)

        const fileType = mimeType.startsWith('video/') ? 'video' : 'image'

        // Build thumbnail
        const thumbnailUrl = fileType === 'image'
            ? `https://lh3.googleusercontent.com/d/${driveFileId}=s400`
            : `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`

        // Save to database
        const mediaItem = await prisma.mediaItem.create({
            data: {
                channelId,
                url: publicUrl,
                thumbnailUrl,
                storageFileId: driveFileId,
                type: fileType,
                source: 'upload',
                originalName,
                fileSize: fileSize || 0,
                mimeType,
                aiMetadata: {
                    gdriveFolderId: channelFolderId,
                    webViewLink: `https://drive.google.com/file/d/${driveFileId}/view`,
                },
            },
        })

        return NextResponse.json(mediaItem, { status: 201 })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Complete upload failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
