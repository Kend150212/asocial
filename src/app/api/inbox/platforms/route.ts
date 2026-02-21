import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inbox/platforms
 * Get all platform accounts for the user's channels (for sidebar filter tree)
 */
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    let channelIds: string[]

    if (channelId) {
        channelIds = [channelId]
    } else {
        const memberships = await prisma.channelMember.findMany({
            where: { userId: session.user.id },
            select: { channelId: true },
        })
        channelIds = memberships.map(m => m.channelId)
    }

    const platforms = await prisma.channelPlatform.findMany({
        where: {
            channelId: { in: channelIds },
            isActive: true,
        },
        select: {
            id: true,
            platform: true,
            accountId: true,
            accountName: true,
            channelId: true,
        },
        orderBy: [{ platform: 'asc' }, { accountName: 'asc' }],
    })

    return NextResponse.json({ platforms })
}
