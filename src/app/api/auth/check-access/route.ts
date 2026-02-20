import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/auth/check-access — determine if user has staff access, portal access, or both
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a CUSTOMER member of any channel
    const customerMemberships = await prisma.channelMember.count({
        where: { userId: session.user.id, role: 'CUSTOMER' },
    })

    // Check if user is a non-CUSTOMER member (staff) of any channel, or has staff role
    const isStaff = user.role === 'ADMIN' || user.role === 'MANAGER'
    const isCustomer = user.role === 'CUSTOMER' || customerMemberships > 0

    // Staff users who also have customer channel memberships → dual access
    const hasDualAccess = isStaff && isCustomer

    return NextResponse.json({
        role: user.role,
        isStaff,
        isCustomer,
        hasDualAccess,
        customerChannelCount: customerMemberships,
    })
}
