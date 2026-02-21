'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
    MessageSquare,
    Search,
    Bot,
    UserCircle,
    Send,
    Sparkles,
    StickyNote,
    Check,
    MoreVertical,
    Tag,
    UserPlus,
    CheckCircle2,
    Archive,
    Mail,
    Clock,
    Smile,
    Frown,
    Meh,
    Inbox,
    Loader2,
    RefreshCcw,
    ThumbsUp,
    Reply,
    Heart,
    ExternalLink,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ─────────────────────────────
interface PlatformAccount {
    id: string
    platform: string
    accountId: string
    accountName: string
    channelId: string
}

interface Conversation {
    id: string
    channelId: string
    platform: string
    externalUserId: string
    externalUserName: string | null
    externalUserAvatar: string | null
    status: string
    mode: 'BOT' | 'AGENT' | 'PAUSED'
    assignedTo: string | null
    agent: { id: string; name: string | null; email: string } | null
    tags: string[]
    sentiment: string | null
    intent: string | null
    type: string
    metadata: any
    priority: number
    aiSummary: string | null
    lastMessageAt: string | null
    unreadCount: number
    lastMessage: string | null
    lastMessageSender: string | null
    platformAccount: {
        id: string
        accountName: string
        platform: string
    }
    createdAt: string
}

interface InboxMessage {
    id: string
    direction: string
    senderType: string
    content: string
    contentOriginal: string | null
    detectedLang: string | null
    mediaUrl: string | null
    mediaType: string | null
    senderName: string | null
    senderAvatar: string | null
    confidence: number | null
    sentAt: string
}

interface StatusCounts {
    new: number
    open: number
    done: number
    archived: number
    mine: number
    all: number
}

// ─── Platform SVG icons ───────────────
function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
    switch (platform) {
        case 'facebook':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12" fill="#1877F2" />
                </svg>
            )
        case 'instagram':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <defs>
                        <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFC107" />
                            <stop offset=".5" stopColor="#F44336" />
                            <stop offset="1" stopColor="#9C27B0" />
                        </linearGradient>
                    </defs>
                    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
                    <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
                </svg>
            )
        case 'tiktok':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#010101" />
                    <path d="M16.6 5.82a4.28 4.28 0 01-1.04-2.47h-.01V3.2h-2.97v11.88a2.56 2.56 0 01-2.56 2.44 2.56 2.56 0 01-2.56-2.56 2.56 2.56 0 012.56-2.56c.27 0 .53.04.77.11V9.44a5.6 5.6 0 00-.77-.05 5.56 5.56 0 00-5.56 5.56A5.56 5.56 0 009.97 20.5a5.56 5.56 0 005.56-5.56V9.2a7.24 7.24 0 004.24 1.36V7.6a4.28 4.28 0 01-3.17-1.78z" fill="white" />
                </svg>
            )
        case 'linkedin':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="4" fill="#0A66C2" />
                    <path d="M7.5 10v7.5M7.5 7v.01M10.5 17.5v-4.25c0-1.5 1-2.25 2-2.25s1.5.75 1.5 2v4.5M10.5 10v7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        case 'youtube':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#FF0000" />
                    <path d="M10 15.5v-7l6 3.5-6 3.5z" fill="white" />
                </svg>
            )
        case 'pinterest':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#E60023" />
                    <path d="M12 5.5c-3.59 0-6.5 2.91-6.5 6.5 0 2.76 1.72 5.11 4.14 6.05-.06-.52-.11-1.32.02-1.89l.78-3.33s-.2-.4-.2-.98c0-.92.53-1.6 1.2-1.6.56 0 .84.42.84.93 0 .57-.36 1.42-.55 2.2-.16.66.33 1.2.98 1.2 1.18 0 2.09-1.24 2.09-3.04 0-1.59-1.14-2.7-2.77-2.7-1.89 0-3 1.42-3 2.88 0 .57.22 1.18.5 1.52a.2.2 0 01.04.19l-.18.76c-.03.12-.1.15-.22.09-.82-.38-1.34-1.59-1.34-2.56 0-2.08 1.51-4 4.36-4 2.29 0 4.06 1.63 4.06 3.81 0 2.27-1.43 4.1-3.42 4.1-.67 0-1.3-.35-1.51-.76l-.41 1.57c-.15.57-.55 1.29-.82 1.73.62.19 1.27.3 1.96.3 3.59 0 6.5-2.91 6.5-6.5s-2.91-6.5-6.5-6.5z" fill="white" />
                </svg>
            )
        default:
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#666" />
                    <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
    }
}

const platformConfig: Record<string, { color: string; label: string }> = {
    facebook: { color: 'bg-blue-500/10 text-blue-600', label: 'Facebook' },
    instagram: { color: 'bg-pink-500/10 text-pink-600', label: 'Instagram' },
    tiktok: { color: 'bg-gray-800/10 text-gray-800 dark:text-gray-200', label: 'TikTok' },
    linkedin: { color: 'bg-blue-700/10 text-blue-700', label: 'LinkedIn' },
    zalo: { color: 'bg-blue-400/10 text-blue-500', label: 'Zalo' },
    youtube: { color: 'bg-red-500/10 text-red-600', label: 'YouTube' },
    pinterest: { color: 'bg-red-400/10 text-red-500', label: 'Pinterest' },
}

// ─── Status filters config ───────────
const statusFilterItems = [
    { key: 'new', label: 'Unassigned', icon: Mail },
    { key: 'open', label: 'Assigned', icon: UserPlus },
    { key: 'mine', label: 'Mine', icon: UserCircle },
    { key: 'done', label: 'Done', icon: CheckCircle2 },
    { key: 'archived', label: 'Archived', icon: Archive },
    { key: 'all', label: 'All', icon: Inbox },
]

// ─── Tabs ─────────────────────────────
const inboxTabs = [
    { key: 'all', label: 'All' },
    { key: 'messages', label: 'Messages' },
    { key: 'comments', label: 'Comments' },
    { key: 'reviews', label: 'Reviews' },
]

// ─── Sentiment icon ───────────────────
function SentimentIcon({ sentiment }: { sentiment: string | null }) {
    if (sentiment === 'positive') return <Smile className="h-3.5 w-3.5 text-green-500" />
    if (sentiment === 'negative') return <Frown className="h-3.5 w-3.5 text-red-500" />
    return <Meh className="h-3.5 w-3.5 text-muted-foreground/50" />
}

// ─── Time formatter ───────────────────
function timeAgo(date: string) {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export default function InboxPage() {
    const { activeChannel } = useWorkspace()
    const t = useTranslation()

    // ─── State ────────────────────────
    const [statusFilter, setStatusFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<InboxMessage[]>([])
    const [replyText, setReplyText] = useState('')
    const [replyToName, setReplyToName] = useState<string | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([])
    const [counts, setCounts] = useState<StatusCounts>({ new: 0, open: 0, done: 0, archived: 0, mine: 0, all: 0 })
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sendingReply, setSendingReply] = useState(false)
    const [updatingConv, setUpdatingConv] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // ─── Fetch platform accounts ──────
    const fetchPlatforms = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (activeChannel?.id) params.set('channelId', activeChannel.id)
            const res = await fetch(`/api/inbox/platforms?${params}`)
            if (res.ok) {
                const data = await res.json()
                setPlatformAccounts(data.platforms || [])
            }
        } catch (e) {
            console.error('Failed to fetch platforms:', e)
        }
    }, [activeChannel?.id])

    // ─── Fetch conversations ──────────
    const fetchConversations = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (activeChannel?.id) params.set('channelId', activeChannel.id)
            if (statusFilter !== 'all' && statusFilter !== 'mine') params.set('status', statusFilter)
            if (statusFilter === 'mine') params.set('mine', 'true')
            if (searchQuery) params.set('search', searchQuery)
            // If filtering by specific platform accounts
            if (selectedPlatformIds.length === 1) {
                params.set('platformAccountId', selectedPlatformIds[0])
            }

            const res = await fetch(`/api/inbox/conversations?${params}`)
            if (res.ok) {
                const data = await res.json()
                setConversations(data.conversations || [])
                setCounts(data.counts || { new: 0, open: 0, done: 0, archived: 0, mine: 0, all: 0 })
            }
        } catch (e) {
            console.error('Failed to fetch conversations:', e)
        } finally {
            setLoading(false)
        }
    }, [activeChannel?.id, statusFilter, searchQuery, selectedPlatformIds])

    // ─── Fetch messages for a conversation ─
    const fetchMessages = useCallback(async (convId: string) => {
        setLoadingMessages(true)
        try {
            const res = await fetch(`/api/inbox/conversations/${convId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
            }
        } catch (e) {
            console.error('Failed to fetch messages:', e)
        } finally {
            setLoadingMessages(false)
        }
    }, [])

    // ─── Send reply ───────────────────
    const handleSendReply = useCallback(async () => {
        if (!selectedConversation || !replyText.trim() || sendingReply) return

        setSendingReply(true)
        try {
            // For comment conversations, prepend @name tag if replying to someone
            let contentToSend = replyText.trim()

            const res = await fetch(`/api/inbox/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToSend }),
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, data.message])
                setReplyText('')
                setReplyToName(null)
                // Update conversation in list
                setConversations(prev =>
                    prev.map(c =>
                        c.id === selectedConversation.id
                            ? { ...c, lastMessage: contentToSend, lastMessageSender: 'agent', mode: 'AGENT' as const, lastMessageAt: new Date().toISOString() }
                            : c
                    )
                )
                // Update selected conversation mode
                setSelectedConversation(prev => prev ? { ...prev, mode: 'AGENT' } : null)
            } else {
                toast.error('Failed to send reply')
            }
        } catch (e) {
            toast.error('Failed to send reply')
        } finally {
            setSendingReply(false)
        }
    }, [selectedConversation, replyText, sendingReply])

    // ─── Update conversation ──────────
    const updateConversation = useCallback(async (convId: string, body: Record<string, any>) => {
        setUpdatingConv(true)
        try {
            const res = await fetch(`/api/inbox/conversations/${convId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                const data = await res.json()
                const updated = data.conversation
                // Update in list
                setConversations(prev =>
                    prev.map(c => c.id === convId ? { ...c, ...updated } : c)
                )
                // Update selected
                if (selectedConversation?.id === convId) {
                    setSelectedConversation(prev => prev ? { ...prev, ...updated } : null)
                }
                toast.success('Updated')
                // Refresh counts
                fetchConversations()
            } else {
                toast.error('Update failed')
            }
        } catch (e) {
            toast.error('Update failed')
        } finally {
            setUpdatingConv(false)
        }
    }, [selectedConversation, fetchConversations])

    // ─── Effects ──────────────────────
    useEffect(() => {
        fetchPlatforms()
    }, [fetchPlatforms])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    // Auto-scroll messages to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    // Select conversation
    const selectConversation = (conv: Conversation) => {
        setSelectedConversation(conv)
        fetchMessages(conv.id)
    }

    // ─── Toggle platform filter ───────
    const togglePlatformFilter = (platformId: string) => {
        setSelectedPlatformIds(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        )
    }

    // ─── Platform tree (group by platform type) ─
    const platformTree = platformAccounts.reduce((acc, p) => {
        if (!acc[p.platform]) acc[p.platform] = []
        acc[p.platform].push(p)
        return acc
    }, {} as Record<string, PlatformAccount[]>)

    // ─── Filter conversations client-side by selected platforms ─
    const filteredConversations = selectedPlatformIds.length > 0
        ? conversations.filter(c => selectedPlatformIds.includes(c.platformAccount?.id))
        : conversations

    // ─── AI stats ─────────────────────
    const botActive = conversations.filter(c => c.mode === 'BOT').length
    const angryCount = conversations.filter(c => c.sentiment === 'negative').length
    const waitingCount = conversations.filter(c => c.status === 'new').length

    return (
        <div className="-mx-3 -my-4 sm:-mx-6 sm:-my-6 flex h-screen overflow-hidden">
            {/* ═══ LEFT SIDEBAR — Filters ═══ */}
            <div className="w-[220px] border-r flex flex-col shrink-0 bg-card">
                {/* Channel indicator */}
                <div className="p-3 border-b">
                    <div className="flex items-center gap-2 px-1">
                        <Inbox className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Social Inbox</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1 mt-1">
                        {activeChannel?.displayName || 'All Channels'}
                    </p>
                </div>

                <ScrollArea className="flex-1">
                    {/* Status filters */}
                    <div className="p-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                        </p>
                        <nav className="space-y-0.5 mt-1">
                            {statusFilterItems.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer',
                                        statusFilter === f.key
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    )}
                                >
                                    <f.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="flex-1 text-left">{f.label}</span>
                                    {(counts[f.key as keyof StatusCounts] ?? 0) > 0 && (
                                        <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[9px]">
                                            {counts[f.key as keyof StatusCounts]}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <Separator className="mx-2" />

                    {/* Platform / Account tree */}
                    <div className="p-2">
                        <div className="flex items-center justify-between px-2 py-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Platforms
                            </p>
                            {selectedPlatformIds.length > 0 && (
                                <button
                                    onClick={() => setSelectedPlatformIds([])}
                                    className="text-[9px] text-primary hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {Object.keys(platformTree).length === 0 ? (
                            <p className="px-2.5 py-2 text-[11px] text-muted-foreground/60 italic">
                                No platforms connected
                            </p>
                        ) : (
                            <div className="space-y-1 mt-1">
                                {Object.entries(platformTree).map(([platform, accounts]) => (
                                    <div key={platform}>
                                        <div className="w-full flex items-center gap-2 px-2.5 py-1 text-xs text-muted-foreground">
                                            <PlatformIcon platform={platform} size={16} />
                                            <span className="font-medium">{platformConfig[platform]?.label || platform}</span>
                                        </div>
                                        {accounts.map(account => (
                                            <button
                                                key={account.id}
                                                onClick={() => togglePlatformFilter(account.id)}
                                                className={cn(
                                                    'w-full flex items-center gap-2 pl-7 pr-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer',
                                                    selectedPlatformIds.includes(account.id)
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                )}
                                            >
                                                <span className="flex-1 text-left truncate">{account.accountName}</span>
                                                {selectedPlatformIds.includes(account.id) && (
                                                    <Check className="h-3 w-3 text-primary shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator className="mx-2" />

                    {/* AI Quick Stats */}
                    <div className="p-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            AI Stats
                        </p>
                        <div className="space-y-1 mt-1 px-2.5">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Bot className="h-3.5 w-3.5 text-green-500" />
                                <span>{botActive} bot active</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Frown className="h-3.5 w-3.5 text-red-500" />
                                <span>{angryCount} negative</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                <span>{waitingCount} waiting</span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* ═══ CENTER — Conversation List ═══ */}
            <div className="w-[320px] border-r flex flex-col shrink-0 bg-background">
                {/* Tabs */}
                <div className="border-b">
                    <div className="flex">
                        {inboxTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'flex-1 py-2.5 text-xs font-medium transition-colors relative cursor-pointer',
                                    activeTab === tab.key
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search + refresh */}
                <div className="p-2 border-b flex gap-1.5">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Search conversations..."
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => fetchConversations()}
                        disabled={loading}
                    >
                        <RefreshCcw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                    </Button>
                </div>

                {/* Conversation list */}
                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2 animate-spin" />
                            <p className="text-xs text-muted-foreground">Loading...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">No conversations yet</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                Conversations will appear here when customers message you via connected platforms
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => selectConversation(conv)}
                                    className={cn(
                                        'w-full flex gap-3 p-3 text-left transition-colors cursor-pointer',
                                        selectedConversation?.id === conv.id
                                            ? 'bg-primary/5 border-l-2 border-l-primary'
                                            : 'hover:bg-accent/50 border-l-2 border-l-transparent'
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar className="h-9 w-9">
                                            {conv.externalUserAvatar && (
                                                <AvatarImage src={conv.externalUserAvatar} alt={conv.externalUserName || ''} />
                                            )}
                                            <AvatarFallback className={cn(
                                                'text-xs font-medium',
                                                platformConfig[conv.platform]?.color || 'bg-gray-100'
                                            )}>
                                                {conv.externalUserName?.charAt(0)?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="absolute -bottom-0.5 -right-0.5">
                                            <PlatformIcon platform={conv.platform} size={14} />
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold truncate flex-1">
                                                {conv.externalUserName || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <p className="text-[11px] text-muted-foreground truncate flex-1">
                                                {conv.lastMessage || 'No messages'}
                                            </p>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {conv.mode === 'BOT' && <Bot className="h-3 w-3 text-green-500" />}
                                                {conv.mode === 'AGENT' && <UserCircle className="h-3 w-3 text-blue-500" />}
                                                {conv.unreadCount > 0 && (
                                                    <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-primary">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {/* Tags + sentiment */}
                                        {(conv.tags.length > 0 || conv.sentiment) && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <SentimentIcon sentiment={conv.sentiment} />
                                                {conv.tags.slice(0, 2).map(tag => (
                                                    <Badge key={tag} variant="outline" className="h-3.5 px-1 text-[8px] font-normal">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {conv.intent && (
                                                    <Badge variant="secondary" className="h-3.5 px-1 text-[8px]">
                                                        {conv.intent === 'buy' ? '🛒' : conv.intent === 'complaint' ? '⚠️' : conv.intent === 'support' ? '🔧' : 'ℹ️'}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* ═══ RIGHT — Detail Panel ═══ */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
                            <Avatar className="h-8 w-8">
                                {selectedConversation.externalUserAvatar && (
                                    <AvatarImage src={selectedConversation.externalUserAvatar} alt={selectedConversation.externalUserName || ''} />
                                )}
                                <AvatarFallback className={cn(
                                    'text-xs',
                                    platformConfig[selectedConversation.platform]?.color
                                )}>
                                    {selectedConversation.externalUserName?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        {selectedConversation.externalUserName}
                                    </span>
                                    <PlatformIcon platform={selectedConversation.platform} size={16} />
                                    <span className="text-[10px] text-muted-foreground">
                                        {selectedConversation.platformAccount?.accountName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {selectedConversation.mode === 'BOT' && (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-green-300 text-green-600 bg-green-50 dark:bg-green-500/10">
                                            <Bot className="h-2.5 w-2.5 mr-0.5" />
                                            Bot Active
                                        </Badge>
                                    )}
                                    {selectedConversation.mode === 'AGENT' && (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-500/10">
                                            <UserCircle className="h-2.5 w-2.5 mr-0.5" />
                                            Agent
                                        </Badge>
                                    )}
                                    {selectedConversation.sentiment && (
                                        <SentimentIcon sentiment={selectedConversation.sentiment} />
                                    )}
                                    {selectedConversation.intent && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                                            {selectedConversation.intent === 'buy' ? '🛒 Buy intent' : selectedConversation.intent === 'complaint' ? '⚠️ Complaint' : selectedConversation.intent}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5">
                                {selectedConversation.mode === 'BOT' ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5"
                                        disabled={updatingConv}
                                        onClick={() => updateConversation(selectedConversation.id, { action: 'takeover' })}
                                    >
                                        <UserCircle className="h-3.5 w-3.5" />
                                        Take Over
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5"
                                        disabled={updatingConv}
                                        onClick={() => updateConversation(selectedConversation.id, { action: 'transferToBot' })}
                                    >
                                        <Bot className="h-3.5 w-3.5" />
                                        Transfer to Bot
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    disabled={updatingConv}
                                    onClick={() => updateConversation(selectedConversation.id, { status: 'done' })}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Done
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-xs cursor-pointer"
                                            onClick={() => updateConversation(selectedConversation.id, { status: 'archived' })}
                                        >
                                            <Archive className="h-3.5 w-3.5 mr-2" />
                                            Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs cursor-pointer">
                                            <Sparkles className="h-3.5 w-3.5 mr-2" />
                                            AI Summary
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Post preview for comment conversations */}
                        {selectedConversation?.type === 'comment' && selectedConversation.metadata && (
                            <div className="px-4 pt-3 pb-1 border-b border-border/50">
                                <a
                                    href={(selectedConversation.metadata as any).postPermalink || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                                >
                                    <div className="p-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[10px] font-medium text-blue-400/80">📄 Original Post</span>
                                            <span className="text-[10px] text-muted-foreground">• Click to view on Facebook</span>
                                        </div>
                                        {(selectedConversation.metadata as any).postContent && (
                                            <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                                                {(selectedConversation.metadata as any).postContent}
                                            </p>
                                        )}
                                    </div>
                                    {(selectedConversation.metadata as any).postImages?.length > 0 && (
                                        <div className={cn(
                                            'grid gap-0.5',
                                            (selectedConversation.metadata as any).postImages.length === 1 ? 'grid-cols-1' :
                                                (selectedConversation.metadata as any).postImages.length === 2 ? 'grid-cols-2' :
                                                    'grid-cols-2'
                                        )}>
                                            {((selectedConversation.metadata as any).postImages as string[]).slice(0, 4).map((img: string, idx: number) => (
                                                <div key={idx} className="relative aspect-video bg-muted overflow-hidden">
                                                    <img
                                                        src={img}
                                                        alt={`Post image ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {idx === 3 && (selectedConversation.metadata as any).postImages.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <span className="text-white font-bold text-lg">
                                                                +{(selectedConversation.metadata as any).postImages.length - 4}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </a>
                            </div>
                        )}

                        {/* Chat history */}
                        <ScrollArea className="flex-1 p-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-xs text-muted-foreground">No messages yet</p>
                                </div>
                            ) : selectedConversation?.type === 'comment' ? (
                                /* ═══ Facebook-style threaded comment thread ═══ */
                                <div className="max-w-2xl mx-auto space-y-0.5">
                                    {messages.map((msg, idx) => {
                                        const isReply = msg.direction === 'outbound'
                                        const prevMsg = idx > 0 ? messages[idx - 1] : null
                                        const isFirstReplyInGroup = isReply && (!prevMsg || prevMsg.direction === 'inbound')

                                        // Extract @mention from content
                                        const mentionMatch = msg.content.match(/^@(\S+)\s/)
                                        const mentionName = mentionMatch ? mentionMatch[1] : null
                                        const contentWithoutMention = mentionName
                                            ? msg.content.substring(mentionMatch![0].length)
                                            : msg.content

                                        return (
                                            <div key={msg.id} className={cn(
                                                'group',
                                                isReply && 'ml-10 relative'
                                            )}>
                                                {/* Connecting line for replies */}
                                                {isReply && isFirstReplyInGroup && (
                                                    <div className="absolute -left-5 top-0 w-5 h-5 border-l-2 border-b-2 border-muted-foreground/20 rounded-bl-lg" />
                                                )}

                                                <div className="flex gap-2 py-1">
                                                    {/* Avatar */}
                                                    <Avatar className={cn('shrink-0 mt-0.5', isReply ? 'h-7 w-7' : 'h-8 w-8')}>
                                                        {msg.direction === 'inbound' && msg.senderAvatar ? (
                                                            <AvatarImage src={msg.senderAvatar} alt={msg.senderName || ''} />
                                                        ) : null}
                                                        <AvatarFallback className={cn(
                                                            'text-[10px] font-medium',
                                                            msg.direction === 'outbound'
                                                                ? msg.senderType === 'bot'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                                : 'bg-gray-100 dark:bg-gray-800'
                                                        )}>
                                                            {msg.direction === 'outbound'
                                                                ? msg.senderType === 'bot' ? '🤖' : 'S'
                                                                : msg.senderName?.charAt(0)?.toUpperCase() || '?'
                                                            }
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    {/* Comment body */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            'inline-block rounded-2xl px-3 py-2 max-w-[85%]',
                                                            isReply
                                                                ? 'bg-muted/80 dark:bg-muted/50'
                                                                : 'bg-muted/60 dark:bg-muted/40'
                                                        )}>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-semibold">
                                                                    {msg.direction === 'outbound'
                                                                        ? msg.senderType === 'bot'
                                                                            ? '🤖 AI Bot'
                                                                            : selectedConversation.platformAccount?.accountName || 'Page'
                                                                        : msg.senderName || 'User'
                                                                    }
                                                                </span>
                                                                {msg.direction === 'outbound' && msg.senderType !== 'bot' && (
                                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                                                        ✍️ Author
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs leading-relaxed whitespace-pre-wrap mt-0.5">
                                                                {mentionName && (
                                                                    <span className="text-blue-500 font-semibold">@{mentionName} </span>
                                                                )}
                                                                {contentWithoutMention}
                                                            </p>
                                                        </div>
                                                        {/* Like · Reply · Time */}
                                                        <div className="flex items-center gap-3 mt-0.5 ml-3">
                                                            <button className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                                                Like
                                                            </button>
                                                            {msg.direction === 'inbound' && (
                                                                <button
                                                                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                                                    onClick={() => {
                                                                        const name = msg.senderName || 'User'
                                                                        setReplyToName(name)
                                                                        setReplyText(`@${name} `)
                                                                        // Focus the textarea
                                                                        setTimeout(() => {
                                                                            const textarea = document.querySelector('textarea')
                                                                            if (textarea) {
                                                                                textarea.focus()
                                                                                textarea.setSelectionRange(textarea.value.length, textarea.value.length)
                                                                            }
                                                                        }, 50)
                                                                    }}
                                                                >
                                                                    Reply
                                                                </button>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground/60">
                                                                {timeAgo(msg.sentAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            ) : (
                                /* ═══ Normal DM-style chat ═══ */
                                <div className="max-w-2xl mx-auto space-y-4">
                                    {messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                'flex gap-2',
                                                msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                            )}
                                        >
                                            {msg.direction === 'inbound' && (
                                                <Avatar className="h-7 w-7 shrink-0 mt-1">
                                                    {selectedConversation.externalUserAvatar && (
                                                        <AvatarImage src={selectedConversation.externalUserAvatar} alt={selectedConversation.externalUserName || ''} />
                                                    )}
                                                    <AvatarFallback className="text-[10px] bg-gray-100 dark:bg-gray-800">
                                                        {selectedConversation.externalUserName?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
                                                msg.direction === 'outbound'
                                                    ? msg.senderType === 'bot'
                                                        ? 'bg-green-500/10 text-foreground border border-green-200 dark:border-green-800'
                                                        : 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            )}>
                                                {msg.senderType === 'bot' && (
                                                    <div className="flex items-center gap-1 mb-1.5 text-green-600 dark:text-green-400 text-[10px] font-medium">
                                                        <Bot className="h-3 w-3" />
                                                        AI Bot
                                                        {msg.confidence != null && (
                                                            <span className="text-muted-foreground">
                                                                · {Math.round(msg.confidence * 100)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                                <div className={cn(
                                                    'text-[9px] mt-1.5',
                                                    msg.direction === 'outbound' && msg.senderType !== 'bot'
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                )}>
                                                    {new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {msg.direction === 'outbound' && msg.senderType === 'agent' && (
                                                <Avatar className="h-7 w-7 shrink-0 mt-1">
                                                    <AvatarFallback className="text-[10px] bg-primary/10">
                                                        A
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Reply box */}
                        <div className="border-t bg-card p-3">
                            {/* Reply-to indicator */}
                            {replyToName && (
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <Reply className="h-3 w-3 text-muted-foreground rotate-180" />
                                    <span className="text-[11px] text-muted-foreground">
                                        Replying to <strong className="text-foreground">{replyToName}</strong>
                                    </span>
                                    <button
                                        onClick={() => setReplyToName(null)}
                                        className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                {selectedConversation.mode === 'BOT' ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400 font-medium">
                                        <Bot className="h-3 w-3" />
                                        Bot is handling this conversation
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                        <UserCircle className="h-3 w-3" />
                                        You are handling this conversation
                                    </div>
                                )}
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendReply()
                                            }
                                        }}
                                        placeholder={selectedConversation.mode === 'BOT' ? 'Take over to reply...' : 'Type your reply... (Enter to send)'}
                                        disabled={selectedConversation.mode === 'BOT'}
                                        rows={2}
                                        className="w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0"
                                        disabled={selectedConversation.mode === 'BOT'}
                                        title="AI Suggest"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 w-7 p-0"
                                        disabled={selectedConversation.mode === 'BOT'}
                                        title="Internal Note"
                                    >
                                        <StickyNote className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        disabled={selectedConversation.mode === 'BOT' || !replyText.trim() || sendingReply}
                                        onClick={handleSendReply}
                                    >
                                        {sendingReply ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Send className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-foreground mb-1">Select a conversation</h3>
                            <p className="text-xs text-muted-foreground">Choose a conversation from the list to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
