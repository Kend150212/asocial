import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/auth/setup-password?token=xxx — Validate invite token
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { inviteToken: token },
        select: { id: true, name: true, email: true, role: true, inviteExpiresAt: true },
    })

    if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 410 })
    }

    return NextResponse.json({
        name: user.name,
        email: user.email,
        role: user.role,
    })
}

// POST /api/auth/setup-password — Set password for invited user
export async function POST(req: NextRequest) {
    const { token, password } = await req.json()

    if (!token || !password) {
        return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { inviteToken: token },
    })

    if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 410 })
    }

    // Set password and clear invite token
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            inviteToken: null,
            inviteExpiresAt: null,
        },
    })

    return NextResponse.json({ success: true, email: user.email })
}
