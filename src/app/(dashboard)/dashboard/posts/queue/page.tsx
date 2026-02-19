'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { useWorkspace } from '@/lib/workspace-context'
import {
    CalendarClock, Loader2, PenSquare, Plus, RefreshCw,
    ChevronRight, CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PlatformIcon } from '@/components/platform-icons'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────

interface PlatformStatus { platform: string; status: string }
interface PostMedia { mediaItem: { url: string; thumbnailUrl: string | null } }
interface QueuePost {
    id: string
    content: string | null
    status: string
    scheduledAt: string
    publishedAt: string | null
    channel: { id: string; displayName: string }
    media: PostMedia[]
    platformStatuses: PlatformStatus[]
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatTime(d: string, locale: string) {
    return new Date(d).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit', minute: '2-digit',
    })
}

const STATUS_DOT: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    PUBLISHED: 'bg-emerald-500',
    FAILED: 'bg-red-500',
}

// ─── Page ─────────────────────────────────────────────────────────

export default function QueuePage() {
    const router = useRouter()
    const t = useTranslation()
    const [posts, setPosts] = useState<QueuePost[]>([])
    const [loading, setLoading] = useState(true)
    const { activeChannelId } = useWorkspace()

    // i18n group labels map
    const GROUP_LABELS_MAP: Record<string, string> = {
        today: t('queue.today'),
        tomorrow: t('queue.tomorrow'),
        thisWeek: t('queue.thisWeek'),
        nextWeek: t('queue.nextWeek'),
        later: t('queue.later'),
    }
    const GROUP_ORDER = ['today', 'tomorrow', 'thisWeek', 'nextWeek', 'later']

    function getGroupKey(dateStr: string): string {
        const d = new Date(dateStr)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
        const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)
        const twoWeeks = new Date(today); twoWeeks.setDate(today.getDate() + 14)
        const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        if (dt.getTime() === today.getTime()) return 'today'
        if (dt.getTime() === tomorrow.getTime()) return 'tomorrow'
        if (dt < nextWeek) return 'thisWeek'
        if (dt < twoWeeks) return 'nextWeek'
        return 'later'
    }

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ status: 'SCHEDULED', limit: '100' })
            if (activeChannelId) params.set('channelId', activeChannelId)
            const res = await fetch(`/api/admin/posts?${params}`)
            const data = await res.json()
            setPosts(data.posts || [])
        } catch {
            toast.error(t('queue.loadFailed') || 'Failed to load queue')
        } finally {
            setLoading(false)
        }
    }, [t, activeChannelId])

    useEffect(() => { fetchPosts() }, [fetchPosts])

    // Group by day key
    const grouped = useMemo(() => {
        const map: Record<string, QueuePost[]> = {}
        for (const post of posts) {
            const key = post.scheduledAt ? getGroupKey(post.scheduledAt) : 'later'
            if (!map[key]) map[key] = []
            map[key].push(post)
        }
        for (const key of Object.keys(map)) {
            map[key].sort((a, b) =>
                new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
            )
        }
        return GROUP_ORDER.filter(k => map[k]).map(k => ({ key: k, label: GROUP_LABELS_MAP[k], posts: map[k] }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts])

    const subtitle = posts.length === 1
        ? t('queue.subtitle').replace('{count}', '1')
        : t('queue.subtitlePlural').replace('{count}', String(posts.length))

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <CalendarClock className="h-5 w-5" />
                        {t('queue.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchPosts} className="cursor-pointer h-8 gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" />{t('common.refresh')}
                    </Button>
                    <Button size="sm" onClick={() => router.push('/dashboard/posts/compose')} className="cursor-pointer h-8 gap-1.5">
                        <Plus className="h-3.5 w-3.5" />{t('nav.posts')}
                    </Button>
                </div>
            </div>

            {/* Queue */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-lg font-semibold">{t('queue.empty')}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t('queue.emptyDesc')}</p>
                    <Button onClick={() => router.push('/dashboard/posts/compose')} className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />{t('queue.schedulePost')}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {grouped.map(group => (
                        <div key={group.key}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-muted-foreground">{group.label}</span>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">{group.posts.length}</span>
                            </div>

                            <div className="space-y-2">
                                {group.posts.map(post => {
                                    const platforms = [...new Set(post.platformStatuses.map(ps => ps.platform))]
                                    const thumb = post.media[0]?.mediaItem

                                    return (
                                        <div
                                            key={post.id}
                                            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-shadow group cursor-pointer"
                                            onClick={() => router.push(`/dashboard/posts/compose?edit=${post.id}`)}
                                        >
                                            {/* Time column */}
                                            <div className="shrink-0 text-center w-14">
                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                    {formatTime(post.scheduledAt, 'vi')}
                                                </p>
                                                <div className={cn('h-1.5 w-1.5 rounded-full mx-auto mt-1', STATUS_DOT[post.status] || 'bg-slate-400')} />
                                            </div>

                                            {/* Thumbnail */}
                                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                                {thumb ? (
                                                    <img src={thumb.thumbnailUrl || thumb.url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <PenSquare className="h-4 w-4 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">
                                                    {post.content || <span className="text-muted-foreground/60 italic">{t('queue.noContent')}</span>}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">{post.channel.displayName}</span>
                                                    <div className="flex items-center gap-0.5">
                                                        {platforms.map(p => <PlatformIcon key={p} platform={p} size="xs" />)}
                                                    </div>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-foreground transition-colors" />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
