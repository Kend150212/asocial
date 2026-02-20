import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDaysLeftInTrial } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

// GET /api/user/trial-status
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ isInTrial: false, daysLeft: 0, trialEndsAt: null })

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { trialEndsAt: true },
    })

    const trialEndsAt = user?.trialEndsAt ?? null
    const daysLeft = getDaysLeftInTrial(trialEndsAt)

    return NextResponse.json({
        isInTrial: daysLeft > 0,
        daysLeft,
        trialEndsAt: trialEndsAt?.toISOString() ?? null,
    })
}
