'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    PenSquare,
    Trash2,
    Copy,
    MoreHorizontal,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    FileEdit,
    Loader2,
    Filter,
    Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────

interface Channel {
    id: string
    displayName: string
}

interface PostMedia {
    mediaItem: {
        id: string
        url: string
        thumbnailUrl: string | null
        type: string
        originalName: string | null
    }
}

interface PlatformStatus {
    platform: string
    status: string
}

interface Post {
    id: string
    content: string | null
    status: string
    scheduledAt: string | null
    publishedAt: string | null
    createdAt: string
    channel: { id: string; displayName: string; name: string }
    author: { id: string; name: string | null; email: string }
    media: PostMedia[]
    platformStatuses: PlatformStatus[]
    _count: { approvals: number }
}

// ─── Status Config ──────────────────────────────────

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
    DRAFT: { label: 'Draft', variant: 'secondary', icon: FileEdit },
    PENDING_APPROVAL: { label: 'Pending', variant: 'outline', icon: Clock },
    APPROVED: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle },
    SCHEDULED: { label: 'Scheduled', variant: 'outline', icon: Calendar },
    PUBLISHING: { label: 'Publishing', variant: 'default', icon: Send },
    PUBLISHED: { label: 'Published', variant: 'default', icon: CheckCircle2 },
    FAILED: { label: 'Failed', variant: 'destructive', icon: XCircle },
}

// ─── Page ───────────────────────────────────────────

export default function PostsPage() {
    const t = useTranslation()
    const router = useRouter()

    const [posts, setPosts] = useState<Post[]>([])
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterChannel, setFilterChannel] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)

    // Fetch channels for filter
    useEffect(() => {
        fetch('/api/admin/channels')
            .then((r) => r.json())
            .then((data) => setChannels(data))
            .catch(() => { })
    }, [])

    // Fetch posts
    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' })
            if (filterChannel !== 'all') params.set('channelId', filterChannel)
            if (filterStatus !== 'all') params.set('status', filterStatus)
            if (search.trim()) params.set('search', search.trim())

            const res = await fetch(`/api/admin/posts?${params}`)
            const data = await res.json()
            setPosts(data.posts || [])
            setTotalPages(data.pagination?.totalPages || 1)
            setTotal(data.pagination?.total || 0)
        } catch {
            toast.error('Failed to load posts')
        } finally {
            setLoading(false)
        }
    }, [page, filterChannel, filterStatus, search])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    // Delete post
    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            const res = await fetch(`/api/admin/posts/${deleteTarget.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast.success('Post deleted')
            fetchPosts()
        } catch {
            toast.error('Failed to delete post')
        } finally {
            setDeleteTarget(null)
        }
    }

    // Duplicate post
    const handleDuplicate = async (post: Post) => {
        try {
            const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: post.channel.id,
                    content: post.content,
                    status: 'DRAFT',
                    mediaIds: post.media.map((m) => m.mediaItem.id),
                }),
            })
            if (!res.ok) throw new Error()
            toast.success('Post duplicated as draft')
            fetchPosts()
        } catch {
            toast.error('Failed to duplicate')
        }
    }

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const truncate = (text: string | null, len: number) => {
        if (!text) return '—'
        return text.length > len ? text.slice(0, len) + '…' : text
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                        <PenSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                        {t('nav.posts') || 'Posts'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {total} post{total !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/posts/compose')}
                    className="cursor-pointer w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search posts..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterChannel} onValueChange={(v) => { setFilterChannel(v); setPage(1) }}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="All Channels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Channels</SelectItem>
                                {channels.map((ch) => (
                                    <SelectItem key={ch.id} value={ch.id}>{ch.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Posts List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : posts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <PenSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <CardTitle className="text-lg mb-1">No posts yet</CardTitle>
                        <CardDescription>Create your first post to get started</CardDescription>
                        <Button
                            onClick={() => router.push('/dashboard/posts/compose')}
                            className="mt-4 cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Post
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => {
                        const sc = statusConfig[post.status] || statusConfig.DRAFT
                        const StatusIcon = sc.icon
                        return (
                            <Card
                                key={post.id}
                                className="hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        {post.media.length > 0 ? (
                                            <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                                <img
                                                    src={post.media[0].mediaItem.thumbnailUrl || post.media[0].mediaItem.url}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <PenSquare className="h-6 w-6 text-muted-foreground/30" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={sc.variant} className="text-xs gap-1">
                                                    <StatusIcon className="h-3 w-3" />
                                                    {sc.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {post.channel.displayName}
                                                </span>
                                                {post.media.length > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        📎 {post.media.length}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium truncate">
                                                {truncate(post.content, 120)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span>{formatDate(post.createdAt)}</span>
                                                {post.scheduledAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(post.scheduledAt)}
                                                    </span>
                                                )}
                                                {post.platformStatuses.length > 0 && (
                                                    <span>
                                                        {post.platformStatuses.map((ps) => ps.platform).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 cursor-pointer">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/posts/${post.id}`) }}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View / Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(post) }}
                                                    className="cursor-pointer"
                                                >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(post) }}
                                                    className="cursor-pointer text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="cursor-pointer"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="cursor-pointer"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this post and all its media attachments. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
