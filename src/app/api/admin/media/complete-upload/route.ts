import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, makeFilePublic } from '@/lib/gdrive'

/**
 * POST /api/admin/media/complete-upload
 * Called after client finishes uploading to either R2 (presigned URL) or GDrive (resumable).
 * Saves media metadata to the database.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
        channelId,
        // R2 fields
        r2Key,
        publicUrl,
        storage,
        // GDrive fields (legacy)
        driveFileId,
        channelFolderId,
        // Common
        originalName,
        mimeType,
        fileSize,
        folderId,
    } = body

    if (!channelId || !originalName || !mimeType) {
        return NextResponse.json({ error: 'channelId, originalName, mimeType are required' }, { status: 400 })
    }

    try {
        const fileType = mimeType.startsWith('video/') ? 'video' : 'image'

        // ─── R2 storage ──────────────────────────────────────────────
        if (storage === 'r2' && r2Key && publicUrl) {
            const thumbnailUrl = fileType === 'image'
                ? publicUrl
                : publicUrl // For videos uploaded via presigned URL, thumbnail = video URL (no server-side ffmpeg)

            const mediaItem = await prisma.mediaItem.create({
                data: {
                    channelId,
                    url: publicUrl,
                    thumbnailUrl,
                    storageFileId: r2Key,
                    type: fileType,
                    source: 'upload',
                    originalName,
                    fileSize: fileSize || 0,
                    mimeType,
                    ...(folderId ? { folderId } : {}),
                    aiMetadata: {
                        storage: 'r2',
                        r2Key,
                    },
                },
            })

            return NextResponse.json(mediaItem, { status: 201 })
        }

        // ─── Google Drive storage (legacy) ───────────────────────────
        if (!driveFileId) {
            return NextResponse.json({ error: 'Either r2Key+publicUrl or driveFileId is required' }, { status: 400 })
        }

        const accessToken = await getGDriveAccessToken()
        const drivePublicUrl = await makeFilePublic(accessToken, driveFileId, mimeType)

        const thumbnailUrl = fileType === 'image'
            ? `https://lh3.googleusercontent.com/d/${driveFileId}=s400`
            : `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`

        const mediaItem = await prisma.mediaItem.create({
            data: {
                channelId,
                url: drivePublicUrl,
                thumbnailUrl,
                storageFileId: driveFileId,
                type: fileType,
                source: 'upload',
                originalName,
                fileSize: fileSize || 0,
                mimeType,
                ...(folderId ? { folderId } : {}),
                aiMetadata: {
                    storage: 'gdrive',
                    gdriveFolderId: channelFolderId,
                    webViewLink: `https://drive.google.com/file/d/${driveFileId}/view`,
                },
            },
        })

        return NextResponse.json(mediaItem, { status: 201 })
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Complete upload failed'
        return NextResponse.json({ error: errMsg }, { status: 500 })
    }
}
