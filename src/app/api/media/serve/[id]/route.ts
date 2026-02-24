import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/media/serve/[id]
 *
 * Public proxy endpoint for media files stored on Google Drive.
 * Instagram/Facebook APIs cannot download from Google Drive URLs directly,
 * so this endpoint downloads from Drive and streams the file to the caller.
 *
 * NOTE: This is intentionally public (no auth) so that Instagram's servers
 * can fetch media via this URL during the publish process.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const media = await prisma.mediaItem.findUnique({
            where: { id },
            select: { url: true, storageFileId: true, mimeType: true, type: true, originalName: true },
        })

        if (!media) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 })
        }

        // Determine the source URL to download from
        let sourceUrl = media.url
        if (media.storageFileId) {
            sourceUrl = `https://drive.google.com/uc?export=download&id=${media.storageFileId}`
        }

        // Download the file from source
        const response = await fetch(sourceUrl, {
            redirect: 'follow',
            headers: {
                // Some CDNs need a user-agent to serve content
                'User-Agent': 'NeeFlow/1.0',
            },
        })

        if (!response.ok) {
            console.error(`[Media Proxy] Failed to download from source: ${response.status} ${response.statusText}`)
            return NextResponse.json({ error: 'Failed to download media' }, { status: 502 })
        }

        // Get the actual content type
        const contentType = media.mimeType
            || response.headers.get('content-type')
            || (media.type === 'video' ? 'video/mp4' : 'image/jpeg')

        // Stream the response
        const body = response.body
        if (!body) {
            return NextResponse.json({ error: 'Empty response from source' }, { status: 502 })
        }

        // Set appropriate headers
        const headers = new Headers()
        headers.set('Content-Type', contentType)
        headers.set('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
        if (response.headers.get('content-length')) {
            headers.set('Content-Length', response.headers.get('content-length')!)
        }
        // Set filename for downloads
        const ext = contentType.includes('video') ? 'mp4' : contentType.includes('png') ? 'png' : 'jpg'
        headers.set('Content-Disposition', `inline; filename="${media.originalName || `media.${ext}`}"`)

        return new NextResponse(body as unknown as ReadableStream, {
            status: 200,
            headers,
        })
    } catch (err) {
        console.error('[Media Proxy] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
