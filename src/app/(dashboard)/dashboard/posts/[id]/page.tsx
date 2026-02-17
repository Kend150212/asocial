'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import {
    ArrowLeft,
    Send,
    Save,
    Calendar,
    Clock,
    Loader2,
    Sparkles,
    Upload,
    X,
    ImageIcon,
    Check,
    Hash,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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

interface ChannelPlatform {
    id: string
    platform: string
    accountId: string
    accountName: string
}

interface MediaItem {
    id: string
    url: string
    thumbnailUrl: string | null
    type: string
    originalName: string | null
}

interface PlatformStatus {
    id: string
    platform: string
    accountId: string
    status: string
    externalId: string | null
    errorMsg: string | null
    publishedAt: string | null
}

interface PostDetail {
    id: string
    content: string | null
    contentPerPlatform: Record<string, string>
    status: string
    scheduledAt: string | null
    publishedAt: string | null
    createdAt: string
    channel: {
        id: string
        displayName: string
        name: string
        language: string
        defaultAiProvider: string | null
        defaultAiModel: string | null
        platforms: ChannelPlatform[]
    }
    author: { id: string; name: string | null; email: string }
    media: { mediaItem: MediaItem }[]
    platformStatuses: PlatformStatus[]
    approvals: { id: string; action: string; comment: string | null; createdAt: string }[]
}

// ─── Platform Config ────────────────────────────────

const platformLimits: Record<string, number> = {
    facebook: 63206, instagram: 2200, x: 280, twitter: 280,
    tiktok: 2200, youtube: 5000, linkedin: 3000, pinterest: 500,
}

const platformLabels: Record<string, string> = {
    facebook: 'Facebook', instagram: 'Instagram', x: 'X (Twitter)',
    twitter: 'Twitter', tiktok: 'TikTok', youtube: 'YouTube',
    linkedin: 'LinkedIn', pinterest: 'Pinterest',
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline' },
    SCHEDULED: { label: 'Scheduled', variant: 'outline' },
    PUBLISHING: { label: 'Publishing...', variant: 'default' },
    PUBLISHED: { label: 'Published', variant: 'default' },
    FAILED: { label: 'Failed', variant: 'destructive' },
}

// ─── Page ───────────────────────────────────────────

export default function PostEditPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [post, setPost] = useState<PostDetail | null>(null)
    const [content, setContent] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
    const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([])
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    const [showDelete, setShowDelete] = useState(false)

    // Load post
    const fetchPost = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/posts/${id}`)
            if (!res.ok) throw new Error()
            const data: PostDetail = await res.json()
            setPost(data)
            setContent(data.content || '')
            setAttachedMedia(data.media.map((m) => m.mediaItem))

            // Restore selected platforms
            const platformKeys = data.platformStatuses.map(
                (ps) => `${ps.platform}:${ps.accountId}`
            )
            setSelectedPlatforms(new Set(platformKeys))

            // Restore schedule
            if (data.scheduledAt) {
                const d = new Date(data.scheduledAt)
                setScheduleDate(d.toISOString().split('T')[0])
                setScheduleTime(d.toTimeString().slice(0, 5))
            }
        } catch {
            toast.error('Failed to load post')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchPost()
    }, [fetchPost])

    const isEditable = post && !['PUBLISHED', 'PUBLISHING'].includes(post.status)

    // Toggle platform
    const togglePlatform = (key: string) => {
        if (!isEditable) return
        setSelectedPlatforms((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Upload media
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || !post) return
        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('channelId', post.channel.id)
                const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
                if (!res.ok) continue
                const media = await res.json()
                setAttachedMedia((prev) => [...prev, media])
            }
            toast.success('Media uploaded')
        } catch {
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    // Save
    const handleSave = async () => {
        if (!post) return
        setSaving(true)
        try {
            const platforms = Array.from(selectedPlatforms).map((key) => {
                const [platform, accountId] = key.split(':')
                return { platform, accountId }
            })

            let scheduledAt: string | null = null
            if (scheduleDate && scheduleTime) {
                scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            }

            const res = await fetch(`/api/admin/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    status: scheduledAt ? 'SCHEDULED' : post.status === 'DRAFT' ? 'DRAFT' : post.status,
                    scheduledAt,
                    mediaIds: attachedMedia.map((m) => m.id),
                    platforms,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error || 'Failed to save')
                return
            }

            toast.success('Post updated!')
            fetchPost()
        } catch {
            toast.error('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    // Publish
    const handlePublish = async () => {
        if (!post) return
        setPublishing(true)
        try {
            // Update platforms first
            const platforms = Array.from(selectedPlatforms).map((key) => {
                const [platform, accountId] = key.split(':')
                return { platform, accountId }
            })

            await fetch(`/api/admin/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    status: 'PUBLISHING',
                    mediaIds: attachedMedia.map((m) => m.id),
                    platforms,
                }),
            })

            const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' })
            if (!res.ok) toast.error('Publishing failed')
            else toast.success('Post published!')
            fetchPost()
        } catch {
            toast.error('Failed to publish')
        } finally {
            setPublishing(false)
        }
    }

    // Delete
    const handleDelete = async () => {
        try {
            await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
            toast.success('Post deleted')
            router.push('/dashboard/posts')
        } catch {
            toast.error('Failed to delete')
        }
    }

    // AI Generate
    const handleGenerate = async () => {
        if (!post || !aiTopic.trim()) return
        setGenerating(true)
        try {
            const res = await fetch('/api/admin/posts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: post.channel.id,
                    topic: aiTopic,
                    platforms: Array.from(selectedPlatforms).map((k) => k.split(':')[0]),
                }),
            })
            if (!res.ok) throw new Error()
            const data = await res.json()
            setContent(data.content || '')
            toast.success('Content generated!')
        } catch {
            toast.error('AI generation failed')
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Post not found</p>
            </div>
        )
    }

    const sb = statusBadge[post.status] || statusBadge.DRAFT
    const charCount = content.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={sb.variant}>{sb.label}</Badge>
                            <span className="text-xs text-muted-foreground">{post.channel.displayName}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditable && (
                        <>
                            <Button variant="outline" onClick={handleSave} disabled={saving} className="cursor-pointer">
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save
                            </Button>
                            <Button onClick={handlePublish} disabled={publishing || selectedPlatforms.size === 0} className="cursor-pointer">
                                {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Publish
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="cursor-pointer text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Platforms + Status */}
                <div className="lg:col-span-3 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Platforms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {post.channel.platforms.map((p) => {
                                const key = `${p.platform}:${p.accountId}`
                                const isChecked = selectedPlatforms.has(key)
                                const ps = post.platformStatuses.find(
                                    (s) => s.platform === p.platform && s.accountId === p.accountId
                                )
                                return (
                                    <div key={key} className="flex items-center gap-3 cursor-pointer" onClick={() => togglePlatform(key)}>
                                        <Checkbox checked={isChecked} disabled={!isEditable} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{platformLabels[p.platform] || p.platform}</p>
                                            <p className="text-xs text-muted-foreground truncate">{p.accountName}</p>
                                        </div>
                                        {ps && (
                                            <Badge variant={ps.status === 'published' ? 'default' : ps.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                {ps.status === 'published' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : ps.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> : null}
                                                {ps.status}
                                            </Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    {isEditable && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Time</Label>
                                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Failed statuses */}
                    {post.platformStatuses.some((ps) => ps.status === 'failed') && (
                        <Card className="border-destructive/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-destructive">Failed Platforms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {post.platformStatuses.filter((ps) => ps.status === 'failed').map((ps) => (
                                    <div key={ps.id} className="text-xs">
                                        <p className="font-medium">{platformLabels[ps.platform] || ps.platform}</p>
                                        <p className="text-destructive">{ps.errorMsg || 'Unknown error'}</p>
                                    </div>
                                ))}
                                <Button size="sm" variant="outline" onClick={handlePublish} disabled={publishing} className="w-full mt-2 cursor-pointer">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry Failed
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Center: Editor */}
                <div className="lg:col-span-5 space-y-4">
                    {isEditable && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    AI Generate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter topic..."
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                    />
                                    <Button onClick={handleGenerate} disabled={generating} size="sm" className="shrink-0 cursor-pointer">
                                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Content</CardTitle>
                                <span className="text-xs text-muted-foreground">{charCount} chars</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={!isEditable}
                                placeholder="Post content..."
                                className="w-full min-h-[200px] resize-y rounded-lg border bg-transparent px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                rows={8}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Media ({attachedMedia.length})
                                </CardTitle>
                                {isEditable && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="cursor-pointer">
                                            {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                            Upload
                                        </Button>
                                        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {attachedMedia.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {attachedMedia.map((media) => (
                                        <div key={media.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
                                            <img src={media.thumbnailUrl || media.url} alt="" className="h-full w-full object-cover" />
                                            {isEditable && (
                                                <button
                                                    onClick={() => setAttachedMedia((prev) => prev.filter((m) => m.id !== media.id))}
                                                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No media attached</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Preview + Info */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {content.trim() ? (
                                <div className="space-y-4">
                                    {Array.from(selectedPlatforms).map((key) => {
                                        const [platform] = key.split(':')
                                        const limit = platformLimits[platform] || 5000
                                        const previewContent = content.slice(0, limit)
                                        const isOver = content.length > limit
                                        return (
                                            <div key={key} className="rounded-lg border p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-xs">{platformLabels[platform] || platform}</Badge>
                                                    <Badge variant={isOver ? 'destructive' : 'secondary'} className="text-[10px]">
                                                        {isOver ? 'Over limit' : <><Check className="h-3 w-3 mr-1" />OK</>}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{previewContent}{isOver && '...'}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Hash className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">No content</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Post Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Info</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Author</span>
                                <span className="font-medium text-foreground">{post.author.name || post.author.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Created</span>
                                <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            {post.publishedAt && (
                                <div className="flex justify-between">
                                    <span>Published</span>
                                    <span>{new Date(post.publishedAt).toLocaleString('vi-VN')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
