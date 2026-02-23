import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

// GET /api/media/proxy?url=... — Proxy remote media for platforms that can't fetch from Google Drive directly
// Also auto-converts PNG → JPEG for Threads API compliance (Threads only accepts JPEG)
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url')
    if (!url) return new NextResponse('Missing url param', { status: 400 })

    // Only allow known safe domains to prevent abuse
    const allowed = [
        'drive.google.com',
        'googleusercontent.com',
        'lh3.googleusercontent.com',
        'storage.googleapis.com',
    ]
    let parsedUrl: URL
    try {
        parsedUrl = new URL(url)
    } catch {
        return new NextResponse('Invalid URL', { status: 400 })
    }
    const isAllowed = allowed.some(d => parsedUrl.hostname.endsWith(d))
    if (!isAllowed) {
        return new NextResponse('Domain not allowed', { status: 403 })
    }

    try {
        const res = await fetch(url, {
            headers: {
                // Mimic browser to avoid Google's virus-scan redirect for large files
                'User-Agent': 'Mozilla/5.0 (compatible; NeeflowBot/1.0)',
            },
            redirect: 'follow',
        })

        if (!res.ok) {
            return new NextResponse(`Upstream error: ${res.status}`, { status: 502 })
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream'
        // Only allow image/video content types
        if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
            return new NextResponse('Not an image or video', { status: 415 })
        }

        const arrayBuf = await res.arrayBuffer()

        // Threads (Meta) only accepts JPEG — convert PNG/WebP/etc → JPEG
        if (contentType.startsWith('image/') && !contentType.includes('jpeg') && !contentType.includes('jpg')) {
            try {
                const jpegBuffer = await sharp(Buffer.from(arrayBuf))
                    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Replace transparency with white bg
                    .jpeg({ quality: 90 })
                    .toBuffer()

                return new NextResponse(jpegBuffer.buffer as ArrayBuffer, {
                    headers: {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': String(jpegBuffer.byteLength),
                        'Cache-Control': 'public, max-age=3600',
                    },
                })
            } catch (convErr) {
                console.error('[MediaProxy] PNG→JPEG conversion failed, serving original:', convErr)
                // Fall through and serve original if sharp conversion fails
            }
        }

        return new NextResponse(arrayBuf, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(arrayBuf.byteLength),
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (err) {
        console.error('[MediaProxy] Error fetching URL:', url, err)
        return new NextResponse('Failed to fetch media', { status: 502 })
    }
}
