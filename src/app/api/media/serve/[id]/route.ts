import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserGDriveAccessToken } from '@/lib/gdrive'

/**
 * GET /api/media/serve/[id]
 *
 * Public proxy endpoint for media files stored on Google Drive.
 * Instagram/Facebook APIs cannot download from Google Drive URLs directly,
 * so this endpoint uses the Google Drive API to download and stream the file.
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
            // Try to get a user-level GDrive access token via the channel owner
            try {
                // Find the channel owner (first member with OWNER/ADMIN role)
                const channelMember = await prisma.channelMember.findFirst({
                    where: { channelId: media.channelId },
                    orderBy: { role: 'asc' }, // OWNER comes first alphabetically
                    select: { userId: true },
                })

                if (channelMember) {
                    const gdriveToken = await getUserGDriveAccessToken(channelMember.userId)
                    sourceUrl = `https://www.googleapis.com/drive/v3/files/${media.storageFileId}?alt=media`
                    fetchHeaders['Authorization'] = `Bearer ${gdriveToken}`
                    console.log(`[Media Proxy] Using Google Drive API (user token) for ${media.originalName || id}`)
                } else {
                    throw new Error('No channel member found')
                }
            } catch (err) {
                // Fallback to public URL if GDrive auth fails
                console.warn(`[Media Proxy] GDrive user auth failed, using public URL:`, (err as Error).message)
                sourceUrl = `https://drive.google.com/uc?export=download&id=${media.storageFileId}`
            }
        }

        // Download the file from source
        const response = await fetch(sourceUrl, {
            redirect: 'follow',
            headers: {
                ...fetchHeaders,
                'User-Agent': 'NeeFlow/1.0',
            },
        })

        if (!response.ok) {
            console.error(`[Media Proxy] Failed to download: ${response.status} ${response.statusText}`)
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
        const respHeaders = new Headers()
        respHeaders.set('Content-Type', contentType)
        respHeaders.set('Cache-Control', 'public, max-age=3600')
        if (response.headers.get('content-length')) {
            respHeaders.set('Content-Length', response.headers.get('content-length')!)
        }
        const ext = contentType.includes('video') ? 'mp4' : contentType.includes('png') ? 'png' : 'jpg'
        respHeaders.set('Content-Disposition', `inline; filename="${media.originalName || `media.${ext}`}"`)

        console.log(`[Media Proxy] Streaming ${media.originalName || id} (${contentType}, ${response.headers.get('content-length') || 'unknown'} bytes)`)

        return new NextResponse(body as unknown as ReadableStream, {
            status: 200,
            headers: respHeaders,
        })
    } catch (err) {
        console.error('[Media Proxy] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
