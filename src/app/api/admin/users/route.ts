import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendInvitationEmail } from '@/lib/email'

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
            inviteToken: true,
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
    const { name, email, password, role, sendInvite } = body

    if (!email || !name) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // If not sending invite, password is required
    if (!sendInvite && !password) {
        return NextResponse.json({ error: 'Password is required when not sending invite' }, { status: 400 })
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // Generate invite token (valid for 7 days)
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // If password provided, hash it; otherwise leave null (invite flow)
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: role || 'MANAGER',
            inviteToken: sendInvite ? inviteToken : null,
            inviteExpiresAt: sendInvite ? inviteExpiresAt : null,
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

    // Send invitation email if requested
    let emailSent = false
    if (sendInvite) {
        const protocol = req.headers.get('x-forwarded-proto') || 'https'
        const host = req.headers.get('host') || 'localhost:3000'
        const appUrl = `${protocol}://${host}`

        const result = await sendInvitationEmail({
            toEmail: email,
            toName: name,
            role: role || 'MANAGER',
            appUrl,
            inviteToken,
        })
        emailSent = result.success
    }

    return NextResponse.json({ ...user, emailSent }, { status: 201 })
}
