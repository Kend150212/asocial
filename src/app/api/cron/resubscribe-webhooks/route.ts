import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cron/resubscribe-webhooks
 * 
 * Periodically re-subscribe all active Facebook pages to the webhook.
 * Should be called via cron (e.g. every 6 hours) to keep subscriptions alive.
 * 
 * Protections: CRON_SECRET header or query param required.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    // Auth: check cron secret
    const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
    const CRON_SECRET = process.env.CRON_SECRET || 'asocial_cron_2024'
    if (secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active Facebook pages with access tokens
    const platforms = await prisma.channelPlatform.findMany({
        where: {
            platform: 'facebook',
            isActive: true,
            accessToken: { not: null },
        },
        select: {
            id: true,
            accountId: true,
            accountName: true,
            accessToken: true,
        },
    })

    if (platforms.length === 0) {
        return NextResponse.json({ message: 'No active Facebook pages found', results: [] })
    }

    const results: Array<{ pageId: string; name: string; success: boolean; fields?: string; error?: string }> = []

    for (const p of platforms) {
        try {
            const allFields = 'feed,messages,messaging_postbacks,message_deliveries,message_reads,message_echoes'
            const feedOnly = 'feed'

            // Try full subscription first
            let res = await fetch(
                `https://graph.facebook.com/v19.0/${p.accountId}/subscribed_apps`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscribed_fields: allFields,
                        access_token: p.accessToken,
                    }),
                }
            )
            let data = await res.json()

            if (data.success) {
                results.push({ pageId: p.accountId, name: p.accountName, success: true, fields: allFields })
                console.log(`[Cron Resubscribe] ✅ ${p.accountName} (${p.accountId}) — all fields`)
                continue
            }

            // Fallback: feed only if pages_messaging not granted
            if (JSON.stringify(data).includes('pages_messaging')) {
                res = await fetch(
                    `https://graph.facebook.com/v19.0/${p.accountId}/subscribed_apps`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscribed_fields: feedOnly,
                            access_token: p.accessToken,
                        }),
                    }
                )
                data = await res.json()

                if (data.success) {
                    results.push({ pageId: p.accountId, name: p.accountName, success: true, fields: feedOnly })
                    console.log(`[Cron Resubscribe] ✅ ${p.accountName} (${p.accountId}) — feed only`)
                    continue
                }
            }

            // Failed
            const errorMsg = data.error?.message || JSON.stringify(data)
            results.push({ pageId: p.accountId, name: p.accountName, success: false, error: errorMsg })
            console.warn(`[Cron Resubscribe] ❌ ${p.accountName}: ${errorMsg}`)
        } catch (err: any) {
            results.push({ pageId: p.accountId, name: p.accountName, success: false, error: err.message })
            console.error(`[Cron Resubscribe] ❌ ${p.accountName}:`, err)
        }
    }

    const succeeded = results.filter(r => r.success).length
    console.log(`[Cron Resubscribe] Done: ${succeeded}/${results.length} pages subscribed`)

    return NextResponse.json({
        message: `Resubscribed ${succeeded}/${results.length} Facebook pages`,
        results,
    })
}
