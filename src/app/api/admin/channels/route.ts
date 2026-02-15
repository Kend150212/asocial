import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels — list all channels (admin only)
export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channels = await prisma.channel.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            displayName: true,
            isActive: true,
            language: true,
            _count: { select: { members: true, posts: true } },
        },
    })

    return NextResponse.json(channels)
}
