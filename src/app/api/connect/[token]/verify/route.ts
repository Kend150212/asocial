import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/connect/[token]/verify
// Verifies the password for a password-protected EasyConnect link.
export async function POST(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    const { password } = await req.json()

    const link = await prisma.easyConnectLink.findUnique({
        where: { token: params.token },
    })

    if (!link || !link.isEnabled) {
        return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }

    if (!link.passwordHash) {
        // No password set — always passes
        return NextResponse.json({ ok: true })
    }

    const valid = await bcrypt.compare(password || '', link.passwordHash)
    if (!valid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
}
