import { NextResponse } from 'next/server'
import { authenticateApiKey, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

/**
 * GET /api/v1/channels — List channels the API user has access to
 */
export async function GET(req: NextRequest) {
    const authResult = await authenticateApiKey(req)
    if (authResult instanceof NextResponse) return authResult

    const { user, plan, usage } = authResult

    const channels = await prisma.channel.findMany({
        where: {
            OR: [
                // Admin sees all channels
                ...(user.role === 'ADMIN' ? [{}] : []),
                // Others see channels they're a member of
                { members: { some: { userId: user.id } } },
            ],
        },
        select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            isActive: true,
            createdAt: true,
            platforms: {
                where: { isActive: true },
                select: {
                    id: true,
                    platform: true,
                    accountName: true,
                    isActive: true,
                },
            },
        },
    })

    return apiSuccess(channels, usage.apiCalls, plan.maxApiCallsPerMonth)
}
