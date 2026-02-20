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

    // Check channel memberships for dual access detection
    const customerMemberships = await prisma.channelMember.count({
        where: { userId: session.user.id, role: 'CUSTOMER' },
    })

    const staffMemberships = await prisma.channelMember.count({
        where: { userId: session.user.id, role: { not: 'CUSTOMER' } },
    })

    // Primary role check
    const hasStaffRole = user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'STAFF'
    const hasCustomerRole = user.role === 'CUSTOMER'

    // A user has staff access if they have a staff role OR are a non-customer channel member
    const isStaff = hasStaffRole || staffMemberships > 0
    // A user has customer access if they are a CUSTOMER role OR have customer channel memberships
    const isCustomer = hasCustomerRole || customerMemberships > 0

    // Dual access = user can access BOTH dashboard and portal
    const hasDualAccess = isStaff && isCustomer

    return NextResponse.json({
        role: user.role,
        isStaff,
        isCustomer,
        hasDualAccess,
        customerChannelCount: customerMemberships,
        staffChannelCount: staffMemberships,
    })
}
