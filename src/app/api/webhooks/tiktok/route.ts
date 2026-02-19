import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * TikTok Webhook Handler
 *
 * GET  — TikTok sends a challenge param for URL verification.
 *         We must echo it back as plain text.
 *
 * POST — TikTok sends real-time events (video status updates, publish complete etc.)
 *         We handle each event type and update DB accordingly.
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

        // ── post.publish.complete ────────────────────────────────────────────
        // Fired when TikTok finishes processing and publishing the video
        if (eventType === 'post.publish.complete') {
            await handlePublishComplete(payload)
        }

        // ── video.status_update (legacy / non-sandbox) ──────────────────────
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

/**
 * post.publish.complete
 * Payload: { client_key, event, create_time, user_openid, content: JSON string }
 * content: { publish_id, publish_type }
 */
async function handlePublishComplete(payload: {
    content?: string
    user_openid?: string
}) {
    let publishId: string | undefined
    try {
        const content = JSON.parse(payload.content ?? '{}')
        publishId = content.publish_id
    } catch {
        console.warn('[TikTok Webhook] Failed to parse content field')
        return
    }

    if (!publishId) {
        console.warn('[TikTok Webhook] post.publish.complete: no publish_id')
        return
    }

    console.log('[TikTok Webhook] publish.complete for publish_id:', publishId)

    try {
        // Update platform status to PUBLISHED
        await prisma.postPlatformStatus.updateMany({
            where: {
                platform: 'tiktok',
                externalId: publishId,
            },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        })

        // Update parent post status too
        const record = await prisma.postPlatformStatus.findFirst({
            where: { platform: 'tiktok', externalId: publishId },
            select: { postId: true },
        })
        if (record?.postId) {
            await prisma.post.update({
                where: { id: record.postId },
                data: { status: 'PUBLISHED', publishedAt: new Date() },
            })
            console.log('[TikTok Webhook] Post', record.postId, 'marked PUBLISHED')
        }
    } catch (err) {
        console.error('[TikTok Webhook] DB update failed:', err)
    }
}

/**
 * video.status_update (legacy format)
 * Payload: { data: { video_id, status, error_code, error_message } }
 */
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

    try {
        await prisma.postPlatformStatus.updateMany({
            where: {
                platform: 'tiktok',
                externalId: video_id,
            },
            data: {
                status: platformStatus,
                ...(platformStatus === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
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
