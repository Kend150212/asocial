import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/admin/users/[id] — single user with channels + permissions
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            image: true,
            lastLoginAt: true,
            createdAt: true,
            channelMembers: {
                include: {
                    channel: { select: { id: true, name: true, displayName: true } },
                    permission: true,
                },
            },
        },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
}

// PUT /api/admin/users/[id] — update user
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, password, role, isActive } = body

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check email uniqueness if changing
    if (email && email !== existing.email) {
        const dup = await prisma.user.findUnique({ where: { email } })
        if (dup) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (password && password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    })

    return NextResponse.json(updated)
}

// DELETE /api/admin/users/[id]
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent self-delete
    if (id === session.user.id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
