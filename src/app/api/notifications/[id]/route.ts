import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await prisma.notification.updateMany({
        where: { id, userId: session.user.id },
        data: { isRead: true },
    })

    return NextResponse.json({ success: true })
}

// DELETE /api/notifications/[id] — delete a notification
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await prisma.notification.deleteMany({
        where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
}
