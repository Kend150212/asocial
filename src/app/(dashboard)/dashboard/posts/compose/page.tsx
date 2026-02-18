'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    HardDrive,
    Folder,
    ChevronRight,
    Bold,
    Italic,
    Type,
    Smile,
    AtSign,
    Link2,
    ChevronDown,
    MessageSquare,
    Layers,
    Film,
    LayoutGrid,
    CircleDot,
    Camera,
    Users,
    Video,
    Scissors,
    Tag,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Bell,
    Code2,
    Baby,
} from 'lucide-react'
import { PlatformIcon } from '@/components/platform-icons'
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
                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-muted">
                    <PlatformIcon platform={platform} size="md" />
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
    const searchParams = useSearchParams()
    const editPostId = searchParams.get('edit')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const savedRef = useRef(false) // track if post has been saved/published
    const postIdRef = useRef<string | null>(editPostId) // track created post ID to avoid duplicates
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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
    const [fbPostTypes, setFbPostTypes] = useState<Record<string, 'feed' | 'story' | 'reel'>>({})
    const [fbCarousel, setFbCarousel] = useState(false)
    const [fbFirstComment, setFbFirstComment] = useState('')
    const [fbSettingsOpen, setFbSettingsOpen] = useState(true)
    // Instagram settings
    const [igPostType, setIgPostType] = useState<'feed' | 'reel' | 'story'>('feed')
    const [igShareToStory, setIgShareToStory] = useState(false)
    const [igCollaborators, setIgCollaborators] = useState('')
    const [igSettingsOpen, setIgSettingsOpen] = useState(true)
    // YouTube settings
    const [ytPostType, setYtPostType] = useState<'video' | 'shorts'>('video')
    const [ytVideoTitle, setYtVideoTitle] = useState('')
    const [ytCategory, setYtCategory] = useState('')
    const [ytTags, setYtTags] = useState('')
    const [ytPrivacy, setYtPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
    const [ytMadeForKids, setYtMadeForKids] = useState(false)
    const [ytNotifySubscribers, setYtNotifySubscribers] = useState(true)
    const [ytSettingsOpen, setYtSettingsOpen] = useState(true)
    const [previewPlatform, setPreviewPlatform] = useState<string>('')
    const [mediaRatio, setMediaRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1')
    const [showMediaLibrary, setShowMediaLibrary] = useState(false)
    const [libraryMedia, setLibraryMedia] = useState<MediaItem[]>([])
    const [loadingLibrary, setLoadingLibrary] = useState(false)
    const [loadingDrivePicker, setLoadingDrivePicker] = useState(false)
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
                // If editing, don't auto-select channel — wait for post load
                if (!editPostId) {
                    const first = filtered.find((ch) => ch.platforms.length > 0)
                    if (first) setSelectedChannel(first)
                }
            })
            .catch(() => toast.error('Failed to load channels'))
    }, [editPostId])

    // Load existing post when in edit mode
    useEffect(() => {
        if (!editPostId || channels.length === 0) return
        fetch(`/api/admin/posts/${editPostId}`)
            .then((r) => r.json())
            .then((post) => {
                setContent(post.content || '')
                setAttachedMedia((post.media || []).map((m: { mediaItem: MediaItem }) => m.mediaItem))
                // Find and select the channel
                const ch = channels.find((c) => c.id === post.channel.id)
                if (ch) setSelectedChannel(ch)
                // Restore schedule
                if (post.scheduledAt) {
                    const d = new Date(post.scheduledAt)
                    setScheduleDate(d.toISOString().split('T')[0])
                    setScheduleTime(d.toTimeString().slice(0, 5))
                }
                // Restore selected platforms from platformStatuses
                if (post.platformStatuses && ch) {
                    const selectedIds = new Set<string>()
                    const fbTypes: Record<string, 'feed' | 'story' | 'reel'> = {}
                    for (const ps of post.platformStatuses) {
                        const match = ch.platforms.find(
                            (p) => p.platform === ps.platform && p.accountId === ps.accountId
                        )
                        if (match) {
                            selectedIds.add(match.id)
                            if (match.platform === 'facebook') fbTypes[match.id] = 'feed'
                        }
                    }
                    setSelectedPlatformIds(selectedIds)
                    setFbPostTypes(fbTypes)
                }
                savedRef.current = true // prevent auto-save of loaded data
            })
            .catch(() => toast.error('Failed to load post'))
    }, [editPostId, channels])

    // When channel changes (new post only), auto-select all active platforms
    useEffect(() => {
        if (editPostId) return // skip for edit mode — platforms restored from post
        if (selectedChannel?.platforms) {
            setSelectedPlatformIds(new Set(selectedChannel.platforms.map((p) => p.id)))
            // Default FB pages to "feed"
            const fbTypes: Record<string, 'feed' | 'story' | 'reel'> = {}
            selectedChannel.platforms.forEach((p) => {
                if (p.platform === 'facebook') fbTypes[p.id] = 'feed'
            })
            setFbPostTypes(fbTypes)
        }
    }, [selectedChannel, editPostId])

    // ── Auto-save draft on page leave ──
    useEffect(() => {
        const autoSave = async () => {
            if (savedRef.current || !selectedChannel || !content.trim()) return
            savedRef.current = true // prevent multiple saves
            try {
                const scheduledAt = scheduleDate && scheduleTime
                    ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
                    : null

                const url = postIdRef.current
                    ? `/api/admin/posts/${postIdRef.current}`
                    : '/api/admin/posts'
                const method = postIdRef.current ? 'PUT' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: selectedChannel.id,
                        content,
                        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
                        scheduledAt,
                        mediaIds: attachedMedia.map((m) => m.id),
                        platforms: activePlatforms
                            .filter((p) => selectedPlatformIds.has(p.id))
                            .map((p) => ({
                                platform: p.platform,
                                accountId: p.accountId,
                                ...(p.platform === 'facebook' ? {
                                    postType: fbPostTypes[p.id] || 'feed',
                                    carousel: fbCarousel,
                                    firstComment: fbFirstComment || undefined,
                                } : {}),
                                ...(p.platform === 'instagram' ? {
                                    postType: igPostType,
                                    shareToStory: igShareToStory,
                                    collaborators: igCollaborators || undefined,
                                } : {}),
                                ...(p.platform === 'youtube' ? {
                                    postType: ytPostType,
                                    videoTitle: ytVideoTitle || undefined,
                                    category: ytCategory || undefined,
                                    tags: ytTags || undefined,
                                    privacy: ytPrivacy,
                                    notifySubscribers: ytNotifySubscribers,
                                    madeForKids: ytMadeForKids,
                                } : {}),
                            })),
                    }),
                    keepalive: true,
                })
                if (!postIdRef.current && res.ok) {
                    const data = await res.json()
                    postIdRef.current = data.id
                }
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

    // Google Picker API — opens Google's native file picker
    const openGooglePicker = useCallback(async () => {
        setLoadingDrivePicker(true)
        try {
            // 1. Get picker config (access token + client ID)
            const configRes = await fetch('/api/user/gdrive/picker-config')
            if (!configRes.ok) {
                const err = await configRes.json()
                toast.error(err.error || 'Google Drive not connected. Connect in API Keys page.')
                setLoadingDrivePicker(false)
                return
            }
            const { accessToken, appId } = await configRes.json()

            // 2. Load Google Picker script if not loaded
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any
            if (!win.google?.picker) {
                await new Promise<void>((resolve, reject) => {
                    if (document.getElementById('google-picker-script')) {
                        const check = setInterval(() => {
                            if (win.google?.picker) { clearInterval(check); resolve() }
                        }, 100)
                        setTimeout(() => { clearInterval(check); reject(new Error('Timeout')) }, 10000)
                        return
                    }
                    const script = document.createElement('script')
                    script.id = 'google-picker-script'
                    script.src = 'https://apis.google.com/js/api.js'
                    script.onload = () => {
                        win.gapi.load('picker', { callback: () => resolve() })
                    }
                    script.onerror = () => reject(new Error('Failed to load Google Picker'))
                    document.head.appendChild(script)
                })
            }

            // 3. Build and show picker with folder navigation
            const gPicker = win.google.picker

            // Create a view that shows images & videos BUT with folder navigation
            const docsView = new gPicker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(false)
                .setMimeTypes('image/png,image/jpeg,image/gif,image/webp,video/mp4,video/quicktime,video/avi,video/webm')

            const picker = new gPicker.PickerBuilder()
                .addView(docsView)
                .setOAuthToken(accessToken)
                .setAppId(appId)
                .enableFeature(gPicker.Feature.MULTISELECT_ENABLED)
                .setMaxItems(10)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .setCallback((data: any) => {
                    if (data.action === gPicker.Action.PICKED && data.docs) {
                        for (const doc of data.docs) {
                            const alreadyAttached = attachedMedia.some((m: { id: string }) => m.id === doc.id)
                            if (alreadyAttached) continue
                            setAttachedMedia(prev => [...prev, {
                                id: doc.id,
                                url: `https://drive.google.com/uc?id=${doc.id}&export=download`,
                                thumbnailUrl: doc.thumbnails?.[0]?.url || null,
                                type: doc.mimeType,
                                originalName: doc.name,
                            }])
                        }
                        toast.success(`Added ${data.docs.length} file${data.docs.length > 1 ? 's' : ''} from Drive`)
                    }
                })
                .build()
            picker.setVisible(true)
        } catch (error) {
            console.error('Google Picker error:', error)
            toast.error('Failed to open Google Drive picker')
        }
        setLoadingDrivePicker(false)
    }, [attachedMedia])

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
                ...(p.platform === 'facebook' ? {
                    postType: fbPostTypes[p.id] || 'feed',
                    carousel: fbCarousel,
                    firstComment: fbFirstComment || undefined,
                } : {}),
                ...(p.platform === 'instagram' ? {
                    postType: igPostType,
                    shareToStory: igShareToStory,
                    collaborators: igCollaborators || undefined,
                } : {}),
                ...(p.platform === 'youtube' ? {
                    postType: ytPostType,
                    videoTitle: ytVideoTitle || undefined,
                    category: ytCategory || undefined,
                    tags: ytTags || undefined,
                    privacy: ytPrivacy,
                    notifySubscribers: ytNotifySubscribers,
                    madeForKids: ytMadeForKids,
                } : {}),
            }))
    }

    // Save draft (or update existing)
    const handleSaveDraft = async () => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Select a channel and add content')
            return
        }
        setSaving(true)
        try {
            let scheduledAt: string | null = null
            if (scheduleDate && scheduleTime) scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

            const existingId = editPostId || postIdRef.current
            const url = existingId ? `/api/admin/posts/${existingId}` : '/api/admin/posts'
            const method = existingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
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
            const data = await res.json()
            if (!postIdRef.current) postIdRef.current = data.id
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
            const existingId = editPostId || postIdRef.current
            const url = existingId ? `/api/admin/posts/${existingId}` : '/api/admin/posts'
            const method = existingId ? 'PUT' : 'POST'

            const createRes = await fetch(url, {
                method,
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{editPostId ? 'Edit Post' : 'Compose Post'}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={saving || !content.trim()} className="cursor-pointer">
                        {saving ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Save className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline">{scheduleDate ? 'Schedule' : 'Save Draft'}</span>
                    </Button>
                    <Button onClick={handlePublishNow} disabled={publishing || !content.trim() || selectedPlatformIds.size === 0} className="cursor-pointer">
                        {publishing ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Send className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline">Publish Now</span>
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Left: Platforms ── */}
                <div className="lg:col-span-2 space-y-4">
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm">Publish To</CardTitle>
                                    <CardDescription className="text-xs">
                                        {selectedPlatformIds.size} account{selectedPlatformIds.size !== 1 ? 's' : ''} selected
                                    </CardDescription>
                                </div>
                                {activePlatforms.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                        onClick={() => {
                                            if (selectedPlatformIds.size === activePlatforms.length) {
                                                setSelectedPlatformIds(new Set())
                                            } else {
                                                setSelectedPlatformIds(new Set(activePlatforms.map(p => p.id)))
                                            }
                                        }}
                                    >
                                        {selectedPlatformIds.size === activePlatforms.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
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
                                                <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                                                    <PlatformIcon platform={p.platform} size="md" />
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
                < div className="lg:col-span-6 space-y-4" >
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
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Content</CardTitle>
                                <span className={`text-xs ${charCount > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                                    {charCount > 0 ? `${charCount} characters` : ''}
                                </span>
                            </div>
                            {/* Content Toolbar */}
                            <div className="flex items-center gap-1 pt-2 border-b pb-2 -mx-1 flex-wrap">
                                <button
                                    type="button"
                                    title="Bold"
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const start = ta.selectionStart
                                        const end = ta.selectionEnd
                                        const selected = content.substring(start, end)
                                        const newContent = content.substring(0, start) + `**${selected || 'text'}**` + content.substring(end)
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + 2, start + 2 + (selected || 'text').length) }, 0)
                                    }}
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Italic"
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const start = ta.selectionStart
                                        const end = ta.selectionEnd
                                        const selected = content.substring(start, end)
                                        const newContent = content.substring(0, start) + `_${selected || 'text'}_` + content.substring(end)
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + 1, start + 1 + (selected || 'text').length) }, 0)
                                    }}
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <div className="w-px h-5 bg-border mx-1" />
                                <button
                                    type="button"
                                    title="Add Hashtag"
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const pos = ta.selectionStart
                                        const before = content.substring(0, pos)
                                        const after = content.substring(pos)
                                        const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
                                        const newContent = before + prefix + '#' + after
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length + 1, pos + prefix.length + 1) }, 0)
                                    }}
                                >
                                    <Hash className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Mention"
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const pos = ta.selectionStart
                                        const before = content.substring(0, pos)
                                        const after = content.substring(pos)
                                        const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
                                        const newContent = before + prefix + '@' + after
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length + 1, pos + prefix.length + 1) }, 0)
                                    }}
                                >
                                    <AtSign className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Add Link"
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const pos = ta.selectionStart
                                        const before = content.substring(0, pos)
                                        const after = content.substring(pos)
                                        const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
                                        const newContent = before + prefix + 'https://' + after
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length, pos + prefix.length + 8) }, 0)
                                    }}
                                >
                                    <Link2 className="h-4 w-4" />
                                </button>
                                <div className="w-px h-5 bg-border mx-1" />
                                {/* Emoji Picker */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        title="Emoji"
                                        className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${showEmojiPicker ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile className="h-4 w-4" />
                                    </button>
                                    {showEmojiPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                            <div className="absolute top-10 left-0 z-50 bg-popover border rounded-xl shadow-xl p-3 w-[280px]">
                                                <div className="grid grid-cols-8 gap-1">
                                                    {['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', '😤', '🔥', '💯', '❤️', '👏', '🙌', '💪', '✨', '🎉', '🎊', '👍', '👎', '🤔', '😱', '😢', '🤝', '💡', '📌', '🚀', '📢', '💰', '🛒', '🎯', '📈', '⭐', '🏆', '💎', '🌟', '❗', '✅', '📣', '🔔', '🎁', '💝', '🌈', '☀️', '🌙', '💫', '🍀', '🦋'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-lg"
                                                            onClick={() => {
                                                                const ta = textareaRef.current
                                                                if (!ta) { setContent(prev => prev + emoji); setShowEmojiPicker(false); return }
                                                                const pos = ta.selectionStart
                                                                const newContent = content.substring(0, pos) + emoji + content.substring(pos)
                                                                setContent(newContent)
                                                                setShowEmojiPicker(false)
                                                                setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + emoji.length, pos + emoji.length) }, 0)
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                ref={textareaRef}
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
                                    <Button variant="outline" size="sm" onClick={openGooglePicker} disabled={loadingDrivePicker} className="cursor-pointer">
                                        {loadingDrivePicker ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <HardDrive className="h-4 w-4 mr-1" />}
                                        Drive
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
                                <div className={`grid gap-2 ${mediaRatio === '9:16' ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
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

                    {/* Facebook Settings — only when Facebook platform is selected */}
                    {selectedChannel?.platforms?.some(p => p.platform === 'facebook' && selectedPlatformIds.has(p.id)) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setFbSettingsOpen(!fbSettingsOpen)}
                                >
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <PlatformIcon platform="facebook" size="md" />
                                        Facebook Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${fbSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {fbSettingsOpen && (
                                <CardContent className="space-y-4">
                                    {/* Post Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'feed' as const, label: 'Feed', icon: LayoutGrid, desc: 'Up to 10 images or a video' },
                                                { value: 'reel' as const, label: 'Reel', icon: Film, desc: 'Single video only' },
                                                { value: 'story' as const, label: 'Story', icon: CircleDot, desc: 'Images, videos, or a mix' },
                                            ].map(opt => {
                                                // Set same post type for all selected Facebook accounts
                                                const selectedFbIds = selectedChannel?.platforms?.filter(p => p.platform === 'facebook' && selectedPlatformIds.has(p.id)).map(p => p.id) || []
                                                const currentType = selectedFbIds.length > 0 ? (fbPostTypes[selectedFbIds[0]] || 'feed') : 'feed'
                                                const isActive = currentType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive
                                                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                            : 'border-border hover:border-blue-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => {
                                                            const newTypes = { ...fbPostTypes }
                                                            selectedFbIds.forEach(id => { newTypes[id] = opt.value })
                                                            setFbPostTypes(newTypes)
                                                        }}
                                                    >
                                                        <opt.icon className="h-5 w-5" />
                                                        <span className="text-xs font-medium">{opt.label}</span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight text-center">{opt.desc}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Carousel Toggle */}
                                    <div className="flex items-center justify-between py-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium">Carousel</p>
                                                <p className="text-[10px] text-muted-foreground">Post images as a swipeable carousel</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${fbCarousel ? 'bg-blue-500' : 'bg-muted'}`}
                                            onClick={() => setFbCarousel(!fbCarousel)}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${fbCarousel ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* First Comment */}
                                    <div className="space-y-2 border-t pt-3">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium">First Comment</p>
                                                <p className="text-[10px] text-muted-foreground">Auto-comment after posting (great for hashtags)</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={fbFirstComment}
                                            onChange={(e) => setFbFirstComment(e.target.value)}
                                            placeholder="Add your first comment here... #hashtag #marketing"
                                            className="w-full min-h-[60px] resize-y rounded-lg border bg-transparent px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                                            rows={2}
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Instagram Settings — only when Instagram platform is selected */}
                    {selectedChannel?.platforms?.some(p => p.platform === 'instagram' && selectedPlatformIds.has(p.id)) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setIgSettingsOpen(!igSettingsOpen)}
                                >
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <PlatformIcon platform="instagram" size="md" />
                                        Instagram Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${igSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {igSettingsOpen && (
                                <CardContent className="space-y-4">
                                    {/* Post Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'feed' as const, label: 'Feed', icon: LayoutGrid, desc: 'Single or multiple images/video' },
                                                { value: 'reel' as const, label: 'Reel', icon: Film, desc: 'Short-form video content' },
                                                { value: 'story' as const, label: 'Story', icon: CircleDot, desc: 'Disappears after 24 hours' },
                                            ].map(opt => {
                                                const isActive = igPostType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive
                                                            ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400'
                                                            : 'border-border hover:border-pink-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setIgPostType(opt.value)}
                                                    >
                                                        <opt.icon className="h-5 w-5" />
                                                        <span className="text-xs font-medium">{opt.label}</span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight text-center">{opt.desc}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Also Share to Story */}
                                    {igPostType === 'feed' && (
                                        <div className="flex items-center justify-between py-2 border-t">
                                            <div className="flex items-center gap-2">
                                                <Camera className="h-4 w-4 text-pink-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Also Share to Story</p>
                                                    <p className="text-[10px] text-muted-foreground">Automatically share your feed post to Stories</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${igShareToStory ? 'bg-pink-500' : 'bg-muted'}`}
                                                onClick={() => setIgShareToStory(!igShareToStory)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${igShareToStory ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Collaborators */}
                                    <div className="space-y-2 border-t pt-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-pink-500" />
                                            <div>
                                                <p className="text-sm font-medium">Collaborators</p>
                                                <p className="text-[10px] text-muted-foreground">Invite up to 3 collaborators (public profiles only)</p>
                                            </div>
                                        </div>
                                        <Input
                                            value={igCollaborators}
                                            onChange={(e) => setIgCollaborators(e.target.value)}
                                            placeholder="@username1, @username2, @username3"
                                            className="text-xs"
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* YouTube Settings — only when YouTube platform is selected */}
                    {selectedChannel?.platforms?.some(p => p.platform === 'youtube' && selectedPlatformIds.has(p.id)) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setYtSettingsOpen(!ytSettingsOpen)}
                                >
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <PlatformIcon platform="youtube" size="md" />
                                        YouTube Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${ytSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {ytSettingsOpen && (
                                <CardContent className="space-y-4">
                                    {/* Post Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'video' as const, label: 'Video', icon: Video, desc: 'Standard YouTube video' },
                                                { value: 'shorts' as const, label: 'Shorts', icon: Scissors, desc: 'Vertical short-form video' },
                                            ].map(opt => {
                                                const isActive = ytPostType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive
                                                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                                                            : 'border-border hover:border-red-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setYtPostType(opt.value)}
                                                    >
                                                        <opt.icon className="h-5 w-5" />
                                                        <span className="text-xs font-medium">{opt.label}</span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight text-center">{opt.desc}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Video Title */}
                                    <div className="space-y-2 border-t pt-3">
                                        <Label className="text-xs text-muted-foreground">Video Title</Label>
                                        <Input
                                            value={ytVideoTitle}
                                            onChange={(e) => setYtVideoTitle(e.target.value)}
                                            placeholder="Enter video title..."
                                            className="text-sm"
                                        />
                                    </div>

                                    {/* Category & Tags */}
                                    <div className="grid grid-cols-2 gap-3 border-t pt-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Category</Label>
                                            <Select value={ytCategory} onValueChange={setYtCategory}>
                                                <SelectTrigger className="text-xs">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[
                                                        'Film & Animation', 'Autos & Vehicles', 'Music', 'Pets & Animals',
                                                        'Sports', 'Travel & Events', 'Gaming', 'People & Blogs',
                                                        'Comedy', 'Entertainment', 'News & Politics', 'Howto & Style',
                                                        'Education', 'Science & Technology', 'Nonprofits & Activism'
                                                    ].map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Privacy</Label>
                                            <Select value={ytPrivacy} onValueChange={(v) => setYtPrivacy(v as 'public' | 'unlisted' | 'private')}>
                                                <SelectTrigger className="text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="public">
                                                        <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Public</span>
                                                    </SelectItem>
                                                    <SelectItem value="unlisted">
                                                        <span className="flex items-center gap-1.5"><EyeOff className="h-3 w-3" /> Unlisted</span>
                                                    </SelectItem>
                                                    <SelectItem value="private">
                                                        <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Private</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Video Tags */}
                                    <div className="space-y-2 border-t pt-3">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-red-500" />
                                            <Label className="text-xs text-muted-foreground">Video Tags</Label>
                                        </div>
                                        <Input
                                            value={ytTags}
                                            onChange={(e) => setYtTags(e.target.value)}
                                            placeholder="tag1, tag2, tag3..."
                                            className="text-xs"
                                        />
                                    </div>

                                    {/* Toggles */}
                                    <div className="border-t pt-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-red-500" />
                                                <p className="text-sm font-medium">Notify Subscribers</p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${ytNotifySubscribers ? 'bg-red-500' : 'bg-muted'}`}
                                                onClick={() => setYtNotifySubscribers(!ytNotifySubscribers)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${ytNotifySubscribers ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-red-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Made for Kids</p>
                                                    <p className="text-[10px] text-muted-foreground">Required by COPPA regulations</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${ytMadeForKids ? 'bg-red-500' : 'bg-muted'}`}
                                                onClick={() => setYtMadeForKids(!ytMadeForKids)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${ytMadeForKids ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Media Library Modal */}
                    {showMediaLibrary && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4" />
                                            Media Library — {selectedChannel?.displayName}
                                            {attachedMedia.length > 0 && (
                                                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                                    {attachedMedia.length} selected
                                                </span>
                                            )}
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowMediaLibrary(false)} className="cursor-pointer">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardDescription className="text-xs">Click to add media. Hover to delete. Already attached items are marked with ✓.</CardDescription>
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
                                                        className={`relative rounded-lg overflow-hidden bg-muted aspect-square group transition-all ${isAttached ? 'ring-2 ring-primary opacity-60' : 'hover:ring-2 hover:ring-primary/50'
                                                            }`}
                                                    >
                                                        {/* Media content — click to add */}
                                                        <div
                                                            className="h-full w-full cursor-pointer"
                                                            onClick={() => !isAttached && addFromLibrary(media)}
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
                                                                </div>
                                                            ) : (
                                                                <img src={media.thumbnailUrl || media.url} alt={media.originalName || ''} className="h-full w-full object-cover" />
                                                            )}
                                                        </div>

                                                        {/* Attached check overlay */}
                                                        {isAttached && (
                                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                                                                <Check className="h-5 w-5 text-primary" />
                                                            </div>
                                                        )}

                                                        {/* Delete button — top right on hover */}
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                if (!confirm(`Delete "${media.originalName}"? This will also remove it from Google Drive.`)) return
                                                                try {
                                                                    const res = await fetch(`/api/admin/media/${media.id}`, { method: 'DELETE' })
                                                                    if (!res.ok) throw new Error()
                                                                    // Remove from library list
                                                                    setLibraryMedia((prev) => prev.filter((m) => m.id !== media.id))
                                                                    // Remove from attached if it was attached
                                                                    setAttachedMedia((prev) => prev.filter((m) => m.id !== media.id))
                                                                    toast.success('Media deleted')
                                                                } catch {
                                                                    toast.error('Failed to delete media')
                                                                }
                                                            }}
                                                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>

                                                        {/* Filename */}
                                                        <span className="absolute bottom-0 inset-x-0 text-[8px] bg-black/60 text-white px-1 py-0.5 truncate">
                                                            {media.originalName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>

                                {/* Done button footer */}
                                <div className="border-t px-4 py-3 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {libraryMedia.length} item{libraryMedia.length !== 1 ? 's' : ''} in library
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowMediaLibrary(false)}
                                        className="cursor-pointer"
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Done
                                    </Button>
                                </div>
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
                                                <PlatformIcon platform={platform} size="xs" />
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
