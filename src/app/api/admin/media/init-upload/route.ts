import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, getOrCreateChannelFolder } from '@/lib/gdrive'
import { randomUUID } from 'crypto'

/**
 * POST /api/admin/media/init-upload
 * Creates a resumable upload session on Google Drive and returns the upload URI.
 * The client then uploads the file directly to Google Drive, bypassing the server.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, fileName, mimeType, fileSize } = await req.json()

    if (!channelId || !fileName || !mimeType) {
        return NextResponse.json({ error: 'channelId, fileName, mimeType are required' }, { status: 400 })
    }

    // Max 100MB
    if (fileSize && fileSize > 100 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    try {
        const accessToken = await getGDriveAccessToken()

        // Get parent folder
        const integration = await prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive' },
        })
        const gdriveConfig = (integration?.config || {}) as Record<string, string>
        const parentFolderId = gdriveConfig.parentFolderId

        if (!parentFolderId) {
            return NextResponse.json(
                { error: 'Google Drive parent folder not configured. Go to API Hub → Google Drive → Create Folder.' },
                { status: 400 }
            )
        }

        // Get channel info for subfolder
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            select: { name: true, displayName: true },
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get or create channel subfolder
        const channelFolder = await getOrCreateChannelFolder(
            accessToken,
            parentFolderId,
            channel.displayName || channel.name,
        )

        // Generate unique filename with date
        const ext = fileName.split('.').pop() || 'mp4'
        const now = new Date()
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`
        const prefix = mimeType.startsWith('video/') ? 'video' : 'image'
        const shortId = randomUUID().slice(0, 6)
        const uniqueName = `${prefix} ${shortId} - ${dateStr}.${ext}`

        // Initiate resumable upload on Google Drive
        const metadata = {
            name: uniqueName,
            mimeType,
            parents: [channelFolder.id],
        }

        const initRes = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,webViewLink,webContentLink,size',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': mimeType,
                    ...(fileSize ? { 'X-Upload-Content-Length': String(fileSize) } : {}),
                },
                body: JSON.stringify(metadata),
            },
        )

        if (!initRes.ok) {
            const errData = await initRes.json()
            throw new Error(`GDrive init failed: ${errData.error?.message || initRes.statusText}`)
        }

        const uploadUri = initRes.headers.get('Location')
        if (!uploadUri) {
            throw new Error('No upload URI returned from Google Drive')
        }

        return NextResponse.json({
            uploadUri,
            accessToken,
            channelFolderId: channelFolder.id,
            uniqueName,
            originalName: fileName,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Init upload failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
