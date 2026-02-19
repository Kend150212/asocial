import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/channels/[id]/customers/[customerId]
// Body: { action: 'activate' | 'deactivate' }
// DELETE /api/admin/channels/[id]/customers/[customerId]
// Removes customer from channel

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; customerId: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { customerId } = await params
    const { action } = await req.json()

    const isActive = action === 'activate'

    await prisma.user.update({
        where: { id: customerId },
        data: { isActive },
    })

    return NextResponse.json({ ok: true, isActive })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; customerId: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: channelId, customerId } = await params

    // Remove from channel (userId can be user id or invite id)
    await prisma.channelMember.deleteMany({
        where: { channelId, userId: customerId },
    })

    // Also delete pending invite if any
    await prisma.channelInvite.deleteMany({
        where: { channelId, userId: customerId },
    })

    return NextResponse.json({ ok: true })
}
