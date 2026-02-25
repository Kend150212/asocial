import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserGDriveAccessToken } from '@/lib/gdrive'

// Simple in-memory cache to avoid re-downloading during Instagram's multiple fetch attempts
const fileCache = new Map<string, { data: Uint8Array; contentType: string; size: number; cachedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Clean up stale cache entries periodically
function cleanCache() {
    const now = Date.now()
    for (const [key, entry] of fileCache) {
        if (now - entry.cachedAt > CACHE_TTL) {
            fileCache.delete(key)
        }
    }
}

/**
 * GET /api/media/serve/[id]
 *
 * Public proxy endpoint for media files stored on Google Drive.
 * Instagram/Facebook APIs cannot download from Google Drive URLs directly.
 *
 * Strategy: Download the ENTIRE file into memory first, then serve it
 * instantly to Instagram. This avoids the double-latency issue where
 * streaming GDrive → Neeflow → Instagram causes Instagram to timeout.
 *
 * Files are cached in memory for 5 minutes so Instagram's multiple
 * fetch attempts (container checks) don't re-download from GDrive.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Check cache first
        cleanCache()
        const cached = fileCache.get(id)
        if (cached) {
            console.log(`[Media Proxy] Cache hit for ${id} (${(cached.size / 1024 / 1024).toFixed(1)}MB)`)
            return new NextResponse(new Blob([cached.data], { type: cached.contentType }), {
                status: 200,
                headers: {
                    'Content-Type': cached.contentType,
                    'Content-Length': String(cached.size),
                    'Cache-Control': 'public, max-age=300',
                },
            })
        }

        const media = await prisma.mediaItem.findUnique({
            where: { id },
            select: {
                url: true,
                storageFileId: true,
                mimeType: true,
                type: true,
                originalName: true,
                channelId: true,
            },
        })

        if (!media) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 })
        }

        let sourceUrl = media.url
        const fetchHeaders: Record<string, string> = {}

        if (media.storageFileId) {
            try {
                const channelMember = await prisma.channelMember.findFirst({
                    where: { channelId: media.channelId },
                    orderBy: { role: 'asc' },
                    select: { userId: true },
                })

                if (channelMember) {
                    const gdriveToken = await getUserGDriveAccessToken(channelMember.userId)
                    sourceUrl = `https://www.googleapis.com/drive/v3/files/${media.storageFileId}?alt=media`
                    fetchHeaders['Authorization'] = `Bearer ${gdriveToken}`
                    console.log(`[Media Proxy] Downloading from Google Drive API: ${media.originalName || id}`)
                } else {
                    throw new Error('No channel member found')
                }
            } catch (err) {
                console.warn(`[Media Proxy] GDrive auth failed, using public URL:`, (err as Error).message)
                sourceUrl = `https://drive.google.com/uc?export=download&id=${media.storageFileId}`
            }
        }

        // Download the ENTIRE file into memory
        const response = await fetch(sourceUrl, {
            redirect: 'follow',
            headers: { ...fetchHeaders, 'User-Agent': 'NeeFlow/1.0' },
        })

        if (!response.ok) {
            console.error(`[Media Proxy] Download failed: ${response.status} ${response.statusText}`)
            return NextResponse.json({ error: 'Failed to download media' }, { status: 502 })
        }

        const arrayBuffer = await response.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)

        const contentType = media.mimeType
            || response.headers.get('content-type')
            || (media.type === 'video' ? 'video/mp4' : 'image/jpeg')

        console.log(`[Media Proxy] Downloaded ${media.originalName || id} (${contentType}, ${(data.length / 1024 / 1024).toFixed(1)}MB) — caching for 5min`)

        // Cache the file
        fileCache.set(id, { data, contentType, size: data.length, cachedAt: Date.now() })

        // Serve instantly
        return new NextResponse(new Blob([data], { type: contentType }), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'public, max-age=300',
            },
        })
    } catch (err) {
        console.error('[Media Proxy] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
