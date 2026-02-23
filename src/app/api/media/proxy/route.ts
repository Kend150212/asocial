import { NextRequest, NextResponse } from 'next/server'

// GET /api/media/proxy?url=... — Proxy remote media for platforms that can't fetch from Google Drive directly
// Used internally by the Threads publisher (and potentially other platforms)
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
                // Mimic browser to avoid Google's cookie warning on large files
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

        const buffer = await res.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(buffer.byteLength),
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (err) {
        console.error('[MediaProxy] Error fetching URL:', url, err)
        return new NextResponse('Failed to fetch media', { status: 502 })
    }
}
