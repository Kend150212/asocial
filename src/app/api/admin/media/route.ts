import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

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

// POST /api/admin/media — upload image/video
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
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/webm',
    ]
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
            { error: `Unsupported file type: ${file.type}` },
            { status: 400 }
        )
    }

    // Max size: 50MB
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Create upload directory per channel
    const channelDir = path.join(UPLOAD_DIR, channelId)
    await mkdir(channelDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg'
    const fileName = `${randomUUID()}${ext}`
    const filePath = path.join(channelDir, fileName)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Determine type
    const fileType = file.type.startsWith('video/') ? 'video' : 'image'

    // Save to database
    const mediaItem = await prisma.mediaItem.create({
        data: {
            channelId,
            url: `/uploads/${channelId}/${fileName}`,
            type: fileType,
            source: 'upload',
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
        },
    })

    return NextResponse.json(mediaItem, { status: 201 })
}
