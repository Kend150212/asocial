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
    FolderOpen,
    RectangleHorizontal,
    RectangleVertical,
    Square,
    ChevronLeft,
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

// ─── Media helper ────────────────────────────────────

function isVideo(media: MediaItem): boolean {
    if (media.type === 'video') return true
    const ext = (media.originalName || media.url || '').toLowerCase()
    return /\.(mp4|mov|webm|avi|mkv|ogg|3gp|flv|wmv|mpeg)$/.test(ext)
}

function MediaElement({ media, className }: { media: MediaItem; className?: string }) {
    if (isVideo(media)) {
        return (
            <div className={`relative ${className || ''}`}>
                <img
                    src={media.thumbnailUrl || media.url}
                    alt=""
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white ml-0.5" />
                    </div>
                </div>
            </div>
        )
    }
    return <img src={media.thumbnailUrl || media.url} alt="" className={className} />
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

function FacebookPreview({ content, media, accountName, postType, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; postType: string; mediaRatio: string
}) {
    if (postType === 'story') {
        return (
            <div className="rounded-xl overflow-hidden bg-gradient-to-b from-blue-600 to-blue-800 text-white relative" style={{ minHeight: 280 }}>
                {media.length > 0 && (
                    <MediaElement media={media[0]} className="absolute inset-0 w-full h-full object-cover opacity-80" />
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
                <div className={`w-full bg-muted overflow-hidden ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'
                    }`}>
                    <MediaElement media={media[0]} className="w-full h-full object-cover" />
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

function InstagramPreview({ content, media, accountName, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; mediaRatio: string
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
                <div className={`w-full bg-muted overflow-hidden ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'
                    }`}>
                    <MediaElement media={media[0]} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className={`w-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'
                    }`}>
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

function TikTokPreview({ content, media, accountName, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; mediaRatio: string
}) {
    return (
        <div className={`rounded-xl overflow-hidden bg-black text-white relative ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
            }`}>
            {media.length > 0 ? (
                <MediaElement media={media[0]} className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            )}
            <div className="relative z-10 flex h-full">
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

function YouTubePreview({ content, media, accountName, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; mediaRatio: string
}) {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {media.length > 0 ? (
                <div className={`relative w-full bg-muted overflow-hidden ${mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : mediaRatio === '1:1' ? 'aspect-square' : 'aspect-video'
                    }`}>
                    <MediaElement media={media[0]} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white ml-0.5" />
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1 rounded">0:00</div>
                </div>
            ) : (
                <div className={`w-full bg-muted flex items-center justify-center ${mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : mediaRatio === '1:1' ? 'aspect-square' : 'aspect-video'
                    }`}>
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

function LinkedInPreview({ content, media, accountName, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; mediaRatio: string
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
                <div className={`w-full bg-muted overflow-hidden ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'
                    }`}>
                    <MediaElement media={media[0]} className="w-full h-full object-cover" />
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

function GenericPreview({ content, media, accountName, platform, mediaRatio }: {
    content: string; media: MediaItem[]; accountName: string; platform: string; mediaRatio: string
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
                <div className={`px-3 pb-3 overflow-hidden ${mediaRatio === '16:9' ? 'aspect-video' : mediaRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'
                    }`}>
                    <MediaElement media={media[0]} className="w-full h-full rounded-lg object-cover" />
                </div>
            )}
        </div>
    )
}

// ─── Page ───────────────────────────────────────────

export default function ComposePage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const savedRef = useRef(false) // track if post has been saved/published

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
    const [dragging, setDragging] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    // Facebook post type per platform ID
    const [fbPostTypes, setFbPostTypes] = useState<Record<string, 'feed' | 'story'>>({})
    const [previewPlatform, setPreviewPlatform] = useState<string>('')
    const [mediaRatio, setMediaRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1')
    const [showMediaLibrary, setShowMediaLibrary] = useState(false)
    const [libraryMedia, setLibraryMedia] = useState<MediaItem[]>([])
    const [loadingLibrary, setLoadingLibrary] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [aiScheduleSuggestions, setAiScheduleSuggestions] = useState<any[]>([])

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

    // ── Auto-save draft on page leave ──
    useEffect(() => {
        const autoSave = async () => {
            if (savedRef.current || !selectedChannel || !content.trim()) return
            savedRef.current = true // prevent multiple saves
            try {
                const scheduledAt = scheduleDate && scheduleTime
                    ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
                    : null
                await fetch('/api/admin/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: selectedChannel.id,
                        content,
                        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
                        scheduledAt,
                        mediaIds: attachedMedia.map((m) => m.id),
                        platforms: buildPlatformsPayload(),
                    }),
                    keepalive: true, // ensures request completes even on page close
                })
            } catch { /* silent */ }
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!savedRef.current && selectedChannel && content.trim()) {
                autoSave()
                e.preventDefault()
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            // Auto-save when component unmounts (back button, navigation)
            autoSave()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannel, content, attachedMedia, scheduleDate, scheduleTime])

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

    // Upload media — server-side upload to Google Drive (avoids CORS)
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || !selectedChannel) return
        setUploading(true)
        let successCount = 0
        try {
            for (const file of Array.from(files)) {
                try {
                    toast.info(`Uploading ${file.name}...`)
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('channelId', selectedChannel.id)

                    const res = await fetch('/api/admin/media', {
                        method: 'POST',
                        body: formData,
                    })

                    if (!res.ok) {
                        const err = await res.json()
                        toast.error(err.error || `Failed to upload ${file.name}`)
                        continue
                    }

                    const media = await res.json()
                    setAttachedMedia((prev) => [...prev, media])
                    successCount++
                } catch {
                    toast.error(`Upload failed: ${file.name}`)
                }
            }
            if (successCount > 0) toast.success(`${successCount} file(s) uploaded!`)
        } finally {
            setUploading(false)
        }
    }, [selectedChannel])

    const removeMedia = (id: string) => {
        setAttachedMedia((prev) => prev.filter((m) => m.id !== id))
    }

    // Drag & drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files)
        }
    }, [handleFileUpload])

    // Fetch media library for current channel
    const fetchLibrary = useCallback(async () => {
        if (!selectedChannel) return
        setLoadingLibrary(true)
        try {
            const res = await fetch(`/api/admin/media?channelId=${selectedChannel.id}&limit=50`)
            const data = await res.json()
            setLibraryMedia(data.media || [])
        } catch {
            toast.error('Failed to load media library')
        } finally {
            setLoadingLibrary(false)
        }
    }, [selectedChannel])

    const openLibrary = useCallback(() => {
        setShowMediaLibrary(true)
        fetchLibrary()
    }, [fetchLibrary])

    const addFromLibrary = (media: MediaItem) => {
        if (attachedMedia.some((m) => m.id === media.id)) {
            toast.error('Already added')
            return
        }
        setAttachedMedia((prev) => [...prev, media])
    }

    // AI Generate
    const handleGenerate = async () => {
        if (!selectedChannel || !aiTopic.trim()) {
            toast.error('Enter a topic or paste an article link for AI generation')
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
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Generation failed')
                return
            }
            setContent(data.content || '')
            if (data.articlesFetched > 0) {
                toast.success(`Content generated from ${data.articlesFetched} article(s)!`)
            } else {
                toast.success('Content generated!')
            }
        } catch { toast.error('AI generation failed — check your AI API key in API Hub') }
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
            savedRef.current = true
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
            if (!createRes.ok) {
                const err = await createRes.json()
                toast.error(err.error || 'Failed to create post')
                return
            }
            const post = await createRes.json()
            const pubRes = await fetch(`/api/admin/posts/${post.id}/publish`, { method: 'POST' })
            const pubData = await pubRes.json()

            if (!pubRes.ok || !pubData.success) {
                // Show per-platform errors but do NOT redirect
                const failedPlatforms = (pubData.results || []).filter((r: { success: boolean }) => !r.success)
                if (failedPlatforms.length > 0) {
                    failedPlatforms.forEach((f: { platform: string; error?: string }) => {
                        toast.error(`${f.platform}: ${f.error || 'Failed'}`, { duration: 8000 })
                    })
                    const successCount = (pubData.results || []).filter((r: { success: boolean }) => r.success).length
                    if (successCount > 0) {
                        toast.warning(`Published to ${successCount} platform(s), ${failedPlatforms.length} failed`)
                    }
                } else {
                    toast.error('Publishing failed. Check platform connections.')
                }
                return // Stay on page — don't redirect
            }

            toast.success('Published successfully!')
            savedRef.current = true
            router.push('/dashboard/posts')
        } catch {
            toast.error('Network error — failed to publish')
        } finally {
            setPublishing(false)
        }
    }

    const charCount = content.length

    // Get selected platform entries for preview
    const selectedEntries = activePlatforms.filter((p) => selectedPlatformIds.has(p.id))

    // Deduplicate platforms for preview tabs
    const uniqueSelectedPlatforms = [...new Set(selectedEntries.map((p) => p.platform))]

    // Auto-select first platform for preview if current is invalid
    const effectivePreviewPlatform = uniqueSelectedPlatforms.includes(previewPlatform)
        ? previewPlatform
        : uniqueSelectedPlatforms[0] || ''

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
                                            <div
                                                className="flex items-center gap-3 cursor-pointer select-none"
                                                onClick={() => togglePlatform(p.id)}
                                            >
                                                {/* Custom checkbox — no Radix, no event issues */}
                                                <div className={`h-4 w-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors ${isChecked
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'border-input bg-transparent'
                                                    }`}>
                                                    {isChecked && <Check className="h-3 w-3" />}
                                                </div>
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
                            {/* AI-Powered Schedule Suggestion */}
                            <div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs cursor-pointer gap-2"
                                    disabled={!selectedChannel || generating}
                                    onClick={async () => {
                                        if (!selectedChannel) return
                                        const platforms = activePlatforms
                                            .filter((p) => selectedPlatformIds.has(p.id))
                                            .map((p) => p.platform)
                                        if (platforms.length === 0) {
                                            toast.error('Select at least one platform')
                                            return
                                        }
                                        try {
                                            const res = await fetch('/api/admin/posts/suggest-schedule', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    channelId: selectedChannel.id,
                                                    platforms,
                                                    content: content.slice(0, 200),
                                                }),
                                            })
                                            const data = await res.json()
                                            if (!res.ok) {
                                                toast.error(data.error || 'Failed to get suggestions')
                                                return
                                            }
                                            setAiScheduleSuggestions(data.suggestions || [])
                                            toast.success('AI schedule suggestions ready!')
                                        } catch {
                                            toast.error('Failed to get AI suggestions')
                                        }
                                    }}
                                >
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    AI Suggest Best Times
                                </Button>
                                {aiScheduleSuggestions.length > 0 && (
                                    <div className="grid grid-cols-1 gap-1.5 mt-2">
                                        {aiScheduleSuggestions.map((s: { date: string; time: string; label: string; reason: string }, i: number) => {
                                            const isSelected = scheduleDate === s.date && scheduleTime === s.time
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setScheduleDate(s.date)
                                                        setScheduleTime(s.time)
                                                    }}
                                                    className={`text-left px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{s.label}</span>
                                                        <span className="opacity-70">{s.date} {s.time}</span>
                                                    </div>
                                                    <p className="opacity-60 mt-0.5 text-[10px]">{s.reason}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="border-t pt-3">
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Time</Label>
                                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1" />
                            </div>
                            {scheduleDate && (
                                <Button variant="ghost" size="sm" onClick={() => { setScheduleDate(''); setScheduleTime(''); setAiScheduleSuggestions([]) }} className="text-xs cursor-pointer">
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
                                    placeholder="Topic, keyword, or paste an article URL..."
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
                                <span className={`text-xs ${charCount > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                                    {charCount > 0 ? `${charCount} characters` : ''}
                                </span>
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
                    <Card
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`transition-all ${dragging ? 'ring-2 ring-primary border-primary' : ''}`}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Media
                                    {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                                </CardTitle>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="sm" onClick={openLibrary} disabled={!selectedChannel} className="cursor-pointer">
                                        <FolderOpen className="h-4 w-4 mr-1" />
                                        Library
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || !selectedChannel} className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload
                                    </Button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPTED_FILE_TYPES}
                                    className="hidden"
                                    onChange={(e) => { handleFileUpload(e.target.files); if (e.target) e.target.value = '' }}
                                />
                            </div>
                            {/* Aspect Ratio Selector */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">Ratio:</span>
                                {(['16:9', '1:1', '9:16'] as const).map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setMediaRatio(ratio)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${mediaRatio === ratio
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {ratio === '16:9' && <RectangleHorizontal className="h-3 w-3" />}
                                        {ratio === '1:1' && <Square className="h-3 w-3" />}
                                        {ratio === '9:16' && <RectangleVertical className="h-3 w-3" />}
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {attachedMedia.length > 0 && (
                                <div className={`grid gap-2 ${mediaRatio === '9:16' ? 'grid-cols-4' : 'grid-cols-3'
                                    }`}>
                                    {attachedMedia.map((media) => (
                                        <div
                                            key={media.id}
                                            className={`relative group rounded-lg overflow-hidden bg-muted ${mediaRatio === '16:9' ? 'aspect-video'
                                                : mediaRatio === '9:16' ? 'aspect-[9/16]'
                                                    : 'aspect-square'
                                                }`}
                                        >
                                            {isVideo(media) ? (
                                                <div className="relative h-full w-full bg-muted">
                                                    <img
                                                        src={media.thumbnailUrl || media.url}
                                                        alt={media.originalName || ''}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
                                                            <Play className="h-4 w-4 text-white ml-0.5" />
                                                        </div>
                                                    </div>
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
                            )}
                            {/* Drop zone — always visible */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${dragging
                                    ? 'border-primary bg-primary/5 p-8'
                                    : attachedMedia.length > 0
                                        ? 'p-4 hover:border-primary/30'
                                        : 'p-8 hover:border-primary/30'
                                    }`}
                            >
                                {dragging ? (
                                    <>
                                        <Upload className="h-10 w-10 mx-auto text-primary mb-2 animate-bounce" />
                                        <p className="text-sm font-medium text-primary">Drop files here</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className={`mx-auto text-muted-foreground/40 mb-1.5 ${attachedMedia.length > 0 ? 'h-5 w-5' : 'h-8 w-8 mb-2'}`} />
                                        <p className="text-sm text-muted-foreground">{attachedMedia.length > 0 ? 'Add more files' : 'Click or drag files to upload'}</p>
                                        {attachedMedia.length === 0 && (
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                Images & Videos — uploaded to Google Drive
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Library Modal */}
                    {showMediaLibrary && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4" />
                                            Media Library — {selectedChannel?.displayName}
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowMediaLibrary(false)} className="cursor-pointer">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardDescription className="text-xs">Click to add media to your post. Already attached items are marked.</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-y-auto flex-1 py-4">
                                    {loadingLibrary ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : libraryMedia.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-12">No media uploaded yet for this channel.</p>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {libraryMedia.map((media) => {
                                                const isAttached = attachedMedia.some((m) => m.id === media.id)
                                                return (
                                                    <div
                                                        key={media.id}
                                                        onClick={() => !isAttached && addFromLibrary(media)}
                                                        className={`relative rounded-lg overflow-hidden bg-muted aspect-square cursor-pointer group transition-all ${isAttached ? 'ring-2 ring-primary opacity-60' : 'hover:ring-2 hover:ring-primary/50'
                                                            }`}
                                                    >
                                                        {isVideo(media) ? (
                                                            <div className="relative h-full w-full bg-muted">
                                                                <img
                                                                    src={media.thumbnailUrl || media.url}
                                                                    alt={media.originalName || ''}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <div className="h-6 w-6 rounded-full bg-black/50 flex items-center justify-center">
                                                                        <Play className="h-3 w-3 text-white ml-0.5" />
                                                                    </div>
                                                                </div>
                                                                <span className="absolute bottom-0 inset-x-0 text-[8px] bg-black/60 text-white px-1 py-0.5 truncate">{media.originalName}</span>
                                                            </div>
                                                        ) : (
                                                            <img src={media.thumbnailUrl || media.url} alt={media.originalName || ''} className="h-full w-full object-cover" />
                                                        )}
                                                        {isAttached && (
                                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                <Check className="h-5 w-5 text-primary" />
                                                            </div>
                                                        )}
                                                        <span className="absolute bottom-0 inset-x-0 text-[8px] bg-black/60 text-white px-1 py-0.5 truncate">
                                                            {media.originalName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div >

                {/* ── Right: Realistic Previews ── */}
                < div className="lg:col-span-4 space-y-4" >
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Post Preview</CardTitle>
                                {content.trim() && uniqueSelectedPlatforms.length > 1 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {uniqueSelectedPlatforms.length} platforms
                                    </p>
                                )}
                            </div>
                            {/* Platform tab pills */}
                            {content.trim() && uniqueSelectedPlatforms.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    {uniqueSelectedPlatforms.map((platform) => {
                                        const accountsForPlatform = selectedEntries.filter((e) => e.platform === platform)
                                        const isActive = effectivePreviewPlatform === platform
                                        return (
                                            <button
                                                key={platform}
                                                onClick={() => setPreviewPlatform(platform)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${isActive
                                                    ? 'text-white shadow-sm'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                                style={isActive ? { backgroundColor: platformColors[platform] || '#666' } : {}}
                                            >
                                                {platformLabels[platform] || platform}
                                                {accountsForPlatform.length > 1 && (
                                                    <span className={`text-[9px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                                                        ×{accountsForPlatform.length}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {content.trim() && effectivePreviewPlatform ? (() => {
                                // Find the first account of the currently previewed platform
                                const entry = selectedEntries.find((e) => e.platform === effectivePreviewPlatform)
                                if (!entry) return null
                                const name = entry.accountName
                                const accountsCount = selectedEntries.filter((e) => e.platform === effectivePreviewPlatform).length

                                return (
                                    <>
                                        {(() => {
                                            switch (effectivePreviewPlatform) {
                                                case 'facebook':
                                                    return <FacebookPreview content={content} media={attachedMedia} accountName={name} postType={fbPostTypes[entry.id] || 'feed'} mediaRatio={mediaRatio} />
                                                case 'instagram':
                                                    return <InstagramPreview content={content} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'tiktok':
                                                    return <TikTokPreview content={content} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'x':
                                                case 'twitter':
                                                    return <XPreview content={content} accountName={name} />
                                                case 'youtube':
                                                    return <YouTubePreview content={content} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'linkedin':
                                                    return <LinkedInPreview content={content} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                default:
                                                    return <GenericPreview content={content} media={attachedMedia} accountName={name} platform={effectivePreviewPlatform} mediaRatio={mediaRatio} />
                                            }
                                        })()}
                                        {accountsCount > 1 && (
                                            <p className="text-[10px] text-muted-foreground text-center">
                                                This content will be posted to {accountsCount} {platformLabels[effectivePreviewPlatform] || effectivePreviewPlatform} accounts
                                            </p>
                                        )}
                                    </>
                                )
                            })() : (
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
