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
    Heart,
    MessageCircle,
    Share2,
    ThumbsUp,
    Bookmark,
    MoreHorizontal,
    Play,
    Repeat2,
    Globe,
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
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────

interface ChannelPlatform {
    id: string
    platform: string
    accountId: string
    accountName: string
    isActive: boolean
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

// ─── Platform config ────────────────────────────────

const platformLimits: Record<string, number> = {
    facebook: 63206, instagram: 2200, x: 280, twitter: 280,
    tiktok: 2200, youtube: 5000, linkedin: 3000, pinterest: 500,
}

const platformLabels: Record<string, string> = {
    facebook: 'Facebook', instagram: 'Instagram', x: 'X (Twitter)',
    twitter: 'Twitter', tiktok: 'TikTok', youtube: 'YouTube',
    linkedin: 'LinkedIn', pinterest: 'Pinterest',
}

const platformColors: Record<string, string> = {
    facebook: '#1877F2', instagram: '#E4405F', x: '#000000',
    twitter: '#1DA1F2', tiktok: '#00F2EA', youtube: '#FF0000',
    linkedin: '#0A66C2', pinterest: '#E60023',
}

// Supported file types for upload
const ACCEPTED_FILE_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'image/avif',
    // Videos
    'video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo',
    'video/x-matroska', 'video/ogg', 'video/3gpp', 'video/x-flv',
    'video/x-ms-wmv', 'video/mpeg',
].join(',')

// ─── Realistic Preview Components ───────────────────

function FacebookPreview({ content, media, accountName, postType }: {
    content: string; media: MediaItem[]; accountName: string; postType: string
}) {
    if (postType === 'story') {
        return (
            <div className="rounded-xl overflow-hidden bg-gradient-to-b from-blue-600 to-blue-800 text-white relative" style={{ minHeight: 280 }}>
                {media.length > 0 && (
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                )}
                <div className="relative z-10 p-4 flex flex-col justify-between h-full" style={{ minHeight: 280 }}>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                            {accountName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">{accountName}</span>
                        <span className="text-xs opacity-60">Story</span>
                    </div>
                    <p className="text-sm font-medium drop-shadow-lg mt-auto">
                        {content.slice(0, 200)}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#1877F2' }}>
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">{accountName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Just now · <Globe className="h-3 w-3" />
                    </p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>
            {/* Content */}
            <div className="px-3 pb-2">
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {content.slice(0, platformLimits.facebook)}
                </p>
            </div>
            {/* Media */}
            {media.length > 0 && (
                <div className="w-full bg-muted">
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="w-full max-h-[300px] object-cover" />
                </div>
            )}
            {/* Reactions bar */}
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center justify-between border-t">
                <span>👍 ❤️ 0</span>
                <span>0 Comments · 0 Shares</span>
            </div>
            {/* Actions */}
            <div className="flex items-center border-t divide-x">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <ThumbsUp className="h-4 w-4" /> Like
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>
        </div>
    )
}

function InstagramPreview({ content, media, accountName }: {
    content: string; media: MediaItem[]; accountName: string
}) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <div className="h-8 w-8 rounded-full ring-2 ring-pink-500 ring-offset-2 ring-offset-background flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#E4405F' }}>
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold flex-1">{accountName}</p>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>
            {media.length > 0 ? (
                <div className="w-full bg-muted aspect-square">
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 aspect-square flex items-center justify-center">
                    <p className="text-white text-center font-medium px-6 text-sm leading-relaxed">
                        {content.slice(0, 150)}
                    </p>
                </div>
            )}
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart className="h-5 w-5 cursor-pointer hover:text-red-500 transition-colors" />
                        <MessageCircle className="h-5 w-5 cursor-pointer" />
                        <Send className="h-5 w-5 cursor-pointer" />
                    </div>
                    <Bookmark className="h-5 w-5 cursor-pointer" />
                </div>
                <p className="text-xs font-semibold">0 likes</p>
                <p className="text-xs leading-relaxed">
                    <span className="font-semibold">{accountName}</span>{' '}
                    {content.slice(0, platformLimits.instagram)}
                </p>
            </div>
        </div>
    )
}

function TikTokPreview({ content, media, accountName }: {
    content: string; media: MediaItem[]; accountName: string
}) {
    return (
        <div className="rounded-xl overflow-hidden bg-black text-white relative" style={{ minHeight: 320 }}>
            {media.length > 0 ? (
                <img src={media[0].thumbnailUrl || media[0].url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            )}
            <div className="relative z-10 flex h-full" style={{ minHeight: 320 }}>
                {/* Right sidebar */}
                <div className="flex-1" />
                <div className="flex flex-col items-center justify-end gap-4 p-3 pb-16">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border-2 border-white">
                        {accountName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Heart className="h-6 w-6" />
                        <span className="text-[10px]">0</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-[10px]">0</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Bookmark className="h-6 w-6" />
                        <span className="text-[10px]">0</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Share2 className="h-6 w-6" />
                        <span className="text-[10px]">0</span>
                    </div>
                </div>
                {/* Bottom caption */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs font-semibold mb-1">@{accountName}</p>
                    <p className="text-xs leading-relaxed line-clamp-3">{content.slice(0, 150)}</p>
                </div>
            </div>
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="h-12 w-12 opacity-30" />
            </div>
        </div>
    )
}

function XPreview({ content, accountName }: {
    content: string; accountName: string
}) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-3 flex gap-3">
                <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <p className="text-sm font-bold">{accountName}</p>
                        <p className="text-sm text-muted-foreground">@{accountName.toLowerCase().replace(/\s/g, '')} · now</p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words leading-relaxed">
                        {content.slice(0, platformLimits.x)}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-muted-foreground max-w-[280px]">
                        <button className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors cursor-pointer">
                            <MessageCircle className="h-4 w-4" /> 0
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-green-500 transition-colors cursor-pointer">
                            <Repeat2 className="h-4 w-4" /> 0
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-red-500 transition-colors cursor-pointer">
                            <Heart className="h-4 w-4" /> 0
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors cursor-pointer">
                            <Share2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function YouTubePreview({ content, media, accountName }: {
    content: string; media: MediaItem[]; accountName: string
}) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {media.length > 0 ? (
                <div className="relative w-full aspect-video bg-muted">
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white ml-0.5" />
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1 rounded">0:00</div>
                </div>
            ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground/30" />
                </div>
            )}
            <div className="p-3 flex gap-3">
                <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold line-clamp-2">{content.slice(0, 100)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{accountName} · 0 views · Just now</p>
                </div>
            </div>
        </div>
    )
}

function LinkedInPreview({ content, media, accountName }: {
    content: string; media: MediaItem[]; accountName: string
}) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#0A66C2' }}>
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">{accountName}</p>
                    <p className="text-xs text-muted-foreground">Just now · <Globe className="h-3 w-3 inline" /></p>
                </div>
            </div>
            <div className="px-3 pb-2">
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content.slice(0, platformLimits.linkedin)}</p>
            </div>
            {media.length > 0 && (
                <div className="w-full bg-muted">
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="w-full max-h-[250px] object-cover" />
                </div>
            )}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                👍 0 · 0 comments
            </div>
            <div className="flex items-center border-t divide-x">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <ThumbsUp className="h-4 w-4" /> Like
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>
        </div>
    )
}

function GenericPreview({ content, media, accountName, platform }: {
    content: string; media: MediaItem[]; accountName: string; platform: string
}) {
    const limit = platformLimits[platform] || 5000
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: platformColors[platform] || '#666' }}>
                    {accountName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold">{accountName}</p>
                    <p className="text-[10px] text-muted-foreground">{platformLabels[platform] || platform}</p>
                </div>
            </div>
            <div className="px-3 pb-3">
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content.slice(0, limit)}</p>
            </div>
            {media.length > 0 && (
                <div className="px-3 pb-3">
                    <img src={media[0].thumbnailUrl || media[0].url} alt="" className="w-full rounded-lg max-h-[200px] object-cover" />
                </div>
            )}
        </div>
    )
}

// ─── Page ───────────────────────────────────────────

export default function ComposePage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
    const [content, setContent] = useState('')
    // Use platform ID as unique key (not platform:accountId which can collide)
    const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set())
    const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([])
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    // Facebook post type per platform ID
    const [fbPostTypes, setFbPostTypes] = useState<Record<string, 'feed' | 'story'>>({})

    // Load channels — only include active platforms
    useEffect(() => {
        fetch('/api/admin/channels')
            .then((r) => r.json())
            .then((data: Channel[]) => {
                // Filter only active platforms
                const filtered = data.map((ch) => ({
                    ...ch,
                    platforms: (ch.platforms || []).filter((p) => p.isActive),
                }))
                setChannels(filtered)
                const first = filtered.find((ch) => ch.platforms.length > 0)
                if (first) setSelectedChannel(first)
            })
            .catch(() => toast.error('Failed to load channels'))
    }, [])

    // When channel changes, auto-select all active platforms (by unique ID)
    useEffect(() => {
        if (selectedChannel?.platforms) {
            setSelectedPlatformIds(new Set(selectedChannel.platforms.map((p) => p.id)))
            // Default FB pages to "feed"
            const fbTypes: Record<string, 'feed' | 'story'> = {}
            selectedChannel.platforms.forEach((p) => {
                if (p.platform === 'facebook') fbTypes[p.id] = 'feed'
            })
            setFbPostTypes(fbTypes)
        }
    }, [selectedChannel])

    // Get active platforms from selected channel
    const activePlatforms = selectedChannel?.platforms || []

    // Toggle platform by unique ID
    const togglePlatform = (platformId: string) => {
        setSelectedPlatformIds((prev) => {
            const next = new Set(prev)
            if (next.has(platformId)) next.delete(platformId)
            else next.add(platformId)
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
                const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
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
            const platforms = activePlatforms
                .filter((p) => selectedPlatformIds.has(p.id))
                .map((p) => p.platform)
            const res = await fetch('/api/admin/posts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: selectedChannel.id, topic: aiTopic, platforms }),
            })
            if (!res.ok) { toast.error('Generation failed'); return }
            const data = await res.json()
            setContent(data.content || '')
            toast.success('Content generated!')
        } catch { toast.error('AI generation failed') }
        finally { setGenerating(false) }
    }

    // Build platforms payload from selected IDs
    const buildPlatformsPayload = () => {
        return activePlatforms
            .filter((p) => selectedPlatformIds.has(p.id))
            .map((p) => ({
                platform: p.platform,
                accountId: p.accountId,
                ...(p.platform === 'facebook' ? { postType: fbPostTypes[p.id] || 'feed' } : {}),
            }))
    }

    // Save draft
    const handleSaveDraft = async () => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Select a channel and add content')
            return
        }
        setSaving(true)
        try {
            let scheduledAt: string | null = null
            if (scheduleDate && scheduleTime) scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

            const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id, content,
                    status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
                    scheduledAt,
                    mediaIds: attachedMedia.map((m) => m.id),
                    platforms: buildPlatformsPayload(),
                }),
            })
            if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed to save'); return }
            toast.success(scheduledAt ? 'Post scheduled!' : 'Draft saved!')
            router.push('/dashboard/posts')
        } catch { toast.error('Failed to save') }
        finally { setSaving(false) }
    }

    // Publish now
    const handlePublishNow = async () => {
        if (!selectedChannel || !content.trim()) { toast.error('Select a channel and add content'); return }
        if (selectedPlatformIds.size === 0) { toast.error('Select at least one platform'); return }
        setPublishing(true)
        try {
            const createRes = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id, content, status: 'PUBLISHING',
                    mediaIds: attachedMedia.map((m) => m.id),
                    platforms: buildPlatformsPayload(),
                }),
            })
            if (!createRes.ok) { toast.error('Failed to create post'); return }
            const post = await createRes.json()
            const pubRes = await fetch(`/api/admin/posts/${post.id}/publish`, { method: 'POST' })
            if (!pubRes.ok) toast.error('Post created but publishing failed.')
            else toast.success('Post published!')
            router.push('/dashboard/posts')
        } catch { toast.error('Failed to publish') }
        finally { setPublishing(false) }
    }

    const charCount = content.length

    // Get selected platform entries for preview
    const selectedEntries = activePlatforms.filter((p) => selectedPlatformIds.has(p.id))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Compose Post</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={saving || !content.trim()} className="cursor-pointer">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {scheduleDate ? 'Schedule' : 'Save Draft'}
                    </Button>
                    <Button onClick={handlePublishNow} disabled={publishing || !content.trim() || selectedPlatformIds.size === 0} className="cursor-pointer">
                        {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Publish Now
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Left: Platforms ── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Channel */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Channel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedChannel?.id || ''}
                                onValueChange={(v) => setSelectedChannel(channels.find((c) => c.id === v) || null)}
                            >
                                <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                                <SelectContent>
                                    {channels.map((ch) => (
                                        <SelectItem key={ch.id} value={ch.id}>{ch.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Publish To</CardTitle>
                            <CardDescription className="text-xs">
                                {selectedPlatformIds.size} account{selectedPlatformIds.size !== 1 ? 's' : ''} selected
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {activePlatforms.length ? (
                                activePlatforms.map((p) => {
                                    const isChecked = selectedPlatformIds.has(p.id)
                                    const isFacebook = p.platform === 'facebook'
                                    return (
                                        <div key={p.id} className="space-y-1.5">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => togglePlatform(p.id)}
                                                />
                                                <div
                                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => togglePlatform(p.id)}
                                                >
                                                    <div
                                                        className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                        style={{ backgroundColor: platformColors[p.platform] || '#666' }}
                                                    >
                                                        {(platformLabels[p.platform] || p.platform).charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium leading-none">
                                                            {p.accountName}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {platformLabels[p.platform] || p.platform}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {isFacebook && isChecked && (
                                                <div className="ml-9 flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setFbPostTypes((prev) => ({ ...prev, [p.id]: 'feed' }))}
                                                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors cursor-pointer ${(fbPostTypes[p.id] || 'feed') === 'feed'
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'border-border hover:border-blue-300'
                                                            }`}
                                                    >
                                                        Feed
                                                    </button>
                                                    <button
                                                        onClick={() => setFbPostTypes((prev) => ({ ...prev, [p.id]: 'story' }))}
                                                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors cursor-pointer ${fbPostTypes[p.id] === 'story'
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'border-border hover:border-blue-300'
                                                            }`}
                                                    >
                                                        Story
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    No active platforms connected
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Schedule
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
                            {scheduleDate && (
                                <Button variant="ghost" size="sm" onClick={() => { setScheduleDate(''); setScheduleTime('') }} className="text-xs cursor-pointer">
                                    <X className="h-3 w-3 mr-1" /> Clear schedule
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div >

                {/* ── Center: Editor ── */}
                < div className="lg:col-span-5 space-y-4" >
                    {/* AI Generate */}
                    < Card >
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" /> AI Generate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter topic, e.g. 'Summer sale 50% off'"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <Button onClick={handleGenerate} disabled={generating || !aiTopic.trim()} size="sm" className="shrink-0 cursor-pointer">
                                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card >

                    {/* Content Editor */}
                    < Card >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Content</CardTitle>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {selectedEntries.map((p) => {
                                        const limit = platformLimits[p.platform]
                                        if (!limit) return null
                                        const over = charCount > limit
                                        return (
                                            <Badge key={p.id} variant={over ? 'destructive' : 'secondary'} className="text-[10px]">
                                                {(platformLabels[p.platform] || p.platform).slice(0, 2).toUpperCase()} {charCount}/{limit}
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
                    </Card >

                    {/* Media */}
                    < Card >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Media
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || !selectedChannel} className="cursor-pointer">
                                    {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                    Upload
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPTED_FILE_TYPES}
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
                                            {media.type === 'video' ? (
                                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                                    <Play className="h-8 w-8 text-muted-foreground/50" />
                                                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{media.originalName}</span>
                                                </div>
                                            ) : (
                                                <img src={media.thumbnailUrl || media.url} alt={media.originalName || ''} className="h-full w-full object-cover" />
                                            )}
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
                                    <p className="text-sm text-muted-foreground">Click or drag files to upload</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Images (JPG, PNG, GIF, WebP, HEIC, AVIF) & Videos (MP4, MOV, AVI, MKV, WebM) up to 50MB
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card >
                </div >

                {/* ── Right: Realistic Previews ── */}
                < div className="lg:col-span-4 space-y-4" >
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {content.trim() && selectedEntries.length > 0 ? (
                                selectedEntries.map((p) => {
                                    const name = p.accountName
                                    switch (p.platform) {
                                        case 'facebook':
                                            return <FacebookPreview key={p.id} content={content} media={attachedMedia} accountName={name} postType={fbPostTypes[p.id] || 'feed'} />
                                        case 'instagram':
                                            return <InstagramPreview key={p.id} content={content} media={attachedMedia} accountName={name} />
                                        case 'tiktok':
                                            return <TikTokPreview key={p.id} content={content} media={attachedMedia} accountName={name} />
                                        case 'x':
                                        case 'twitter':
                                            return <XPreview key={p.id} content={content} accountName={name} />
                                        case 'youtube':
                                            return <YouTubePreview key={p.id} content={content} media={attachedMedia} accountName={name} />
                                        case 'linkedin':
                                            return <LinkedInPreview key={p.id} content={content} media={attachedMedia} accountName={name} />
                                        default:
                                            return <GenericPreview key={p.id} content={content} media={attachedMedia} accountName={name} platform={p.platform} />
                                    }
                                })
                            ) : (
                                <div className="text-center py-10">
                                    <Hash className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {selectedEntries.length === 0 ? 'Select platforms to see preview' : 'Start typing to see preview'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {
                        scheduleDate && (
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
                        )
                    }
                </div >
            </div >
        </div >
    )
}
