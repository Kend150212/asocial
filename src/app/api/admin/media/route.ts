import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, getUserGDriveAccessToken, uploadFile, makeFilePublic, getOrCreateChannelFolder, getOrCreateMonthlyFolder } from '@/lib/gdrive'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

// Allow large file uploads (up to 60MB)
export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

/**
 * Generate a video thumbnail using ffmpeg.
 * Extracts a frame at 1s, uploads to Google Drive, returns public URL.
 * Falls back to Drive thumbnail URL if ffmpeg is not available.
 */
async function generateVideoThumbnail(
    videoBuffer: Buffer,
    accessToken: string,
    parentFolderId: string,
    videoFileId: string,
): Promise<string> {
    const fallbackUrl = `https://drive.google.com/thumbnail?id=${videoFileId}&sz=w400`

    try {
        const id = randomUUID().slice(0, 8)
        const tmpVideo = join(tmpdir(), `vid_${id}.mp4`)
        const tmpThumb = join(tmpdir(), `thumb_${id}.jpg`)

        // Write video to temp file
        await writeFile(tmpVideo, videoBuffer)

        // Extract frame at 1 second (or first frame if video is shorter)
        await execAsync(
            `ffmpeg -i "${tmpVideo}" -ss 00:00:01 -vframes 1 -q:v 2 -y "${tmpThumb}"`,
            { timeout: 15000 }
        )

        // Read the thumbnail
        const thumbBuffer = await readFile(tmpThumb)

        // Clean up temp files
        await unlink(tmpVideo).catch(() => { })
        await unlink(tmpThumb).catch(() => { })

        // Upload thumbnail to Google Drive
        const thumbName = `thumb_${videoFileId}.jpg`
        const thumbFile = await uploadFile(
            accessToken,
            thumbName,
            'image/jpeg',
            thumbBuffer,
            parentFolderId,
        )

        // Make thumbnail public
        const publicUrl = await makeFilePublic(accessToken, thumbFile.id, 'image/jpeg')
        return publicUrl
    } catch (err) {
        console.warn('ffmpeg thumbnail generation failed, using fallback:', err)
        return fallbackUrl
    }
}


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
    const folderId = searchParams.get('folderId') // null = root
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest' // newest, oldest, name, size
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!channelId) {
        return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { channelId }
    if (type) where.type = type
    if (source) where.source = source
    if (folderId === 'root') {
        where.folderId = null
    } else if (folderId) {
        where.folderId = folderId
    }
    if (search) {
        where.originalName = { contains: search, mode: 'insensitive' }
    }

    // Sorting
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'oldest') orderBy = { createdAt: 'asc' }
    else if (sort === 'name') orderBy = { originalName: 'asc' }
    else if (sort === 'size') orderBy = { fileSize: 'desc' }

    const [media, total] = await Promise.all([
        prisma.mediaItem.findMany({
            where,
            skip,
            take: limit,
            orderBy,
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
    console.log('POST /api/admin/media — channelId:', channelId, 'file:', file?.name, 'size:', file?.size, 'type:', file?.type)

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
        let accessToken: string
        let targetFolderId: string

        // Check if user has their own Google Drive connected
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { gdriveRefreshToken: true, gdriveFolderId: true },
        })

        if (user?.gdriveRefreshToken && user?.gdriveFolderId) {
            // ─── User's own Google Drive ───
            accessToken = await getUserGDriveAccessToken(session.user.id)

            // Get channel name for subfolder
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                select: { name: true, displayName: true },
            })
            const channelName = channel?.displayName || channel?.name || 'General'

            // Folder structure: ASocial - User → Channel Name → YYYY-MM
            const channelFolder = await getOrCreateChannelFolder(accessToken, user.gdriveFolderId, channelName)
            const monthlyFolder = await getOrCreateMonthlyFolder(accessToken, channelFolder.id)
            targetFolderId = monthlyFolder.id
            console.log('Media upload: using USER GDrive, root:', user.gdriveFolderId, '→ channel:', channelFolder.id, '→ monthly:', monthlyFolder.id)
        } else {
            // ─── Fallback: Admin's Google Drive (legacy) ───
            accessToken = await getGDriveAccessToken()

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
            targetFolderId = channelFolder.id
            console.log('Media upload: using ADMIN GDrive (legacy), folder:', parentFolderId, '→ channel:', channelFolder.id)
        }

        // Generate filename with date suffix: "image 1 - 02-17-2026.jpg"
        const ext = file.name.split('.').pop() || 'jpg'
        const now = new Date()
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`
        const prefix = file.type.startsWith('video/') ? 'video' : 'image'
        const shortId = randomUUID().slice(0, 6)
        const uniqueName = `${prefix} ${shortId} - ${dateStr}.${ext}`

        // Read file into buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Google Drive
        const driveFile = await uploadFile(
            accessToken,
            uniqueName,
            file.type,
            buffer,
            targetFolderId,
        )

        // Make file publicly accessible (needed for platform publishing)
        const publicUrl = await makeFilePublic(accessToken, driveFile.id, file.type)

        // Determine type
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'

        // Build thumbnail URL
        let thumbnailUrl: string
        if (fileType === 'image') {
            thumbnailUrl = `https://lh3.googleusercontent.com/d/${driveFile.id}=s400`
        } else {
            // For videos: try to generate thumbnail with ffmpeg
            thumbnailUrl = await generateVideoThumbnail(
                buffer, accessToken, targetFolderId, driveFile.id
            )
        }

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
                    gdriveFolderId: targetFolderId,
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
