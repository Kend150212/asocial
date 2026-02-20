import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/profile — get current user profile
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
            createdAt: true,
            preference: { select: { locale: true } },
        },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
}

// PUT /api/user/profile — update firstName, lastName
export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName } = await req.json()

    if (!firstName?.trim() || !lastName?.trim()) {
        return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            name: `${firstName.trim()} ${lastName.trim()}`,
        },
        select: { id: true, firstName: true, lastName: true, name: true, email: true },
    })

    return NextResponse.json(updated)
}
