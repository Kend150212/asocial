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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    MessageSquare,
    MessageCircle,
    Star,
    Search,
    Bot,
    UserCircle,
    Send,
    Sparkles,
    StickyNote,
    ChevronDown,
    Check,
    MoreVertical,
    Tag,
    UserPlus,
    CheckCircle2,
    Archive,
    Mail,
    Clock,
    AlertCircle,
    Smile,
    Frown,
    Meh,
    ArrowRightLeft,
    Filter,
    RefreshCcw,
    Inbox,
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
    isActive: boolean
}

interface Conversation {
    id: string
    platform: string
    externalUserName: string | null
    externalUserAvatar: string | null
    status: string
    mode: 'BOT' | 'AGENT' | 'PAUSED'
    assignedTo: string | null
    tags: string[]
    sentiment: string | null
    intent: string | null
    priority: number
    aiSummary: string | null
    lastMessageAt: string | null
    unreadCount: number
    lastMessage?: string
    platformAccount?: {
        accountName: string
        platform: string
    }
}

interface InboxMessage {
    id: string
    direction: string
    senderType: string
    content: string
    mediaUrl: string | null
    confidence: number | null
    sentAt: string
}

// ─── Platform icons / colors ──────────
const platformConfig: Record<string, { icon: string; color: string; label: string }> = {
    facebook: { icon: '📘', color: 'bg-blue-500/10 text-blue-600', label: 'Facebook' },
    instagram: { icon: '📸', color: 'bg-pink-500/10 text-pink-600', label: 'Instagram' },
    tiktok: { icon: '🎵', color: 'bg-gray-800/10 text-gray-800 dark:text-gray-200', label: 'TikTok' },
    linkedin: { icon: '💼', color: 'bg-blue-700/10 text-blue-700', label: 'LinkedIn' },
    zalo: { icon: '📘', color: 'bg-blue-400/10 text-blue-500', label: 'Zalo' },
    youtube: { icon: '🎬', color: 'bg-red-500/10 text-red-600', label: 'YouTube' },
}

// ─── Status filters ───────────────────
const statusFilters = [
    { key: 'new', label: 'Unassigned', icon: Mail, count: 0 },
    { key: 'open', label: 'Assigned', icon: UserPlus, count: 0 },
    { key: 'mine', label: 'Mine', icon: UserCircle, count: 0 },
    { key: 'done', label: 'Done', icon: CheckCircle2, count: 0 },
    { key: 'archived', label: 'Archived', icon: Archive, count: 0 },
    { key: 'all', label: 'All', icon: Inbox, count: 0 },
]

// ─── Tabs ─────────────────────────────
const inboxTabs = [
    { key: 'all', label: 'All' },
    { key: 'messages', label: 'Messages' },
    { key: 'comments', label: 'Comments' },
    { key: 'reviews', label: 'Reviews' },
]

// ─── Sentiment icons ──────────────────
function SentimentIcon({ sentiment }: { sentiment: string | null }) {
    if (sentiment === 'positive') return <Smile className="h-3.5 w-3.5 text-green-500" />
    if (sentiment === 'negative') return <Frown className="h-3.5 w-3.5 text-red-500" />
    return <Meh className="h-3.5 w-3.5 text-muted-foreground/50" />
}

// ─── Mock data for UI shell ───────────
const mockConversations: Conversation[] = [
    {
        id: '1',
        platform: 'facebook',
        externalUserName: 'Thanh Dan',
        externalUserAvatar: null,
        status: 'new',
        mode: 'BOT',
        assignedTo: null,
        tags: ['order'],
        sentiment: 'positive',
        intent: 'buy',
        priority: 80,
        aiSummary: null,
        lastMessageAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        unreadCount: 2,
        lastMessage: 'Em muốn đặt sản phẩm này',
        platformAccount: { accountName: 'Lux Home Official', platform: 'facebook' },
    },
    {
        id: '2',
        platform: 'instagram',
        externalUserName: 'Vinh Nguyen',
        externalUserAvatar: null,
        status: 'open',
        mode: 'AGENT',
        assignedTo: 'user1',
        tags: ['support'],
        sentiment: 'neutral',
        intent: 'support',
        priority: 50,
        aiSummary: null,
        lastMessageAt: new Date(Date.now() - 10 * 3600000).toISOString(),
        unreadCount: 0,
        lastMessage: 'Giá sản phẩm như nào ạ?',
        platformAccount: { accountName: '@luxhome.vn', platform: 'instagram' },
    },
    {
        id: '3',
        platform: 'zalo',
        externalUserName: 'Mai Linh',
        externalUserAvatar: null,
        status: 'new',
        mode: 'BOT',
        assignedTo: null,
        tags: ['complaint'],
        sentiment: 'negative',
        intent: 'complaint',
        priority: 95,
        aiSummary: null,
        lastMessageAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        unreadCount: 5,
        lastMessage: 'Sản phẩm bị lỗi, tôi muốn đổi trả',
        platformAccount: { accountName: 'Lux Home Zalo', platform: 'zalo' },
    },
    {
        id: '4',
        platform: 'facebook',
        externalUserName: 'Hùng Trần',
        externalUserAvatar: null,
        status: 'done',
        mode: 'AGENT',
        assignedTo: 'user1',
        tags: [],
        sentiment: 'positive',
        intent: 'info',
        priority: 20,
        aiSummary: null,
        lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        unreadCount: 0,
        lastMessage: 'Cảm ơn shop đã tư vấn',
        platformAccount: { accountName: 'Lux Home VN', platform: 'facebook' },
    },
    {
        id: '5',
        platform: 'tiktok',
        externalUserName: 'Bảo Ngọc',
        externalUserAvatar: null,
        status: 'new',
        mode: 'BOT',
        assignedTo: null,
        tags: ['buy'],
        sentiment: 'positive',
        intent: 'buy',
        priority: 70,
        aiSummary: null,
        lastMessageAt: new Date(Date.now() - 30 * 60000).toISOString(),
        unreadCount: 1,
        lastMessage: 'Cho mình hỏi có ship COD không?',
        platformAccount: { accountName: '@luxhome', platform: 'tiktok' },
    },
]

const mockMessages: InboxMessage[] = [
    { id: 'm1', direction: 'inbound', senderType: 'customer', content: 'Chào shop, em muốn hỏi về sản phẩm sofa góc L', mediaUrl: null, confidence: null, sentAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'm2', direction: 'outbound', senderType: 'bot', content: 'Dạ chào anh/chị! 🤖 Em là trợ lý AI của Lux Home. Anh/chị muốn hỏi về sofa góc L model nào ạ? Hiện tại shop đang có 3 mẫu:\n\n1. Sofa góc L Classic - 15.900.000đ\n2. Sofa góc L Premium - 22.500.000đ\n3. Sofa góc L Luxury - 35.000.000đ\n\nAnh/chị quan tâm mẫu nào ạ?', mediaUrl: null, confidence: 0.92, sentAt: new Date(Date.now() - 3.9 * 3600000).toISOString() },
    { id: 'm3', direction: 'inbound', senderType: 'customer', content: 'Em muốn đặt sofa Premium, có thể trả góp không shop?', mediaUrl: null, confidence: null, sentAt: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'm4', direction: 'outbound', senderType: 'bot', content: 'Dạ sofa góc L Premium giá 22.500.000đ ạ! Shop hiện hỗ trợ trả góp 0% qua:%\n\n🏦 Thẻ tín dụng: 3-12 tháng\n💳 Ví điện tử: MoMo, ZaloPay\n\nAnh/chị muốn tìm hiểu thêm chi tiết trả góp không ạ?', mediaUrl: null, confidence: 0.85, sentAt: new Date(Date.now() - 2.9 * 3600000).toISOString() },
]

const mockPlatformAccounts: PlatformAccount[] = [
    { id: 'p1', platform: 'facebook', accountId: '123', accountName: 'Lux Home Official', isActive: true },
    { id: 'p2', platform: 'facebook', accountId: '456', accountName: 'Lux Home VN', isActive: true },
    { id: 'p3', platform: 'instagram', accountId: '789', accountName: '@luxhome.vn', isActive: true },
    { id: 'p4', platform: 'tiktok', accountId: 'abc', accountName: '@luxhome', isActive: true },
    { id: 'p5', platform: 'zalo', accountId: 'def', accountName: 'Lux Home Zalo', isActive: true },
]

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
    const { activeChannel, channels } = useWorkspace()
    const t = useTranslation()

    // ─── State ────────────────────────
    const [statusFilter, setStatusFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<InboxMessage[]>([])
    const [replyText, setReplyText] = useState('')
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
    const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>(mockPlatformAccounts)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-select first conversation
    useEffect(() => {
        if (conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(conversations[0])
            setMessages(mockMessages)
        }
    }, [conversations])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ─── Filtered conversations ───────
    const filteredConversations = conversations.filter(c => {
        if (statusFilter !== 'all' && statusFilter !== 'mine') {
            if (c.status !== statusFilter) return false
        }
        if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(c.platform)) {
            return false
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return c.externalUserName?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q)
        }
        return true
    })

    // ─── Count by status ──────────────
    const counts = {
        new: conversations.filter(c => c.status === 'new').length,
        open: conversations.filter(c => c.status === 'open').length,
        mine: conversations.filter(c => c.assignedTo === 'currentUser').length,
        done: conversations.filter(c => c.status === 'done').length,
        archived: conversations.filter(c => c.status === 'archived').length,
        all: conversations.length,
    }

    // ─── Toggle platform filter ───────
    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        )
    }

    // ─── Platform tree (group by platform) 
    const platformTree = platformAccounts.reduce((acc, p) => {
        if (!acc[p.platform]) acc[p.platform] = []
        acc[p.platform].push(p)
        return acc
    }, {} as Record<string, PlatformAccount[]>)

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
                            {statusFilters.map(f => (
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
                                    {counts[f.key as keyof typeof counts] > 0 && (
                                        <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[9px]">
                                            {counts[f.key as keyof typeof counts]}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <Separator className="mx-2" />

                    {/* Platform / Account tree */}
                    <div className="p-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Platforms
                        </p>
                        <div className="space-y-1 mt-1">
                            {Object.entries(platformTree).map(([platform, accounts]) => (
                                <div key={platform}>
                                    <button
                                        onClick={() => {
                                            // Toggle all accounts of this platform
                                            const allIds = accounts.map(a => a.platform)
                                            const allSelected = accounts.every(a => selectedPlatforms.includes(a.id))
                                            if (allSelected) {
                                                setSelectedPlatforms(prev => prev.filter(p => !accounts.some(a => a.id === p)))
                                            } else {
                                                setSelectedPlatforms(prev => [...new Set([...prev, ...accounts.map(a => a.id)])])
                                            }
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        <span className="text-sm">{platformConfig[platform]?.icon || '🌐'}</span>
                                        <span className="font-medium">{platformConfig[platform]?.label || platform}</span>
                                    </button>
                                    {accounts.map(account => (
                                        <button
                                            key={account.id}
                                            onClick={() => togglePlatform(account.id)}
                                            className={cn(
                                                'w-full flex items-center gap-2 pl-7 pr-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer',
                                                selectedPlatforms.includes(account.id)
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            )}
                                        >
                                            <span className="flex-1 text-left truncate">{account.accountName}</span>
                                            {selectedPlatforms.includes(account.id) && (
                                                <Check className="h-3 w-3 text-primary shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
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
                                <span>{conversations.filter(c => c.mode === 'BOT').length} bot active</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Frown className="h-3.5 w-3.5 text-red-500" />
                                <span>{conversations.filter(c => c.sentiment === 'negative').length} angry</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                <span>{conversations.filter(c => c.status === 'new').length} waiting</span>
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

                {/* Search */}
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setSelectedConversation(conv)
                                    setMessages(mockMessages)
                                }}
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
                                        <AvatarFallback className={cn(
                                            'text-xs font-medium',
                                            platformConfig[conv.platform]?.color || 'bg-gray-100'
                                        )}>
                                            {conv.externalUserName?.charAt(0)?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Platform badge */}
                                    <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">
                                        {platformConfig[conv.platform]?.icon}
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
                                            {conv.lastMessage}
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

                        {filteredConversations.length === 0 && (
                            <div className="p-8 text-center">
                                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">No conversations found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* ═══ RIGHT — Detail Panel ═══ */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
                            <Avatar className="h-8 w-8">
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
                                    <span className="text-[10px]">
                                        {platformConfig[selectedConversation.platform]?.icon}
                                    </span>
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
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                        <UserCircle className="h-3.5 w-3.5" />
                                        Take Over
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                        <Bot className="h-3.5 w-3.5" />
                                        Transfer to Bot
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                            <UserPlus className="h-3.5 w-3.5" />
                                            Assign
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem className="text-xs cursor-pointer">Assign to me</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-xs cursor-pointer">Team Member 1</DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs cursor-pointer">Team Member 2</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                    <Tag className="h-3.5 w-3.5" />
                                    Tags
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50">
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
                                        <DropdownMenuItem className="text-xs cursor-pointer">
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

                        {/* Chat history */}
                        <ScrollArea className="flex-1 p-4">
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
                                                <AvatarFallback className="text-[10px] bg-gray-100">
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
                                                    {msg.confidence && (
                                                        <span className="text-muted-foreground">
                                                            · {Math.round(msg.confidence * 100)}% conf
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
                                        {msg.direction === 'outbound' && msg.senderType !== 'bot' && (
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
                        </ScrollArea>

                        {/* AI Insights bar */}
                        {selectedConversation.mode === 'AGENT' && (
                            <div className="mx-4 mb-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 text-[11px]">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span className="text-amber-700 dark:text-amber-300 font-medium">AI Suggestion:</span>
                                    <span className="text-amber-600 dark:text-amber-400 flex-1 truncate">
                                        &quot;Dạ anh/chị có thể chọn trả góp 0% qua thẻ tín dụng 6-12 tháng...&quot;
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] text-amber-600 hover:bg-amber-100">
                                        Use
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Reply box */}
                        <div className="border-t bg-card p-3">
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
                                        placeholder={selectedConversation.mode === 'BOT' ? 'Take over to reply...' : 'Type your reply...'}
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
                                        disabled={selectedConversation.mode === 'BOT' || !replyText.trim()}
                                    >
                                        <Send className="h-3.5 w-3.5" />
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
