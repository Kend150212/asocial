import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function requireAdmin() {
    const session = await auth()
    if (!session?.user?.id) return null
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (user?.role !== 'ADMIN') return null
    return session.user
}

/**
 * PUT /api/admin/addons/[id] — update an add-on
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Remove fields that shouldn't be updated directly
    delete body.id
    delete body.createdAt
    delete body.updatedAt
    delete body._count
    delete body.subscriptionAddons

    const addon = await db.addon.update({
        where: { id },
        data: body,
    })

    return NextResponse.json(addon)
}

/**
 * DELETE /api/admin/addons/[id] — delete an add-on (if no active subscribers)
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if any active subscriptions use this add-on
    const activeCount = await db.subscriptionAddon.count({
        where: { addonId: id, status: 'active' },
    })

    if (activeCount > 0) {
        return NextResponse.json({
            error: `Cannot delete: ${activeCount} active subscriber(s). Deactivate the add-on instead.`,
            errorVi: `Không thể xóa: ${activeCount} người dùng đang sử dụng. Hãy tắt add-on thay vì xóa.`,
        }, { status: 409 })
    }

    await db.addon.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
