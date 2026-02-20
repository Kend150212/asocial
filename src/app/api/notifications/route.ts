import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications — get user's notifications
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 30,
        }),
        prisma.notification.count({
            where: { userId: session.user.id, isRead: false },
        }),
    ])

    return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
    })

    return NextResponse.json({ success: true })
}
