import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/oauth/facebook/confirm
 * Import only the user-selected Facebook pages into the channel
 * Body: { payload: string (encrypted), selectedPageIds: string[] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { payload: encryptedPayload, selectedPageIds } = body

        if (!encryptedPayload || !selectedPageIds?.length) {
            return NextResponse.json({ error: 'Missing payload or selectedPageIds' }, { status: 400 })
        }

        // Decrypt the payload
        let data: {
            channelId: string
            userId: string
            pages: Array<{ id: string; name: string; access_token: string }>
            timestamp: number
        }
        try {
            data = JSON.parse(decrypt(encryptedPayload))
        } catch {
            return NextResponse.json({ error: 'Invalid or expired payload' }, { status: 400 })
        }

        // Check if payload is not too old (15 min max)
        if (Date.now() - data.timestamp > 15 * 60 * 1000) {
            return NextResponse.json({ error: 'Session expired. Please reconnect.' }, { status: 400 })
        }

        const selectedSet = new Set(selectedPageIds as string[])
        const selectedPages = data.pages.filter(p => selectedSet.has(p.id))

        if (selectedPages.length === 0) {
            return NextResponse.json({ error: 'No valid pages selected' }, { status: 400 })
        }

        let imported = 0
        const errors: string[] = []

        for (const page of selectedPages) {
            try {
                await prisma.channelPlatform.upsert({
                    where: {
                        channelId_platform_accountId: {
                            channelId: data.channelId,
                            platform: 'facebook',
                            accountId: page.id,
                        },
                    },
                    update: {
                        accountName: page.name,
                        accessToken: page.access_token,
                        connectedBy: data.userId,
                        isActive: true,
                        config: { source: 'oauth' },
                    },
                    create: {
                        channelId: data.channelId,
                        platform: 'facebook',
                        accountId: page.id,
                        accountName: page.name,
                        accessToken: page.access_token,
                        connectedBy: data.userId,
                        isActive: true,
                        config: { source: 'oauth' },
                    },
                })

                // Also update tokens for the same page in other channels
                const updated = await prisma.channelPlatform.updateMany({
                    where: {
                        platform: 'facebook',
                        accountId: page.id,
                        channelId: { not: data.channelId },
                    },
                    data: {
                        accessToken: page.access_token,
                        isActive: true,
                    },
                })
                if (updated.count > 0) {
                    console.log(`[Facebook OAuth] 🔄 Also updated token for ${updated.count} other channel(s) with page ${page.name}`)
                }

                imported++
                console.log(`[Facebook OAuth] ✅ Imported: ${page.name} (${page.id})`)
            } catch (upsertErr) {
                console.error(`[Facebook OAuth] ❌ Failed to import ${page.name} (${page.id}):`, upsertErr)
                errors.push(`${page.name}: ${upsertErr}`)
            }
        }

        // Remove pages that were deselected (existed before but user unchecked them)
        const allAvailableIds = data.pages.map(p => p.id)
        const deselectedIds = allAvailableIds.filter(id => !selectedSet.has(id))
        if (deselectedIds.length > 0) {
            const removed = await prisma.channelPlatform.deleteMany({
                where: {
                    channelId: data.channelId,
                    platform: 'facebook',
                    accountId: { in: deselectedIds },
                },
            })
            if (removed.count > 0) {
                console.log(`[Facebook OAuth] 🗑️ Removed ${removed.count} deselected page(s)`)
            }
        }

        // Subscribe selected pages to webhook
        for (const page of selectedPages) {
            try {
                const allFields = 'feed,messages,messaging_postbacks,message_deliveries,message_reads,message_echoes'
                const feedOnly = 'feed'

                let subRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscribed_fields: allFields,
                            access_token: page.access_token,
                        }),
                    }
                )
                let subData = await subRes.json()

                if (!subData.success && JSON.stringify(subData).includes('pages_messaging')) {
                    subRes = await fetch(
                        `https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscribed_fields: feedOnly,
                                access_token: page.access_token,
                            }),
                        }
                    )
                    subData = await subRes.json()
                }

                if (subData.success) {
                    console.log(`[Facebook OAuth] 🔔 Webhook subscribed: ${page.name}`)
                } else {
                    console.warn(`[Facebook OAuth] ⚠️ Webhook subscription failed for ${page.name}:`, JSON.stringify(subData))
                }
            } catch (subErr) {
                console.error(`[Facebook OAuth] ❌ Webhook subscription error for ${page.name}:`, subErr)
            }
        }

        console.log(`[Facebook OAuth] Done: imported ${imported}/${selectedPages.length} pages. Errors: ${errors.length}`)

        return NextResponse.json({
            success: true,
            imported,
            errors: errors.length,
            redirectUrl: `/dashboard/channels/${data.channelId}?tab=platforms&oauth=facebook&imported=${imported}`,
        })
    } catch (err) {
        console.error('[Facebook OAuth Confirm] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
