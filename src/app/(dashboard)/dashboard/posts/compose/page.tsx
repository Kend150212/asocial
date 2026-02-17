'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────

interface ChannelPlatform {
    id: string
    platform: string
    accountId: string
    accountName: string
}

interface Channel {
    id: string
    displayName: string
    name: string
    language: string
    defaultAiProvider: string | null
    defaultAiModel: string | null
    platforms: ChannelPlatform[]
}

interface MediaItem {
    id: string
    url: string
    thumbnailUrl: string | null
    type: string
    originalName: string | null
}

// ─── Platform limits ────────────────────────────────

const platformLimits: Record<string, number> = {
    facebook: 63206,
    instagram: 2200,
    x: 280,
    twitter: 280,
    tiktok: 2200,
    youtube: 5000,
    linkedin: 3000,
    pinterest: 500,
}

const platformLabels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X (Twitter)',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    pinterest: 'Pinterest',
}

// ─── Page ───────────────────────────────────────────

export default function ComposePage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
    const [content, setContent] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
    const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([])
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [aiTopic, setAiTopic] = useState('')

    // Load channels
    useEffect(() => {
        fetch('/api/admin/channels')
            .then((r) => r.json())
            .then((data: Channel[]) => {
                // Need platforms in each channel
                const channelsWithPlatforms = data.filter(
                    (ch: Channel) => ch.platforms && ch.platforms.length > 0
                )
                setChannels(data)
                if (channelsWithPlatforms.length > 0) {
                    setSelectedChannel(channelsWithPlatforms[0])
                }
            })
            .catch(() => toast.error('Failed to load channels'))
    }, [])

    // When channel changes, auto-select all platforms
    useEffect(() => {
        if (selectedChannel?.platforms) {
            setSelectedPlatforms(
                new Set(selectedChannel.platforms.map((p) => `${p.platform}:${p.accountId}`))
            )
        }
    }, [selectedChannel])

    // Toggle platform
    const togglePlatform = (key: string) => {
        setSelectedPlatforms((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Upload media
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || !selectedChannel) return

        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('channelId', selectedChannel.id)

                const res = await fetch('/api/admin/media', {
                    method: 'POST',
                    body: formData,
                })

                if (!res.ok) {
                    const err = await res.json()
                    toast.error(err.error || 'Upload failed')
                    continue
                }

                const media = await res.json()
                setAttachedMedia((prev) => [...prev, media])
            }
            toast.success('Media uploaded')
        } catch {
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }, [selectedChannel])

    // Remove media
    const removeMedia = (id: string) => {
        setAttachedMedia((prev) => prev.filter((m) => m.id !== id))
    }

    // AI Generate
    const handleGenerate = async () => {
        if (!selectedChannel || !aiTopic.trim()) {
            toast.error('Enter a topic for AI generation')
            return
        }

        setGenerating(true)
        try {
            const res = await fetch('/api/admin/posts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id,
                    topic: aiTopic,
                    platforms: Array.from(selectedPlatforms).map((k) => k.split(':')[0]),
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error || 'Generation failed')
                return
            }

            const data = await res.json()
            setContent(data.content || '')
            toast.success('Content generated!')
        } catch {
            toast.error('AI generation failed')
        } finally {
            setGenerating(false)
        }
    }

    // Save draft
    const handleSaveDraft = async () => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Select a channel and add content')
            return
        }

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

            const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id,
                    content,
                    status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
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

            toast.success(scheduledAt ? 'Post scheduled!' : 'Draft saved!')
            router.push('/dashboard/posts')
        } catch {
            toast.error('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    // Publish now
    const handlePublishNow = async () => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Select a channel and add content')
            return
        }
        if (selectedPlatforms.size === 0) {
            toast.error('Select at least one platform')
            return
        }

        setPublishing(true)
        try {
            const platforms = Array.from(selectedPlatforms).map((key) => {
                const [platform, accountId] = key.split(':')
                return { platform, accountId }
            })

            // First create the post
            const createRes = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id,
                    content,
                    status: 'PUBLISHING',
                    mediaIds: attachedMedia.map((m) => m.id),
                    platforms,
                }),
            })

            if (!createRes.ok) {
                const err = await createRes.json()
                toast.error(err.error || 'Failed to create post')
                return
            }

            const post = await createRes.json()

            // Then publish
            const pubRes = await fetch(`/api/admin/posts/${post.id}/publish`, {
                method: 'POST',
            })

            if (!pubRes.ok) {
                toast.error('Post created but publishing failed. Check post details.')
            } else {
                toast.success('Post published!')
            }

            router.push('/dashboard/posts')
        } catch {
            toast.error('Failed to publish')
        } finally {
            setPublishing(false)
        }
    }

    const charCount = content.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="cursor-pointer"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Compose Post</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving || !content.trim()}
                        className="cursor-pointer"
                    >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {scheduleDate ? 'Schedule' : 'Save Draft'}
                    </Button>
                    <Button
                        onClick={handlePublishNow}
                        disabled={publishing || !content.trim() || selectedPlatforms.size === 0}
                        className="cursor-pointer"
                    >
                        {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Publish Now
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Left: Platforms ── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Channel Selector */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Channel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedChannel?.id || ''}
                                onValueChange={(v) => {
                                    const ch = channels.find((c) => c.id === v) || null
                                    setSelectedChannel(ch)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {channels.map((ch) => (
                                        <SelectItem key={ch.id} value={ch.id}>
                                            {ch.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Platform Selector */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Publish To</CardTitle>
                            <CardDescription className="text-xs">
                                {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''} selected
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedChannel?.platforms.length ? (
                                selectedChannel.platforms.map((p) => {
                                    const key = `${p.platform}:${p.accountId}`
                                    const isChecked = selectedPlatforms.has(key)
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => togglePlatform(key)}
                                        >
                                            <Checkbox checked={isChecked} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">
                                                    {platformLabels[p.platform] || p.platform}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {p.accountName}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    No platforms connected to this channel
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
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
                                <Input
                                    type="date"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Time</Label>
                                <Input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            {scheduleDate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setScheduleDate(''); setScheduleTime('') }}
                                    className="text-xs cursor-pointer"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear schedule
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Center: Editor ── */}
                <div className="lg:col-span-5 space-y-4">
                    {/* AI Generate */}
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
                                    placeholder="Enter topic, e.g. 'Summer sale 50% off all items'"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !aiTopic.trim()}
                                    size="sm"
                                    className="shrink-0 cursor-pointer"
                                >
                                    {generating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Editor */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Content</CardTitle>
                                <div className="flex items-center gap-2">
                                    {Array.from(selectedPlatforms).map((key) => {
                                        const platform = key.split(':')[0]
                                        const limit = platformLimits[platform]
                                        if (!limit) return null
                                        const over = charCount > limit
                                        return (
                                            <Badge
                                                key={key}
                                                variant={over ? 'destructive' : 'secondary'}
                                                className="text-[10px]"
                                            >
                                                {platformLabels[platform]?.slice(0, 2) || platform.slice(0, 2).toUpperCase()}
                                                {' '}
                                                {charCount}/{limit}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your post content here..."
                                className="w-full min-h-[200px] resize-y rounded-lg border bg-transparent px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                                rows={8}
                            />
                        </CardContent>
                    </Card>

                    {/* Media Attachments */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Media
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || !selectedChannel}
                                    className="cursor-pointer"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-1" />
                                    )}
                                    Upload
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {attachedMedia.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {attachedMedia.map((media) => (
                                        <div key={media.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
                                            <img
                                                src={media.thumbnailUrl || media.url}
                                                alt={media.originalName || ''}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeMedia(media.id)}
                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/30 transition-colors"
                                >
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Click or drag files to upload
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Images & videos up to 50MB
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: Preview ── */}
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
                                                    <Badge variant="outline" className="text-xs">
                                                        {platformLabels[platform] || platform}
                                                    </Badge>
                                                    {isOver ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Over limit
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            OK
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                    {previewContent}
                                                    {isOver && '...'}
                                                </p>
                                                {attachedMedia.length > 0 && (
                                                    <div className="flex gap-1 pt-2">
                                                        {attachedMedia.slice(0, 4).map((m) => (
                                                            <div key={m.id} className="h-12 w-12 rounded bg-muted overflow-hidden">
                                                                <img
                                                                    src={m.thumbnailUrl || m.url}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        ))}
                                                        {attachedMedia.length > 4 && (
                                                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                                +{attachedMedia.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {selectedPlatforms.size === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Select platforms to see preview
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Hash className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Start typing to see preview
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule Summary */}
                    {scheduleDate && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Scheduled for</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(`${scheduleDate}T${scheduleTime || '00:00'}`).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
