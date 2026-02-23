import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBrandingServer } from '@/lib/use-branding-server'
import { getPinterestApiBase } from '@/lib/pinterest'

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
        const pinterestBase = await getPinterestApiBase()
        const res = await fetch(`${pinterestBase}/v5/boards?page_size=50`, {
            headers: { Authorization: `Bearer ${platform.accessToken}` },
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error('[Pinterest Boards] API error:', errText)
            return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 502 })
        }

        const data = await res.json()
        let boards = (data.items || []).map((b: { id: string; name: string; description?: string; privacy?: string }) => ({
            id: b.id,
            name: b.name,
            description: b.description || '',
            privacy: b.privacy || 'PUBLIC',
        }))

        // Auto-create a default board if none exist (e.g. in sandbox mode)
        if (boards.length === 0) {
            console.log('[Pinterest Boards] No boards found, auto-creating default board...')
            const createRes = await fetch(`${pinterestBase}/v5/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${platform.accessToken}`,
                },
                body: JSON.stringify({
                    name: (await getBrandingServer()).appName,
                    description: `Auto-created board for ${(await getBrandingServer()).appName} publishing`,
                    privacy: 'PUBLIC',
                }),
            })
            if (createRes.ok) {
                const newBoard = await createRes.json()
                console.log('[Pinterest Boards] Created default board:', newBoard.id, newBoard.name)
                boards = [{
                    id: newBoard.id,
                    name: newBoard.name || (await getBrandingServer()).appName,
                    description: newBoard.description || '',
                    privacy: newBoard.privacy || 'PUBLIC',
                }]
            } else {
                const errText = await createRes.text()
                console.error('[Pinterest Boards] Failed to create default board:', errText)
            }
        }

        return NextResponse.json({ boards })
    } catch (err) {
        console.error('[Pinterest Boards] Error:', err)
        return NextResponse.json({ error: 'Failed to fetch Pinterest boards' }, { status: 500 })
    }
}

// POST /api/admin/channels/[id]/pinterest-boards
// Create a new Pinterest board
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: channelId } = await params
    const { accountId, name, description = '', privacy = 'PUBLIC' } = await req.json()

    if (!accountId || !name?.trim()) {
        return NextResponse.json({ error: 'accountId and board name are required' }, { status: 400 })
    }

    const platform = await prisma.channelPlatform.findFirst({
        where: { channelId, platform: 'pinterest', accountId, isActive: true },
    })

    if (!platform?.accessToken) {
        return NextResponse.json({ error: 'Pinterest not connected' }, { status: 404 })
    }

    try {
        const pinterestBase = await getPinterestApiBase()
        const res = await fetch(`${pinterestBase}/v5/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${platform.accessToken}`,
            },
            body: JSON.stringify({ name: name.trim(), description, privacy }),
        })

        const data = await res.json()
        if (!res.ok) {
            console.error('[Pinterest Boards] Create failed:', JSON.stringify(data))
            return NextResponse.json({ error: data.message || 'Failed to create board' }, { status: 502 })
        }

        console.log('[Pinterest Boards] Created board:', data.id, data.name)
        return NextResponse.json({
            board: { id: data.id, name: data.name, description: data.description || '', privacy: data.privacy || 'PUBLIC' }
        })
    } catch (err) {
        console.error('[Pinterest Boards] Create error:', err)
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
    }
}
