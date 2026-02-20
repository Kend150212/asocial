import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/user/change-password
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmNewPassword } = await req.json()

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (newPassword !== confirmNewPassword) {
        return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
        return NextResponse.json(
            { error: 'Cannot change password for accounts that use Google sign-in' },
            { status: 400 }
        )
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
    })

    return NextResponse.json({ success: true })
}
