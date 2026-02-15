import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/admin/users — list all users
export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            image: true,
            lastLoginAt: true,
            createdAt: true,
            _count: { select: { channelMembers: true } },
        },
    })

    return NextResponse.json(users)
}

// POST /api/admin/users — create user
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, role } = body

    if (!email || !password || !name) {
        return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: role || 'MANAGER',
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    })

    return NextResponse.json(user, { status: 201 })
}
