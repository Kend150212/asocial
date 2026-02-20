'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────
interface MediaItem { url: string; thumbnailUrl: string | null; type: string }
interface PostMedia { mediaItem: MediaItem }
interface Approval { action: string }
interface PlatformStatus { platform: string }
interface Post {
    id: string; content: string | null; scheduledAt: string | null; createdAt: string; status?: string
    channel: { id: string; displayName: string }
    author: { name: string | null; email: string }
    media: PostMedia[]; approvals: Approval[]; platformStatuses: PlatformStatus[]
}
interface Channel { id: string; displayName: string; name: string; isActive: boolean }
interface UserProfile { id: string; name: string | null; email: string; role: string; image: string | null; createdAt: string }

const PLATFORM_ICONS: Record<string, string> = {
    facebook: '📘', instagram: '📸', tiktok: '🎵', youtube: '▶️',
    linkedin: '💼', pinterest: '📌', x: '𝕏', twitter: '𝕏',
}

// ─── Calendar helpers ────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function PortalPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    // Data
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [channels, setChannels] = useState<Channel[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    // UI
    const [activeTab, setActiveTab] = useState<'review' | 'calendar'>('review')
    const [selectedChannel, setSelectedChannel] = useState<string>('all')
    const [comments, setComments] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
    const [done, setDone] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({})
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Calendar
    const today = new Date()
    const [calYear, setCalYear] = useState(today.getFullYear())
    const [calMonth, setCalMonth] = useState(today.getMonth())

    // ─── Load data ───────────────────────────────────────
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
            setPosts(postsData.posts || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        if (status === 'loading') return
        if (!session) { router.push('/login'); return }
        if (session.user.role !== 'CUSTOMER') { router.push('/dashboard'); return }
        loadData()
    }, [session, status, router, loadData])

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

    // ─── Filtered posts ─────────────────────────────────
    const filteredPosts = useMemo(() => {
        const pending = posts.filter((p) => !done[p.id])
        if (selectedChannel === 'all') return pending
        return pending.filter((p) => p.channel.id === selectedChannel)
    }, [posts, done, selectedChannel])

    // Calendar posts
    const calendarPosts = useMemo(() => {
        return posts.filter((p) => {
            const d = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.createdAt)
            return d.getFullYear() === calYear && d.getMonth() === calMonth
        })
    }, [posts, calYear, calMonth])

    const postsByDay = useMemo(() => {
        const map: Record<number, Post[]> = {}
        calendarPosts.forEach((p) => {
            const d = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.createdAt)
            const day = d.getDate()
            if (!map[day]) map[day] = []
            map[day].push(p)
        })
        return map
    }, [calendarPosts])

    const reviewedCount = Object.keys(done).length

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
                fixed lg:sticky top-0 left-0 h-screen w-[280px] bg-[#0f0f16] border-r border-white/[0.06]
                flex flex-col z-40 transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-5 flex items-center gap-3 border-b border-white/[0.06]">
                    <Image src="/logo.png" alt="ASocial" width={36} height={36} className="rounded-xl" unoptimized />
                    <div>
                        <h1 className="font-bold text-base tracking-tight">ASocial</h1>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Client Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <button
                        onClick={() => { setActiveTab('review'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'review'
                            ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                        Pending Review
                        {filteredPosts.length > 0 && (
                            <span className="ml-auto bg-indigo-500/20 text-indigo-400 text-xs font-medium min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                                {filteredPosts.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('calendar'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'calendar'
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

                {/* Channels */}
                <div className="px-3 pb-3">
                    <p className="px-3 mb-2 text-[10px] text-white/25 uppercase tracking-widest font-semibold">Your Channels</p>
                    <div className="space-y-0.5">
                        {channels.map((ch) => (
                            <button
                                key={ch.id}
                                onClick={() => setSelectedChannel(selectedChannel === ch.id ? 'all' : ch.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${selectedChannel === ch.id
                                    ? 'bg-white/[0.08] text-white font-medium'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${ch.isActive ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                <span className="truncate">{ch.displayName}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Profile */}
                <div className="p-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{profile?.name || 'Customer'}</p>
                            <p className="text-xs text-white/30 truncate">{profile?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            title="Sign out"
                            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ───────────────────────── */}
            <main className="flex-1 min-h-screen">
                {/* Top bar (mobile) */}
                <header className="lg:hidden sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/[0.06]">
                    <div className="flex items-center justify-between px-4 h-14">
                        <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 text-white/60">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <Image src="/logo.png" alt="ASocial" width={28} height={28} className="rounded-lg" unoptimized />
                        <div className="w-8" />
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                    {activeTab === 'review' ? (
                        <ReviewTab
                            posts={filteredPosts}
                            comments={comments}
                            setComments={setComments}
                            submitting={submitting}
                            done={done}
                            reviewedCount={reviewedCount}
                            handleAction={handleAction}
                            selectedChannel={selectedChannel}
                        />
                    ) : (
                        <CalendarTab
                            calYear={calYear}
                            calMonth={calMonth}
                            setCalYear={setCalYear}
                            setCalMonth={setCalMonth}
                            postsByDay={postsByDay}
                            done={done}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Review Tab
// ─────────────────────────────────────────────────────────
function ReviewTab({
    posts, comments, setComments, submitting, done, reviewedCount, handleAction, selectedChannel,
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
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">
                    Pending Review
                </h1>
                <p className="text-white/40 text-sm mt-1">
                    {posts.length} post{posts.length !== 1 ? 's' : ''} waiting for your approval
                    {reviewedCount > 0 && <span className="text-emerald-400"> · {reviewedCount} reviewed ✓</span>}
                    {selectedChannel !== 'all' && <span className="text-indigo-400"> · filtered</span>}
                </p>
            </div>

            {/* Reviewed banner */}
            {reviewedCount > 0 && (
                <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <p className="text-emerald-400 text-sm">{reviewedCount} post{reviewedCount !== 1 ? 's' : ''} reviewed — thank you!</p>
                </div>
            )}

            {/* Empty state */}
            {posts.length === 0 && (
                <div className="text-center py-24">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white/80 mb-1">All caught up!</h2>
                    <p className="text-white/30 text-sm">No posts are waiting for your review right now.</p>
                </div>
            )}

            {/* Post cards */}
            <div className="space-y-5">
                {posts.map((post) => (
                    <div key={post.id} className="bg-[#12121a] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.1] transition-colors">
                        {/* Card header */}
                        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-indigo-400 font-medium text-sm">{post.channel.displayName}</span>
                                </div>
                                <p className="text-white/30 text-xs mt-1 ml-3.5">
                                    by {post.author.name || post.author.email}
                                    {post.scheduledAt && (
                                        <> · <span className="text-amber-400/60">📅 {new Date(post.scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-1.5">
                                {post.platformStatuses.map((ps) => (
                                    <span key={ps.platform} title={ps.platform} className="text-base">{PLATFORM_ICONS[ps.platform] || '📲'}</span>
                                ))}
                            </div>
                        </div>

                        {/* Media */}
                        {post.media.length > 0 && (
                            <div className={`grid gap-0.5 ${post.media.length === 1 ? '' : 'grid-cols-2'}`}>
                                {post.media.slice(0, 4).map((m, i) => (
                                    <div key={i} className="relative aspect-video bg-black/60 overflow-hidden">
                                        {m.mediaItem.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur">
                                                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <Image src={m.mediaItem.thumbnailUrl || m.mediaItem.url} alt="Media" fill className="object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        {post.content && (
                            <div className="px-5 py-4">
                                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">{post.content}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-5 pb-5 space-y-3">
                            <textarea
                                value={comments[post.id] || ''}
                                onChange={(e) => setComments((c) => ({ ...c, [post.id]: e.target.value }))}
                                placeholder="Add feedback or comments (optional)..."
                                rows={2}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-white/20"
                            />
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => handleAction(post.id, 'REJECTED')}
                                    disabled={submitting[post.id]}
                                    className="flex-1 border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(post.id, 'APPROVED')}
                                    disabled={submitting[post.id]}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
// Calendar Tab
// ─────────────────────────────────────────────────────────
function CalendarTab({
    calYear, calMonth, setCalYear, setCalMonth, postsByDay, done,
}: {
    calYear: number; calMonth: number
    setCalYear: (y: number) => void; setCalMonth: (m: number) => void
    postsByDay: Record<number, Post[]>
    done: Record<string, string>
}) {
    function prevMonth() {
        if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) }
        else setCalMonth(calMonth - 1)
    }
    function nextMonth() {
        if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) }
        else setCalMonth(calMonth + 1)
    }

    const daysInMonth = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfWeek(calYear, calMonth)
    const today = new Date()
    const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth()

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
                <p className="text-white/40 text-sm mt-1">View your scheduled and published content</p>
            </div>

            {/* Calendar nav */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h2 className="text-lg font-semibold">{MONTH_NAMES[calMonth]} {calYear}</h2>
                <button onClick={nextMonth} className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Calendar grid */}
            <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-white/[0.06]">
                    {DAY_NAMES.map((d) => (
                        <div key={d} className="py-3 text-center text-xs font-medium text-white/30 uppercase tracking-wider">{d}</div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7">
                    {/* Empty slots */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-white/[0.03]" />
                    ))}
                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const dayPosts = postsByDay[day] || []
                        const isToday = isCurrentMonth && day === today.getDate()
                        return (
                            <div
                                key={day}
                                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-white/[0.03] p-1.5 sm:p-2 ${isToday ? 'bg-indigo-500/[0.06]' : ''
                                    }`}
                            >
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${isToday
                                    ? 'bg-indigo-500 text-white font-bold'
                                    : 'text-white/50'
                                    }`}>
                                    {day}
                                </span>
                                {dayPosts.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                        {dayPosts.slice(0, 3).map((p) => (
                                            <div
                                                key={p.id}
                                                className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs truncate ${done[p.id] === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    done[p.id] === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-amber-500/15 text-amber-400'
                                                    }`}
                                                title={p.content?.slice(0, 80) || p.channel.displayName}
                                            >
                                                {p.channel.displayName}
                                            </div>
                                        ))}
                                        {dayPosts.length > 3 && (
                                            <span className="text-[10px] text-white/30 ml-1">+{dayPosts.length - 3} more</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30" /> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30" /> Approved</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/30" /> Rejected</span>
            </div>
        </>
    )
}
