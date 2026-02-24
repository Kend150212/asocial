import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id]/platforms — list platform connections
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const platforms = await prisma.channelPlatform.findMany({
        where: { channelId: id },
        orderBy: { platform: 'asc' },
    })

    return NextResponse.json(platforms)
}

// POST /api/admin/channels/[id]/platforms — add a platform connection
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { platform, accountId, accountName, config } = body

    if (!platform || !accountId || !accountName) {
        return NextResponse.json(
            { error: 'Platform, Account ID, and Account Name are required' },
            { status: 400 }
        )
    }

    // Check for duplicates
    const existing = await prisma.channelPlatform.findFirst({
        where: { channelId: id, platform, accountId },
    })
    if (existing) {
        return NextResponse.json(
            { error: 'This platform account is already connected' },
            { status: 409 }
        )
    }

    const entry = await prisma.channelPlatform.create({
        data: {
            channelId: id,
            platform,
            accountId,
            accountName,
            config: config || {},
            isActive: true,
        },
    })

    return NextResponse.json(entry, { status: 201 })
}

// PUT /api/admin/channels/[id]/platforms — toggle active status
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const body = await req.json()
    const { platformId, isActive } = body

    if (!platformId) {
        return NextResponse.json({ error: 'Platform ID is required' }, { status: 400 })
    }

    const entry = await prisma.channelPlatform.update({
        where: { id: platformId },
        data: { isActive },
    })

    return NextResponse.json(entry)
}

// DELETE /api/admin/channels/[id]/platforms — remove a platform connection
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const { searchParams } = new URL(req.url)
    const platformId = searchParams.get('platformId')

    if (!platformId) {
        return NextResponse.json({ error: 'Platform ID is required' }, { status: 400 })
    }

    // Fetch the record first so we can unsubscribe from webhooks
    const platform = await prisma.channelPlatform.findUnique({
        where: { id: platformId },
        select: { accountId: true, accessToken: true, platform: true, accountName: true },
    })

    if (!platform) {
        return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // 1. Unsubscribe from Facebook/Instagram webhooks
    if (platform.accessToken && (platform.platform === 'facebook' || platform.platform === 'instagram')) {
        try {
            const unsubRes = await fetch(
                `https://graph.facebook.com/v19.0/${platform.accountId}/subscribed_apps?access_token=${platform.accessToken}`,
                { method: 'DELETE' }
            )
            const unsubData = await unsubRes.json()
            if (unsubData.success) {
                console.log(`[Platform Disconnect] 🔕 Webhook unsubscribed: ${platform.accountName} (${platform.accountId})`)
            } else {
                console.warn(`[Platform Disconnect] ⚠️ Webhook unsubscribe failed for ${platform.accountName}:`, JSON.stringify(unsubData))
            }
        } catch (err) {
            console.error(`[Platform Disconnect] ❌ Webhook unsubscribe error for ${platform.accountName}:`, err)
        }
    }

    // 2. Cascade-delete inbox data: messages → conversations → comments
    //    (Prisma schema doesn't have onDelete:Cascade for platformAccount relations)
    const conversations = await prisma.conversation.findMany({
        where: { platformAccountId: platformId },
        select: { id: true },
    })
    const conversationIds = conversations.map(c => c.id)

    if (conversationIds.length > 0) {
        // Delete messages first (child records)
        await prisma.inboxMessage.deleteMany({
            where: { conversationId: { in: conversationIds } },
        })
        // Delete conversations
        await prisma.conversation.deleteMany({
            where: { id: { in: conversationIds } },
        })
        console.log(`[Platform Disconnect] 🗑️ Deleted ${conversationIds.length} conversations and their messages`)
    }

    // Delete social comments linked to this platform
    await prisma.socialComment.deleteMany({
        where: { platformAccountId: platformId },
    })

    // 3. Delete the platform record itself
    await prisma.channelPlatform.deleteMany({ where: { id: platformId } })

    console.log(`[Platform Disconnect] ✅ Fully disconnected: ${platform.accountName} (${platform.platform})`)
    return NextResponse.json({ success: true })
}
