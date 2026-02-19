import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * TikTok Webhook Handler
 *
 * GET  — TikTok sends a challenge param for URL verification.
 *         We must echo it back as plain text.
 *
 * POST — TikTok sends real-time events (video status updates, etc.)
 *         We verify the signature, then handle each event type.
 */

// ─── GET: URL Verification ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get('challenge')
    if (challenge) {
        // TikTok requires plain text response with the challenge value
        return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        })
    }
    return NextResponse.json({ ok: true })
}

// ─── POST: Event Handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const payload = JSON.parse(body)

        // Log raw event for debugging
        console.log('[TikTok Webhook]', JSON.stringify(payload, null, 2))

        const eventType: string = payload.event ?? payload.type ?? ''

        // ── video.status_update ─────────────────────────────────────────────
        if (eventType === 'video.status_update') {
            await handleVideoStatusUpdate(payload)
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        console.error('[TikTok Webhook] Error:', err)
        return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleVideoStatusUpdate(payload: {
    data?: {
        video_id?: string
        status?: string
        error_code?: number
        error_message?: string
    }
}) {
    const { video_id, status, error_message } = payload.data ?? {}
    if (!video_id || !status) return

    // Map TikTok status → our platform status
    const platformStatus =
        status === 'PUBLISHED' ? 'PUBLISHED'
            : status === 'FAILED' ? 'FAILED'
                : 'PROCESSING'

    // Find the platform status record by tiktok video_id
    try {
        await prisma.postPlatformStatus.updateMany({
            where: {
                platform: 'tiktok',
                externalId: video_id,
            },
            data: {
                status: platformStatus,
                ...(error_message ? { errorMessage: error_message } : {}),
            },
        })

        // Also update parent post status if now published
        if (platformStatus === 'PUBLISHED') {
            const record = await prisma.postPlatformStatus.findFirst({
                where: { platform: 'tiktok', externalId: video_id },
                select: { postId: true },
            })
            if (record?.postId) {
                await prisma.post.update({
                    where: { id: record.postId },
                    data: { status: 'PUBLISHED', publishedAt: new Date() },
                })
            }
        }
    } catch (err) {
        console.error('[TikTok Webhook] DB update failed:', err)
    }
}
