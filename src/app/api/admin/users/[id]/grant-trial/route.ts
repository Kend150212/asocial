import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[id]/grant-trial — grant or extend trial
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { days = 14 } = await req.json()

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + Number(days))

    await prisma.user.update({
        where: { id },
        data: { trialEndsAt },
    })

    return NextResponse.json({ trialEndsAt: trialEndsAt.toISOString() })
}

// DELETE /api/admin/users/[id]/grant-trial — revoke trial
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    await prisma.user.update({
        where: { id },
        data: { trialEndsAt: null },
    })

    return NextResponse.json({ success: true })
}
