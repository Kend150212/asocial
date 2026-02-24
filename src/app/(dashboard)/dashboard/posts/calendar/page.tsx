'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useWorkspace } from '@/lib/workspace-context'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Loader2,
    Sparkles,
    GripVertical,
    Undo2,
    Globe,
    AlertCircle,
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
import { toast } from 'sonner'
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core'

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

interface BestTimeSlot {
    date: string
    time: string
    score: number
    platforms: string[]
    reason: string
    tier: 'best' | 'good' | 'fair'
}

interface HolidayInfo {
    date: string
    name: string
    type: string
    classification: string
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

const TIER_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    best: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    good: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
    fair: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
}

const COUNTRY_OPTIONS = [
    { value: 'US', label: '🇺🇸 US' }, { value: 'VN', label: '🇻🇳 Vietnam' },
    { value: 'JP', label: '🇯🇵 Japan' }, { value: 'KR', label: '🇰🇷 Korea' },
    { value: 'CN', label: '🇨🇳 China' }, { value: 'TH', label: '🇹🇭 Thailand' },
    { value: 'SG', label: '🇸🇬 Singapore' }, { value: 'GB', label: '🇬🇧 UK' },
    { value: 'FR', label: '🇫🇷 France' }, { value: 'DE', label: '🇩🇪 Germany' },
    { value: 'AU', label: '🇦🇺 Australia' }, { value: 'CA', label: '🇨🇦 Canada' },
    { value: 'BR', label: '🇧🇷 Brazil' }, { value: 'IN', label: '🇮🇳 India' },
    { value: 'ID', label: '🇮🇩 Indonesia' }, { value: 'PH', label: '🇵🇭 Philippines' },
    { value: 'MX', label: '🇲🇽 Mexico' }, { value: 'IT', label: '🇮🇹 Italy' },
    { value: 'ES', label: '🇪🇸 Spain' }, { value: 'NL', label: '🇳🇱 Netherlands' },
]

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
        bestTimes: 'Best Times',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        months: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'],
        status: {
            PUBLISHED: 'Published', SCHEDULED: 'Scheduled', DRAFT: 'Draft',
            FAILED: 'Failed', PUBLISHING: 'Publishing', PENDING_APPROVAL: 'Pending',
        },
        legend: { best: 'Best', good: 'Good', fair: 'Fair' },
        movedTo: 'Moved to',
        undo: 'Undo',
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
        bestTimes: 'Gợi ý giờ',
        days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        status: {
            PUBLISHED: 'Đã đăng', SCHEDULED: 'Đã lên lịch', DRAFT: 'Nháp',
            FAILED: 'Thất bại', PUBLISHING: 'Đang đăng', PENDING_APPROVAL: 'Chờ duyệt',
        },
        legend: { best: 'Tốt nhất', good: 'Tốt', fair: 'Khá' },
        movedTo: 'Đã chuyển đến',
        undo: 'Hoàn tác',
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

function isDraggable(post: CalendarPost): boolean {
    return ['SCHEDULED', 'DRAFT', 'FAILED'].includes(post.status)
}

// ─── Draggable Post Card ────────────────────────────────────

function DraggablePostCard({
    post,
    compact = false,
    onClick,
    locale,
    draggedId,
}: {
    post: CalendarPost
    compact?: boolean
    onClick: () => void
    locale: 'en' | 'vi'
    draggedId: string | null
}) {
    const canDrag = isDraggable(post)
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: post.id,
        data: { post },
        disabled: !canDrag,
    })

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined

    const isBeingDragged = draggedId === post.id

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(isBeingDragged && 'opacity-30')}
        >
            <PostCardContent
                post={post}
                compact={compact}
                onClick={onClick}
                locale={locale}
                dragHandle={canDrag ? { ...attributes, ...listeners } : undefined}
            />
        </div>
    )
}

function PostCardContent({
    post,
    compact = false,
    onClick,
    locale,
    dragHandle,
}: {
    post: CalendarPost
    compact?: boolean
    onClick: () => void
    locale: 'en' | 'vi'
    dragHandle?: Record<string, unknown>
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
        return (
            <div className={cn(
                'w-full text-left rounded-md border-l-2 bg-card hover:bg-accent transition-colors overflow-hidden',
                borderColor,
                'flex items-center gap-1.5 px-1.5 py-1 group'
            )}>
                {dragHandle && (
                    <button {...dragHandle} className="cursor-grab active:cursor-grabbing touch-none shrink-0 opacity-0 group-hover:opacity-60 transition-opacity">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </button>
                )}
                <button onClick={onClick} className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer">
                    {thumb && (
                        <img src={thumb.thumbnailUrl || thumb.url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeStr}</span>
                    <span className="text-[10px] font-medium truncate leading-tight">{post.content?.slice(0, 40) || '—'}</span>
                    <div className="ml-auto flex gap-0.5 shrink-0">
                        {platforms.slice(0, 3).map(p => (
                            <PlatformIcon key={p} platform={p} size="xs" />
                        ))}
                    </div>
                </button>
            </div>
        )
    }

    // Week view: full card
    return (
        <div className={cn(
            'w-full text-left rounded-lg border-l-[3px] bg-card hover:bg-accent transition-colors overflow-hidden shadow-sm',
            borderColor,
        )}>
            {dragHandle && (
                <div className="flex justify-center py-0.5 opacity-0 group-hover:opacity-60 transition-opacity">
                    <button {...dragHandle} className="cursor-grab active:cursor-grabbing touch-none">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                </div>
            )}
            <button onClick={onClick} className="w-full text-left cursor-pointer">
                {thumb && (
                    <div className="w-full aspect-video bg-muted overflow-hidden">
                        <img src={thumb.thumbnailUrl || thumb.url} alt="" className="w-full h-full object-cover" />
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
        </div>
    )
}

// ─── Best Time Slot Pill ────────────────────────────────────

function BestTimeSlotPill({
    slot,
    locale,
    onClick,
}: {
    slot: BestTimeSlot
    locale: 'en' | 'vi'
    onClick: () => void
}) {
    const style = TIER_STYLES[slot.tier]
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed transition-all',
                'hover:shadow-sm hover:scale-[1.01] cursor-pointer group',
                style.bg, style.border,
            )}
            title={slot.reason}
        >
            <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', style.dot)} />
            <span className={cn('text-[10px] font-semibold', style.text)}>{slot.time}</span>
            <div className="flex gap-0.5 ml-auto shrink-0">
                {slot.platforms.slice(0, 3).map(p => (
                    <PlatformIcon key={p} platform={p} size="xs" />
                ))}
            </div>
        </button>
    )
}

// ─── Holiday Badge ──────────────────────────────────────────

function HolidayBadge({ holiday, compact }: { holiday: HolidayInfo; compact?: boolean }) {
    const emoji = holiday.classification === 'content-friendly' ? '🎉' :
        holiday.classification === 'family' ? '🏠' : '📅'

    if (compact) {
        return (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-[9px] text-violet-700 dark:text-violet-300 truncate">
                <span>{emoji}</span>
                <span className="truncate">{holiday.name}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-xs text-violet-700 dark:text-violet-300">
            <span>{emoji}</span>
            <span className="truncate font-medium">{holiday.name}</span>
            {holiday.classification === 'content-friendly' && (
                <Badge className="ml-auto text-[8px] px-1 py-0 h-3.5 bg-emerald-500 text-white">Boost</Badge>
            )}
            {holiday.classification === 'family' && (
                <Badge className="ml-auto text-[8px] px-1 py-0 h-3.5 bg-amber-500 text-white">⚠️</Badge>
            )}
        </div>
    )
}

// ─── Droppable Day Cell ─────────────────────────────────────

function DroppableCell({
    id,
    children,
    className,
}: {
    id: string
    children: React.ReactNode
    className?: string
}) {
    const { isOver, setNodeRef } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                className,
                isOver && 'ring-2 ring-primary ring-inset bg-primary/5',
            )}
        >
            {children}
        </div>
    )
}

// ─── Month View ─────────────────────────────────────────────

function MonthView({
    currentDate,
    postsByDate,
    onPostClick,
    onDayClick,
    locale,
    holidays,
    draggedId,
    bestTimeSlots,
    showBestTimes,
    onSlotClick,
}: {
    currentDate: Date
    postsByDate: Record<string, CalendarPost[]>
    onPostClick: (post: CalendarPost) => void
    onDayClick: (date: Date) => void
    locale: 'en' | 'vi'
    holidays: HolidayInfo[]
    draggedId: string | null
    bestTimeSlots: BestTimeSlot[]
    showBestTimes: boolean
    onSlotClick: (date: string, time: string) => void
}) {
    const L = LABELS[locale]
    const today = toLocalDateStr(new Date())
    const holidayMap: Record<string, HolidayInfo> = {}
    holidays.forEach(h => { holidayMap[h.date] = h })

    const slotsByDate: Record<string, BestTimeSlot[]> = {}
    bestTimeSlots.forEach(s => {
        if (!slotsByDate[s.date]) slotsByDate[s.date] = []
        slotsByDate[s.date].push(s)
    })

    // Build 6-week grid
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
            <div className="grid grid-cols-7 border-b">
                {L.days.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-y-auto">
                {cells.map((date, idx) => {
                    const dateStr = toLocalDateStr(date)
                    const posts = postsByDate[dateStr] || []
                    const isToday = dateStr === today
                    const inMonth = isCurrentMonth(date)
                    const holiday = holidayMap[dateStr]
                    return (
                        <DroppableCell
                            key={idx}
                            id={`day-${dateStr}`}
                            className={cn(
                                'border-r border-b p-1 min-h-[120px] overflow-hidden flex flex-col gap-0.5',
                                !inMonth && 'bg-muted/20',
                                isToday && 'bg-primary/5',
                            )}
                        >
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onDayClick(date)}
                                    className={cn(
                                        'h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-colors',
                                        isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground',
                                        !inMonth && 'opacity-40',
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                                {holiday && <HolidayBadge holiday={holiday} compact />}
                            </div>
                            {/* Best time slots (compact for month view) */}
                            {showBestTimes && (slotsByDate[dateStr] || []).slice(0, 2).map((slot, si) => (
                                <button
                                    key={`slot-${si}`}
                                    onClick={() => onSlotClick(slot.date, slot.time)}
                                    className={cn(
                                        'w-full flex items-center gap-1 px-1 py-0.5 rounded text-[9px] border border-dashed cursor-pointer truncate',
                                        TIER_STYLES[slot.tier].bg, TIER_STYLES[slot.tier].border,
                                    )}
                                    title={slot.reason}
                                >
                                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', TIER_STYLES[slot.tier].dot)} />
                                    <span className={cn('font-semibold', TIER_STYLES[slot.tier].text)}>{slot.time}</span>
                                </button>
                            ))}
                            {posts.slice(0, 3).map(post => (
                                <DraggablePostCard
                                    key={post.id}
                                    post={post}
                                    compact
                                    onClick={() => onPostClick(post)}
                                    locale={locale}
                                    draggedId={draggedId}
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
                        </DroppableCell>
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
    bestTimeSlots,
    showBestTimes,
    holidays,
    draggedId,
    onSlotClick,
}: {
    currentDate: Date
    postsByDate: Record<string, CalendarPost[]>
    onPostClick: (post: CalendarPost) => void
    locale: 'en' | 'vi'
    bestTimeSlots: BestTimeSlot[]
    showBestTimes: boolean
    holidays: HolidayInfo[]
    draggedId: string | null
    onSlotClick: (date: string, time: string) => void
}) {
    const L = LABELS[locale]
    const today = toLocalDateStr(new Date())
    const weekStart = getWeekStart(currentDate)
    const holidayMap: Record<string, HolidayInfo> = {}
    holidays.forEach(h => { holidayMap[h.date] = h })

    const slotsByDate: Record<string, BestTimeSlot[]> = {}
    bestTimeSlots.forEach(s => {
        if (!slotsByDate[s.date]) slotsByDate[s.date] = []
        slotsByDate[s.date].push(s)
    })

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        days.push(d)
    }

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
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
            <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                {days.map((date, i) => {
                    const dateStr = toLocalDateStr(date)
                    const posts = postsByDate[dateStr] || []
                    const isToday = dateStr === today
                    const holiday = holidayMap[dateStr]
                    const daySlots = slotsByDate[dateStr] || []

                    return (
                        <DroppableCell
                            key={i}
                            id={`day-${dateStr}`}
                            className={cn('border-r last:border-r-0 p-1.5 flex flex-col gap-1.5 min-h-[400px]', isToday && 'bg-primary/5')}
                        >
                            {/* Holiday banner */}
                            {holiday && <HolidayBadge holiday={holiday} />}

                            {/* Best time slots */}
                            {showBestTimes && daySlots.map((slot, si) => (
                                <BestTimeSlotPill
                                    key={`slot-${si}`}
                                    slot={slot}
                                    locale={locale}
                                    onClick={() => onSlotClick(slot.date, slot.time)}
                                />
                            ))}

                            {/* Posts */}
                            {posts.length === 0 && !showBestTimes ? (
                                <p className="text-[10px] text-muted-foreground/50 text-center mt-4">{L.noPostsDay}</p>
                            ) : (
                                posts.map(post => (
                                    <DraggablePostCard
                                        key={post.id}
                                        post={post}
                                        compact={false}
                                        onClick={() => onPostClick(post)}
                                        locale={locale}
                                        draggedId={draggedId}
                                    />
                                ))
                            )}
                        </DroppableCell>
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
    const { activeChannelId, channels } = useWorkspace()
    const [channelId, setChannelId] = useState<string>('all')
    const [activePlatforms, setActivePlatforms] = useState<Set<string>>(new Set())
    const [showFailed, setShowFailed] = useState(false)

    // Best times state
    const [showBestTimes, setShowBestTimes] = useState(false)
    const [bestTimeSlots, setBestTimeSlots] = useState<BestTimeSlot[]>([])
    const [holidays, setHolidays] = useState<HolidayInfo[]>([])
    const [loadingBestTimes, setLoadingBestTimes] = useState(false)
    const [country, setCountry] = useState<string>('auto')
    const [bestTimesMessage, setBestTimesMessage] = useState<string | null>(null)
    const [bestTimesPublishedCount, setBestTimesPublishedCount] = useState<number>(0)
    const [bestTimesMinRequired, setBestTimesMinRequired] = useState<number>(20)

    // DnD state
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [draggedPost, setDraggedPost] = useState<CalendarPost | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    )

    // Sync channelId from workspace
    useEffect(() => {
        setChannelId(activeChannelId ?? 'all')
    }, [activeChannelId])

    // Compute from/to for the current view window
    const { from, to, title } = useMemo(() => {
        if (view === 'month') {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
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

    // Fetch best times + holidays
    const fetchBestTimes = useCallback(async () => {
        if (channelId === 'all' || !showBestTimes) {
            setBestTimeSlots([])
            setHolidays([])
            setBestTimesMessage(null)
            return
        }
        setLoadingBestTimes(true)
        try {
            const params = new URLSearchParams({
                channelId,
                from: from.toISOString(),
                to: to.toISOString(),
            })
            if (activePlatforms.size > 0) {
                params.set('platforms', Array.from(activePlatforms).join(','))
            }
            if (country !== 'auto') {
                params.set('country', country)
            }
            const res = await fetch(`/api/admin/posts/best-times?${params}`)
            if (!res.ok) return
            const data = await res.json()
            setBestTimeSlots(data.slots || [])
            setHolidays(data.holidays || [])
            setBestTimesMessage(data.message || null)
            setBestTimesPublishedCount(data.publishedCount ?? 0)
            setBestTimesMinRequired(data.minRequired ?? 20)
        } catch { /* ignore */ } finally {
            setLoadingBestTimes(false)
        }
    }, [channelId, from, to, activePlatforms, country, showBestTimes])

    useEffect(() => {
        fetchBestTimes()
    }, [fetchBestTimes])

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

    const handleSlotClick = (date: string, time: string) => {
        const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
        router.push(`/dashboard/posts/compose?scheduledAt=${encodeURIComponent(scheduledAt)}`)
    }

    const togglePlatform = (platform: string) => {
        setActivePlatforms(prev => {
            const next = new Set(prev)
            if (next.has(platform)) next.delete(platform)
            else next.add(platform)
            return next
        })
    }

    // ─── DnD Handlers ────────────────────────────────────────

    const handleDragStart = (event: DragStartEvent) => {
        const post = event.active.data.current?.post as CalendarPost
        setDraggedId(event.active.id as string)
        setDraggedPost(post)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setDraggedId(null)
        setDraggedPost(null)

        const { active, over } = event
        if (!over) return

        const droppedDateStr = (over.id as string).replace('day-', '')
        const post = active.data.current?.post as CalendarPost
        if (!post) return

        const oldDate = getPostDate(post)
        const oldDateStr = toLocalDateStr(oldDate)

        // Skip if dropped on same day
        if (droppedDateStr === oldDateStr) return

        // Calculate new scheduledAt (keep same time, change date)
        const newDate = new Date(droppedDateStr + 'T00:00:00')
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0)
        const newScheduledAt = newDate.toISOString()
        const oldScheduledAt = post.scheduledAt

        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === post.id
                ? { ...p, scheduledAt: newScheduledAt }
                : p
        ))

        // Format display date for toast
        const displayDate = newDate.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
        })

        // API call
        try {
            const res = await fetch(`/api/admin/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduledAt: newScheduledAt }),
            })

            if (!res.ok) throw new Error('Failed')

            toast.success(`${L.movedTo} ${displayDate}`, {
                action: {
                    label: L.undo,
                    onClick: async () => {
                        // Undo: revert to old date
                        setPosts(prev => prev.map(p =>
                            p.id === post.id
                                ? { ...p, scheduledAt: oldScheduledAt }
                                : p
                        ))
                        await fetch(`/api/admin/posts/${post.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ scheduledAt: oldScheduledAt }),
                        })
                    },
                },
            })
        } catch {
            // Revert on error
            setPosts(prev => prev.map(p =>
                p.id === post.id
                    ? { ...p, scheduledAt: oldScheduledAt }
                    : p
            ))
            toast.error(locale === 'vi' ? 'Không thể di chuyển bài viết' : 'Failed to move post')
        }
    }

    const handleDragCancel = () => {
        setDraggedId(null)
        setDraggedPost(null)
    }

    // ─── Render ──────────────────────────────────────────────

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
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

                    {/* Row 2: Channel filter + Platform pills + Best Times + Country */}
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
                                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer',
                                showFailed
                                    ? 'bg-red-500 text-white border-transparent'
                                    : 'bg-transparent text-red-500 border-red-500/40 hover:border-red-500'
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500" style={showFailed ? { background: 'rgba(255,255,255,0.7)' } : {}} />
                            {locale === 'vi' ? 'Thất bại' : 'Failed'}
                        </button>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Country selector */}
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="h-8 text-xs w-36">
                                <Globe className="h-3 w-3 mr-1" />
                                <SelectValue placeholder="Auto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">🌍 Auto</SelectItem>
                                {COUNTRY_OPTIONS.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Best Times toggle button */}
                        <button
                            onClick={() => setShowBestTimes(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${showBestTimes
                                ? 'bg-violet-500 text-white'
                                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {loadingBestTimes ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {L.bestTimes}
                        </button>
                    </div>

                    {/* Best Times notification: not enough posts */}
                    {showBestTimes && bestTimesMessage && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>
                                {locale === 'vi'
                                    ? `Cần ít nhất ${bestTimesMinRequired} bài đã đăng để phân tích giờ tốt nhất. Hiện tại: ${bestTimesPublishedCount} bài.`
                                    : bestTimesMessage}
                            </span>
                        </div>
                    )}

                    {/* Best Times info: data-driven indicator */}
                    {showBestTimes && !bestTimesMessage && bestTimeSlots.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                            <Sparkles className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {locale === 'vi'
                                    ? `Gợi ý dựa trên ${bestTimesPublishedCount} bài đã đăng của bạn`
                                    : `Suggestions based on your ${bestTimesPublishedCount} published posts`}
                            </span>
                        </div>
                    )}

                    {/* Row 3: Color legend (when best times is active and has data) */}
                    {showBestTimes && bestTimeSlots.length > 0 && channelId !== 'all' && (
                        <div className="flex items-center gap-4 text-[10px]">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider">
                                {locale === 'vi' ? 'Chú thích:' : 'Legend:'}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-emerald-700 dark:text-emerald-300 font-medium">{L.legend.best} (80-100)</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <span className="text-amber-700 dark:text-amber-300 font-medium">{L.legend.good} (60-79)</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                                <span className="text-orange-700 dark:text-orange-300 font-medium">{L.legend.fair} (40-59)</span>
                            </span>
                            <span className="flex items-center gap-1 ml-2">
                                <span className="text-violet-600 dark:text-violet-400">🎉</span>
                                <span className="text-muted-foreground">{locale === 'vi' ? 'Ngày lễ boost' : 'Holiday boost'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="text-amber-600 dark:text-amber-400">🏠</span>
                                <span className="text-muted-foreground">{locale === 'vi' ? 'Ngày nghỉ gia đình' : 'Family holiday'}</span>
                            </span>
                        </div>
                    )}
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
                            holidays={holidays}
                            draggedId={draggedId}
                            bestTimeSlots={bestTimeSlots}
                            showBestTimes={showBestTimes}
                            onSlotClick={handleSlotClick}
                        />
                    ) : (
                        <WeekView
                            currentDate={currentDate}
                            postsByDate={postsByDate}
                            onPostClick={handlePostClick}
                            locale={(locale as 'en' | 'vi') || 'en'}
                            bestTimeSlots={bestTimeSlots}
                            showBestTimes={showBestTimes}
                            holidays={holidays}
                            draggedId={draggedId}
                            onSlotClick={handleSlotClick}
                        />
                    )}
                </div>
            </div>

            {/* ── Drag Overlay ── */}
            <DragOverlay>
                {draggedPost ? (
                    <div className="opacity-90 shadow-xl scale-105 pointer-events-none">
                        <PostCardContent
                            post={draggedPost}
                            compact={view === 'month'}
                            onClick={() => { }}
                            locale={(locale as 'en' | 'vi') || 'en'}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
