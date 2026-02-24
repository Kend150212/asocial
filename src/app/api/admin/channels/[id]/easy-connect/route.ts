import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

// GET /api/admin/channels/[id]/easy-connect
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const links = await prisma.easyConnectLink.findMany({
        where: { channelId: params.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            token: true,
            isEnabled: true,
            expiresAt: true,
            createdAt: true,
            passwordHash: false,
        },
    })

    return NextResponse.json(links)
}

// POST /api/admin/channels/[id]/easy-connect
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, password, expiresAt } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const token = randomBytes(32).toString('hex')
    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const link = await prisma.easyConnectLink.create({
        data: {
            channelId: params.id,
            title: title.trim(),
            token,
            passwordHash,
            isEnabled: true,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: session.user.id,
        },
        select: { id: true, title: true, token: true, isEnabled: true, expiresAt: true, createdAt: true },
    })

    return NextResponse.json(link)
}
