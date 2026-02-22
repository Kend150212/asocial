import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/oauth/instagram/confirm
 * Import only the user-selected Instagram accounts into the channel
 * Body: { payload: string (encrypted), selectedAccountIds: string[] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { payload: encryptedPayload, selectedAccountIds } = body

        if (!encryptedPayload || !selectedAccountIds?.length) {
            return NextResponse.json({ error: 'Missing payload or selectedAccountIds' }, { status: 400 })
        }

        // Decrypt the payload
        let data: {
            channelId: string
            userId: string
            userAccessToken: string
            accounts: Array<{
                igId: string
                igUsername: string
                igName: string
                profilePic: string | null
                pageId: string
                pageName: string
            }>
            timestamp: number
        }
        try {
            data = JSON.parse(decrypt(encryptedPayload))
        } catch {
            return NextResponse.json({ error: 'Invalid or expired payload' }, { status: 400 })
        }

        // Check expiry (15 min)
        if (Date.now() - data.timestamp > 15 * 60 * 1000) {
            return NextResponse.json({ error: 'Session expired. Please reconnect.' }, { status: 400 })
        }

        const selectedSet = new Set(selectedAccountIds as string[])
        const selectedAccounts = data.accounts.filter(a => selectedSet.has(a.igId))

        if (selectedAccounts.length === 0) {
            return NextResponse.json({ error: 'No valid accounts selected' }, { status: 400 })
        }

        let imported = 0
        const errors: string[] = []

        for (const acc of selectedAccounts) {
            try {
                await prisma.channelPlatform.upsert({
                    where: {
                        channelId_platform_accountId: {
                            channelId: data.channelId,
                            platform: 'instagram',
                            accountId: acc.igId,
                        },
                    },
                    update: {
                        accountName: acc.igUsername,
                        accessToken: data.userAccessToken,
                        connectedBy: data.userId,
                        isActive: true,
                        config: { source: 'oauth', pageId: acc.pageId, pageName: acc.pageName },
                    },
                    create: {
                        channelId: data.channelId,
                        platform: 'instagram',
                        accountId: acc.igId,
                        accountName: acc.igUsername,
                        accessToken: data.userAccessToken,
                        connectedBy: data.userId,
                        isActive: true,
                        config: { source: 'oauth', pageId: acc.pageId, pageName: acc.pageName },
                    },
                })

                // Also update tokens for the same account in other channels
                const updated = await prisma.channelPlatform.updateMany({
                    where: {
                        platform: 'instagram',
                        accountId: acc.igId,
                        channelId: { not: data.channelId },
                    },
                    data: {
                        accessToken: data.userAccessToken,
                        isActive: true,
                    },
                })
                if (updated.count > 0) {
                    console.log(`[Instagram OAuth] 🔄 Also updated token for ${updated.count} other channel(s) with @${acc.igUsername}`)
                }

                imported++
                console.log(`[Instagram OAuth] ✅ Imported: @${acc.igUsername} (${acc.igId}) linked to ${acc.pageName}`)
            } catch (upsertErr) {
                console.error(`[Instagram OAuth] ❌ Failed to import @${acc.igUsername}:`, upsertErr)
                errors.push(`@${acc.igUsername}: ${upsertErr}`)
            }
        }

        // Remove deselected accounts
        const allAvailableIds = data.accounts.map(a => a.igId)
        const deselectedIds = allAvailableIds.filter(id => !selectedSet.has(id))
        if (deselectedIds.length > 0) {
            const removed = await prisma.channelPlatform.deleteMany({
                where: {
                    channelId: data.channelId,
                    platform: 'instagram',
                    accountId: { in: deselectedIds },
                },
            })
            if (removed.count > 0) {
                console.log(`[Instagram OAuth] 🗑️ Removed ${removed.count} deselected account(s)`)
            }
        }

        console.log(`[Instagram OAuth] Done: imported ${imported}/${selectedAccounts.length} accounts. Errors: ${errors.length}`)

        return NextResponse.json({
            success: true,
            imported,
            errors: errors.length,
            redirectUrl: `/dashboard/channels/${data.channelId}?tab=platforms&oauth=instagram&imported=${imported}`,
        })
    } catch (err) {
        console.error('[Instagram OAuth Confirm] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
