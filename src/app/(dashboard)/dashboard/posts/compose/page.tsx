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
    Palette,
    Search,
    CheckCircle2,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { THUMBNAIL_STYLES, DEFAULT_THUMBNAIL_STYLE_ID } from '@/lib/thumbnail-styles'
import Image from 'next/image'

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

function FacebookPreview({ content, media, accountName, postType, mediaRatio, firstComment }: {
    content: string; media: MediaItem[]; accountName: string; postType: string; mediaRatio: string; firstComment?: string
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
                <span>{firstComment ? '1 Comment' : '0 Comments'} · 0 Shares</span>
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
            {/* First Comment */}
            {firstComment && (
                <div className="px-3 py-2 border-t">
                    <div className="flex gap-2">
                        <div className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: '#1877F2' }}>
                            {accountName.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-muted rounded-xl px-3 py-1.5 flex-1">
                            <p className="text-xs font-semibold">{accountName}</p>
                            <p className="text-xs whitespace-pre-wrap break-words">{firstComment}</p>
                        </div>
                    </div>
                </div>
            )}
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
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkInputValue, setLinkInputValue] = useState('')

    // State
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
    const [content, setContent] = useState('')
    // Per-platform content customization
    const [contentPerPlatform, setContentPerPlatform] = useState<Record<string, string>>({})
    const [customizingContent, setCustomizingContent] = useState(false)
    const [activeContentTab, setActiveContentTab] = useState<string | null>(null)
    // Use platform ID as unique key (not platform:accountId which can collide)
    const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set())
    const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([])
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [generatingMeta, setGeneratingMeta] = useState(false)
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
    const [ytThumbnailPrompt, setYtThumbnailPrompt] = useState('')
    const [ytSettingsOpen, setYtSettingsOpen] = useState(true)
    // YouTube 3 title options + 3 thumbnail prompts
    const [ytTitleOptions, setYtTitleOptions] = useState<string[]>([])
    const [ytThumbnailPrompts, setYtThumbnailPrompts] = useState<string[]>([])
    const [ytSelectedTitleIdx, setYtSelectedTitleIdx] = useState(0)
    const [ytSelectedThumbIdx, setYtSelectedThumbIdx] = useState(0)
    // Thumbnail style selector
    const [thumbnailStyleId, setThumbnailStyleId] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('asocial_yt_thumbnail_style') || DEFAULT_THUMBNAIL_STYLE_ID
        }
        return DEFAULT_THUMBNAIL_STYLE_ID
    })
    const [styleModalOpen, setStyleModalOpen] = useState(false)
    const [styleSearch, setStyleSearch] = useState('')
    // TikTok settings
    const [ttPostType, setTtPostType] = useState<'video' | 'carousel'>('video')
    const [ttPublishMode, setTtPublishMode] = useState<'direct' | 'inbox'>('direct')
    const [ttVisibility, setTtVisibility] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE')
    const [ttAllowComment, setTtAllowComment] = useState(true)
    const [ttAllowDuet, setTtAllowDuet] = useState(false)
    const [ttAllowStitch, setTtAllowStitch] = useState(false)
    const [ttBrandedContent, setTtBrandedContent] = useState(false)
    const [ttAiGenerated, setTtAiGenerated] = useState(false)
    const [ttSettingsOpen, setTtSettingsOpen] = useState(true)
    // Pinterest settings
    const [pinBoardId, setPinBoardId] = useState('')
    const [pinTitle, setPinTitle] = useState('')
    const [pinLink, setPinLink] = useState('')
    const [pinSettingsOpen, setPinSettingsOpen] = useState(true)
    const [pinBoards, setPinBoards] = useState<{ id: string; name: string }[]>([])
    const [pinBoardsLoading, setPinBoardsLoading] = useState(false)
    const [previewPlatform, setPreviewPlatform] = useState<string>('')
    const [mediaRatio, setMediaRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1')
    const [showMediaLibrary, setShowMediaLibrary] = useState(false)
    const [libraryMedia, setLibraryMedia] = useState<MediaItem[]>([])
    const [loadingLibrary, setLoadingLibrary] = useState(false)
    const [loadingDrivePicker, setLoadingDrivePicker] = useState(false)
    const [canvaLoading, setCanvaLoading] = useState(false)
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

    // ── Auto-fetch Pinterest boards when Pinterest is selected ──
    useEffect(() => {
        const hasPinterest = activePlatforms.some(p => selectedPlatformIds.has(p.id) && p.platform === 'pinterest')
        if (!hasPinterest || !selectedChannel || pinBoards.length > 0 || pinBoardsLoading) return
        const pintPlatform = activePlatforms.find(p => selectedPlatformIds.has(p.id) && p.platform === 'pinterest')
        if (!pintPlatform) return
        setPinBoardsLoading(true)
        fetch(`/api/admin/channels/${selectedChannel.id}/pinterest-boards?accountId=${pintPlatform.accountId}`)
            .then(r => r.json())
            .then(data => { if (data.boards) setPinBoards(data.boards) })
            .catch(() => { })
            .finally(() => setPinBoardsLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannel, selectedPlatformIds])

    // ── Auto-save draft continuously (debounced 3s) ──
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const performAutoSave = useCallback(async () => {
        if (savedRef.current || !selectedChannel || !content.trim()) return
        if (selectedPlatformIds.size === 0) return

        setAutoSaveStatus('saving')
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
                    contentPerPlatform: Object.keys(contentPerPlatform).length > 0 ? contentPerPlatform : undefined,
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
                            ...(p.platform === 'tiktok' ? {
                                postType: ttPostType,
                                publishMode: ttPublishMode,
                                visibility: ttVisibility,
                                allowComment: ttAllowComment,
                                allowDuet: ttAllowDuet,
                                allowStitch: ttAllowStitch,
                                brandedContent: ttBrandedContent,
                                aiGenerated: ttAiGenerated,
                            } : {}),
                        })),
                }),
                keepalive: true,
            })
            if (!postIdRef.current && res.ok) {
                const data = await res.json()
                postIdRef.current = data.id
            }
            setAutoSaveStatus('saved')
            // Reset to idle after 2s
            setTimeout(() => setAutoSaveStatus('idle'), 2000)
        } catch {
            setAutoSaveStatus('error')
            setTimeout(() => setAutoSaveStatus('idle'), 3000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannel, content, contentPerPlatform, attachedMedia, scheduleDate, scheduleTime,
        selectedPlatformIds, fbPostTypes, fbCarousel, fbFirstComment,
        igPostType, igShareToStory, igCollaborators,
        ytPostType, ytVideoTitle, ytCategory, ytTags, ytPrivacy, ytNotifySubscribers, ytMadeForKids,
        ttPostType, ttPublishMode, ttVisibility, ttAllowComment, ttAllowDuet, ttAllowStitch, ttBrandedContent, ttAiGenerated])

    // Debounced auto-save: trigger 3s after last change
    useEffect(() => {
        if (savedRef.current || !selectedChannel || !content.trim()) return
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = setTimeout(() => {
            performAutoSave()
        }, 3000)
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        }
    }, [performAutoSave])

    // Also save on page leave as safety net
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!savedRef.current && selectedChannel && content.trim()) {
                performAutoSave()
                e.preventDefault()
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            performAutoSave()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [performAutoSave])

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

    // ─── Canva design handler ────────────────────────────────────
    const openCanvaDesign = useCallback(async (existingMediaUrl?: string) => {
        setCanvaLoading(true)
        try {
            // Determine dimensions from current ratio
            const dims = mediaRatio === '16:9' ? { width: 1920, height: 1080 }
                : mediaRatio === '9:16' ? { width: 1080, height: 1920 }
                    : { width: 1080, height: 1080 }

            const res = await fetch('/api/canva/designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    designType: 'custom',
                    width: dims.width,
                    height: dims.height,
                    title: `ASocial Design ${new Date().toLocaleDateString()}`,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                // If user hasn't connected Canva yet, redirect to OAuth
                if (data.error === 'canva_not_connected' && data.connectUrl) {
                    toast('🎨 Connecting to Canva...', { icon: '🔗' })
                    window.location.href = data.connectUrl
                    return
                }
                toast.error(data.message || data.error || 'Failed to open Canva')
                setCanvaLoading(false)
                return
            }

            if (!data.editUrl) {
                toast.error('No Canva editor URL returned')
                setCanvaLoading(false)
                return
            }

            // Open Canva editor in popup
            const popup = window.open(data.editUrl, 'canva-editor', 'width=1200,height=800,menubar=no,toolbar=no')
            toast.success('🎨 Canva editor opened! Design your content and close the tab when done.')

            // Poll for popup close, then export
            const checkClosed = setInterval(async () => {
                if (popup && popup.closed) {
                    clearInterval(checkClosed)
                    toast.loading('Exporting design from Canva...', { id: 'canva-export' })
                    try {
                        const exportRes = await fetch(`/api/canva/designs?designId=${data.designId}`)
                        const exportData = await exportRes.json()

                        if (exportData.status === 'success' && exportData.urls?.length > 0) {
                            // Download the exported image and upload to our media library
                            const imageUrl = exportData.urls[0]
                            const imgRes = await fetch(imageUrl)
                            const blob = await imgRes.blob()
                            const file = new File([blob], `canva-design-${Date.now()}.png`, { type: 'image/png' })

                            // Upload via handleFileUpload
                            const dt = new DataTransfer()
                            dt.items.add(file)
                            await handleFileUpload(dt.files)
                            toast.success('🎨 Canva design imported!', { id: 'canva-export' })
                        } else {
                            toast.error(exportData.error || 'Export failed', { id: 'canva-export' })
                        }
                    } catch {
                        toast.error('Failed to export from Canva', { id: 'canva-export' })
                    }
                    setCanvaLoading(false)
                }
            }, 1000)

            // Timeout after 10 minutes
            setTimeout(() => {
                clearInterval(checkClosed)
                setCanvaLoading(false)
            }, 600000)
        } catch {
            toast.error('Failed to open Canva')
            setCanvaLoading(false)
        }
    }, [mediaRatio])

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

    // AI Generate platform metadata (first comment, pin title, yt titles x3, etc.)
    const handleGenerateMetadata = async (requestedPlatforms?: string[]) => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Write your post content first')
            return
        }
        setGeneratingMeta(true)
        try {
            // Determine which platforms to generate for
            const platforms = requestedPlatforms || activePlatforms
                .filter((p) => selectedPlatformIds.has(p.id))
                .map((p) => p.platform)

            const res = await fetch('/api/admin/posts/generate-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: selectedChannel.id, content, platforms, thumbnailStyleId }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Failed to generate metadata')
                return
            }

            // Fill in the generated fields
            let filled = 0
            if (data.firstComment) { setFbFirstComment(data.firstComment); filled++ }
            if (data.pinTitle) { setPinTitle(data.pinTitle); filled++ }
            if (data.pinLink) { setPinLink(data.pinLink); filled++ }
            // YouTube: 3 titles
            if (data.ytTitles && Array.isArray(data.ytTitles) && data.ytTitles.length > 0) {
                setYtTitleOptions(data.ytTitles)
                setYtSelectedTitleIdx(0)
                setYtVideoTitle(data.ytTitles[0])
                filled++
            } else if (data.ytTitle) {
                setYtVideoTitle(data.ytTitle)
                setYtTitleOptions([data.ytTitle])
                filled++
            }
            if (data.ytTags) { setYtTags(data.ytTags); filled++ }
            if (data.ytCategory) { setYtCategory(data.ytCategory); filled++ }
            // YouTube: 3 thumbnail prompts
            if (data.ytThumbnailPrompts && Array.isArray(data.ytThumbnailPrompts) && data.ytThumbnailPrompts.length > 0) {
                setYtThumbnailPrompts(data.ytThumbnailPrompts)
                setYtSelectedThumbIdx(0)
                setYtThumbnailPrompt(data.ytThumbnailPrompts[0])
                filled++
            } else if (data.ytThumbnailPrompt) {
                setYtThumbnailPrompt(data.ytThumbnailPrompt)
                setYtThumbnailPrompts([data.ytThumbnailPrompt])
                filled++
            }

            toast.success(`✨ AI filled ${filled} field(s)`)
        } catch {
            toast.error('AI metadata generation failed')
        } finally {
            setGeneratingMeta(false)
        }
    }

    // AI Customize content for each platform
    const handleCustomizeContent = async () => {
        if (!selectedChannel || !content.trim()) {
            toast.error('Write your post content first')
            return
        }
        const platforms = activePlatforms
            .filter((p) => selectedPlatformIds.has(p.id))
            .map((p) => p.platform)
        const uniquePlatforms = [...new Set(platforms)]
        if (uniquePlatforms.length === 0) {
            toast.error('Select at least one platform')
            return
        }
        setCustomizingContent(true)
        try {
            const res = await fetch('/api/admin/posts/customize-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: selectedChannel.id, content, platforms: uniquePlatforms }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Failed to customize content')
                return
            }
            setContentPerPlatform(data.contentPerPlatform || {})
            const firstPlatform = uniquePlatforms.find(p => data.contentPerPlatform?.[p])
            if (firstPlatform) setActiveContentTab(firstPlatform)
            toast.success(`✨ Content customized for ${Object.keys(data.contentPerPlatform || {}).length} platform(s)`)
        } catch {
            toast.error('AI content customization failed')
        } finally {
            setCustomizingContent(false)
        }
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
                ...(p.platform === 'tiktok' ? {
                    postType: ttPostType,
                    publishMode: ttPublishMode,
                    visibility: ttVisibility,
                    allowComment: ttAllowComment,
                    allowDuet: ttAllowDuet,
                    allowStitch: ttAllowStitch,
                    brandedContent: ttBrandedContent,
                    aiGenerated: ttAiGenerated,
                } : {}),
                ...(p.platform === 'pinterest' ? {
                    boardId: pinBoardId || undefined,
                    pinTitle: pinTitle || undefined,
                    pinLink: pinLink || undefined,
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
                    contentPerPlatform: Object.keys(contentPerPlatform).length > 0 ? contentPerPlatform : undefined,
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

    // Publish now (fire-and-forget — publishes in background on server)
    const handlePublishNow = async () => {
        if (!selectedChannel || !content.trim()) { toast.error('Select a channel and add content'); return }
        if (selectedPlatformIds.size === 0) { toast.error('Select at least one platform'); return }

        // ── Media validation per platform ──
        const hasVideo = attachedMedia.some(m => isVideo(m))
        const hasImage = attachedMedia.some(m => !isVideo(m))
        const selectedPlatforms = activePlatforms.filter(p => selectedPlatformIds.has(p.id))
        const errors: string[] = []

        for (const p of selectedPlatforms) {
            switch (p.platform) {
                case 'tiktok':
                    if (!hasVideo) errors.push('🎵 TikTok requires a video. Please upload a video.')
                    break
                case 'youtube':
                    if (!hasVideo) errors.push('▶️ YouTube requires a video. Please upload a video.')
                    break
                case 'facebook':
                    if ((fbPostTypes[p.id] || 'feed') === 'reel' && !hasVideo) errors.push('📘 Facebook Reels require a video.')
                    if ((fbPostTypes[p.id] || 'feed') === 'story' && !hasVideo && !hasImage) errors.push('📘 Facebook Stories require media (image or video).')
                    break
                case 'instagram':
                    if (igPostType === 'reel' && !hasVideo) errors.push('📸 Instagram Reels require a video.')
                    if (igPostType === 'story' && !hasVideo && !hasImage) errors.push('📸 Instagram Stories require media (image or video).')
                    if (igPostType === 'feed' && attachedMedia.length === 0) errors.push('📸 Instagram Feed requires at least one image or video.')
                    break
            }
        }

        // De-duplicate errors
        const uniqueErrors = [...new Set(errors)]
        if (uniqueErrors.length > 0) {
            uniqueErrors.forEach(err => toast.error(err, { duration: 5000 }))
            return
        }
        setPublishing(true)
        try {
            const existingId = editPostId || postIdRef.current
            const url = existingId ? `/api/admin/posts/${existingId}` : '/api/admin/posts'
            const method = existingId ? 'PUT' : 'POST'

            const createRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id, content,
                    contentPerPlatform: Object.keys(contentPerPlatform).length > 0 ? contentPerPlatform : undefined,
                    status: 'PUBLISHING',
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

            // Fire publish in background — don't await
            fetch(`/api/admin/posts/${post.id}/publish`, { method: 'POST' })
                .catch(() => { /* server handles errors */ })

            toast.success('Publishing in background...')
            savedRef.current = true
            router.push('/dashboard/posts')
        } catch {
            toast.error('Network error — failed to save post')
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
        <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-1 py-1.5 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-sm font-bold tracking-tight">{editPostId ? 'Edit Post' : 'Compose Post'}</h1>
                    {/* Auto-save status */}
                    {autoSaveStatus !== 'idle' && (
                        <span className={`text-[10px] font-medium transition-opacity ${autoSaveStatus === 'saving' ? 'text-muted-foreground animate-pulse' :
                            autoSaveStatus === 'saved' ? 'text-emerald-500' :
                                'text-destructive'
                            }`}>
                            {autoSaveStatus === 'saving' && '● Saving...'}
                            {autoSaveStatus === 'saved' && '✓ Saved'}
                            {autoSaveStatus === 'error' && '⚠ Save failed'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs cursor-pointer" onClick={handleSaveDraft} disabled={saving || !content.trim()}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        {scheduleDate ? 'Schedule' : 'Save Draft'}
                    </Button>
                    <Button size="sm" className="h-7 text-xs cursor-pointer" onClick={handlePublishNow} disabled={publishing || !content.trim() || selectedPlatformIds.size === 0}>
                        {publishing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                        Publish Now
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout — fills remaining height */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 flex-1 min-h-0">
                {/* ── Left: Platforms ── */}
                <div className="lg:col-span-2 space-y-1 overflow-y-auto pr-0.5">
                    {/* Channel */}
                    <Card>
                        <CardHeader className="py-1.5 px-2.5">
                            <CardTitle className="text-xs">Channel</CardTitle>
                        </CardHeader>
                        <CardContent className="px-2.5 pb-2">
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
                        <CardHeader className="py-1.5 px-2.5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs">Publish To</CardTitle>
                                    <p className="text-[9px] text-muted-foreground">
                                        {selectedPlatformIds.size} selected
                                    </p>
                                </div>
                                {activePlatforms.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-[9px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
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
                        <CardContent className="space-y-0.5 px-2.5 pb-2">
                            {activePlatforms.length ? (
                                activePlatforms.map((p) => {
                                    const isChecked = selectedPlatformIds.has(p.id)
                                    const isFacebook = p.platform === 'facebook'
                                    return (
                                        <div key={p.id}>
                                            <div
                                                className="flex items-center gap-1.5 py-0.5 cursor-pointer select-none"
                                                onClick={() => togglePlatform(p.id)}
                                            >
                                                <div className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border shadow-xs flex items-center justify-center transition-colors ${isChecked
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'border-input bg-transparent'
                                                    }`}>
                                                    {isChecked && <Check className="h-2.5 w-2.5" />}
                                                </div>
                                                <div className="h-4 w-4 shrink-0 flex items-center justify-center">
                                                    <PlatformIcon platform={p.platform} size="sm" />
                                                </div>
                                                <p className="text-[11px] font-medium leading-none truncate">
                                                    {p.accountName}
                                                </p>
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
                        <CardHeader className="py-1.5 px-2.5">
                            <CardTitle className="text-xs flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 px-2.5 pb-2">
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
                            <div className="border-t pt-1.5">
                                <Label className="text-[10px] text-muted-foreground">Date</Label>
                                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-0.5 h-7 text-xs" />
                            </div>
                            <div>
                                <Label className="text-[10px] text-muted-foreground">Time</Label>
                                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-0.5 h-7 text-xs" />
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
                < div className="lg:col-span-6 space-y-1 overflow-y-auto px-0.5" >
                    {/* AI Generate */}
                    < Card >
                        <CardHeader className="py-1.5 px-2.5">
                            <CardTitle className="text-xs flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Generate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2.5 pb-2 space-y-2">
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
                            {/* AI Fill All Platforms — shown when content exists and platforms are selected */}
                            {content.trim() && activePlatforms.some(p => selectedPlatformIds.has(p.id) && ['facebook', 'pinterest', 'youtube'].includes(p.platform)) && (
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/15 rounded-md py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                    disabled={generatingMeta}
                                    onClick={() => handleGenerateMetadata()}
                                >
                                    {generatingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    AI Fill All Platforms
                                </button>
                            )}
                        </CardContent>
                    </Card >

                    {/* Content Editor */}
                    < Card >
                        <CardHeader className="py-1.5 px-2.5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs">Content</CardTitle>
                                <span className={`text-[10px] ${charCount > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                                    {charCount > 0 ? `${charCount}` : ''}
                                </span>
                            </div>
                            {/* Content Toolbar */}
                            <div className="flex items-center gap-0 pt-0.5 border-b pb-1 -mx-0.5 flex-wrap">
                                <button
                                    type="button"
                                    title="UPPERCASE"
                                    className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => {
                                        const ta = textareaRef.current
                                        if (!ta) return
                                        const start = ta.selectionStart
                                        const end = ta.selectionEnd
                                        if (start === end) return // nothing selected
                                        const selected = content.substring(start, end)
                                        const isUpper = selected === selected.toUpperCase()
                                        const transformed = isUpper ? selected.toLowerCase() : selected.toUpperCase()
                                        const newContent = content.substring(0, start) + transformed + content.substring(end)
                                        setContent(newContent)
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(start, start + transformed.length) }, 0)
                                    }}
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <div className="w-px h-5 bg-border mx-1" />
                                <button
                                    type="button"
                                    title="Add Hashtag"
                                    className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                                    className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                                {/* Link button with popover input */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        title="Add Link"
                                        className={`h-7 w-7 rounded flex items-center justify-center transition-colors cursor-pointer ${showLinkInput ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                        onClick={() => {
                                            setShowLinkInput(!showLinkInput)
                                            setLinkInputValue('')
                                        }}
                                    >
                                        <Link2 className="h-4 w-4" />
                                    </button>
                                    {showLinkInput && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowLinkInput(false)} />
                                            <div className="absolute top-9 left-0 z-50 bg-popover border rounded-xl shadow-xl p-3 w-[280px]">
                                                <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Paste or type a URL</p>
                                                <div className="flex gap-1.5">
                                                    <Input
                                                        value={linkInputValue}
                                                        onChange={(e) => setLinkInputValue(e.target.value)}
                                                        placeholder="https://example.com"
                                                        className="text-xs h-8"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && linkInputValue.trim()) {
                                                                e.preventDefault()
                                                                const ta = textareaRef.current
                                                                const url = linkInputValue.trim().startsWith('http') ? linkInputValue.trim() : `https://${linkInputValue.trim()}`
                                                                if (ta) {
                                                                    const pos = ta.selectionStart
                                                                    const before = content.substring(0, pos)
                                                                    const after = content.substring(pos)
                                                                    const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
                                                                    setContent(before + prefix + url + after)
                                                                    setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length + url.length, pos + prefix.length + url.length) }, 0)
                                                                } else {
                                                                    setContent(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '') + url)
                                                                }
                                                                setShowLinkInput(false)
                                                                setLinkInputValue('')
                                                            } else if (e.key === 'Escape') {
                                                                setShowLinkInput(false)
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                                                        disabled={!linkInputValue.trim()}
                                                        onClick={() => {
                                                            const ta = textareaRef.current
                                                            const url = linkInputValue.trim().startsWith('http') ? linkInputValue.trim() : `https://${linkInputValue.trim()}`
                                                            if (ta) {
                                                                const pos = ta.selectionStart
                                                                const before = content.substring(0, pos)
                                                                const after = content.substring(pos)
                                                                const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
                                                                setContent(before + prefix + url + after)
                                                                setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length + url.length, pos + prefix.length + url.length) }, 0)
                                                            } else {
                                                                setContent(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '') + url)
                                                            }
                                                            setShowLinkInput(false)
                                                            setLinkInputValue('')
                                                        }}
                                                    >
                                                        Insert
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="w-px h-5 bg-border mx-1" />
                                {/* Emoji Picker */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        title="Emoji"
                                        className={`h-7 w-7 rounded flex items-center justify-center transition-colors cursor-pointer ${showEmojiPicker ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile className="h-4 w-4" />
                                    </button>
                                    {showEmojiPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                            <div className="absolute top-9 left-0 z-50 bg-popover border rounded-xl shadow-xl p-2 w-[260px]">
                                                <div className="grid grid-cols-8 gap-1">
                                                    {['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', '😤', '🔥', '💯', '❤️', '👏', '🙌', '💪', '✨', '🎉', '🎊', '👍', '👎', '🤔', '😱', '😢', '🤝', '💡', '📌', '🚀', '📢', '💰', '🛒', '🎯', '📈', '⭐', '🏆', '💎', '🌟', '❗', '✅', '📣', '🔔', '🎁', '💝', '🌈', '☀️', '🌙', '💫', '🍀', '🦋'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-base"
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
                                className="w-full min-h-[120px] resize-y rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                                rows={5}
                            />
                        </CardContent>
                    </Card >

                    {/* Per-Platform Content Customization */}
                    {selectedPlatformIds.size > 0 && (
                        <Card>
                            <CardHeader className="py-1.5 px-2.5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" /> Platform Content
                                    </CardTitle>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-medium hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                                        disabled={customizingContent || !content.trim()}
                                        onClick={handleCustomizeContent}
                                    >
                                        {customizingContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                        {customizingContent ? 'Customizing...' : 'AI Customize'}
                                    </button>
                                </div>
                                {/* Platform tabs */}
                                {(() => {
                                    const uniquePlatforms = [...new Set(
                                        activePlatforms
                                            .filter((p) => selectedPlatformIds.has(p.id))
                                            .map((p) => p.platform)
                                    )]
                                    const platformIcons: Record<string, string> = {
                                        facebook: '📘', instagram: '📸', tiktok: '🎵',
                                        x: '𝕏', linkedin: '💼', pinterest: '📌', youtube: '▶️',
                                    }
                                    const platformLabels: Record<string, string> = {
                                        facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok',
                                        x: 'X', linkedin: 'LinkedIn', pinterest: 'Pinterest', youtube: 'YouTube',
                                    }
                                    if (Object.keys(contentPerPlatform).length === 0) {
                                        return (
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Click &quot;AI Customize&quot; to generate optimized content for each platform, or all platforms will use the master content above.
                                            </p>
                                        )
                                    }
                                    return (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {uniquePlatforms.map((platform) => (
                                                <button
                                                    key={platform}
                                                    type="button"
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${activeContentTab === platform
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : contentPerPlatform[platform]
                                                            ? 'bg-muted text-foreground hover:bg-muted/80'
                                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                                                        }`}
                                                    onClick={() => setActiveContentTab(activeContentTab === platform ? null : platform)}
                                                >
                                                    <span>{platformIcons[platform] || '📱'}</span>
                                                    {platformLabels[platform] || platform}
                                                    {contentPerPlatform[platform] && <Check className="h-2.5 w-2.5" />}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </CardHeader>
                            {activeContentTab && contentPerPlatform[activeContentTab] && (
                                <CardContent>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {activeContentTab.charAt(0).toUpperCase() + activeContentTab.slice(1)} version
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {contentPerPlatform[activeContentTab]?.length || 0}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        const updated = { ...contentPerPlatform }
                                                        delete updated[activeContentTab!]
                                                        setContentPerPlatform(updated)
                                                        if (Object.keys(updated).length === 0) setActiveContentTab(null)
                                                    }}
                                                >
                                                    ↺ Reset to Master
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            value={contentPerPlatform[activeContentTab] || ''}
                                            onChange={(e) => setContentPerPlatform({
                                                ...contentPerPlatform,
                                                [activeContentTab]: e.target.value,
                                            })}
                                            className="w-full min-h-[100px] resize-y rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Media */}
                    <Card
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`transition-all ${dragging ? 'ring-2 ring-primary border-primary' : ''}`}
                    >
                        <CardHeader className="py-1.5 px-2.5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs flex items-center gap-1.5">
                                    <ImageIcon className="h-3.5 w-3.5" /> Media
                                    {uploading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 cursor-pointer" onClick={openLibrary} disabled={!selectedChannel}>
                                        <FolderOpen className="h-3 w-3 mr-0.5" />
                                        Library
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 cursor-pointer" onClick={openGooglePicker} disabled={loadingDrivePicker}>
                                        {loadingDrivePicker ? <Loader2 className="h-3 w-3 mr-0.5 animate-spin" /> : <HardDrive className="h-3 w-3 mr-0.5" />}
                                        Drive
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 cursor-pointer" onClick={() => fileInputRef.current?.click()} disabled={uploading || !selectedChannel}>
                                        <Upload className="h-3 w-3 mr-0.5" />
                                        Upload
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 cursor-pointer bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-400" onClick={() => openCanvaDesign()} disabled={canvaLoading}>
                                        {canvaLoading ? <Loader2 className="h-3 w-3 mr-0.5 animate-spin" /> : <Palette className="h-3 w-3 mr-0.5" />}
                                        Canva
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
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-muted-foreground">Ratio:</span>
                                {(['16:9', '1:1', '9:16'] as const).map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setMediaRatio(ratio)}
                                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${mediaRatio === ratio
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {ratio === '16:9' && <RectangleHorizontal className="h-2.5 w-2.5" />}
                                        {ratio === '1:1' && <Square className="h-2.5 w-2.5" />}
                                        {ratio === '9:16' && <RectangleVertical className="h-2.5 w-2.5" />}
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5 px-2.5 pb-2">
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
                                            {/* Edit in Canva — only for images */}
                                            {!isVideo(media) && (
                                                <button
                                                    onClick={() => openCanvaDesign(media.url)}
                                                    title="Edit in Canva"
                                                    className="absolute top-1 left-1 h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                    <Palette className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Drop zone — always visible */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border border-dashed rounded-md text-center cursor-pointer transition-all ${dragging
                                    ? 'border-primary bg-primary/5 py-2 px-3'
                                    : attachedMedia.length > 0
                                        ? 'py-1.5 px-2 hover:border-primary/30'
                                        : 'py-2 px-3 hover:border-primary/30'
                                    }`}
                            >
                                {dragging ? (
                                    <p className="text-xs font-medium text-primary">Drop files here</p>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">{attachedMedia.length > 0 ? '+ Add more' : 'Click or drag to upload'}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Facebook Settings — only when Facebook platform is selected */}
                    {selectedChannel?.platforms?.some(p => p.platform === 'facebook' && selectedPlatformIds.has(p.id)) && (
                        <Card>
                            <CardHeader className="py-1.5 px-2.5">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setFbSettingsOpen(!fbSettingsOpen)}
                                >
                                    <CardTitle className="text-xs flex items-center gap-1.5">
                                        <PlatformIcon platform="facebook" size="sm" />
                                        Facebook Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${fbSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {fbSettingsOpen && (
                                <CardContent className="space-y-2 px-2.5 pb-2">
                                    {/* Post Type */}
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { value: 'feed' as const, label: 'Feed', icon: LayoutGrid },
                                                { value: 'reel' as const, label: 'Reel', icon: Film },
                                                { value: 'story' as const, label: 'Story', icon: CircleDot },
                                            ].map(opt => {
                                                const selectedFbIds = selectedChannel?.platforms?.filter(p => p.platform === 'facebook' && selectedPlatformIds.has(p.id)).map(p => p.id) || []
                                                const currentType = selectedFbIds.length > 0 ? (fbPostTypes[selectedFbIds[0]] || 'feed') : 'feed'
                                                const isActive = currentType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md border transition-all cursor-pointer text-[11px] font-medium ${isActive
                                                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                            : 'border-border hover:border-blue-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => {
                                                            const newTypes = { ...fbPostTypes }
                                                            selectedFbIds.forEach(id => { newTypes[id] = opt.value })
                                                            setFbPostTypes(newTypes)
                                                        }}
                                                    >
                                                        <opt.icon className="h-3.5 w-3.5" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Carousel Toggle */}
                                    <div className="flex items-center justify-between py-1 border-t">
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5 text-blue-500" />
                                            <div>
                                                <p className="text-xs font-medium">Carousel</p>
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
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-medium">First Comment</p>
                                                    <p className="text-[10px] text-muted-foreground">Auto-comment after posting (great for hashtags)</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
                                                disabled={generatingMeta || !content.trim()}
                                                onClick={() => handleGenerateMetadata(['facebook'])}
                                            >
                                                {generatingMeta ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                AI Generate
                                            </button>
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
                            <CardHeader className="py-1.5 px-2.5">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setIgSettingsOpen(!igSettingsOpen)}
                                >
                                    <CardTitle className="text-xs flex items-center gap-1.5">
                                        <PlatformIcon platform="instagram" size="sm" />
                                        Instagram Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${igSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {igSettingsOpen && (
                                <CardContent className="space-y-2 px-2.5 pb-2">
                                    {/* Post Type */}
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { value: 'feed' as const, label: 'Feed', icon: LayoutGrid },
                                                { value: 'reel' as const, label: 'Reel', icon: Film },
                                                { value: 'story' as const, label: 'Story', icon: CircleDot },
                                            ].map(opt => {
                                                const isActive = igPostType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md border transition-all cursor-pointer text-[11px] font-medium ${isActive
                                                            ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400'
                                                            : 'border-border hover:border-pink-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setIgPostType(opt.value)}
                                                    >
                                                        <opt.icon className="h-3.5 w-3.5" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Also Share to Story */}
                                    {igPostType === 'feed' && (
                                        <div className="flex items-center justify-between py-1 border-t">
                                            <div className="flex items-center gap-1.5">
                                                <Camera className="h-3.5 w-3.5 text-pink-500" />
                                                <div>
                                                    <p className="text-xs font-medium">Also Share to Story</p>
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
                            <CardHeader className="py-1.5 px-2.5">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setYtSettingsOpen(!ytSettingsOpen)}
                                >
                                    <CardTitle className="text-xs flex items-center gap-1.5">
                                        <PlatformIcon platform="youtube" size="sm" />
                                        YouTube Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${ytSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {ytSettingsOpen && (
                                <CardContent className="space-y-2 px-2.5 pb-2">
                                    {/* Post Type */}
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {[
                                                { value: 'video' as const, label: 'Video', icon: Video },
                                                { value: 'shorts' as const, label: 'Shorts', icon: Scissors },
                                            ].map(opt => {
                                                const isActive = ytPostType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md border transition-all cursor-pointer text-[11px] font-medium ${isActive
                                                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                                                            : 'border-border hover:border-red-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setYtPostType(opt.value)}
                                                    >
                                                        <opt.icon className="h-3.5 w-3.5" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Video Title — 3 AI options */}
                                    <div className="space-y-1.5 border-t pt-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-muted-foreground">Video Title</Label>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
                                                disabled={generatingMeta || !content.trim()}
                                                onClick={() => handleGenerateMetadata(['youtube'])}
                                            >
                                                {generatingMeta ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                ✨ AI Generate 3 Titles
                                            </button>
                                        </div>
                                        <Input
                                            value={ytVideoTitle}
                                            onChange={(e) => setYtVideoTitle(e.target.value)}
                                            placeholder="Enter video title..."
                                            className="text-sm"
                                        />
                                        {/* 3 title options from AI */}
                                        {ytTitleOptions.length > 1 && (
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">AI Options — click to use</p>
                                                {ytTitleOptions.map((title, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`w-full text-left px-2.5 py-1.5 rounded-md border text-xs transition-all cursor-pointer flex items-start gap-2 ${ytSelectedTitleIdx === idx
                                                            ? 'border-red-500 bg-red-500/10 text-foreground'
                                                            : 'border-border hover:border-red-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => {
                                                            setYtSelectedTitleIdx(idx)
                                                            setYtVideoTitle(title)
                                                        }}
                                                    >
                                                        <span className={`shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${ytSelectedTitleIdx === idx ? 'border-red-500' : 'border-muted-foreground/30'
                                                            }`}>
                                                            {ytSelectedTitleIdx === idx && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                                        </span>
                                                        <span className="leading-snug">{title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
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

                                    {/* Thumbnail Style + Prompts */}
                                    <div className="space-y-2 border-t pt-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4 text-red-500" />
                                                <Label className="text-xs text-muted-foreground">Thumbnail</Label>
                                            </div>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 text-[10px] font-medium text-purple-600 hover:text-purple-500 transition-colors cursor-pointer"
                                                onClick={() => setStyleModalOpen(true)}
                                            >
                                                <Palette className="h-3 w-3" />
                                                {THUMBNAIL_STYLES.find(s => s.id === thumbnailStyleId)?.name || 'Select Style'}
                                            </button>
                                        </div>
                                        {/* Selected style preview */}
                                        {(() => {
                                            const style = THUMBNAIL_STYLES.find(s => s.id === thumbnailStyleId)
                                            if (!style) return null
                                            return (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                                                    <Image
                                                        src={style.preview}
                                                        alt={style.name}
                                                        width={64}
                                                        height={36}
                                                        className="rounded object-cover"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-medium truncate">{style.name}</p>
                                                        <p className="text-[9px] text-muted-foreground truncate">{style.description}</p>
                                                    </div>
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                </div>
                                            )
                                        })()}
                                        {/* Active thumbnail prompt */}
                                        <textarea
                                            value={ytThumbnailPrompt}
                                            onChange={(e) => setYtThumbnailPrompt(e.target.value)}
                                            placeholder="AI will generate a thumbnail prompt based on your content & selected style..."
                                            className="w-full min-h-[60px] resize-y rounded-lg border bg-transparent px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                                            rows={3}
                                        />
                                        {/* 3 thumbnail prompt options */}
                                        {ytThumbnailPrompts.length > 1 && (
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Prompt options</p>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {ytThumbnailPrompts.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className={`py-1 px-2 rounded border text-[10px] font-medium transition-all cursor-pointer ${ytSelectedThumbIdx === idx
                                                                ? 'border-red-500 bg-red-500/10 text-red-600'
                                                                : 'border-border hover:border-red-300 text-muted-foreground hover:text-foreground'
                                                                }`}
                                                            onClick={() => {
                                                                setYtSelectedThumbIdx(idx)
                                                                setYtThumbnailPrompt(ytThumbnailPrompts[idx])
                                                            }}
                                                        >
                                                            Prompt {idx + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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

                    {/* TikTok Settings — only when TikTok platform is selected */}
                    {selectedChannel?.platforms?.some(p => p.platform === 'tiktok' && selectedPlatformIds.has(p.id)) && (
                        <Card>
                            <CardHeader className="py-1.5 px-2.5">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full cursor-pointer"
                                    onClick={() => setTtSettingsOpen(!ttSettingsOpen)}
                                >
                                    <CardTitle className="text-xs flex items-center gap-1.5">
                                        <PlatformIcon platform="tiktok" size="sm" />
                                        TikTok Settings
                                    </CardTitle>
                                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${ttSettingsOpen ? '' : '-rotate-90'}`} />
                                </button>
                            </CardHeader>
                            {ttSettingsOpen && (
                                <CardContent className="space-y-2 px-2.5 pb-2">
                                    {/* Publish As */}
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Publish As</Label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {[
                                                { value: 'direct' as const, label: 'Direct Publishing', icon: Send },
                                                { value: 'inbox' as const, label: 'App Notification', icon: Bell },
                                            ].map(opt => {
                                                const isActive = ttPublishMode === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md border transition-all cursor-pointer text-[11px] font-medium ${isActive
                                                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                                            : 'border-border hover:border-cyan-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setTtPublishMode(opt.value)}
                                                    >
                                                        <opt.icon className="h-3.5 w-3.5" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Post Type */}
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Post Type</Label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {[
                                                { value: 'video' as const, label: 'Video', icon: Video },
                                                { value: 'carousel' as const, label: 'Image Carousel', icon: Layers },
                                            ].map(opt => {
                                                const isActive = ttPostType === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md border transition-all cursor-pointer text-[11px] font-medium ${isActive
                                                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                                            : 'border-border hover:border-cyan-300 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        onClick={() => setTtPostType(opt.value)}
                                                    >
                                                        <opt.icon className="h-3.5 w-3.5" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Visibility */}
                                    <div className="space-y-1 border-t pt-1.5">
                                        <Label className="text-[10px] text-muted-foreground">Who can see</Label>
                                        <Select value={ttVisibility} onValueChange={(v) => setTtVisibility(v as typeof ttVisibility)}>
                                            <SelectTrigger className="text-xs h-7">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PUBLIC_TO_EVERYONE">
                                                    <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Public To Everyone</span>
                                                </SelectItem>
                                                <SelectItem value="MUTUAL_FOLLOW_FRIENDS">
                                                    <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> Mutual Follow Friends</span>
                                                </SelectItem>
                                                <SelectItem value="SELF_ONLY">
                                                    <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Self Only</span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Allow User to */}
                                    <div className="border-t pt-1.5 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Allow User to</Label>
                                        <div className="space-y-1">
                                            {[
                                                { label: 'Comment', value: ttAllowComment, setter: setTtAllowComment },
                                                { label: 'Duet', value: ttAllowDuet, setter: setTtAllowDuet },
                                                { label: 'Stitch', value: ttAllowStitch, setter: setTtAllowStitch },
                                            ].map(opt => (
                                                <div key={opt.label} className="flex items-center justify-between">
                                                    <p className="text-xs font-medium">{opt.label}</p>
                                                    <button
                                                        type="button"
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${opt.value ? 'bg-cyan-500' : 'bg-muted'}`}
                                                        onClick={() => opt.setter(!opt.value)}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${opt.value ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Branded Content & AI-Generated */}
                                    <div className="border-t pt-1.5 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                                                <p className="text-xs font-medium">Branded content</p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${ttBrandedContent ? 'bg-cyan-500' : 'bg-muted'}`}
                                                onClick={() => setTtBrandedContent(!ttBrandedContent)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${ttBrandedContent ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                                                <p className="text-xs font-medium">AI-generated</p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${ttAiGenerated ? 'bg-cyan-500' : 'bg-muted'}`}
                                                onClick={() => setTtAiGenerated(!ttAiGenerated)}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${ttAiGenerated ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Pinterest Settings — only when Pinterest platform is selected */}
                    {activePlatforms.some(p => selectedPlatformIds.has(p.id) && p.platform === 'pinterest') && (
                        <Card className="overflow-hidden border-[#E60023]/30">
                            <CardHeader
                                className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                    setPinSettingsOpen(!pinSettingsOpen)
                                    // Fetch boards when opening settings for the first time
                                    if (!pinSettingsOpen && pinBoards.length === 0 && !pinBoardsLoading) {
                                        const pinterestPlatform = activePlatforms.find(p => selectedPlatformIds.has(p.id) && p.platform === 'pinterest')
                                        if (pinterestPlatform && selectedChannel) {
                                            setPinBoardsLoading(true)
                                            fetch(`/api/admin/channels/${selectedChannel.id}/pinterest-boards?accountId=${pinterestPlatform.accountId}`)
                                                .then(r => r.json())
                                                .then(data => { if (data.boards) setPinBoards(data.boards) })
                                                .catch(() => { })
                                                .finally(() => setPinBoardsLoading(false))
                                        }
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-medium flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: '#E60023' }}>P</div>
                                        Pinterest Settings
                                    </CardTitle>
                                    <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${pinSettingsOpen ? 'rotate-90' : ''}`} />
                                </div>
                            </CardHeader>
                            {pinSettingsOpen && (
                                <CardContent className="px-3 pb-3 pt-0 space-y-2">
                                    {/* Board Selection */}
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground">Board</Label>
                                        <Select value={pinBoardId} onValueChange={v => setPinBoardId(v)}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder={pinBoardsLoading ? 'Loading boards...' : 'Select a board'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pinBoards.map(b => (
                                                    <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                                                ))}
                                                {pinBoards.length === 0 && !pinBoardsLoading && (
                                                    <SelectItem value="_none" disabled className="text-xs text-muted-foreground">No boards found</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Pin Title + AI Button */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-muted-foreground">Pin Title</Label>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
                                                disabled={generatingMeta || !content.trim()}
                                                onClick={() => handleGenerateMetadata(['pinterest'])}
                                            >
                                                {generatingMeta ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                AI Fill
                                            </button>
                                        </div>
                                        <Input
                                            className="h-8 text-xs"
                                            placeholder="Enter pin title (max 100 chars)"
                                            maxLength={100}
                                            value={pinTitle}
                                            onChange={e => setPinTitle(e.target.value)}
                                        />
                                    </div>
                                    {/* Destination Link */}
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground">Destination Link</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            placeholder="https://example.com"
                                            value={pinLink}
                                            onChange={e => setPinLink(e.target.value)}
                                        />
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
                < div className="lg:col-span-4 space-y-1 overflow-y-auto pl-0.5" >
                    <Card>
                        <CardHeader className="py-1.5 px-2.5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs">Post Preview</CardTitle>
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
                                            // Use per-platform content if available, otherwise fall back to master content
                                            const previewContent = contentPerPlatform[effectivePreviewPlatform]?.trim() || content
                                            switch (effectivePreviewPlatform) {
                                                case 'facebook':
                                                    return <FacebookPreview content={previewContent} media={attachedMedia} accountName={name} postType={fbPostTypes[entry.id] || 'feed'} mediaRatio={mediaRatio} firstComment={fbFirstComment || undefined} />
                                                case 'instagram':
                                                    return <InstagramPreview content={previewContent} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'tiktok':
                                                    return <TikTokPreview content={previewContent} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'x':
                                                case 'twitter':
                                                    return <XPreview content={previewContent} accountName={name} />
                                                case 'youtube':
                                                    return <YouTubePreview content={previewContent} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                case 'linkedin':
                                                    return <LinkedInPreview content={previewContent} media={attachedMedia} accountName={name} mediaRatio={mediaRatio} />
                                                default:
                                                    return <GenericPreview content={previewContent} media={attachedMedia} accountName={name} platform={effectivePreviewPlatform} mediaRatio={mediaRatio} />
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
                                <div className="text-center py-4">
                                    <Hash className="h-6 w-6 mx-auto text-muted-foreground/30 mb-1" />
                                    <p className="text-xs text-muted-foreground">
                                        {selectedEntries.length === 0 ? 'Select platforms' : 'Start typing'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {
                        scheduleDate && (
                            <Card>
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-primary" />
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

            {/* ── Thumbnail Style Selector Modal ── */}
            <Dialog open={styleModalOpen} onOpenChange={setStyleModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-purple-500" />
                            Choose Thumbnail Style
                        </DialogTitle>
                    </DialogHeader>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search styles..."
                            value={styleSearch}
                            onChange={(e) => setStyleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {/* Style Grid */}
                    <div className="flex-1 overflow-y-auto -mx-1 px-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
                            {THUMBNAIL_STYLES
                                .filter(s => {
                                    if (!styleSearch.trim()) return true
                                    const q = styleSearch.toLowerCase()
                                    return s.name.toLowerCase().includes(q)
                                        || s.description.toLowerCase().includes(q)
                                        || s.tags.some(t => t.toLowerCase().includes(q))
                                })
                                .map(style => {
                                    const isSelected = thumbnailStyleId === style.id
                                    return (
                                        <button
                                            key={style.id}
                                            type="button"
                                            className={`group relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer hover:shadow-lg ${isSelected
                                                ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                                                : 'border-border hover:border-purple-300'
                                                }`}
                                            onClick={() => {
                                                setThumbnailStyleId(style.id)
                                                localStorage.setItem('asocial_yt_thumbnail_style', style.id)
                                                setStyleModalOpen(false)
                                                setStyleSearch('')
                                            }}
                                        >
                                            {/* Preview image */}
                                            <div className="aspect-video relative bg-muted">
                                                <Image
                                                    src={style.preview}
                                                    alt={style.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 50vw, 33vw"
                                                />
                                                {isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 bg-purple-500 text-white rounded-full p-0.5">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {/* Default badge */}
                                                {isSelected && (
                                                    <div className="absolute bottom-1.5 left-1.5 bg-purple-500/90 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        Default
                                                    </div>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="p-2">
                                                <p className="text-xs font-semibold truncate">{style.name}</p>
                                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">{style.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {style.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[8px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
