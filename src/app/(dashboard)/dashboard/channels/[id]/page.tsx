'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { use } from 'react'
import {
    ArrowLeft,
    Save,
    Megaphone,
    Globe,
    Settings,
    BookOpen,
    FileText,
    Hash,
    Bell,
    Palette,
    Plus,
    Trash2,
    Link as LinkIcon,
    FileSpreadsheet,
    Type,
    ExternalLink,
    GripVertical,
    Sparkles,
    Loader2,
    Send,
    Zap,
    Download,
    Search,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// ─── Types ──────────────────────────────────────────
interface KnowledgeEntry {
    id: string
    title: string
    sourceType: string
    sourceUrl: string | null
    content: string
    createdAt: string
}

interface ContentTemplate {
    id: string
    name: string
    platform: string | null
    templateContent: string
    variables: string[]
    createdAt: string
}

interface HashtagGroup {
    id: string
    name: string
    hashtags: string[]
    usageCount: number
}

interface AiProviderInfo {
    id: string
    provider: string
    name: string
    status: string
    hasApiKey: boolean
}

interface AiModelInfo {
    id: string
    name: string
    type: string
    description?: string
}

interface ChannelPlatformEntry {
    id: string
    platform: string
    accountId: string
    accountName: string
    isActive: boolean
}

const platformIcons: Record<string, React.ReactNode> = {
    facebook: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>
    ),
    youtube: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    ),
    tiktok: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
    ),
    x: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    ),
    linkedin: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    ),
    pinterest: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E60023"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>
    ),
    gbp: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#4285F4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
    ),
    threads: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.56c-1.096-3.98-3.832-5.988-8.136-5.974h-.013c-2.806.02-4.929.926-6.31 2.694-1.296 1.66-1.974 4.074-2.013 7.169.039 3.094.717 5.508 2.014 7.168 1.382 1.77 3.505 2.674 6.31 2.694h.013c2.447-.017 4.33-.604 5.6-1.745 1.358-1.222 2.065-2.979 2.1-5.222l.008-.018c-.033-.632-.185-1.163-.452-1.578-.396-.615-.98-1.004-1.636-1.089-.508-.065-1.021.012-1.389.211-.182.098-.333.228-.424.396.182.32.321.676.414 1.065.14.587.147 1.266.02 1.916-.232 1.186-.899 2.183-1.881 2.81-.893.571-1.99.83-3.176.748-1.523-.105-2.862-.733-3.769-1.768-.823-.94-1.276-2.163-1.312-3.54-.036-1.392.353-2.647 1.126-3.636.87-1.113 2.193-1.82 3.829-2.046.776-.107 1.534-.113 2.249-.02-.022-1.123-.177-2.023-.489-2.755-.397-.932-1.05-1.461-1.941-1.574-.505-.064-1.037.02-1.449.23-.255.13-.471.312-.639.538l-1.596-1.297c.34-.417.77-.756 1.276-1.006.774-.384 1.655-.56 2.542-.51 1.48.084 2.652.72 3.482 1.89.764 1.076 1.162 2.522 1.182 4.298l.003.188c1.116.115 2.098.588 2.804 1.395.828.946 1.24 2.198 1.194 3.627-.037 2.656-.912 4.824-2.602 6.445-1.619 1.553-3.937 2.35-6.887 2.37zM9.206 14.633c.013.557.17 1.032.468 1.372.366.418.918.65 1.601.674.711.024 1.379-.135 1.876-.447.436-.273.74-.672.858-1.123.076-.294.087-.624.031-.954-.086-.51-.389-.91-.82-1.09-.314-.13-.72-.182-1.14-.145-1.235.108-2.469.65-2.874 1.713z" /></svg>
    ),
}

const platformOptions = [
    { value: 'facebook', label: 'Facebook', color: '#1877F2' },
    { value: 'instagram', label: 'Instagram', color: '#E4405F' },
    { value: 'youtube', label: 'YouTube', color: '#FF0000' },
    { value: 'tiktok', label: 'TikTok', color: '#00F2EA' },
    { value: 'x', label: 'X / Twitter', color: '#000000' },
    { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { value: 'pinterest', label: 'Pinterest', color: '#E60023' },
    { value: 'gbp', label: 'Google Business', color: '#4285F4' },
    { value: 'threads', label: 'Threads', color: '#000000' },
]

interface ChannelDetail {
    id: string
    name: string
    displayName: string
    description: string | null
    isActive: boolean
    language: string
    descriptionsPerPlatform: Record<string, string>
    vibeTone: Record<string, string>
    seoTags: string[]
    colorPalette: string[]
    notificationEmail: string | null
    requireApproval: boolean
    storageProvider: string | null
    useDefaultStorage: boolean
    webhookDiscord: Record<string, string>
    webhookTelegram: Record<string, string>
    webhookSlack: Record<string, string>
    webhookCustom: Record<string, string>
    knowledgeBase: KnowledgeEntry[]
    contentTemplates: ContentTemplate[]
    hashtagGroups: HashtagGroup[]
    _count: { posts: number; mediaItems: number }
    defaultAiProvider: string | null
    defaultAiModel: string | null
}

const sourceTypeIcons: Record<string, typeof Type> = {
    text: Type,
    url: LinkIcon,
    google_sheet: FileSpreadsheet,
    file: FileText,
}

const sourceTypeLabels: Record<string, string> = {
    text: 'Text',
    url: 'URL',
    google_sheet: 'Google Sheets',
    file: 'File',
}

// ─── Page ───────────────────────────────────────────
export default function ChannelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const t = useTranslation()
    const router = useRouter()
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === 'ADMIN'
    const [channel, setChannel] = useState<ChannelDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    // Editable fields
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')
    const [language, setLanguage] = useState('en')
    const [isActive, setIsActive] = useState(true)
    const [notificationEmail, setNotificationEmail] = useState('')
    const [requireApproval, setRequireApproval] = useState(false)
    const [vibeTone, setVibeTone] = useState<Record<string, string>>({})

    // Knowledge Base state
    const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
    const [newKbTitle, setNewKbTitle] = useState('')
    const [newKbType, setNewKbType] = useState('text')
    const [newKbUrl, setNewKbUrl] = useState('')
    const [newKbContent, setNewKbContent] = useState('')
    const [addingKb, setAddingKb] = useState(false)

    // Content Templates state
    const [templates, setTemplates] = useState<ContentTemplate[]>([])
    const [newTplName, setNewTplName] = useState('')
    const [newTplContent, setNewTplContent] = useState('')
    const [addingTpl, setAddingTpl] = useState(false)

    // Hashtag Groups state
    const [hashtags, setHashtags] = useState<HashtagGroup[]>([])
    const [newHashName, setNewHashName] = useState('')
    const [newHashTags, setNewHashTags] = useState('')
    const [addingHash, setAddingHash] = useState(false)

    // AI provider/model
    const [aiProvider, setAiProvider] = useState('')
    const [aiModel, setAiModel] = useState('')
    const [generatingDesc, setGeneratingDesc] = useState(false)
    const [generatingVibe, setGeneratingVibe] = useState(false)
    const [newVibeFieldName, setNewVibeFieldName] = useState('')
    const [addingVibeField, setAddingVibeField] = useState(false)
    const [availableProviders, setAvailableProviders] = useState<AiProviderInfo[]>([])
    const [availableModels, setAvailableModels] = useState<AiModelInfo[]>([])
    const [loadingModels, setLoadingModels] = useState(false)

    // Webhook state
    const [webhookDiscordUrl, setWebhookDiscordUrl] = useState('')
    const [webhookTelegramToken, setWebhookTelegramToken] = useState('')
    const [webhookTelegramChatId, setWebhookTelegramChatId] = useState('')
    const [webhookSlackUrl, setWebhookSlackUrl] = useState('')
    const [webhookCustomUrl, setWebhookCustomUrl] = useState('')
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

    // Platform state
    const [platforms, setPlatforms] = useState<ChannelPlatformEntry[]>([])
    const [addingPlatform, setAddingPlatform] = useState(false)
    const [newPlatform, setNewPlatform] = useState('')
    const [newPlatformAccountId, setNewPlatformAccountId] = useState('')
    const [newPlatformAccountName, setNewPlatformAccountName] = useState('')
    const [savingPlatform, setSavingPlatform] = useState(false)
    const [fetchingVbout, setFetchingVbout] = useState(false)
    const [platformSearch, setPlatformSearch] = useState('')

    const fetchChannel = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/channels/${id}`)
            if (res.ok) {
                const data = await res.json()
                setChannel(data)
                setDisplayName(data.displayName)
                setDescription(data.description || '')
                setLanguage(data.language)
                setIsActive(data.isActive)
                setNotificationEmail(data.notificationEmail || '')
                setRequireApproval(data.requireApproval)
                setVibeTone(data.vibeTone || {})
                setKnowledgeEntries(data.knowledgeBase || [])
                setTemplates(data.contentTemplates || [])
                setHashtags(data.hashtagGroups || [])
                // AI defaults
                setAiProvider(data.defaultAiProvider || '')
                setAiModel(data.defaultAiModel || '')
                // Webhooks
                setWebhookDiscordUrl(data.webhookDiscord?.url || '')
                setWebhookTelegramToken(data.webhookTelegram?.botToken || '')
                setWebhookTelegramChatId(data.webhookTelegram?.chatId || '')
                setWebhookSlackUrl(data.webhookSlack?.url || '')
                setWebhookCustomUrl(data.webhookCustom?.url || '')
            } else {
                toast.error(t('channels.notFound'))
                router.push('/dashboard/channels')
            }
        } catch {
            toast.error(t('channels.loadFailed'))
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchChannel()
        // Fetch platforms
        fetch(`/api/admin/channels/${id}/platforms`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setPlatforms(data))
            .catch(() => { })
    }, [fetchChannel, id])

    // Handle OAuth redirect success
    const searchParams = useSearchParams()
    useEffect(() => {
        const oauthPlatform = searchParams.get('oauth')
        const imported = searchParams.get('imported')
        const oauthError = searchParams.get('error')
        const tab = searchParams.get('tab')

        if (tab === 'platforms') {
            setActiveTab('platforms')
        }

        if (oauthPlatform && imported) {
            const name = oauthPlatform.charAt(0).toUpperCase() + oauthPlatform.slice(1)
            toast.success(`${name} connected! ${imported} account(s) imported.`)
            // Refresh platform list
            fetch(`/api/admin/channels/${id}/platforms`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setPlatforms(data))
                .catch(() => { })
            // Clean URL params
            router.replace(`/dashboard/channels/${id}`, { scroll: false })
        } else if (oauthError) {
            toast.error(`OAuth error: ${oauthError}`)
            router.replace(`/dashboard/channels/${id}`, { scroll: false })
        }
    }, [searchParams, id, router])

    // Fetch AI providers from API Hub
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const res = await fetch('/api/admin/integrations')
                if (res.ok) {
                    const data = await res.json()
                    const aiProviders = data.filter(
                        (i: AiProviderInfo & { category: string }) => i.category === 'AI'
                    )
                    setAvailableProviders(aiProviders)
                }
            } catch { /* silently ignore */ }
        }
        fetchProviders()
    }, [])

    // Fetch models when provider changes
    useEffect(() => {
        if (!aiProvider) {
            setAvailableModels([])
            return
        }
        const provider = availableProviders.find(p => p.provider === aiProvider)
        if (!provider) return

        const fetchModels = async () => {
            setLoadingModels(true)
            try {
                const res = await fetch('/api/admin/integrations/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: provider.id }),
                })
                if (res.ok) {
                    const data = await res.json()
                    // Filter to text models only for content generation
                    setAvailableModels(
                        (data.models || []).filter((m: AiModelInfo) => m.type === 'text')
                    )
                }
            } catch { /* silently ignore */ }
            setLoadingModels(false)
        }
        fetchModels()
    }, [aiProvider, availableProviders])

    // ─── Save General Settings ──────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    description: description || null,
                    language,
                    isActive,
                    notificationEmail: notificationEmail || null,
                    requireApproval,
                    vibeTone,
                    defaultAiProvider: aiProvider || null,
                    defaultAiModel: aiModel || null,
                    webhookDiscord: webhookDiscordUrl ? { url: webhookDiscordUrl } : {},
                    webhookTelegram: webhookTelegramToken ? { botToken: webhookTelegramToken, chatId: webhookTelegramChatId } : {},
                    webhookSlack: webhookSlackUrl ? { url: webhookSlackUrl } : {},
                    webhookCustom: webhookCustomUrl ? { url: webhookCustomUrl } : {},
                }),
            })
            if (res.ok) {
                toast.success(t('channels.saved'))
                fetchChannel()
            } else {
                toast.error(t('channels.saveFailed'))
            }
        } catch {
            toast.error(t('channels.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    // ─── AI Analysis ────────────────────────────────
    const handleAnalyze = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setAnalyzing(true)
        toast.info(t('channels.ai.started'))

        try {
            // First save description
            await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            })

            // Call AI analysis
            const res = await fetch(`/api/admin/channels/${id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    description,
                    language,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || t('channels.ai.failed'))
            }

            const analysis = await res.json()

            // Apply Vibe & Tone
            if (analysis.vibeTone) {
                setVibeTone(analysis.vibeTone)
                await fetch(`/api/admin/channels/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vibeTone: analysis.vibeTone }),
                })
            }

            // Create Knowledge Base entries
            if (analysis.knowledgeBase?.length) {
                for (const entry of analysis.knowledgeBase) {
                    await fetch(`/api/admin/channels/${id}/knowledge`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: entry.title,
                            sourceType: 'text',
                            content: entry.content,
                        }),
                    })
                }
            }

            // Create Content Templates
            if (analysis.contentTemplates?.length) {
                for (const tpl of analysis.contentTemplates) {
                    await fetch(`/api/admin/channels/${id}/templates`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: tpl.name,
                            templateContent: tpl.templateContent,
                        }),
                    })
                }
            }

            // Create Hashtag Groups
            if (analysis.hashtagGroups?.length) {
                for (const group of analysis.hashtagGroups) {
                    await fetch(`/api/admin/channels/${id}/hashtags`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: group.name,
                            hashtags: group.hashtags,
                        }),
                    })
                }
            }

            // Refresh all data
            await fetchChannel()
            toast.success(t('channels.ai.complete'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('channels.ai.failed'))
        } finally {
            setAnalyzing(false)
        }
    }

    // ─── Knowledge Base CRUD ────────────────────────
    const addKbEntry = async () => {
        if (!newKbTitle) return
        setAddingKb(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newKbTitle,
                    sourceType: newKbType,
                    sourceUrl: newKbUrl || null,
                    content: newKbContent,
                }),
            })
            if (res.ok) {
                const entry = await res.json()
                setKnowledgeEntries([entry, ...knowledgeEntries])
                setNewKbTitle('')
                setNewKbType('text')
                setNewKbUrl('')
                setNewKbContent('')
                toast.success(t('channels.knowledge.added'))
            }
        } catch {
            toast.error(t('channels.knowledge.addFailed'))
        } finally {
            setAddingKb(false)
        }
    }

    const deleteKbEntry = async (entryId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/knowledge?entryId=${entryId}`, { method: 'DELETE' })
            setKnowledgeEntries(knowledgeEntries.filter((e) => e.id !== entryId))
            toast.success(t('channels.knowledge.deleted'))
        } catch {
            toast.error(t('channels.knowledge.deleteFailed'))
        }
    }

    // ─── Content Templates CRUD ─────────────────────
    const addTemplate = async () => {
        if (!newTplName || !newTplContent) return
        setAddingTpl(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTplName,
                    templateContent: newTplContent,
                }),
            })
            if (res.ok) {
                const tpl = await res.json()
                setTemplates([tpl, ...templates])
                setNewTplName('')
                setNewTplContent('')
                toast.success(t('channels.templates.added'))
            }
        } catch {
            toast.error(t('channels.templates.addFailed'))
        } finally {
            setAddingTpl(false)
        }
    }

    const deleteTemplate = async (templateId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/templates?templateId=${templateId}`, { method: 'DELETE' })
            setTemplates(templates.filter((t) => t.id !== templateId))
            toast.success(t('channels.templates.deleted'))
        } catch {
            toast.error(t('channels.templates.deleteFailed'))
        }
    }

    // ─── Hashtag Groups CRUD ────────────────────────
    const addHashtagGroup = async () => {
        if (!newHashName) return
        setAddingHash(true)
        try {
            const tags = newHashTags.split(/[,\n]/).map((t) => t.trim()).filter(Boolean)
            const res = await fetch(`/api/admin/channels/${id}/hashtags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newHashName, hashtags: tags }),
            })
            if (res.ok) {
                const group = await res.json()
                setHashtags([...hashtags, group])
                setNewHashName('')
                setNewHashTags('')
                toast.success(t('channels.hashtags.added'))
            }
        } catch {
            toast.error(t('channels.hashtags.addFailed'))
        } finally {
            setAddingHash(false)
        }
    }

    const deleteHashtagGroup = async (groupId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/hashtags?groupId=${groupId}`, { method: 'DELETE' })
            setHashtags(hashtags.filter((h) => h.id !== groupId))
            toast.success(t('channels.hashtags.deleted'))
        } catch {
            toast.error(t('channels.hashtags.deleteFailed'))
        }
    }

    // ─── Generate SEO Description ────────────────────
    const handleGenerateDescription = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setGeneratingDesc(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/generate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    shortDescription: description,
                    language,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setDescription(data.description)
                toast.success(t('channels.ai.descGenerated'))
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.ai.descFailed'))
            }
        } catch {
            toast.error(t('channels.ai.descFailed'))
        } finally {
            setGeneratingDesc(false)
        }
    }

    // ─── Generate Vibe & Tone ───────────────────────
    const handleGenerateVibe = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setGeneratingVibe(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/generate-vibe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    description,
                    language,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                if (data.vibeTone) {
                    setVibeTone(data.vibeTone)
                    toast.success(t('channels.vibe.vibeGenerated'))
                }
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.vibe.vibeFailed'))
            }
        } catch {
            toast.error(t('channels.vibe.vibeFailed'))
        } finally {
            setGeneratingVibe(false)
        }
    }

    // ─── Webhook Test ────────────────────────────────
    const handleWebhookTest = async (platform: string) => {
        setTestingWebhook(platform)
        try {
            const payload: Record<string, string> = { platform }
            if (platform === 'discord') payload.url = webhookDiscordUrl
            if (platform === 'telegram') {
                payload.botToken = webhookTelegramToken
                payload.chatId = webhookTelegramChatId
            }
            if (platform === 'slack') payload.url = webhookSlackUrl
            if (platform === 'custom') payload.url = webhookCustomUrl

            const res = await fetch(`/api/admin/channels/${id}/webhook-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(t('channels.webhooks.testSuccess'))
            } else {
                toast.error(data.message || t('channels.webhooks.testFailed'))
            }
        } catch {
            toast.error(t('channels.webhooks.testFailed'))
        } finally {
            setTestingWebhook(null)
        }
    }

    // ─── Platform CRUD ───────────────────────────────
    const addPlatformConnection = async () => {
        if (!newPlatform || !newPlatformAccountId || !newPlatformAccountName) return
        setSavingPlatform(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/platforms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: newPlatform,
                    accountId: newPlatformAccountId,
                    accountName: newPlatformAccountName,
                }),
            })
            if (res.ok) {
                const entry = await res.json()
                setPlatforms([...platforms, entry])
                setNewPlatform('')
                setNewPlatformAccountId('')
                setNewPlatformAccountName('')
                setAddingPlatform(false)
                toast.success(t('channels.platforms.connected'))
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.platforms.connectFailed'))
            }
        } catch {
            toast.error(t('channels.platforms.connectFailed'))
        } finally {
            setSavingPlatform(false)
        }
    }

    const togglePlatformActive = async (platformId: string, isActive: boolean) => {
        try {
            await fetch(`/api/admin/channels/${id}/platforms`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platformId, isActive }),
            })
            setPlatforms(platforms.map(p => p.id === platformId ? { ...p, isActive } : p))
        } catch {
            toast.error(t('channels.platforms.connectFailed'))
        }
    }

    const deletePlatformConnection = async (platformId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/platforms?platformId=${platformId}`, { method: 'DELETE' })
            setPlatforms(platforms.filter(p => p.id !== platformId))
            toast.success(t('channels.platforms.disconnected'))
        } catch {
            toast.error(t('channels.platforms.disconnectFailed'))
        }
    }

    // ─── Fetch platforms from Vbout ──────────────────
    const fetchFromVbout = async () => {
        setFetchingVbout(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/platforms/vbout`, { cache: 'no-store' })
            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error || t('channels.platforms.vboutError'))
                return
            }
            const data = await res.json()
            const accounts = data.accounts || []

            if (accounts.length === 0) {
                toast.info(t('channels.platforms.noVboutAccounts'))
                return
            }

            // Add each account that isn't already connected
            let imported = 0
            for (const acc of accounts) {
                const alreadyExists = platforms.some(
                    p => p.platform === acc.platform && p.accountId === acc.accountId
                )
                if (alreadyExists) continue

                const addRes = await fetch(`/api/admin/channels/${id}/platforms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        platform: acc.platform,
                        accountId: acc.accountId,
                        accountName: acc.accountName,
                        config: { vboutChannelId: acc.vboutChannelId },
                    }),
                })
                if (addRes.ok) {
                    const entry = await addRes.json()
                    setPlatforms(prev => [...prev, entry])
                    imported++
                }
            }

            if (imported > 0) {
                toast.success(t('channels.platforms.imported').replace('{count}', String(imported)))
            } else {
                toast.info(t('channels.platforms.alreadyConnected'))
            }
        } catch {
            toast.error(t('channels.platforms.vboutError'))
        } finally {
            setFetchingVbout(false)
        }
    }

    // Toggle all platforms active/inactive
    const toggleAllPlatforms = async (active: boolean) => {
        const toToggle = platforms.filter(p => p.isActive !== active)
        for (const p of toToggle) {
            await togglePlatformActive(p.id, active)
        }
    }

    // ─── Loading state ──────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
            </div>
        )
    }

    if (!channel) return null

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/channels')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Megaphone className="h-5 w-5" />
                            {channel.displayName}
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono">/{channel.name}</p>
                    </div>
                    <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                        {channel.isActive ? t('channels.active') : t('channels.inactive')}
                    </Badge>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Settings className="h-3.5 w-3.5" />
                        {t('channels.tabs.general')}
                    </TabsTrigger>
                    <TabsTrigger value="platforms" className="gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" />
                        {t('channels.tabs.platforms')}
                    </TabsTrigger>
                    <TabsTrigger value="vibe" className="gap-1.5 text-xs">
                        <Palette className="h-3.5 w-3.5" />
                        {t('channels.tabs.vibe')}
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        {t('channels.tabs.knowledge')}
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        {t('channels.tabs.templates')}
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="gap-1.5 text-xs">
                        <Hash className="h-3.5 w-3.5" />
                        {t('channels.tabs.hashtags')}
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
                        <Bell className="h-3.5 w-3.5" />
                        {t('channels.tabs.webhooks')}
                    </TabsTrigger>
                </TabsList>

                {/* ─── General Tab ───────────────────── */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('channels.generalSettings')}</CardTitle>
                            <CardDescription>{t('channels.generalSettingsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('channels.displayName')}</Label>
                                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('channels.language')}</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="vi">Vietnamese</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                            <SelectItem value="ja">Japanese</SelectItem>
                                            <SelectItem value="ko">Korean</SelectItem>
                                            <SelectItem value="zh">Chinese</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>{t('channels.descriptionLabel')}</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGenerateDescription}
                                        disabled={generatingDesc || !description}
                                        className="gap-1.5 text-xs text-purple-400 hover:text-purple-300 h-7"
                                    >
                                        {generatingDesc ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" /> {t('channels.ai.generatingDesc')}</>
                                        ) : (
                                            <><Sparkles className="h-3 w-3" /> {t('channels.ai.generateDesc')}</>
                                        )}
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder={t('channels.descriptionPlaceholder')}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('channels.descriptionHint')}
                                </p>
                            </div>

                            {/* AI Analyze Button */}
                            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 border-purple-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-purple-400" />
                                            {t('channels.ai.title')}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('channels.ai.desc')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleAnalyze}
                                        disabled={analyzing || !description}
                                        className="gap-2 border-purple-500/30 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300"
                                    >
                                        {analyzing ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> {t('channels.ai.analyzing')}</>
                                        ) : (
                                            <><Sparkles className="h-4 w-4" /> {t('channels.ai.analyze')}</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* AI Provider & Model */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('channels.ai.provider')}</Label>
                                    <Select value={aiProvider || '__default__'} onValueChange={(v) => { setAiProvider(v === '__default__' ? '' : v); setAiModel('') }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('channels.ai.useGlobal')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__default__">{t('channels.ai.useGlobal')}</SelectItem>
                                            {availableProviders.map((p) => (
                                                <SelectItem key={p.provider} value={p.provider}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">{t('channels.ai.providerDesc')}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        {t('channels.ai.model')}
                                        {loadingModels && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                    </Label>
                                    <Select value={aiModel || '__default__'} onValueChange={(v) => setAiModel(v === '__default__' ? '' : v)} disabled={loadingModels}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('channels.ai.useGlobal')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__default__">{t('channels.ai.useGlobal')}</SelectItem>
                                            {availableModels.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">{t('channels.ai.modelDesc')}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>{t('channels.notificationEmail')}</Label>
                                <Input
                                    type="email"
                                    placeholder="notifications@example.com"
                                    value={notificationEmail}
                                    onChange={(e) => setNotificationEmail(e.target.value)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{t('channels.active')}</Label>
                                    <p className="text-xs text-muted-foreground">{t('channels.activeDesc')}</p>
                                </div>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{t('channels.requireApproval')}</Label>
                                    <p className="text-xs text-muted-foreground">{t('channels.requireApprovalDesc')}</p>
                                </div>
                                <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: t('channels.stats.posts'), value: channel._count.posts, icon: FileText },
                            { label: t('channels.stats.media'), value: channel._count.mediaItems, icon: Palette },
                            { label: t('channels.stats.knowledge'), value: knowledgeEntries.length, icon: BookOpen },
                            { label: t('channels.stats.templates'), value: templates.length, icon: FileText },
                        ].map((stat) => (
                            <Card key={stat.label} className="p-4 text-center">
                                <stat.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ─── Platforms Tab ───────────────── */}
                <TabsContent value="platforms" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">{t('channels.platforms.title')}</CardTitle>
                                <CardDescription>{t('channels.platforms.desc')}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchFromVbout}
                                        disabled={fetchingVbout}
                                        className="gap-1.5 border-blue-500/30 hover:bg-blue-500/10 text-blue-500"
                                    >
                                        {fetchingVbout ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('channels.platforms.fetchingVbout')}</>
                                        ) : (
                                            <><Download className="h-3.5 w-3.5" /> {t('channels.platforms.fetchVbout')}</>
                                        )}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAddingPlatform(!addingPlatform)}
                                    className="gap-1.5"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t('channels.platforms.addPlatform')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search and Bulk Actions */}
                            {platforms.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search accounts..."
                                            value={platformSearch}
                                            onChange={(e) => setPlatformSearch(e.target.value)}
                                            className="pl-9 h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleAllPlatforms(true)}
                                            className="gap-1.5 h-8 text-xs"
                                        >
                                            <ToggleRight className="h-3.5 w-3.5" />
                                            Enable All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleAllPlatforms(false)}
                                            className="gap-1.5 h-8 text-xs"
                                        >
                                            <ToggleLeft className="h-3.5 w-3.5" />
                                            Disable All
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Add Platform — OAuth + Manual */}
                            {addingPlatform && (
                                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                                    {/* OAuth Connect Buttons */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Connect via OAuth</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { key: 'facebook', label: 'Facebook', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/10' },
                                                { key: 'instagram', label: 'Instagram', border: 'border-pink-500/30', hover: 'hover:bg-pink-500/10' },
                                                { key: 'youtube', label: 'YouTube', border: 'border-red-500/30', hover: 'hover:bg-red-500/10' },
                                                { key: 'tiktok', label: 'TikTok', border: 'border-neutral-500/30', hover: 'hover:bg-neutral-500/10' },
                                                { key: 'x', label: 'X', border: 'border-neutral-500/30', hover: 'hover:bg-neutral-500/10' },
                                                { key: 'linkedin', label: 'LinkedIn', border: 'border-blue-600/30', hover: 'hover:bg-blue-600/10' },
                                                { key: 'pinterest', label: 'Pinterest', border: 'border-red-600/30', hover: 'hover:bg-red-600/10' },
                                            ].map(({ key, label, border, hover }) => (
                                                <Button
                                                    key={key}
                                                    variant="outline"
                                                    size="sm"
                                                    className={`gap-2 ${border} ${hover}`}
                                                    onClick={() => {
                                                        const w = 500, h = 700
                                                        const left = window.screenX + (window.outerWidth - w) / 2
                                                        const top = window.screenY + (window.outerHeight - h) / 2
                                                        const popup = window.open(
                                                            `/api/oauth/${key}?channelId=${id}`,
                                                            `${key}-oauth`,
                                                            `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
                                                        )
                                                        const handler = (e: MessageEvent) => {
                                                            if (e.data?.type === 'oauth-success' && e.data?.platform === key) {
                                                                window.removeEventListener('message', handler)
                                                                toast.success(`${label} connected successfully!`)
                                                                fetch(`/api/admin/channels/${id}/platforms`).then(r => r.ok ? r.json() : []).then(data => setPlatforms(data)).catch(() => { })
                                                            }
                                                        }
                                                        window.addEventListener('message', handler)
                                                        const check = setInterval(() => {
                                                            if (popup?.closed) { clearInterval(check); window.removeEventListener('message', handler); fetch(`/api/admin/channels/${id}/platforms`).then(r => r.ok ? r.json() : []).then(data => setPlatforms(data)).catch(() => { }) }
                                                        }, 1000)
                                                    }}
                                                >
                                                    {platformIcons[key]}
                                                    <span className="text-sm">{label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 border-t" />
                                        <span className="text-xs text-muted-foreground">or add manually</span>
                                        <div className="flex-1 border-t" />
                                    </div>

                                    {/* Manual Form */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{t('channels.platforms.platform')}</Label>
                                            <Select value={newPlatform} onValueChange={setNewPlatform}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('channels.platforms.selectPlatform')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {platformOptions.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            <span className="flex items-center gap-2">
                                                                {platformIcons[p.value] || (
                                                                    <span
                                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: p.color }}
                                                                    />
                                                                )}
                                                                {p.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{t('channels.platforms.accountId')}</Label>
                                            <Input
                                                placeholder={t('channels.platforms.accountIdPlaceholder')}
                                                value={newPlatformAccountId}
                                                onChange={(e) => setNewPlatformAccountId(e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{t('channels.platforms.accountName')}</Label>
                                            <Input
                                                placeholder={t('channels.platforms.accountNamePlaceholder')}
                                                value={newPlatformAccountName}
                                                onChange={(e) => setNewPlatformAccountName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setAddingPlatform(false)}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={addPlatformConnection}
                                            disabled={!newPlatform || !newPlatformAccountId || !newPlatformAccountName || savingPlatform}
                                        >
                                            {savingPlatform ? t('common.saving') : t('channels.platforms.addPlatform')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Platform List — grouped by platform type */}
                            {platforms.length === 0 ? (
                                <div className="text-center py-8">
                                    <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-sm font-medium">{t('channels.platforms.noPlatforms')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('channels.platforms.noPlatformsDesc')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(() => {
                                        // Non-admin users only see enabled accounts
                                        const visiblePlatforms = isAdmin ? platforms : platforms.filter(p => p.isActive)
                                        const searchLower = platformSearch.toLowerCase()
                                        const filtered = searchLower
                                            ? visiblePlatforms.filter(p =>
                                                p.accountName.toLowerCase().includes(searchLower) ||
                                                p.accountId.toLowerCase().includes(searchLower) ||
                                                p.platform.toLowerCase().includes(searchLower)
                                            )
                                            : visiblePlatforms
                                        const grouped = filtered.reduce<Record<string, ChannelPlatformEntry[]>>((groups, p) => {
                                            const key = p.platform
                                            if (!groups[key]) groups[key] = []
                                            groups[key].push(p)
                                            return groups
                                        }, {})
                                        return Object.entries(grouped).map(([platformKey, items]) => {
                                            const info = platformOptions.find(o => o.value === platformKey)
                                            return (
                                                <div key={platformKey} className="border rounded-lg overflow-hidden">
                                                    {/* Group Header */}
                                                    <div
                                                        className="flex items-center gap-2.5 px-4 py-2.5 border-b"
                                                        style={{ backgroundColor: `${info?.color || '#888'}10` }}
                                                    >
                                                        {platformIcons[platformKey] || (
                                                            <span
                                                                className="w-4 h-4 rounded-full shrink-0"
                                                                style={{ backgroundColor: info?.color || '#888' }}
                                                            />
                                                        )}
                                                        <span className="text-sm font-semibold">
                                                            {info?.label || platformKey}
                                                        </span>
                                                        <Badge variant="secondary" className="text-[10px] ml-auto">
                                                            {items.length}
                                                        </Badge>
                                                    </div>
                                                    {/* Accounts */}
                                                    <div className="divide-y">
                                                        {items.map((p) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium">{p.accountName}</p>
                                                                    <p className="text-xs text-muted-foreground font-mono">{p.accountId}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <Switch
                                                                        checked={p.isActive}
                                                                        onCheckedChange={(checked) => togglePlatformActive(p.id, checked)}
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                        onClick={() => deletePlatformConnection(p.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Vibe & Tone Tab ───────────────── */}
                <TabsContent value="vibe" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">{t('channels.vibe.title')}</CardTitle>
                                <CardDescription>{t('channels.vibe.desc')}</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateVibe}
                                disabled={generatingVibe || !description}
                            >
                                {generatingVibe ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t('channels.vibe.generatingVibe')}</>
                                ) : (
                                    <><Sparkles className="h-4 w-4 mr-1" /> {t('channels.vibe.generateVibe')}</>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(['personality', 'writingStyle', 'vocabulary', 'targetAudience', 'brandValues'] as const).map((field) => {
                                const vibeLabels: Record<string, string> = {
                                    personality: t('channels.vibe.personality'),
                                    writingStyle: t('channels.vibe.writingStyle'),
                                    vocabulary: t('channels.vibe.vocabulary'),
                                    targetAudience: t('channels.vibe.targetAudience'),
                                    brandValues: t('channels.vibe.brandValues'),
                                }
                                const vibePlaceholders: Record<string, string> = {
                                    personality: t('channels.vibe.personalityPlaceholder'),
                                    writingStyle: t('channels.vibe.writingStylePlaceholder'),
                                    vocabulary: t('channels.vibe.vocabularyPlaceholder'),
                                    targetAudience: t('channels.vibe.targetAudiencePlaceholder'),
                                    brandValues: t('channels.vibe.brandValuesPlaceholder'),
                                }
                                return (
                                    <div key={field} className="space-y-2">
                                        <Label>{vibeLabels[field]}</Label>
                                        <Textarea
                                            placeholder={vibePlaceholders[field]}
                                            value={vibeTone[field] || ''}
                                            onChange={(e) => setVibeTone({ ...vibeTone, [field]: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                )
                            })}

                            {/* Custom Fields */}
                            {Object.keys(vibeTone)
                                .filter((k) => !['personality', 'writingStyle', 'vocabulary', 'targetAudience', 'brandValues'].includes(k))
                                .length > 0 && (
                                    <>
                                        <Separator />
                                        <Label className="text-sm font-medium">{t('channels.vibe.customFields')}</Label>
                                    </>
                                )}
                            {Object.keys(vibeTone)
                                .filter((k) => !['personality', 'writingStyle', 'vocabulary', 'targetAudience', 'brandValues'].includes(k))
                                .map((key) => (
                                    <div key={key} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    const updated = { ...vibeTone }
                                                    delete updated[key]
                                                    setVibeTone(updated)
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Textarea
                                            placeholder={t('channels.vibe.customFieldValue')}
                                            value={vibeTone[key] || ''}
                                            onChange={(e) => setVibeTone({ ...vibeTone, [key]: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                ))}

                            {addingVibeField ? (
                                <div className="flex items-center gap-2 rounded-md border border-dashed p-3 bg-muted/30">
                                    <Input
                                        autoFocus
                                        placeholder={t('channels.vibe.customFieldName')}
                                        value={newVibeFieldName}
                                        onChange={(e) => setNewVibeFieldName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newVibeFieldName.trim()) {
                                                const key = newVibeFieldName.trim().replace(/\s+/g, '_').toLowerCase()
                                                if (!vibeTone[key]) {
                                                    setVibeTone({ ...vibeTone, [key]: '' })
                                                }
                                                setNewVibeFieldName('')
                                                setAddingVibeField(false)
                                            } else if (e.key === 'Escape') {
                                                setNewVibeFieldName('')
                                                setAddingVibeField(false)
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        variant="default"
                                        disabled={!newVibeFieldName.trim()}
                                        onClick={() => {
                                            const key = newVibeFieldName.trim().replace(/\s+/g, '_').toLowerCase()
                                            if (key && !vibeTone[key]) {
                                                setVibeTone({ ...vibeTone, [key]: '' })
                                            }
                                            setNewVibeFieldName('')
                                            setAddingVibeField(false)
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setNewVibeFieldName('')
                                            setAddingVibeField(false)
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed"
                                    onClick={() => setAddingVibeField(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> {t('channels.vibe.addCustomField')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Knowledge Base Tab ─────────────── */}
                <TabsContent value="knowledge" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {t('channels.knowledge.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('channels.knowledge.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add new entry */}
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Input
                                            placeholder={t('channels.knowledge.entryTitle')}
                                            value={newKbTitle}
                                            onChange={(e) => setNewKbTitle(e.target.value)}
                                        />
                                    </div>
                                    <Select value={newKbType} onValueChange={setNewKbType}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">
                                                <span className="flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Text</span>
                                            </SelectItem>
                                            <SelectItem value="url">
                                                <span className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" /> URL</span>
                                            </SelectItem>
                                            <SelectItem value="google_sheet">
                                                <span className="flex items-center gap-2"><FileSpreadsheet className="h-3.5 w-3.5" /> Google Sheet</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(newKbType === 'url' || newKbType === 'google_sheet') && (
                                    <Input
                                        placeholder={newKbType === 'google_sheet' ? 'https://docs.google.com/spreadsheets/d/...' : 'https://example.com/page'}
                                        value={newKbUrl}
                                        onChange={(e) => setNewKbUrl(e.target.value)}
                                    />
                                )}

                                <Textarea
                                    placeholder={newKbType === 'text' ? t('channels.knowledge.contentPlaceholder') : t('channels.knowledge.notesPlaceholder')}
                                    value={newKbContent}
                                    onChange={(e) => setNewKbContent(e.target.value)}
                                    rows={3}
                                />

                                <Button
                                    size="sm"
                                    onClick={addKbEntry}
                                    disabled={!newKbTitle || addingKb}
                                    className="gap-2"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t('channels.knowledge.addEntry')}
                                </Button>
                            </div>

                            <Separator />

                            {/* Existing entries */}
                            {knowledgeEntries.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('channels.knowledge.noEntries')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {knowledgeEntries.map((entry) => {
                                        const Icon = sourceTypeIcons[entry.sourceType] || Type
                                        return (
                                            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg group hover:border-primary/20 transition-colors">
                                                <div className="p-2 rounded-md bg-muted shrink-0 mt-0.5">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                                                        <Badge variant="outline" className="text-[10px] shrink-0">
                                                            {sourceTypeLabels[entry.sourceType] || entry.sourceType}
                                                        </Badge>
                                                    </div>
                                                    {entry.sourceUrl && (
                                                        <a
                                                            href={entry.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            {entry.sourceUrl.length > 60 ? entry.sourceUrl.substring(0, 60) + '...' : entry.sourceUrl}
                                                        </a>
                                                    )}
                                                    {entry.content && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {entry.content}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive"
                                                    onClick={() => deleteKbEntry(entry.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Templates Tab ──────────────────── */}
                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {t('channels.templates.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('channels.templates.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <Input
                                    placeholder={t('channels.templates.namePlaceholder')}
                                    value={newTplName}
                                    onChange={(e) => setNewTplName(e.target.value)}
                                />
                                <Textarea
                                    placeholder={t('channels.templates.contentPlaceholder')}
                                    value={newTplContent}
                                    onChange={(e) => setNewTplContent(e.target.value)}
                                    rows={4}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    size="sm"
                                    onClick={addTemplate}
                                    disabled={!newTplName || !newTplContent || addingTpl}
                                    className="gap-2"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t('channels.templates.addTemplate')}
                                </Button>
                            </div>

                            <Separator />

                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('channels.templates.noTemplates')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {templates.map((tpl) => (
                                        <div key={tpl.id} className="flex items-start gap-3 p-3 border rounded-lg group hover:border-primary/20 transition-colors">
                                            <div className="p-2 rounded-md bg-muted shrink-0 mt-0.5">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm">{tpl.name}</h4>
                                                <p className="text-xs text-muted-foreground mt-1 font-mono line-clamp-2">
                                                    {tpl.templateContent}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive"
                                                onClick={() => deleteTemplate(tpl.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Hashtags Tab ───────────────────── */}
                <TabsContent value="hashtags" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                {t('channels.hashtags.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('channels.hashtags.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <Input
                                    placeholder={t('channels.hashtags.namePlaceholder')}
                                    value={newHashName}
                                    onChange={(e) => setNewHashName(e.target.value)}
                                />
                                <Textarea
                                    placeholder={t('channels.hashtags.tagsPlaceholder')}
                                    value={newHashTags}
                                    onChange={(e) => setNewHashTags(e.target.value)}
                                    rows={2}
                                />
                                <Button
                                    size="sm"
                                    onClick={addHashtagGroup}
                                    disabled={!newHashName || addingHash}
                                    className="gap-2"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t('channels.hashtags.addGroup')}
                                </Button>
                            </div>

                            <Separator />

                            {hashtags.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('channels.hashtags.noGroups')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {hashtags.map((group) => (
                                        <div key={group.id} className="flex items-start gap-3 p-3 border rounded-lg group/item hover:border-primary/20 transition-colors">
                                            <div className="p-2 rounded-md bg-muted shrink-0 mt-0.5">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-sm">{group.name}</h4>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {(group.hashtags as string[]).length} {t('channels.hashtags.tags')}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {(group.hashtags as string[]).slice(0, 8).map((tag, i) => (
                                                        <span key={i} className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                            {tag.startsWith('#') ? tag : `#${tag}`}
                                                        </span>
                                                    ))}
                                                    {(group.hashtags as string[]).length > 8 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{(group.hashtags as string[]).length - 8} {t('channels.hashtags.more')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 text-destructive"
                                                onClick={() => deleteHashtagGroup(group.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Webhooks Tab ───────────────────── */}
                <TabsContent value="webhooks" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                {t('channels.webhooks.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('channels.webhooks.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Discord */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-[#5865F2] inline-block" />
                                    Discord {t('channels.webhooks.webhookUrl')}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://discord.com/api/webhooks/..."
                                        value={webhookDiscordUrl}
                                        onChange={(e) => setWebhookDiscordUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleWebhookTest('discord')}
                                        disabled={!webhookDiscordUrl || testingWebhook === 'discord'}
                                        className="gap-1.5 shrink-0"
                                    >
                                        {testingWebhook === 'discord' ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('channels.webhooks.testing')}</>
                                        ) : (
                                            <><Send className="h-3.5 w-3.5" /> {t('channels.webhooks.test')}</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Telegram */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-[#0088cc] inline-block" />
                                    Telegram
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t('channels.webhooks.botToken')}</Label>
                                        <Input
                                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
                                            value={webhookTelegramToken}
                                            onChange={(e) => setWebhookTelegramToken(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t('channels.webhooks.chatId')}</Label>
                                        <Input
                                            placeholder="-1001234567890"
                                            value={webhookTelegramChatId}
                                            onChange={(e) => setWebhookTelegramChatId(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleWebhookTest('telegram')}
                                    disabled={!webhookTelegramToken || !webhookTelegramChatId || testingWebhook === 'telegram'}
                                    className="gap-1.5"
                                >
                                    {testingWebhook === 'telegram' ? (
                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('channels.webhooks.testing')}</>
                                    ) : (
                                        <><Send className="h-3.5 w-3.5" /> {t('channels.webhooks.test')}</>
                                    )}
                                </Button>
                            </div>

                            <Separator />

                            {/* Slack */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full bg-[#4A154B] inline-block" />
                                    Slack {t('channels.webhooks.webhookUrl')}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://hooks.slack.com/services/..."
                                        value={webhookSlackUrl}
                                        onChange={(e) => setWebhookSlackUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleWebhookTest('slack')}
                                        disabled={!webhookSlackUrl || testingWebhook === 'slack'}
                                        className="gap-1.5 shrink-0"
                                    >
                                        {testingWebhook === 'slack' ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('channels.webhooks.testing')}</>
                                        ) : (
                                            <><Send className="h-3.5 w-3.5" /> {t('channels.webhooks.test')}</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Custom */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-400" />
                                    {t('channels.webhooks.customWebhook')}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://your-server.com/webhook"
                                        value={webhookCustomUrl}
                                        onChange={(e) => setWebhookCustomUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleWebhookTest('custom')}
                                        disabled={!webhookCustomUrl || testingWebhook === 'custom'}
                                        className="gap-1.5 shrink-0"
                                    >
                                        {testingWebhook === 'custom' ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('channels.webhooks.testing')}</>
                                        ) : (
                                            <><Send className="h-3.5 w-3.5" /> {t('channels.webhooks.test')}</>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('channels.webhooks.customWebhookDesc')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
