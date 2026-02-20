import { auth } from '@/lib/auth'
import { addSSEClient, removeSSEClient } from '@/lib/notify'
import { prisma } from '@/lib/prisma'

// GET /api/notifications/stream — SSE endpoint
// Pushes real-time notifications to the connected browser tab
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id

    // Send initial unread count immediately on connect
    const initialCount = await prisma.notification.count({
        where: { userId, isRead: false },
    })

    let controller: ReadableStreamDefaultController

    const stream = new ReadableStream({
        start(ctrl) {
            controller = ctrl

            // Register this client
            addSSEClient(userId, controller)

            // Send initial heartbeat + unread count
            const init = `data: ${JSON.stringify({ type: 'connected', unreadCount: initialCount })}\n\n`
            ctrl.enqueue(new TextEncoder().encode(init))

            // Keep-alive ping every 25 seconds to prevent proxy/nginx from dropping idle SSE connections
            const pingInterval = setInterval(() => {
                try {
                    ctrl.enqueue(new TextEncoder().encode(': ping\n\n'))
                } catch {
                    clearInterval(pingInterval)
                }
            }, 25000)

                // Cleanup when client disconnects
                ; (ctrl as unknown as { signal?: AbortSignal }).signal?.addEventListener('abort', () => {
                    clearInterval(pingInterval)
                    removeSSEClient(userId, controller)
                })
        },
        cancel() {
            removeSSEClient(userId, controller)
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    })
}
