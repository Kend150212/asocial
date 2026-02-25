import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { randomUUID } from 'crypto'
import {
    getGDriveAccessToken,
    getUserGDriveAccessToken,
    getOrCreateChannelFolder,
    getOrCreateMonthlyFolder,
    uploadFile,
    makeFilePublic,
} from '@/lib/gdrive'
import { uploadToR2, generateR2Key, isR2Configured } from '@/lib/r2'
import { checkStorageQuota } from '@/lib/storage-quota'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/**
 * POST /api/admin/posts/stock-images
 *
 * action = "search" → search Pexels for stock photos
 * action = "download" → download a Pexels photo → upload to R2 (or GDrive) → create MediaItem
 *
 * Search body: { action: "search", query, perPage?, page? }
 * Download body: { action: "download", channelId, photoUrl, photographer, alt }
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action = 'search' } = body

    if (action === 'search') {
        return handleSearch(session.user.id, body)
    } else if (action === 'download') {
        return handleDownload(session.user.id, body)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// ─── Search Pexels ──────────────────────────────────────

async function handleSearch(userId: string, body: { query: string; perPage?: number; page?: number }) {
    const { query, perPage = 15, page = 1 } = body

    if (!query?.trim()) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get Pexels API key from user's keys or global integrations
    const pexelsKey = await getPexelsKey(userId)
    if (!pexelsKey) {
        return NextResponse.json(
            { error: 'Pexels API key not configured. Add a Pexels key in AI API Keys or ask your admin to set it up in API Hub.' },
            { status: 400 }
        )
    }

    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
            {
                headers: { Authorization: pexelsKey },
            }
        )

        if (!res.ok) {
            throw new Error(`Pexels API error: ${res.status}`)
        }

        const data = await res.json()

        const photos = (data.photos || []).map((p: {
            id: number
            src: { original: string; large2x: string; large: string; medium: string; small: string }
            photographer: string
            alt: string
            width: number
            height: number
        }) => ({
            id: p.id,
            src: {
                original: p.src.original,
                large: p.src.large2x || p.src.large,
                medium: p.src.medium,
                small: p.src.small,
            },
            photographer: p.photographer,
            alt: p.alt,
            width: p.width,
            height: p.height,
        }))

        return NextResponse.json({
            photos,
            totalResults: data.total_results,
            page: data.page,
            perPage: data.per_page,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Stock search failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// ─── Download & Upload to R2 (or Google Drive) ──────────

async function handleDownload(
    userId: string,
    body: { channelId: string; photoUrl: string; photographer?: string; alt?: string }
) {
    const { channelId, photoUrl, photographer, alt } = body

    if (!channelId || !photoUrl) {
        return NextResponse.json({ error: 'channelId and photoUrl are required' }, { status: 400 })
    }

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { name: true, displayName: true },
    })

    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const tmpPath = path.join(os.tmpdir(), `asoc_stock_${randomUUID()}.jpg`)

    try {
        // Download stock photo to temp file (streaming)
        const downloadRes = await fetch(photoUrl)
        if (!downloadRes.ok || !downloadRes.body) {
            throw new Error('Failed to download stock photo')
        }

        const writer = fs.createWriteStream(tmpPath)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pipeline(Readable.fromWeb(downloadRes.body as any), writer)

        const fileBuffer = fs.readFileSync(tmpPath)
        const fileSize = fs.statSync(tmpPath).size
        const mimeType = 'image/jpeg'

        const now = new Date()
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`
        const shortId = randomUUID().slice(0, 6)
        const uniqueName = `stock ${shortId} - ${dateStr}.jpg`

        // ─── Check storage quota ──────────────────────────
        const quota = await checkStorageQuota(userId, fileSize)
        if (!quota.allowed) {
            return NextResponse.json(
                { error: quota.reason, code: 'STORAGE_LIMIT_REACHED', usedMB: quota.usedMB, limitMB: quota.limitMB },
                { status: 429 }
            )
        }

        // ─── Try R2 first ────────────────────────────────
        const useR2 = await isR2Configured()

        if (useR2) {
            const r2Key = generateR2Key(channelId, uniqueName)
            const publicUrl = await uploadToR2(fileBuffer, r2Key, mimeType)

            const mediaItem = await prisma.mediaItem.create({
                data: {
                    channelId,
                    url: publicUrl,
                    thumbnailUrl: publicUrl,
                    storageFileId: r2Key,
                    type: 'image',
                    source: 'stock',
                    originalName: uniqueName,
                    fileSize,
                    mimeType,
                    aiMetadata: {
                        storage: 'r2',
                        r2Key,
                        source: 'pexels',
                        photographer: photographer || 'Unknown',
                        alt: alt || '',
                        originalUrl: photoUrl,
                    },
                },
            })

            return NextResponse.json({ mediaItem })
        }

        // ─── Fallback: Google Drive ──────────────────────
        let accessToken: string
        let targetFolderId: string

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { gdriveRefreshToken: true, gdriveFolderId: true },
        })

        if (user?.gdriveRefreshToken && user?.gdriveFolderId) {
            accessToken = await getUserGDriveAccessToken(userId)
            const channelName = channel.displayName || channel.name || 'General'
            const channelFolder = await getOrCreateChannelFolder(accessToken, user.gdriveFolderId, channelName)
            const monthlyFolder = await getOrCreateMonthlyFolder(accessToken, channelFolder.id)
            targetFolderId = monthlyFolder.id
        } else {
            accessToken = await getGDriveAccessToken()
            const integration = await prisma.apiIntegration.findFirst({
                where: { provider: 'gdrive' },
            })
            const gdriveConfig = (integration?.config || {}) as Record<string, string>
            if (!gdriveConfig.parentFolderId) {
                throw new Error('No storage configured. Set up Cloudflare R2 or Google Drive in API Hub.')
            }
            const channelName = channel.displayName || channel.name || 'General'
            const channelFolder = await getOrCreateChannelFolder(accessToken, gdriveConfig.parentFolderId, channelName)
            targetFolderId = channelFolder.id
        }

        const driveFile = await uploadFile(accessToken, uniqueName, mimeType, fileBuffer, targetFolderId)
        const publicUrl = await makeFilePublic(accessToken, driveFile.id, mimeType)
        const thumbnailUrl = `https://lh3.googleusercontent.com/d/${driveFile.id}=s400`

        const mediaItem = await prisma.mediaItem.create({
            data: {
                channelId,
                url: publicUrl,
                thumbnailUrl,
                storageFileId: driveFile.id,
                type: 'image',
                source: 'stock',
                originalName: uniqueName,
                fileSize,
                mimeType,
                aiMetadata: {
                    storage: 'gdrive',
                    source: 'pexels',
                    photographer: photographer || 'Unknown',
                    alt: alt || '',
                    originalUrl: photoUrl,
                    gdriveFolderId: targetFolderId,
                    webViewLink: driveFile.webViewLink,
                },
            },
        })

        return NextResponse.json({ mediaItem })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to download stock photo'
        return NextResponse.json({ error: msg }, { status: 500 })
    } finally {
        // Always clean up temp file
        fs.unlink(tmpPath, () => { })
    }
}

// ─── Helpers ────────────────────────────────────────────

async function getPexelsKey(userId: string): Promise<string | null> {
    // 1. Check user's personal API keys
    const userKey = await prisma.userApiKey.findFirst({
        where: { userId, provider: 'pexels' },
    })
    if (userKey) return decrypt(userKey.apiKeyEncrypted)

    // 2. Check global integrations
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'pexels' },
    })
    if (integration) {
        const config = integration.config as Record<string, string>
        if (config?.apiKey) return config.apiKey
        if (integration.apiKeyEncrypted) return decrypt(integration.apiKeyEncrypted)
    }

    return null
}
