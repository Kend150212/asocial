import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/webhooks/facebook/subscribe
 * Subscribe all existing Facebook pages to the webhook.
 * Use this for pages that were connected BEFORE the webhook was set up.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all Facebook platform accounts for user's channels
    const memberships = await prisma.channelMember.findMany({
        where: { userId: session.user.id },
        select: { channelId: true },
    })
    const channelIds = memberships.map(m => m.channelId)

    const platforms = await prisma.channelPlatform.findMany({
        where: {
            channelId: { in: channelIds },
            platform: 'facebook',
            isActive: true,
            accessToken: { not: null },
        },
    })

    if (platforms.length === 0) {
        return NextResponse.json({ error: 'No Facebook pages found' }, { status: 404 })
    }

    const results: Array<{ pageId: string; name: string; success: boolean; error?: string }> = []

    for (const p of platforms) {
        try {
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${p.accountId}/subscribed_apps`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscribed_fields: 'feed,messages,messaging_postbacks,message_deliveries,message_reads',
                        access_token: p.accessToken,
                    }),
                }
            )
            const data = await res.json()
            if (data.success) {
                results.push({ pageId: p.accountId, name: p.accountName, success: true })
                console.log(`[FB Subscribe] ✅ ${p.accountName} (${p.accountId})`)
            } else {
                const errorMsg = data.error?.message || JSON.stringify(data)
                results.push({ pageId: p.accountId, name: p.accountName, success: false, error: errorMsg })
                console.warn(`[FB Subscribe] ❌ ${p.accountName}: ${errorMsg}`)
            }
        } catch (err: any) {
            results.push({ pageId: p.accountId, name: p.accountName, success: false, error: err.message })
        }
    }

    const succeeded = results.filter(r => r.success).length
    return NextResponse.json({
        message: `Subscribed ${succeeded}/${results.length} pages`,
        results,
    })
}
