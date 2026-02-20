'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    type: string
    title: string
    message: string | null
    data: { link?: string; postId?: string; channelId?: string } | null
    isRead: boolean
    createdAt: string
}

const typeIcon: Record<string, string> = {
    post_published: '✅',
    post_failed: '❌',
    approval_needed: '👀',
    approval_approved: '✅',
    approval_rejected: '❌',
    member_invited: '👋',
    info: 'ℹ️',
}

export function NotificationBell() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const eventSourceRef = useRef<EventSource | null>(null)
    const hasFetchedRef = useRef(false)

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true
            fetchNotifications()
        }
    }, [fetchNotifications])

    // SSE connection for real-time updates
    useEffect(() => {
        const connect = () => {
            if (eventSourceRef.current) eventSourceRef.current.close()
            const es = new EventSource('/api/notifications/stream')
            eventSourceRef.current = es

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data)
                    if (payload.type === 'connected') {
                        setUnreadCount(payload.unreadCount)
                    } else if (payload.type === 'new_notification') {
                        setNotifications((prev) => [payload.notification, ...prev.slice(0, 29)])
                        setUnreadCount(payload.unreadCount)
                    }
                } catch { /* ignore */ }
            }

            es.onerror = () => {
                es.close()
                // Reconnect after 5s
                setTimeout(connect, 5000)
            }
        }
        connect()
        return () => eventSourceRef.current?.close()
    }, [])

    // Fetch full list when panel opens
    useEffect(() => {
        if (open) fetchNotifications()
    }, [open, fetchNotifications])

    const markRead = async (id: string) => {
        await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount((c) => Math.max(0, c - 1))
    }

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        const wasUnread = notifications.find((n) => n.id === id)?.isRead === false
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    }

    const markAllRead = async () => {
        await fetch('/api/notifications', { method: 'PATCH' })
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
    }

    const handleClick = async (n: Notification) => {
        if (!n.isRead) await markRead(n.id)
        setOpen(false)
        const link = n.data?.link
        if (link) router.push(link)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-muted/60 transition-colors" aria-label="Notifications">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-xl" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={markAllRead}>
                            <CheckCheck className="h-3 w-3" /> Mark all read
                        </Button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="max-h-[380px]">
                    {loading && notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={cn(
                                        'group flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40',
                                        !n.isRead && 'bg-blue-500/5'
                                    )}
                                >
                                    {/* Type icon */}
                                    <span className="text-base mt-0.5 shrink-0">{typeIcon[n.type] ?? 'ℹ️'}</span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn('text-xs leading-snug', !n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!n.isRead && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                                                className="p-1 rounded hover:bg-muted"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => deleteNotification(e, n.id)}
                                            className="p-1 rounded hover:bg-muted"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.isRead && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t border-border px-3 py-2 text-center">
                        <span className="text-[11px] text-muted-foreground">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
