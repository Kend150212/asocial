import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/invite/[token] — validate token, return invite info
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    const invite = await prisma.channelInvite.findUnique({
        where: { token },
        include: { channel: { select: { displayName: true } } },
    })

    if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    if (invite.acceptedAt) return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })

    return NextResponse.json({
        email: invite.email,
        name: invite.name,
        channelName: invite.channel.displayName,
    })
}

// POST /api/invite/[token] — accept invite, set name + password, activate account
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params
    const { name, password } = await req.json()

    if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const invite = await prisma.channelInvite.findUnique({
        where: { token },
        include: { channel: { select: { id: true, displayName: true } } },
    })

    if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    if (invite.acceptedAt) return NextResponse.json({ error: 'Already used' }, { status: 410 })
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })

    const passwordHash = await bcrypt.hash(password, 12)

    // Activate user account
    await prisma.user.update({
        where: { email: invite.email },
        data: {
            name: name || invite.name || invite.email.split('@')[0],
            passwordHash,
            isActive: true,
        },
    })

    // Mark invite as accepted
    await prisma.channelInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
    })

    return NextResponse.json({ ok: true, email: invite.email })
}
