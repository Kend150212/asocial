'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MediaItem { url: string; thumbnailUrl: string | null; type: string }
interface PostMedia { mediaItem: MediaItem }
interface Approval { action: string }
interface PlatformStatus { platform: string }
interface Post {
    id: string
    content: string | null
    scheduledAt: string | null
    createdAt: string
    channel: { id: string; displayName: string }
    author: { name: string | null; email: string }
    media: PostMedia[]
    approvals: Approval[]
    platformStatuses: PlatformStatus[]
}

const PLATFORM_ICONS: Record<string, string> = {
    facebook: '📘', instagram: '📸', tiktok: '🎵', youtube: '▶️',
    linkedin: '💼', pinterest: '📌', x: '𝕏', twitter: '𝕏',
}

export default function PortalPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
    const [done, setDone] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({})

    useEffect(() => {
        if (status === 'loading') return
        if (!session) { router.push('/login'); return }
        if (session.user.role !== 'CUSTOMER') { router.push('/dashboard'); return }

        fetch('/api/portal/posts')
            .then((r) => r.json())
            .then((data) => setPosts(data.posts || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [session, status, router])

    async function handleAction(postId: string, action: 'APPROVED' | 'REJECTED') {
        setSubmitting((s) => ({ ...s, [postId]: true }))
        const res = await fetch(`/api/portal/posts/${postId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment: comments[postId] || '' }),
        })
        if (res.ok) {
            setDone((d) => ({ ...d, [postId]: action }))
        }
        setSubmitting((s) => ({ ...s, [postId]: false }))
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const pendingPosts = posts.filter((p) => !done[p.id])
    const reviewedCount = Object.keys(done).length

    return (
        <div className="min-h-screen bg-[#0f0f12] text-white">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">A</div>
                        <span className="font-semibold text-white">Content Review Portal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/40 text-sm hidden sm:block">{session?.user?.email}</span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-sm text-white/40 hover:text-white transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Stats bar */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold">Pending Review</h1>
                        <p className="text-white/40 text-sm mt-0.5">
                            {pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} waiting for your approval
                            {reviewedCount > 0 && ` · ${reviewedCount} reviewed`}
                        </p>
                    </div>
                </div>

                {/* Reviewed banner */}
                {Object.keys(done).length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm flex items-center gap-2">
                        ✅ {reviewedCount} post{reviewedCount !== 1 ? 's' : ''} reviewed — thank you!
                    </div>
                )}

                {/* Empty state */}
                {pendingPosts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-lg font-medium text-white/80">All caught up!</h2>
                        <p className="text-white/40 text-sm mt-1">No posts are waiting for your review right now.</p>
                    </div>
                )}

                {/* Post cards */}
                <div className="space-y-4">
                    {pendingPosts.map((post) => (
                        <div key={post.id} className="bg-[#1a1a24] border border-white/8 rounded-2xl overflow-hidden">
                            {/* Card header */}
                            <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-white/5">
                                <div>
                                    <span className="text-indigo-400 font-medium text-sm">{post.channel.displayName}</span>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        by {post.author.name || post.author.email}
                                        {post.scheduledAt && (
                                            <> · scheduled {new Date(post.scheduledAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                                        )}
                                    </p>
                                </div>
                                <div className="flex gap-1.5">
                                    {post.platformStatuses.map((ps) => (
                                        <span key={ps.platform} title={ps.platform} className="text-base">
                                            {PLATFORM_ICONS[ps.platform] || '📲'}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Media */}
                            {post.media.length > 0 && (
                                <div className={`grid gap-1 ${post.media.length === 1 ? '' : 'grid-cols-2'}`}>
                                    {post.media.slice(0, 4).map((m, i) => (
                                        <div key={i} className="relative aspect-video bg-black/40 overflow-hidden">
                                            {m.mediaItem.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-4xl">▶️</span>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={m.mediaItem.thumbnailUrl || m.mediaItem.url}
                                                    alt="Media"
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Content */}
                            <div className="px-5 py-4">
                                {post.content && (
                                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap line-clamp-5">{post.content}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-5 pb-4 space-y-3">
                                <textarea
                                    value={comments[post.id] || ''}
                                    onChange={(e) => setComments((c) => ({ ...c, [post.id]: e.target.value }))}
                                    placeholder="Add a comment (optional)..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-white/30"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(post.id, 'REJECTED')}
                                        disabled={submitting[post.id]}
                                        className="flex-1 border border-red-500/40 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-40"
                                    >
                                        ✗ Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(post.id, 'APPROVED')}
                                        disabled={submitting[post.id]}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-40"
                                    >
                                        ✓ Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
