import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendApprovalWebhooks } from '@/lib/webhook-notify'

/**
 * POST /api/admin/posts/[id]/approve
 * Body: { action: 'approved' | 'rejected', comment?: string }
 * Creates a PostApproval record, updates post status, fires webhook.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { action, comment } = body as { action: 'approved' | 'rejected'; comment?: string }

    if (!['approved', 'rejected'].includes(action)) {
        return NextResponse.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            channel: true,
            author: true,
        },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Create approval record
    await prisma.postApproval.create({
        data: {
            postId: id,
            userId: session.user.id,
            action,
            comment: comment || null,
        },
    })

    // Update post status
    // → approved + has scheduledAt → SCHEDULED (shows in Queue + Calendar)
    // → approved + no scheduledAt → APPROVED (manual/immediate publish)
    // → rejected → REJECTED
    let newStatus: string
    if (action === 'rejected') {
        newStatus = 'REJECTED'
    } else {
        newStatus = post.scheduledAt ? 'SCHEDULED' : 'APPROVED'
    }
    await prisma.post.update({
        where: { id },
        data: { status: newStatus as never },
    })

    // Send notification to author (in-app)
    try {
        await prisma.notification.create({
            data: {
                userId: post.authorId,
                type: action === 'approved' ? 'approval_approved' : 'approval_rejected',
                title: action === 'approved' ? 'Post Approved ✅' : 'Post Rejected ❌',
                message: comment || (action === 'approved' ? 'Your post has been approved.' : 'Your post has been rejected.'),
                data: { postId: id },
            },
        })
    } catch { /* notifications are optional */ }

    // Fire webhook notifications (Discord / Telegram / Slack / Custom)
    try {
        await sendApprovalWebhooks(
            {
                webhookDiscord: post.channel.webhookDiscord as Record<string, string> | null,
                webhookTelegram: post.channel.webhookTelegram as Record<string, string> | null,
                webhookSlack: post.channel.webhookSlack as Record<string, string> | null,
                webhookCustom: post.channel.webhookCustom as Record<string, string> | null,
                webhookEvents: post.channel.webhookEvents as string[] | null,
            },
            {
                postId: id,
                content: post.content || '',
                action,
                reviewedBy: session.user.name || session.user.email || 'Unknown',
                reviewedAt: new Date(),
                channelName: post.channel.name,
                authorName: post.author?.name || post.author?.email || 'Unknown',
                comment: comment || undefined,
                scheduledAt: post.scheduledAt || null,
            },
        )
    } catch (err) {
        console.warn('[Webhook] Approval notification error:', err)
    }

    return NextResponse.json({ status: newStatus })
}
