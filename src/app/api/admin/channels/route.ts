import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels — list all channels
export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channels = await prisma.channel.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { members: true, posts: true, knowledgeBase: true, platforms: true } },
            platforms: {
                select: { platform: true, accountName: true, isActive: true },
            },
        },
    })

    return NextResponse.json(channels)
}

// POST /api/admin/channels — create a new channel
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, displayName, language } = body

    if (!name || !displayName) {
        return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    // Check unique name
    const existing = await prisma.channel.findUnique({ where: { name } })
    if (existing) {
        return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 409 })
    }

    const channel = await prisma.channel.create({
        data: {
            name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            displayName,
            language: language || 'en',
        },
        include: {
            _count: { select: { members: true, posts: true, knowledgeBase: true, platforms: true } },
            platforms: {
                select: { platform: true, accountName: true, isActive: true },
            },
        },
    })

    return NextResponse.json(channel, { status: 201 })
}
