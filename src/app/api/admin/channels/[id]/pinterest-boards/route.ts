import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id]/pinterest-boards?accountId=xxx
// Fetches the user's Pinterest boards for the board selector in compose
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: channelId } = await params
    const accountId = req.nextUrl.searchParams.get('accountId')

    if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

    // Find the Pinterest platform connection for this channel
    const platform = await prisma.channelPlatform.findFirst({
        where: {
            channelId,
            platform: 'pinterest',
            accountId,
            isActive: true,
        },
    })

    if (!platform?.accessToken) {
        return NextResponse.json({ error: 'Pinterest not connected or token missing' }, { status: 404 })
    }

    try {
        const res = await fetch('https://api.pinterest.com/v5/boards?page_size=50', {
            headers: { Authorization: `Bearer ${platform.accessToken}` },
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error('[Pinterest Boards] API error:', errText)
            return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 502 })
        }

        const data = await res.json()
        const boards = (data.items || []).map((b: { id: string; name: string; description?: string; privacy?: string }) => ({
            id: b.id,
            name: b.name,
            description: b.description || '',
            privacy: b.privacy || 'PUBLIC',
        }))

        return NextResponse.json({ boards })
    } catch (err) {
        console.error('[Pinterest Boards] Error:', err)
        return NextResponse.json({ error: 'Failed to fetch Pinterest boards' }, { status: 500 })
    }
}
