import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, uploadFile, makeFilePublic, getOrCreateChannelFolder } from '@/lib/gdrive'
import { randomUUID } from 'crypto'

// GET /api/admin/media — list media for a channel
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const type = searchParams.get('type') // image, video
    const source = searchParams.get('source') // upload, ai_generated
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const skip = (page - 1) * limit

    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { channelId }
    if (type) where.type = type
    if (source) where.source = source

    const [media, total] = await Promise.all([
        prisma.mediaItem.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.mediaItem.count({ where }),
    ])

    return NextResponse.json({
        media,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
}

// POST /api/admin/media — upload image/video to Google Drive
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const channelId = formData.get('channelId') as string
    const file = formData.get('file') as File | null

    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }
    if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'image/avif',
        // Videos
        'video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo',
        'video/x-matroska', 'video/ogg', 'video/3gpp', 'video/x-flv',
        'video/x-ms-wmv', 'video/mpeg',
    ]
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
            { error: `Unsupported file type: ${file.type}. Supported: images (JPG, PNG, GIF, WebP, HEIC, AVIF) and videos (MP4, MOV, WebM, AVI, MKV)` },
            { status: 400 }
        )
    }

    // Max size: 50MB
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    try {
        // Get Google Drive access token
        const accessToken = await getGDriveAccessToken()

        // Get the parent folder ID from integration config
        const integration = await prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive' },
        })

        const gdriveConfig = (integration?.config || {}) as Record<string, string>
        const parentFolderId = gdriveConfig.parentFolderId

        if (!parentFolderId) {
            return NextResponse.json(
                { error: 'Google Drive parent folder not configured. Go to API Hub → Google Drive → Create Folder first.' },
                { status: 400 }
            )
        }

        // Get the channel name for subfolder creation
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            select: { name: true, displayName: true },
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get or create channel-specific subfolder
        const channelFolder = await getOrCreateChannelFolder(
            accessToken,
            parentFolderId,
            channel.displayName || channel.name,
        )

        // Generate unique filename to avoid collisions
        const ext = file.name.split('.').pop() || 'jpg'
        const uniqueName = `${randomUUID()}.${ext}`

        // Read file into buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Google Drive
        const driveFile = await uploadFile(
            accessToken,
            uniqueName,
            file.type,
            buffer,
            channelFolder.id,
        )

        // Make file publicly accessible (needed for platform publishing)
        const publicUrl = await makeFilePublic(accessToken, driveFile.id)

        // Determine type
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'

        // Build thumbnail URL for Google Drive
        const thumbnailUrl = fileType === 'image'
            ? `https://drive.google.com/thumbnail?id=${driveFile.id}&sz=w400`
            : undefined

        // Save to database with Google Drive URL
        const mediaItem = await prisma.mediaItem.create({
            data: {
                channelId,
                url: publicUrl,
                thumbnailUrl,
                storageFileId: driveFile.id,
                type: fileType,
                source: 'upload',
                originalName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                aiMetadata: {
                    gdriveFolderId: channelFolder.id,
                    webViewLink: driveFile.webViewLink,
                },
            },
        })

        return NextResponse.json(mediaItem, { status: 201 })
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Upload failed'

        // If Google Drive is not connected, provide helpful message
        if (errMsg.includes('not found') || errMsg.includes('not connected')) {
            return NextResponse.json(
                { error: 'Google Drive not connected. Go to API Hub → Google Drive to set up.' },
                { status: 400 }
            )
        }

        return NextResponse.json({ error: errMsg }, { status: 500 })
    }
}
