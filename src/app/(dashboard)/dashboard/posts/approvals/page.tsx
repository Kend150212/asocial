'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import {
    CheckCircle2, XCircle, MessageSquare, Clock, Loader2,
    PenSquare, ChevronRight, Filter, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { PlatformIcon } from '@/components/platform-icons'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────

interface PlatformStatus { platform: string; status: string }
interface PostMedia { mediaItem: { url: string; thumbnailUrl: string | null } }
interface ApprovalPost {
    id: string
    content: string | null
    createdAt: string
    channel: { displayName: string }
    author: { name: string | null; email: string }
    media: PostMedia[]
    platformStatuses: PlatformStatus[]
    _count: { approvals: number }
}

// ─── Page ──────────────────────────────────────────────────────

export default function ApprovalsPage() {
    const router = useRouter()
    const t = useTranslation()
    const [posts, setPosts] = useState<ApprovalPost[]>([])
    const [loading, setLoading] = useState(true)
    const [actionPost, setActionPost] = useState<{ post: ApprovalPost; action: 'approved' | 'rejected' } | null>(null)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/posts?status=PENDING_APPROVAL&limit=50')
            const data = await res.json()
            setPosts(data.posts || [])
        } catch {
            toast.error('Failed to load pending posts')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchPosts() }, [fetchPosts])

    const handleAction = async () => {
        if (!actionPost) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/admin/posts/${actionPost.post.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionPost.action, comment }),
            })
            if (!res.ok) throw new Error()
            toast.success(actionPost.action === 'approved' ? 'Post approved ✅' : 'Post rejected ❌')
            setActionPost(null)
            setComment('')
            fetchPosts()
        } catch {
            toast.error('Action failed')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Approval Queue
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {posts.length} post{posts.length !== 1 ? 's' : ''} awaiting review
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPosts} className="cursor-pointer h-8 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />Refresh
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                    <p className="text-lg font-semibold">All caught up!</p>
                    <p className="text-sm text-muted-foreground">No posts waiting for approval.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => {
                        const platforms = [...new Set(post.platformStatuses.map(ps => ps.platform))]
                        const thumb = post.media[0]?.mediaItem
                        return (
                            <div
                                key={post.id}
                                className="rounded-xl border bg-card hover:shadow-sm transition-shadow flex gap-4 p-4"
                            >
                                {/* Thumbnail */}
                                <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                                    {thumb ? (
                                        <img src={thumb.thumbnailUrl || thumb.url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <PenSquare className="h-6 w-6 text-muted-foreground/30" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDate(post.createdAt)}
                                        <span className="text-muted-foreground/50">•</span>
                                        <span className="font-medium text-foreground">{post.author.name || post.author.email}</span>
                                        <span className="text-muted-foreground/50">•</span>
                                        <span>{post.channel.displayName}</span>
                                    </div>
                                    <p className="text-sm leading-snug line-clamp-2">
                                        {post.content || <span className="text-muted-foreground italic">No content</span>}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {platforms.map(p => <PlatformIcon key={p} platform={p} size="sm" />)}
                                        <button
                                            onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                                            className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                                        >
                                            View full post <ChevronRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 justify-center shrink-0">
                                    <Button
                                        size="sm"
                                        className="cursor-pointer h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => setActionPost({ post, action: 'approved' })}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="cursor-pointer h-8 gap-1.5 border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={() => setActionPost({ post, action: 'rejected' })}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Confirm dialog */}
            <AlertDialog open={!!actionPost} onOpenChange={() => { setActionPost(null); setComment('') }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={cn(
                            'flex items-center gap-2',
                            actionPost?.action === 'approved' ? 'text-emerald-600' : 'text-red-500'
                        )}>
                            {actionPost?.action === 'approved'
                                ? <><CheckCircle2 className="h-5 w-5" />Approve Post</>
                                : <><XCircle className="h-5 w-5" />Reject Post</>
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionPost?.action === 'approved'
                                ? 'This post will be marked as approved and the author will be notified.'
                                : 'This post will be rejected. Please provide a reason for the author.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-0 pb-2">
                        <Textarea
                            placeholder={actionPost?.action === 'approved'
                                ? 'Optional comment...'
                                : 'Reason for rejection (recommended)...'}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="min-h-[80px] text-sm"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting} className="cursor-pointer">Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleAction}
                            disabled={submitting}
                            className={cn(
                                'cursor-pointer',
                                actionPost?.action === 'approved'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            )}
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {actionPost?.action === 'approved' ? 'Approve' : 'Reject'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
