import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PATCH /api/admin/channels/[id]/easy-connect/[linkId]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; linkId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, linkId } = await params
    const body = await req.json()
    const update: Record<string, unknown> = {}

    if (typeof body.isEnabled === 'boolean') update.isEnabled = body.isEnabled
    if (body.title !== undefined) update.title = body.title.trim()
    if (body.password !== undefined) {
        update.passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null
    }
    if (body.expiresAt !== undefined) {
        update.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    }

    const link = await prisma.easyConnectLink.update({
        where: { id: linkId, channelId: id },
        data: update,
        select: { id: true, title: true, token: true, isEnabled: true, expiresAt: true, createdAt: true },
    })

    return NextResponse.json(link)
}

// DELETE /api/admin/channels/[id]/easy-connect/[linkId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; linkId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, linkId } = await params

    await prisma.easyConnectLink.delete({
        where: { id: linkId, channelId: id },
    })

    return NextResponse.json({ ok: true })
}
