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

    await prisma.channelPlatform.delete({ where: { id: platformId } })

    return NextResponse.json({ success: true })
}
