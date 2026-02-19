'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PlatformIcon } from '@/components/platform-icons'

// ─── Types ──────────────────────────────────────────────────

interface CalendarPost {
    id: string
    content: string | null
    status: string
    scheduledAt: string | null
    publishedAt: string | null
    createdAt: string
    channel: { id: string; displayName: string; name: string }
    media: { mediaItem: { id: string; url: string; thumbnailUrl: string | null; type: string } }[]
    platformStatuses: { platform: string; status: string }[]
}

interface Channel {
    id: string
    displayName: string
    name: string
}

// ─── Constants ──────────────────────────────────────────────

const PLATFORMS = ['facebook', 'instagram', 'youtube', 'pinterest', 'linkedin', 'tiktok', 'x']

const PLATFORM_COLORS: Record<string, string> = {
    facebook: 'bg-blue-500',
    instagram: 'bg-pink-500',
    youtube: 'bg-red-500',
    pinterest: 'bg-red-600',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-slate-900',
    x: 'bg-slate-600',
}

const PLATFORM_LABELS: Record<string, string> = {
    facebook: 'FB', instagram: 'IG', youtube: 'YT',
    pinterest: 'PT', linkedin: 'LI', tiktok: 'TK', x: 'X',
}

const STATUS_COLORS: Record<string, string> = {
    PUBLISHED: 'border-l-emerald-500',
    SCHEDULED: 'border-l-blue-500',
    DRAFT: 'border-l-slate-400',
    FAILED: 'border-l-red-500',
    PUBLISHING: 'border-l-amber-500',
    PENDING_APPROVAL: 'border-l-amber-400',
}

// ─── i18n labels ────────────────────────────────────────────

const LABELS = {
    en: {
        title: 'Content Calendar',
        today: 'Today',
        month: 'Month',
        week: 'Week',
        allChannels: 'All Channels',
        allPlatforms: 'All Platforms',
        createPost: 'Create Post',
        noPostsDay: 'No posts',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        months: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'],
        status: {
            PUBLISHED: 'Published', SCHEDULED: 'Scheduled', DRAFT: 'Draft',
            FAILED: 'Failed', PUBLISHING: 'Publishing', PENDING_APPROVAL: 'Pending',
        },
    },
    vi: {
        title: 'Lịch Nội Dung',
        today: 'Hôm nay',
        month: 'Tháng',
        week: 'Tuần',
        allChannels: 'Tất cả kênh',
        allPlatforms: 'Tất cả nền tảng',
        createPost: 'Tạo bài',
        noPostsDay: 'Không có bài',
        days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        status: {
            PUBLISHED: 'Đã đăng', SCHEDULED: 'Đã lên lịch', DRAFT: 'Nháp',
            FAILED: 'Thất bại', PUBLISHING: 'Đang đăng', PENDING_APPROVAL: 'Chờ duyệt',
        },
    },
}

// ─── Helpers ────────────────────────────────────────────────

function getPostDate(post: CalendarPost): Date {
    return new Date(post.scheduledAt || post.publishedAt || post.createdAt)
}

function toLocalDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay() // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

// ─── Post Card ──────────────────────────────────────────────

function PostCard({
    post,
    compact = false,
    onClick,
    locale,
}: {
    post: CalendarPost
    compact?: boolean
    onClick: () => void
    locale: 'en' | 'vi'
}) {
    const L = LABELS[locale]
    const postDate = getPostDate(post)
    const timeStr = postDate.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit', minute: '2-digit', hour12: locale === 'en',
    })
    const thumb = post.media[0]?.mediaItem
    const platforms = [...new Set(post.platformStatuses.map(ps => ps.platform))]
    const borderColor = STATUS_COLORS[post.status] || 'border-l-slate-300'

    if (compact) {
        // Month view: compact card
        return (
            <button
                onClick={onClick}
                className={cn(
                    'w-full text-left rounded-md border-l-2 bg-card hover:bg-accent transition-colors cursor-pointer overflow-hidden',
                    borderColor,
                    'flex items-center gap-1.5 px-1.5 py-1 group'
                )}
            >
                {thumb && (
                    <img
                        src={thumb.thumbnailUrl || thumb.url}
                        alt=""
                        className="w-6 h-6 rounded object-cover shrink-0"
                    />
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">{timeStr}</span>
                <span className="text-[10px] font-medium truncate leading-tight">
                    {post.content?.slice(0, 40) || '—'}
                </span>
                <div className="ml-auto flex gap-0.5 shrink-0">
                    {platforms.slice(0, 3).map(p => (
                        <PlatformIcon key={p} platform={p} size="xs" />
                    ))}
                </div>
            </button>
        )
    }

    // Week view: full card
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-lg border-l-[3px] bg-card hover:bg-accent transition-colors cursor-pointer overflow-hidden shadow-sm',
                borderColor,
            )}
        >
            {thumb && (
                <div className="w-full aspect-video bg-muted overflow-hidden">
                    <img
                        src={thumb.thumbnailUrl || thumb.url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="p-2 space-y-1">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                    <span className="ml-auto">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {L.status[post.status as keyof typeof L.status] || post.status}
                        </Badge>
                    </span>
                </div>
                <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground">
                    {post.content || '—'}
                </p>
                <div className="flex items-center gap-1 pt-0.5">
                    {platforms.map(p => (
                        <PlatformIcon key={p} platform={p} size="xs" />
                    ))}
                    <span className="ml-auto text-[9px] text-muted-foreground truncate">
                        {post.channel.displayName}
                    </span>
                </div>
            </div>
        </button>
    )
}

// ─── Month View ─────────────────────────────────────────────

function MonthView({
    currentDate,
    postsByDate,
    onPostClick,
    onDayClick,
    locale,
}: {
    currentDate: Date
    postsByDate: Record<string, CalendarPost[]>
    onPostClick: (post: CalendarPost) => void
    onDayClick: (date: Date) => void
    locale: 'en' | 'vi'
}) {
    const L = LABELS[locale]
    const today = toLocalDateStr(new Date())

    // Build 6-week grid starting from Monday of the first week containing month start
    const monthStart = getMonthStart(currentDate)
    const gridStart = getWeekStart(monthStart)

    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart)
        d.setDate(gridStart.getDate() + i)
        cells.push(d)
    }

    const isCurrentMonth = (d: Date) => d.getMonth() === currentDate.getMonth()

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
                {L.days.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {d}
                    </div>
                ))}
            </div>
            {/* Cells grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                {cells.map((date, idx) => {
                    const dateStr = toLocalDateStr(date)
                    const posts = postsByDate[dateStr] || []
                    const isToday = dateStr === today
                    const inMonth = isCurrentMonth(date)
                    return (
                        <div
                            key={idx}
                            className={cn(
                                'border-r border-b p-1 min-h-0 overflow-hidden flex flex-col gap-0.5',
                                !inMonth && 'bg-muted/20',
                                isToday && 'bg-primary/5',
                            )}
                        >
                            <button
                                onClick={() => onDayClick(date)}
                                className={cn(
                                    'h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium self-end cursor-pointer transition-colors',
                                    isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground',
                                    !inMonth && 'opacity-40',
                                )}
                            >
                                {date.getDate()}
                            </button>
                            {posts.slice(0, 3).map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    compact
                                    onClick={() => onPostClick(post)}
                                    locale={locale}
                                />
                            ))}
                            {posts.length > 3 && (
                                <button
                                    onClick={() => onDayClick(date)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left pl-1"
                                >
                                    +{posts.length - 3} {locale === 'vi' ? 'thêm' : 'more'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Week View ───────────────────────────────────────────────

function WeekView({
    currentDate,
    postsByDate,
    onPostClick,
    locale,
}: {
    currentDate: Date
    postsByDate: Record<string, CalendarPost[]>
    onPostClick: (post: CalendarPost) => void
    locale: 'en' | 'vi'
}) {
    const L = LABELS[locale]
    const today = toLocalDateStr(new Date())
    const weekStart = getWeekStart(currentDate)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        days.push(d)
    }

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
                {days.map((date, i) => {
                    const dateStr = toLocalDateStr(date)
                    const isToday = dateStr === today
                    return (
                        <div key={i} className="py-2.5 text-center border-r last:border-r-0">
                            <p className="text-xs text-muted-foreground">{L.days[i]}</p>
                            <div className={cn(
                                'h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-0.5',
                                isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                            )}>
                                {date.getDate()}
                            </div>
                        </div>
                    )
                })}
            </div>
            {/* Columns */}
            <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                {days.map((date, i) => {
                    const dateStr = toLocalDateStr(date)
                    const posts = postsByDate[dateStr] || []
                    const isToday = dateStr === today
                    return (
                        <div key={i} className={cn('border-r last:border-r-0 p-1.5 flex flex-col gap-1.5 min-h-[400px]', isToday && 'bg-primary/5')}>
                            {posts.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground/50 text-center mt-4">{L.noPostsDay}</p>
                            ) : (
                                posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        compact={false}
                                        onClick={() => onPostClick(post)}
                                        locale={locale}
                                    />
                                ))
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main Page ──────────────────────────────────────────────

export default function CalendarPage() {
    const router = useRouter()
    const { locale } = useI18n()
    const L = LABELS[(locale as 'en' | 'vi')] || LABELS.en

    const [view, setView] = useState<'month' | 'week'>('month')
    const [currentDate, setCurrentDate] = useState(() => new Date())
    const [posts, setPosts] = useState<CalendarPost[]>([])
    const [loading, setLoading] = useState(false)
    const [channels, setChannels] = useState<Channel[]>([])
    const [channelId, setChannelId] = useState<string>('all')
    const [activePlatforms, setActivePlatforms] = useState<Set<string>>(new Set())
    const [showFailed, setShowFailed] = useState(false)

    // Compute from/to for the current view window
    const { from, to, title } = useMemo(() => {
        if (view === 'month') {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            // Extend by 1 week either side to cover partial weeks shown
            const from = getWeekStart(start)
            const to = new Date(from)
            to.setDate(from.getDate() + 41)
            to.setHours(23, 59, 59, 999)
            const title = `${L.months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            return { from, to, title }
        } else {
            const from = getWeekStart(currentDate)
            const to = new Date(from)
            to.setDate(from.getDate() + 6)
            to.setHours(23, 59, 59, 999)
            // Week range label
            const startDay = from.getDate()
            const endDay = to.getDate()
            const startMonth = L.months[from.getMonth()]
            const endMonth = L.months[to.getMonth()]
            const year = to.getFullYear()
            const title = from.getMonth() === to.getMonth()
                ? `${startMonth} ${startDay} – ${endDay}, ${year}`
                : `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
            return { from, to, title }
        }
    }, [view, currentDate, L])

    // Fetch channels
    useEffect(() => {
        fetch('/api/admin/channels')
            .then(r => r.json())
            .then(data => setChannels(Array.isArray(data) ? data : data.channels || []))
            .catch(() => { })
    }, [])

    // Fetch posts
    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const statuses = ['PUBLISHED', 'SCHEDULED', ...(showFailed ? ['FAILED'] : [])].join(',')
            const params = new URLSearchParams({
                from: from.toISOString(),
                to: to.toISOString(),
                status: statuses,
            })
            if (channelId !== 'all') params.set('channelId', channelId)
            const res = await fetch(`/api/admin/posts/calendar?${params}`)
            if (!res.ok) return
            const data = await res.json()
            setPosts(data.posts || [])
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [from, to, channelId, showFailed])

    useEffect(() => { fetchPosts() }, [fetchPosts, showFailed])

    // Filter posts by selected platforms
    const filteredPosts = useMemo(() => {
        if (activePlatforms.size === 0) return posts
        return posts.filter(post =>
            post.platformStatuses.some(ps => activePlatforms.has(ps.platform))
        )
    }, [posts, activePlatforms])

    // Group filtered posts by date string
    const postsByDate = useMemo(() => {
        const map: Record<string, CalendarPost[]> = {}
        for (const post of filteredPosts) {
            const dateStr = toLocalDateStr(getPostDate(post))
            if (!map[dateStr]) map[dateStr] = []
            map[dateStr].push(post)
        }
        return map
    }, [filteredPosts])

    const handlePrev = () => {
        setCurrentDate(d => {
            const next = new Date(d)
            if (view === 'month') next.setMonth(d.getMonth() - 1)
            else next.setDate(d.getDate() - 7)
            return next
        })
    }

    const handleNext = () => {
        setCurrentDate(d => {
            const next = new Date(d)
            if (view === 'month') next.setMonth(d.getMonth() + 1)
            else next.setDate(d.getDate() + 7)
            return next
        })
    }

    const handleToday = () => setCurrentDate(new Date())

    const handlePostClick = (post: CalendarPost) => {
        if (['DRAFT', 'SCHEDULED', 'FAILED'].includes(post.status)) {
            router.push(`/dashboard/posts/compose?edit=${post.id}`)
        } else {
            router.push(`/dashboard/posts/${post.id}`)
        }
    }

    const handleDayClick = (date: Date) => {
        setCurrentDate(date)
        setView('week')
    }

    const togglePlatform = (platform: string) => {
        setActivePlatforms(prev => {
            const next = new Set(prev)
            if (next.has(platform)) next.delete(platform)
            else next.add(platform)
            return next
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* ── Header ── */}
            <div className="flex flex-col gap-3 pb-3 border-b px-1 shrink-0">
                {/* Row 1: Title + nav + view toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 mr-2">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-lg font-bold tracking-tight">{L.title}</h1>
                    </div>

                    {/* Navigation */}
                    <Button variant="outline" size="sm" onClick={handleToday} className="cursor-pointer h-8 text-xs">
                        {L.today}
                    </Button>
                    <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={handlePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[160px] text-center">{title}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center rounded-lg border p-0.5 ml-auto">
                        <button
                            onClick={() => setView('month')}
                            className={cn('px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer', view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            {L.month}
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={cn('px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer', view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            {L.week}
                        </button>
                    </div>

                    {/* Create */}
                    <Button size="sm" className="cursor-pointer h-8 gap-1.5" onClick={() => router.push('/dashboard/posts/compose')}>
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{L.createPost}</span>
                    </Button>

                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Row 2: Channel filter + Platform pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Channel select */}
                    <Select value={channelId} onValueChange={setChannelId}>
                        <SelectTrigger className="h-8 text-xs w-44">
                            <SelectValue placeholder={L.allChannels} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{L.allChannels}</SelectItem>
                            {channels.map(ch => (
                                <SelectItem key={ch.id} value={ch.id}>{ch.displayName || ch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Platform filter pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {PLATFORMS.map(platform => {
                            const isActive = activePlatforms.has(platform)
                            return (
                                <button
                                    key={platform}
                                    onClick={() => togglePlatform(platform)}
                                    className={cn(
                                        'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border transition-all cursor-pointer',
                                        isActive
                                            ? `${PLATFORM_COLORS[platform]} text-white border-transparent`
                                            : 'bg-transparent text-muted-foreground border-muted hover:border-muted-foreground'
                                    )}
                                >
                                    <PlatformIcon platform={platform} size="xs" />
                                    <span className={cn(
                                        isActive ? 'text-foreground' : 'text-muted-foreground'
                                    )}>{PLATFORM_LABELS[platform]}</span>
                                </button>
                            )
                        })}
                        {activePlatforms.size > 0 && (
                            <button
                                onClick={() => setActivePlatforms(new Set())}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
                            >
                                {locale === 'vi' ? 'Xoá bộ lọc' : 'Clear'}
                            </button>
                        )}
                    </div>

                    {/* Failed toggle */}
                    <button
                        onClick={() => setShowFailed(v => !v)}
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ml-auto',
                            showFailed
                                ? 'bg-red-500 text-white border-transparent'
                                : 'bg-transparent text-red-500 border-red-500/40 hover:border-red-500'
                        )}
                    >
                        <span className="w-2 h-2 rounded-full bg-red-500" style={showFailed ? { background: 'rgba(255,255,255,0.7)' } : {}} />
                        {locale === 'vi' ? 'Thất bại' : 'Failed'}
                    </button>
                </div>
            </div>

            {/* ── Calendar body ── */}
            <div className="flex-1 overflow-hidden">
                {view === 'month' ? (
                    <MonthView
                        currentDate={currentDate}
                        postsByDate={postsByDate}
                        onPostClick={handlePostClick}
                        onDayClick={handleDayClick}
                        locale={(locale as 'en' | 'vi') || 'en'}
                    />
                ) : (
                    <WeekView
                        currentDate={currentDate}
                        postsByDate={postsByDate}
                        onPostClick={handlePostClick}
                        locale={(locale as 'en' | 'vi') || 'en'}
                    />
                )}
            </div>
        </div>
    )
}
