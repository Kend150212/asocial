import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// Recursively extract all items (objects) from any nested arrays/objects
function extractItems(obj: unknown): Array<Record<string, unknown>> {
    const results: Array<Record<string, unknown>> = []
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                // If item looks like a channel/account (has id or name), add it
                const rec = item as Record<string, unknown>
                if (rec.id || rec.channelid || rec.channel_id || rec.name) {
                    results.push(rec)
                }
            }
        }
    } else if (obj && typeof obj === 'object') {
        // Scan all values of the object for arrays
        for (const val of Object.values(obj as Record<string, unknown>)) {
            if (Array.isArray(val)) {
                results.push(...extractItems(val))
            }
        }
    }
    return results
}

// GET /api/admin/channels/[id]/platforms/vbout — fetch connected social accounts from Vbout
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params

    // Find Vbout integration with API key
    const vbout = await prisma.apiIntegration.findFirst({
        where: { provider: 'vbout' },
    })

    if (!vbout || !vbout.apiKeyEncrypted) {
        return NextResponse.json(
            { error: 'Vbout is not configured. Please add your Vbout API key in API Hub.' },
            { status: 400 }
        )
    }

    try {
        const baseUrl = vbout.baseUrl || 'https://api.vbout.com/1'
        const apiKey = decrypt(vbout.apiKeyEncrypted)
        const res = await fetch(
            `${baseUrl}/socialmedia/channels.json?key=${apiKey}`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            }
        )

        if (!res.ok) {
            return NextResponse.json(
                { error: `Vbout API error: ${res.status}` },
                { status: 502 }
            )
        }

        const data = await res.json()

        // Check rate limit
        const rateLimit = data?.['rate-limit']
        if (rateLimit?.reached === '1' || rateLimit?.reached === 1) {
            return NextResponse.json(
                { error: `Vbout rate limit reached. Please wait ${rateLimit.after || 1} second(s) and try again.` },
                { status: 429 }
            )
        }

        const channelsData = data?.response?.data?.channels || {}

        // Normalize into a flat array
        const accounts: Array<{
            platform: string
            accountId: string
            accountName: string
            vboutChannelId: string
        }> = []

        // Map Vbout platform names (capitalized) to our internal names
        const platformMap: Record<string, string> = {
            facebook: 'facebook',
            twitter: 'x',
            linkedin: 'linkedin',
            instagram: 'instagram',
            pinterest: 'pinterest',
            youtube: 'youtube',
            tiktok: 'tiktok',
            'google business': 'gbp',
            threads: 'threads',
        }

        // Debug: track what we find per platform
        const debug: Record<string, { keys: string[]; itemCount: number }> = {}

        for (const [platformKey, platformData] of Object.entries(channelsData)) {
            if (!platformData || typeof platformData !== 'object') continue
            const normalizedPlatform = platformMap[platformKey.toLowerCase()] || platformKey.toLowerCase()

            const pd = platformData as Record<string, unknown>
            debug[platformKey] = { keys: Object.keys(pd), itemCount: 0 }

            // Recursively extract all channel/account items from the platform data
            const items = extractItems(pd)
            debug[platformKey].itemCount = items.length

            for (const ch of items) {
                const channelId = String(ch.id || ch.channelid || ch.channel_id || '')
                if (!channelId) continue
                accounts.push({
                    platform: normalizedPlatform,
                    accountId: channelId,
                    accountName: String(ch.name || ch.title || ch.screenname || ch.username || `${normalizedPlatform} Account`),
                    vboutChannelId: channelId,
                })
            }
        }

        return NextResponse.json({ accounts, debug, rateLimit })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch Vbout channels' },
            { status: 500 }
        )
    }
}
