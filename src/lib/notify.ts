import { prisma } from '@/lib/prisma'

// ─── SSE broadcaster ─────────────────────────────────────────────────────────
// Map of userId → set of SSE response controllers
const sseClients = new Map<string, Set<ReadableStreamDefaultController>>()

export function addSSEClient(userId: string, controller: ReadableStreamDefaultController) {
    if (!sseClients.has(userId)) sseClients.set(userId, new Set())
    sseClients.get(userId)!.add(controller)
}

export function removeSSEClient(userId: string, controller: ReadableStreamDefaultController) {
    sseClients.get(userId)?.delete(controller)
}

export function broadcastToUser(userId: string, payload: object) {
    const clients = sseClients.get(userId)
    if (!clients || clients.size === 0) return
    const data = `data: ${JSON.stringify(payload)}\n\n`
    for (const ctrl of clients) {
        try {
            ctrl.enqueue(new TextEncoder().encode(data))
        } catch {
            // Client disconnected — will be cleaned up on close
        }
    }
}

// ─── Notification types ───────────────────────────────────────────────────────
export type NotificationType =
    | 'post_published'
    | 'post_failed'
    | 'approval_needed'
    | 'approval_approved'
    | 'approval_rejected'
    | 'member_invited'
    | 'info'

// ─── createNotification ───────────────────────────────────────────────────────
export async function createNotification({
    userId,
    type,
    title,
    message,
    data,
    link,
}: {
    userId: string
    type: NotificationType
    title: string
    message?: string
    data?: Record<string, unknown>
    link?: string
}) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message: message ?? null,
                data: { ...(data ?? {}), link: link ?? null },
            },
        })

        // Count unread for this user and broadcast to any open SSE connections
        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        })
        broadcastToUser(userId, { type: 'new_notification', notification, unreadCount })

        return notification
    } catch (err) {
        console.error('[Notify] Failed to create notification:', err)
        return null
    }
}

// ─── notifyChannelAdmins ──────────────────────────────────────────────────────
// Helper to notify all OWNER/ADMIN/MANAGER members of a channel (excluding excludeUserId)
export async function notifyChannelAdmins({
    channelId,
    excludeUserId,
    type,
    title,
    message,
    data,
    link,
}: {
    channelId: string
    excludeUserId?: string
    type: NotificationType
    title: string
    message?: string
    data?: Record<string, unknown>
    link?: string
}) {
    try {
        const admins = await prisma.channelMember.findMany({
            where: {
                channelId,
                role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
                ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
            },
            select: { userId: true },
        })
        await Promise.all(
            admins.map((m) => createNotification({ userId: m.userId, type, title, message, data, link }))
        )
    } catch (err) {
        console.error('[Notify] notifyChannelAdmins failed:', err)
    }
}
