'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────
interface MediaItem { url: string; thumbnailUrl: string | null; type: string; id?: string }
interface PostMedia { mediaItem: MediaItem }
interface Approval { action: string }
interface PlatformStatus { platform: string; status?: string }
interface Post {
    id: string; content: string | null; scheduledAt: string | null; createdAt: string
    status?: string; publishedAt?: string | null
    channel: { id: string; displayName: string; name?: string }
    author?: { name: string | null; email: string }
    media: PostMedia[]; approvals?: Approval[]; platformStatuses: PlatformStatus[]
}
interface Channel { id: string; displayName: string; name: string; isActive: boolean }
interface UserProfile { id: string; name: string | null; email: string; role: string; image: string | null; createdAt: string }

const PLATFORM_ICONS: Record<string, string> = {
    facebook: '📘', instagram: '📸', tiktok: '🎵', youtube: '▶️',
    linkedin: '💼', pinterest: '📌', x: '𝕏', twitter: '𝕏',
}

const PLATFORM_COLORS: Record<string, string> = {
    facebook: 'bg-blue-500', instagram: 'bg-pink-500', youtube: 'bg-red-500',
    pinterest: 'bg-red-600', linkedin: 'bg-blue-700', tiktok: 'bg-slate-800', x: 'bg-slate-600',
}

const PLATFORMS = ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'x']

const STATUS_COLORS: Record<string, string> = {
    PUBLISHED: 'border-l-emerald-500', SCHEDULED: 'border-l-blue-500',
    PENDING_APPROVAL: 'border-l-amber-400', DRAFT: 'border-l-slate-400',
    FAILED: 'border-l-red-500', APPROVED: 'border-l-emerald-500', REJECTED: 'border-l-red-500',
}

const STATUS_LABELS: Record<string, string> = {
    PUBLISHED: 'Published', SCHEDULED: 'Scheduled', PENDING_APPROVAL: 'Pending',
    DRAFT: 'Draft', FAILED: 'Failed',
}

// ─── Calendar helpers ────────────────────────────────────
function getPostDate(post: Post): Date {
    return new Date(post.scheduledAt || post.publishedAt || post.createdAt)
}
function toLocalDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}
function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PortalPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    // Data
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [channels, setChannels] = useState<Channel[]>([])
    const [pendingPosts, setPendingPosts] = useState<Post[]>([])
    const [calendarPosts, setCalendarPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [calLoading, setCalLoading] = useState(false)

    // UI
    const [activeTab, setActiveTab] = useState<'review' | 'calendar'>('review')
    const [selectedChannel, setSelectedChannel] = useState<string>('all')
    const [comments, setComments] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
    const [done, setDone] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({})
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Calendar state
    const [calView, setCalView] = useState<'month' | 'week'>('month')
    const [currentDate, setCurrentDate] = useState(() => new Date())
    const [activePlatforms, setActivePlatforms] = useState<Set<string>>(new Set())

    // Calendar date range
    const { from, to, title: calTitle } = useMemo(() => {
        if (calView === 'month') {
            const start = getMonthStart(currentDate)
            const f = getWeekStart(start)
            const t = new Date(f)
            t.setDate(f.getDate() + 41)
            t.setHours(23, 59, 59, 999)
            return { from: f, to: t, title: `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}` }
        } else {
            const f = getWeekStart(currentDate)
            const t = new Date(f)
            t.setDate(f.getDate() + 6)
            t.setHours(23, 59, 59, 999)
            const startDay = f.getDate()
            const endDay = t.getDate()
            const label = f.getMonth() === t.getMonth()
                ? `${MONTH_NAMES[f.getMonth()]} ${startDay} – ${endDay}, ${t.getFullYear()}`
                : `${MONTH_NAMES[f.getMonth()]} ${startDay} – ${MONTH_NAMES[t.getMonth()]} ${endDay}, ${t.getFullYear()}`
            return { from: f, to: t, title: label }
        }
    }, [calView, currentDate])

    // ─── Load initial data ───────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [profileRes, postsRes] = await Promise.all([
                fetch('/api/portal/profile'),
                fetch('/api/portal/posts'),
            ])
            const profileData = await profileRes.json()
            const postsData = await postsRes.json()
            setProfile(profileData.user)
            setChannels(profileData.channels || [])
            setPendingPosts(postsData.posts || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    // Load calendar data
    const loadCalendar = useCallback(async () => {
        setCalLoading(true)
        try {
            const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
            if (selectedChannel !== 'all') params.set('channelId', selectedChannel)
            const res = await fetch(`/api/portal/calendar?${params}`)
            const data = await res.json()
            setCalendarPosts(data.posts || [])
        } catch (e) { console.error(e) }
        finally { setCalLoading(false) }
    }, [from, to, selectedChannel])

    useEffect(() => {
        if (status === 'loading') return
        if (!session) { router.push('/login'); return }
        if (session.user.role !== 'CUSTOMER') { router.push('/dashboard'); return }
        loadData()
    }, [session, status, router, loadData])

    useEffect(() => {
        if (activeTab === 'calendar' && channels.length > 0) loadCalendar()
    }, [activeTab, loadCalendar, channels.length])

    // ─── Actions ─────────────────────────────────────────
    async function handleAction(postId: string, action: 'APPROVED' | 'REJECTED') {
        setSubmitting((s) => ({ ...s, [postId]: true }))
        const res = await fetch(`/api/portal/posts/${postId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment: comments[postId] || '' }),
        })
        if (res.ok) setDone((d) => ({ ...d, [postId]: action }))
        setSubmitting((s) => ({ ...s, [postId]: false }))
    }

    // ─── Filtered pending posts ──────────────────────────
    const filteredPending = useMemo(() => {
        const p = pendingPosts.filter((p) => !done[p.id])
        if (selectedChannel === 'all') return p
        return p.filter((p) => p.channel.id === selectedChannel)
    }, [pendingPosts, done, selectedChannel])

    // Calendar posts grouped
    const filteredCalPosts = useMemo(() => {
        if (activePlatforms.size === 0) return calendarPosts
        return calendarPosts.filter(p => p.platformStatuses.some(ps => activePlatforms.has(ps.platform)))
    }, [calendarPosts, activePlatforms])

    const postsByDate = useMemo(() => {
        const map: Record<string, Post[]> = {}
        for (const post of filteredCalPosts) {
            const dateStr = toLocalDateStr(getPostDate(post))
            if (!map[dateStr]) map[dateStr] = []
            map[dateStr].push(post)
        }
        return map
    }, [filteredCalPosts])

    const reviewedCount = Object.keys(done).length

    // Calendar nav
    const handlePrev = () => {
        setCurrentDate(d => {
            const next = new Date(d)
            if (calView === 'month') next.setMonth(d.getMonth() - 1)
            else next.setDate(d.getDate() - 7)
            return next
        })
    }
    const handleNext = () => {
        setCurrentDate(d => {
            const next = new Date(d)
            if (calView === 'month') next.setMonth(d.getMonth() + 1)
            else next.setDate(d.getDate() + 7)
            return next
        })
    }
    const handleToday = () => setCurrentDate(new Date())
    const handleDayClick = (date: Date) => { setCurrentDate(date); setCalView('week') }
    const togglePlatform = (platform: string) => {
        setActivePlatforms(prev => {
            const next = new Set(prev)
            if (next.has(platform)) next.delete(platform)
            else next.add(platform)
            return next
        })
    }

    // ─── Loading ─────────────────────────────────────────
    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center gap-4">
                    <Image src="/logo.png" alt="ASocial" width={48} height={48} className="rounded-xl" unoptimized />
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex">
            {/* ─── Mobile overlay ──────────────────────── */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ─── Sidebar ────────────────────────────── */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-[#0f0f16] border-r border-white/[0.06]
                flex flex-col z-40 transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-4 flex items-center gap-3 border-b border-white/[0.06]">
                    <Image src="/logo.png" alt="ASocial" width={32} height={32} className="rounded-xl" unoptimized />
                    <div>
                        <h1 className="font-bold text-sm tracking-tight">ASocial</h1>
                        <p className="text-[9px] text-white/25 uppercase tracking-[0.15em]">Client Portal</p>
                    </div>
                </div>

                {/* Channel Switcher — directly under logo */}
                <div className="px-3 pt-3 pb-2 border-b border-white/[0.06]">
                    <p className="px-2 mb-1.5 text-[9px] text-white/20 uppercase tracking-[0.15em] font-semibold">Your Channels</p>
                    <button
                        onClick={() => setSelectedChannel('all')}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 ${selectedChannel === 'all'
                                ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                            }`}
                    >
                        <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px]">⊕</span>
                        All Channels
                    </button>
                    {channels.map((ch) => (
                        <button
                            key={ch.id}
                            onClick={() => setSelectedChannel(ch.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${selectedChannel === ch.id
                                    ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ch.isActive ? 'bg-emerald-500' : 'bg-white/20'}`} />
                            <span className="truncate">{ch.displayName}</span>
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-0.5">
                    <button
                        onClick={() => { setActiveTab('review'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all ${activeTab === 'review'
                                ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                        Pending Review
                        {filteredPending.length > 0 && (
                            <span className="ml-auto bg-indigo-500/20 text-indigo-400 text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                                {filteredPending.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('calendar'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all ${activeTab === 'calendar'
                                ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Calendar
                    </button>
                </nav>

                {/* Profile */}
                <div className="p-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{profile?.name || 'Customer'}</p>
                            <p className="text-[10px] text-white/25 truncate">{profile?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            title="Sign out"
                            className="p-1 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ───────────────────────── */}
            <main className="flex-1 min-h-screen flex flex-col">
                {/* Top bar (mobile) */}
                <header className="lg:hidden sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/[0.06]">
                    <div className="flex items-center justify-between px-4 h-12">
                        <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 text-white/60">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <Image src="/logo.png" alt="ASocial" width={24} height={24} className="rounded-lg" unoptimized />
                        <div className="w-8" />
                    </div>
                </header>

                {activeTab === 'review' ? (
                    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <ReviewTab
                            posts={filteredPending}
                            comments={comments}
                            setComments={setComments}
                            submitting={submitting}
                            done={done}
                            reviewedCount={reviewedCount}
                            handleAction={handleAction}
                            selectedChannel={selectedChannel}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col px-3 sm:px-4 lg:px-6 py-4 lg:py-6 overflow-hidden">
                        <FullCalendar
                            calView={calView}
                            setCalView={setCalView}
                            currentDate={currentDate}
                            calTitle={calTitle}
                            calLoading={calLoading}
                            postsByDate={postsByDate}
                            activePlatforms={activePlatforms}
                            handlePrev={handlePrev}
                            handleNext={handleNext}
                            handleToday={handleToday}
                            handleDayClick={handleDayClick}
                            togglePlatform={togglePlatform}
                        />
                    </div>
                )}
            </main>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Review Tab
// ─────────────────────────────────────────────────────────
function ReviewTab({
    posts, comments, setComments, submitting, handleAction, reviewedCount, selectedChannel,
}: {
    posts: Post[]
    comments: Record<string, string>
    setComments: React.Dispatch<React.SetStateAction<Record<string, string>>>
    submitting: Record<string, boolean>
    done: Record<string, string>
    reviewedCount: number
    handleAction: (id: string, action: 'APPROVED' | 'REJECTED') => void
    selectedChannel: string
}) {
    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight">Pending Review</h1>
                <p className="text-white/40 text-sm mt-1">
                    {posts.length} post{posts.length !== 1 ? 's' : ''} waiting for your approval
                    {reviewedCount > 0 && <span className="text-emerald-400"> · {reviewedCount} reviewed ✓</span>}
                    {selectedChannel !== 'all' && <span className="text-indigo-400"> · filtered</span>}
                </p>
            </div>

            {reviewedCount > 0 && (
                <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <p className="text-emerald-400 text-sm">{reviewedCount} post{reviewedCount !== 1 ? 's' : ''} reviewed — thank you!</p>
                </div>
            )}

            {posts.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-white/80 mb-1">All caught up!</h2>
                    <p className="text-white/30 text-sm">No posts are waiting for your review.</p>
                </div>
            )}

            <div className="space-y-4">
                {posts.map((post) => (
                    <div key={post.id} className="bg-[#12121a] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.1] transition-colors">
                        <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-indigo-400 font-medium text-xs">{post.channel.displayName}</span>
                                </div>
                                <p className="text-white/30 text-[11px] mt-0.5 ml-3">
                                    by {post.author?.name || post.author?.email || 'Unknown'}
                                    {post.scheduledAt && (
                                        <> · <span className="text-amber-400/60">📅 {new Date(post.scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {post.platformStatuses.map((ps) => (
                                    <span key={ps.platform} title={ps.platform} className="text-sm">{PLATFORM_ICONS[ps.platform] || '📲'}</span>
                                ))}
                            </div>
                        </div>

                        {post.media.length > 0 && (
                            <div className={`grid gap-0.5 ${post.media.length === 1 ? '' : 'grid-cols-2'}`}>
                                {post.media.slice(0, 4).map((m, i) => (
                                    <div key={i} className="relative aspect-video bg-black/60 overflow-hidden">
                                        {m.mediaItem.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <Image src={m.mediaItem.thumbnailUrl || m.mediaItem.url} alt="" fill className="object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {post.content && (
                            <div className="px-4 py-3">
                                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap line-clamp-5">{post.content}</p>
                            </div>
                        )}

                        <div className="px-4 pb-4 space-y-2.5">
                            <textarea
                                value={comments[post.id] || ''}
                                onChange={(e) => setComments((c) => ({ ...c, [post.id]: e.target.value }))}
                                placeholder="Add feedback (optional)..."
                                rows={2}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-white/15"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(post.id, 'REJECTED')}
                                    disabled={submitting[post.id]}
                                    className="flex-1 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-medium py-2 rounded-xl transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(post.id, 'APPROVED')}
                                    disabled={submitting[post.id]}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2 rounded-xl transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

// ─────────────────────────────────────────────────────────
// Full Calendar (ported from dashboard)
// ─────────────────────────────────────────────────────────
function FullCalendar({
    calView, setCalView, currentDate, calTitle, calLoading,
    postsByDate, activePlatforms,
    handlePrev, handleNext, handleToday, handleDayClick, togglePlatform,
}: {
    calView: 'month' | 'week'
    setCalView: (v: 'month' | 'week') => void
    currentDate: Date
    calTitle: string
    calLoading: boolean
    postsByDate: Record<string, Post[]>
    activePlatforms: Set<string>
    handlePrev: () => void
    handleNext: () => void
    handleToday: () => void
    handleDayClick: (date: Date) => void
    togglePlatform: (p: string) => void
}) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header row */}
            <div className="flex flex-col gap-3 pb-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 mr-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <h1 className="text-lg font-bold tracking-tight">Content Calendar</h1>
                    </div>

                    {/* Today button */}
                    <button onClick={handleToday} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs font-medium transition-all">
                        Today
                    </button>

                    {/* Nav */}
                    <div className="flex items-center gap-0.5">
                        <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="text-sm font-semibold min-w-[160px] text-center">{calTitle}</span>
                        <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center rounded-lg border border-white/[0.08] p-0.5 ml-auto">
                        <button
                            onClick={() => setCalView('month')}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${calView === 'month' ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white/70'}`}
                        >Month</button>
                        <button
                            onClick={() => setCalView('week')}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${calView === 'week' ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white/70'}`}
                        >Week</button>
                    </div>

                    {calLoading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                </div>

                {/* Platform filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {PLATFORMS.map(platform => {
                        const isActive = activePlatforms.has(platform)
                        return (
                            <button
                                key={platform}
                                onClick={() => togglePlatform(platform)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border transition-all ${isActive
                                        ? `${PLATFORM_COLORS[platform]} text-white border-transparent`
                                        : 'bg-transparent text-white/30 border-white/10 hover:border-white/25'
                                    }`}
                            >
                                <span>{PLATFORM_ICONS[platform]}</span>
                                {platform.toUpperCase().slice(0, 2)}
                            </button>
                        )
                    })}
                    {activePlatforms.size > 0 && (
                        <button
                            onClick={() => togglePlatform('')}
                            className="text-[10px] text-white/30 hover:text-white/60 transition-colors underline underline-offset-2 ml-1"
                        >Clear</button>
                    )}
                </div>
            </div>

            {/* Calendar body */}
            <div className="flex-1 overflow-hidden bg-[#12121a] border border-white/[0.06] rounded-xl">
                {calView === 'month' ? (
                    <CalMonthView currentDate={currentDate} postsByDate={postsByDate} onDayClick={handleDayClick} />
                ) : (
                    <CalWeekView currentDate={currentDate} postsByDate={postsByDate} />
                )}
            </div>
        </div>
    )
}

// ─── Month View ──────────────────────────────────────────
function CalMonthView({ currentDate, postsByDate, onDayClick }: {
    currentDate: Date; postsByDate: Record<string, Post[]>; onDayClick: (d: Date) => void
}) {
    const today = toLocalDateStr(new Date())
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
        <div className="flex flex-col h-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {DAY_NAMES.map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-semibold text-white/25 uppercase tracking-wider">{d}</div>
                ))}
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                {cells.map((date, idx) => {
                    const dateStr = toLocalDateStr(date)
                    const posts = postsByDate[dateStr] || []
                    const isToday = dateStr === today
                    const inMonth = isCurrentMonth(date)
                    return (
                        <div
                            key={idx}
                            className={`border-r border-b border-white/[0.03] p-1 min-h-0 overflow-hidden flex flex-col gap-0.5 ${!inMonth ? 'opacity-30' : ''
                                } ${isToday ? 'bg-indigo-500/[0.06]' : ''}`}
                        >
                            <button
                                onClick={() => onDayClick(date)}
                                className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-medium self-end transition-colors ${isToday ? 'bg-indigo-500 text-white' : 'text-white/40 hover:bg-white/[0.06]'
                                    }`}
                            >
                                {date.getDate()}
                            </button>
                            {posts.slice(0, 3).map(post => (
                                <div
                                    key={post.id}
                                    className={`flex items-center gap-1 px-1 py-0.5 rounded border-l-2 bg-white/[0.03] hover:bg-white/[0.06] cursor-default transition-colors ${STATUS_COLORS[post.status || 'SCHEDULED'] || 'border-l-slate-400'
                                        }`}
                                    title={post.content?.slice(0, 80) || post.channel.displayName}
                                >
                                    {post.media[0] && (
                                        <img
                                            src={post.media[0].mediaItem.thumbnailUrl || post.media[0].mediaItem.url}
                                            alt=""
                                            className="w-4 h-4 rounded object-cover shrink-0"
                                        />
                                    )}
                                    <span className="text-[9px] text-white/40 shrink-0">
                                        {getPostDate(post).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                    <span className="text-[9px] text-white/60 truncate">{post.content?.slice(0, 30) || '—'}</span>
                                    <div className="ml-auto flex gap-0.5 shrink-0">
                                        {[...new Set(post.platformStatuses.map(ps => ps.platform))].slice(0, 2).map(p => (
                                            <span key={p} className="text-[8px]">{PLATFORM_ICONS[p]}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {posts.length > 3 && (
                                <button onClick={() => onDayClick(date)} className="text-[9px] text-white/25 hover:text-white/50 text-left pl-1 transition-colors">
                                    +{posts.length - 3} more
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Week View ───────────────────────────────────────────
function CalWeekView({ currentDate, postsByDate }: {
    currentDate: Date; postsByDate: Record<string, Post[]>
}) {
    const today = toLocalDateStr(new Date())
    const weekStart = getWeekStart(currentDate)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        days.push(d)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {days.map((date, i) => {
                    const isToday = toLocalDateStr(date) === today
                    return (
                        <div key={i} className="py-2 text-center border-r border-white/[0.03] last:border-r-0">
                            <p className="text-[10px] text-white/25 uppercase">{DAY_NAMES[i]}</p>
                            <div className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-0.5 ${isToday ? 'bg-indigo-500 text-white' : 'text-white/60'
                                }`}>
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
                        <div key={i} className={`border-r border-white/[0.03] last:border-r-0 p-1.5 flex flex-col gap-1.5 min-h-[300px] ${isToday ? 'bg-indigo-500/[0.04]' : ''}`}>
                            {posts.length === 0 ? (
                                <p className="text-[10px] text-white/15 text-center mt-8">No posts</p>
                            ) : (
                                posts.map(post => {
                                    const thumb = post.media[0]?.mediaItem
                                    const platforms = [...new Set(post.platformStatuses.map(ps => ps.platform))]
                                    const time = getPostDate(post).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                                    return (
                                        <div
                                            key={post.id}
                                            className={`rounded-lg border-l-[3px] bg-white/[0.03] hover:bg-white/[0.06] overflow-hidden transition-colors ${STATUS_COLORS[post.status || 'SCHEDULED'] || 'border-l-slate-400'
                                                }`}
                                        >
                                            {thumb && (
                                                <div className="w-full aspect-video bg-black/40 overflow-hidden">
                                                    <img src={thumb.thumbnailUrl || thumb.url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="p-1.5 space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-white/30">{time}</span>
                                                    <span className={`ml-auto text-[8px] px-1 py-0 rounded font-medium ${post.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            post.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {STATUS_LABELS[post.status || ''] || post.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-white/60 leading-snug line-clamp-2">{post.content || '—'}</p>
                                                <div className="flex items-center gap-0.5 pt-0.5">
                                                    {platforms.map(p => <span key={p} className="text-[9px]">{PLATFORM_ICONS[p]}</span>)}
                                                    <span className="ml-auto text-[8px] text-white/20 truncate">{post.channel.displayName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
