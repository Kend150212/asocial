import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendChannelInviteEmail } from '@/lib/email'

// GET /api/admin/channels/[id]/customers
// Returns: active members (CUSTOMER role) + pending invites
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: channelId } = await params

    const members = await prisma.channelMember.findMany({
        where: { channelId, role: 'CUSTOMER' },
        include: { user: { select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } } },
    })

    // Pending invites (not yet accepted)
    const invites = await prisma.channelInvite.findMany({
        where: { channelId, acceptedAt: null },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ members, invites })
}

// POST /api/admin/channels/[id]/customers
// Body: { email, name }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: channelId } = await params
    const { email, name } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const channel = await prisma.channel.findUnique({ where: { id: channelId } })
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    const existingInvite = await prisma.channelInvite.findUnique({
        where: { channelId_email: { channelId, email } },
    })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                role: 'CUSTOMER',
                isActive: false,
            },
        })
    }

    await prisma.channelMember.upsert({
        where: { userId_channelId: { userId: user.id, channelId } },
        create: { userId: user.id, channelId, role: 'CUSTOMER' },
        update: { role: 'CUSTOMER' },
    })

    const invite = existingInvite
        ? await prisma.channelInvite.update({
            where: { id: existingInvite.id },
            data: { token, expiresAt, name, userId: user.id },
        })
        : await prisma.channelInvite.create({
            data: { channelId, email, name, token, expiresAt, userId: user.id, invitedBy: session.user.id! },
        })

    // Also set User.inviteToken so legacy /setup-password flow works too
    await prisma.user.update({
        where: { id: user.id },
        data: { inviteToken: token, inviteExpiresAt: expiresAt },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'https://asocial.kendymarketing.com'

    try {
        await sendChannelInviteEmail({
            toEmail: email,
            toName: name || email.split('@')[0],
            channelName: channel.displayName,
            inviterName: session.user.name || session.user.email || 'Your team',
            role: 'CUSTOMER',
            appUrl,
            inviteToken: token,
        })
    } catch (emailErr) {
        console.warn('[Invite] Email send failed:', emailErr)
    }

    const inviteUrl = `${appUrl}/invite/${token}`
    return NextResponse.json({ invite, inviteUrl, userId: user.id })
}
