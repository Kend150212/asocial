import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

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
            { method: 'GET', headers: { 'Accept': 'application/json' } }
        )

        if (!res.ok) {
            return NextResponse.json(
                { error: `Vbout API error: ${res.status}` },
                { status: 502 }
            )
        }

        const data = await res.json()

        // Vbout returns channels grouped by platform, each with pages/profiles sub-arrays:
        // { response: { data: { channels: {
        //     Facebook: { count: 8, pages: [{id, name}, ...] },
        //     Instagram: { count: 5, profiles: [{id, name, screenname, accountId}, ...] },
        //     Twitter: { count: 0, profiles: [] },
        //     "Google Business": { count: 0, pages: [] },
        // } } } }
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

        for (const [platformKey, platformData] of Object.entries(channelsData)) {
            if (!platformData || typeof platformData !== 'object') continue
            const normalizedPlatform = platformMap[platformKey.toLowerCase()] || platformKey.toLowerCase()

            // Extract the actual list — Vbout uses "pages" for Facebook/GBP, "profiles" for others
            const pd = platformData as Record<string, unknown>
            const items = (pd.pages || pd.profiles || pd.channels || []) as Array<Record<string, unknown>>
            if (!Array.isArray(items)) continue

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

        return NextResponse.json({ accounts })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch Vbout channels' },
            { status: 500 }
        )
    }
}
