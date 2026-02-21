import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/inbox/conversations/[id]/like
 * Like a Facebook comment via Graph API
 * Body: { commentExternalId: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { commentExternalId } = body

    if (!commentExternalId) {
        return NextResponse.json({ error: 'commentExternalId is required' }, { status: 400 })
    }

    // Get conversation and platform account
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { channelId: true, platform: true, platformAccountId: true },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Verify access
    const membership = await prisma.channelMember.findFirst({
        where: { channelId: conversation.channelId, userId: session.user.id },
    })

    if (!membership && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (conversation.platform !== 'facebook') {
        return NextResponse.json({ error: 'Like only supported for Facebook' }, { status: 400 })
    }

    const platformAccount = await prisma.channelPlatform.findUnique({
        where: { id: conversation.platformAccountId },
    })

    if (!platformAccount?.accessToken) {
        return NextResponse.json({ error: 'No access token' }, { status: 400 })
    }

    try {
        const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${commentExternalId}/likes`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: platformAccount.accessToken,
                }),
            }
        )
        const fbData = await fbRes.json()

        if (fbData.success) {
            console.log(`[FB Like] ✅ Liked comment: ${commentExternalId}`)
            return NextResponse.json({ success: true })
        } else {
            console.warn(`[FB Like] ⚠️ Like failed:`, JSON.stringify(fbData))
            return NextResponse.json({ error: fbData.error?.message || 'Like failed' }, { status: 400 })
        }
    } catch (err) {
        console.error(`[FB Like] ❌ Error:`, err)
        return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 })
    }
}
