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

        // Vbout returns channels grouped by platform:
        // { response: { data: { channels: { facebook: [...], instagram: [...], ... } } } }
        const channelsData = data?.response?.data?.channels || data?.response?.data || {}

        // Normalize into a flat array
        const accounts: Array<{
            platform: string
            accountId: string
            accountName: string
            vboutChannelId: string
        }> = []

        // Map Vbout platform names to our internal names
        const platformMap: Record<string, string> = {
            facebook: 'facebook',
            twitter: 'x',
            linkedin: 'linkedin',
            instagram: 'instagram',
            pinterest: 'pinterest',
            youtube: 'youtube',
            tiktok: 'tiktok',
            gmb: 'gbp',
            google_business: 'gbp',
            threads: 'threads',
        }

        for (const [platformKey, channelList] of Object.entries(channelsData)) {
            if (!Array.isArray(channelList)) continue
            const normalizedPlatform = platformMap[platformKey.toLowerCase()] || platformKey.toLowerCase()

            for (const ch of channelList) {
                accounts.push({
                    platform: normalizedPlatform,
                    accountId: String(ch.id || ch.channelid || ch.channel_id || ''),
                    accountName: ch.name || ch.title || ch.username || `${normalizedPlatform} Account`,
                    vboutChannelId: String(ch.id || ch.channelid || ch.channel_id || ''),
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
