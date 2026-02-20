import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/onboarding/status
 * Returns the completion status of key onboarding steps for the current user.
 * Used by the OnboardingChecklist component on the dashboard.
 */
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    // Run checks in parallel
    const [
        channelCount,
        gdriveIntegration,
        aiIntegration,
        socialPlatformCount,
        userGdrive,
    ] = await Promise.all([
        // Has the user created at least one channel?
        prisma.channelMember.count({
            where: { userId, role: { notIn: ['CUSTOMER'] } },
        }),

        // Is Google Drive configured? (admin shared integration OR user's own)
        prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
            select: { id: true },
        }),

        // Is any AI integration (OpenAI, Gemini, etc.) configured?
        prisma.apiIntegration.findFirst({
            where: { category: 'AI', status: 'ACTIVE', apiKeyEncrypted: { not: null } },
            select: { id: true, provider: true },
        }),

        // Has the user connected at least one social platform on any channel?
        prisma.channelPlatform.count({
            where: {
                channel: {
                    members: { some: { userId, role: { notIn: ['CUSTOMER'] } } },
                },
                isActive: true,
            },
        }),

        // Does the user have their own Google Drive connected?
        prisma.user.findUnique({
            where: { id: userId },
            select: { gdriveRefreshToken: true, gdriveFolderId: true },
        }),
    ])

    const hasChannel = channelCount > 0
    const hasGdrive = !!gdriveIntegration || !!(userGdrive?.gdriveRefreshToken && userGdrive?.gdriveFolderId)
    const hasAI = !!aiIntegration
    const hasSocialPlatform = socialPlatformCount > 0

    // Onboarding is complete when all key steps are done
    const isComplete = hasChannel && hasGdrive && hasSocialPlatform

    return NextResponse.json({
        isComplete,
        steps: {
            hasAI,
            hasGdrive,
            hasChannel,
            hasSocialPlatform,
        },
        isAdmin,
    })
}
