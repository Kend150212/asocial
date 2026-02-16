'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
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
            const res = await fetch(`/api/admin/channels/${id}/platforms/vbout`)
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
                            {isAdmin && (
                                <div className="flex items-center gap-2">
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
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Platform Form — Admin only */}
                            {isAdmin && addingPlatform && (
                                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
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
                                                                <span
                                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                    style={{ backgroundColor: p.color }}
                                                                />
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
                                    {Object.entries(
                                        platforms.reduce<Record<string, ChannelPlatformEntry[]>>((groups, p) => {
                                            const key = p.platform
                                            if (!groups[key]) groups[key] = []
                                            groups[key].push(p)
                                            return groups
                                        }, {})
                                    ).map(([platformKey, items]) => {
                                        const info = platformOptions.find(o => o.value === platformKey)
                                        return (
                                            <div key={platformKey} className="border rounded-lg overflow-hidden">
                                                {/* Group Header */}
                                                <div
                                                    className="flex items-center gap-2.5 px-4 py-2.5 border-b"
                                                    style={{ backgroundColor: `${info?.color || '#888'}10` }}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: info?.color || '#888' }}
                                                    />
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
                                                                {isAdmin ? (
                                                                    <>
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
                                                                    </>
                                                                ) : (
                                                                    <Badge variant={p.isActive ? 'default' : 'secondary'} className="text-[10px]">
                                                                        {p.isActive ? 'Active' : 'Inactive'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
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
