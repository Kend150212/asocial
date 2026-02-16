'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Plug,
    Loader2,
    Check,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    Zap,
    BrainCircuit,
    HardDrive,
    Mail,
    Webhook,
    Save,
    ExternalLink,
    Info,
    FolderPlus,
    Link,
    Palette,
} from 'lucide-react'
import { toast } from 'sonner'

interface ModelInfo {
    id: string
    name: string
    type: 'text' | 'image' | 'video' | 'audio' | 'embedding' | 'other'
    description?: string
}

interface Integration {
    id: string
    category: string
    provider: string
    name: string
    baseUrl: string | null
    config: Record<string, unknown> | null
    isActive: boolean
    isDefault: boolean
    status: string
    lastTestedAt: string | null
    usageCount: number
    rateLimitPerSec: number | null
    hasApiKey: boolean
    apiKeyMasked: string | null
}

const categoryIcons: Record<string, React.ReactNode> = {
    SOCIAL: <Zap className="h-5 w-5" />,
    AI: <BrainCircuit className="h-5 w-5" />,
    STORAGE: <HardDrive className="h-5 w-5" />,
    EMAIL: <Mail className="h-5 w-5" />,
    WEBHOOK: <Webhook className="h-5 w-5" />,
    DESIGN: <Palette className="h-5 w-5" />,
}

// categoryLabels now driven by t() inside the component

const providerColors: Record<string, string> = {
    vbout: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    youtube: 'bg-red-500/10 text-red-500 border-red-500/20',
    tiktok: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    facebook: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    linkedin: 'bg-sky-600/10 text-sky-600 border-sky-600/20',
    x: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    pinterest: 'bg-red-600/10 text-red-600 border-red-600/20',
    openai: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    gemini: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    runware: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    openrouter: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    synthetic: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    robolly: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    gdrive: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    smtp: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
}

const providerGuideUrls: Record<string, string> = {
    vbout: 'https://app.vbout.com/Settings#tab-api',
    youtube: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    tiktok: 'https://developers.tiktok.com/',
    facebook: 'https://developers.facebook.com/apps/',
    instagram: 'https://developers.facebook.com/apps/',
    linkedin: 'https://www.linkedin.com/developers/apps',
    x: 'https://developer.twitter.com/en/portal/dashboard',
    pinterest: 'https://developers.pinterest.com/apps/',
    openai: 'https://platform.openai.com/api-keys',
    gemini: 'https://aistudio.google.com/apikey',
    runware: 'https://my.runware.ai/keys',
    openrouter: 'https://openrouter.ai/settings/keys',
    synthetic: 'https://synthetic.new/api-keys',
    robolly: 'https://robolly.com/dashboard/',
    gdrive: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
    smtp: 'https://myaccount.google.com/apppasswords',
}

export default function IntegrationsPage() {
    const t = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [loading, setLoading] = useState(true)
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [testing, setTesting] = useState<Record<string, boolean>>({})
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
    const [models, setModels] = useState<Record<string, ModelInfo[]>>({})
    const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({})
    const [selectedModels, setSelectedModels] = useState<Record<string, Record<string, string>>>({})
    const [smtpConfigs, setSmtpConfigs] = useState<Record<string, SmtpConfig>>({})
    const [gdriveConfigs, setGdriveConfigs] = useState<Record<string, GDriveConfig>>({})
    const [oauthConfigs, setOauthConfigs] = useState<Record<string, OAuthConfig>>({})
    const [testEmails, setTestEmails] = useState<Record<string, string>>({})
    const [showGuide, setShowGuide] = useState<Record<string, boolean>>({})
    const [folderName, setFolderName] = useState('')
    const [creatingFolder, setCreatingFolder] = useState(false)

    // Handle Google Drive OAuth callback
    useEffect(() => {
        const gdriveStatus = searchParams.get('gdrive')
        if (gdriveStatus === 'connected') {
            toast.success('Google Drive connected successfully!')
            router.replace('/admin/integrations')
            fetchIntegrations()
        } else if (gdriveStatus === 'error') {
            const message = searchParams.get('message') || 'Connection failed'
            toast.error(`Google Drive: ${message}`)
            router.replace('/admin/integrations')
        }
    }, [searchParams, router])

    const fetchIntegrations = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/integrations')
            const data = await res.json()
            setIntegrations(data)

            // Initialize selected models, SMTP config, and GDrive config from config
            const modelSelections: Record<string, Record<string, string>> = {}
            const smtpConfigMap: Record<string, SmtpConfig> = {}
            const gdriveConfigMap: Record<string, GDriveConfig> = {}
            const oauthConfigMap: Record<string, OAuthConfig> = {}
            for (const i of data) {
                const config = (i.config || {}) as Record<string, string>
                modelSelections[i.id] = {
                    text: config.defaultTextModel || '',
                    image: config.defaultImageModel || '',
                    video: config.defaultVideoModel || '',
                }
                if (i.provider === 'smtp') {
                    smtpConfigMap[i.id] = {
                        host: config.smtpHost || 'smtp.gmail.com',
                        port: config.smtpPort || '465',
                        secure: config.smtpSecure || 'ssl',
                        username: config.smtpUsername || '',
                        password: '',
                        from: config.smtpFrom || '',
                    }
                }
                if (i.provider === 'gdrive') {
                    gdriveConfigMap[i.id] = {
                        clientId: config.gdriveClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'youtube') {
                    oauthConfigMap[i.id] = {
                        clientId: config.youtubeClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'tiktok') {
                    oauthConfigMap[i.id] = {
                        clientId: config.tiktokClientKey || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'facebook') {
                    oauthConfigMap[i.id] = {
                        clientId: config.facebookClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'instagram') {
                    oauthConfigMap[i.id] = {
                        clientId: config.instagramClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'linkedin') {
                    oauthConfigMap[i.id] = {
                        clientId: config.linkedinClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'x') {
                    oauthConfigMap[i.id] = {
                        clientId: config.xClientId || '',
                        clientSecret: '',
                    }
                }
                if (i.provider === 'pinterest') {
                    oauthConfigMap[i.id] = {
                        clientId: config.pinterestClientId || '',
                        clientSecret: '',
                    }
                }
            }
            setSelectedModels(modelSelections)
            setSmtpConfigs(smtpConfigMap)
            setGdriveConfigs(gdriveConfigMap)
            setOauthConfigs(oauthConfigMap)
        } catch {
            toast.error('Failed to load integrations')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchIntegrations()
    }, [fetchIntegrations])

    const handleSave = async (integration: Integration) => {
        setSaving((s) => ({ ...s, [integration.id]: true }))
        try {
            const body: Record<string, unknown> = { id: integration.id }

            if (apiKeys[integration.id] !== undefined && apiKeys[integration.id] !== '') {
                body.apiKey = apiKeys[integration.id]
            }

            // SMTP config
            if (integration.provider === 'smtp') {
                const smtp = smtpConfigs[integration.id]
                if (smtp) {
                    body.config = {
                        smtpHost: smtp.host,
                        smtpPort: smtp.port,
                        smtpSecure: smtp.secure,
                        smtpUsername: smtp.username,
                        smtpFrom: smtp.from || smtp.username,
                    }
                    // Use SMTP password as the "API key" for encrypted storage
                    if (smtp.password) {
                        body.apiKey = smtp.password
                    }
                }
            }

            // Google Drive OAuth2 config
            if (integration.provider === 'gdrive') {
                const gdrive = gdriveConfigs[integration.id]
                if (gdrive) {
                    body.config = {
                        gdriveClientId: gdrive.clientId,
                    }
                    // Store Client Secret encrypted as the "API key"
                    if (gdrive.clientSecret) {
                        body.apiKey = gdrive.clientSecret
                    }
                }
            }

            // YouTube OAuth config
            if (integration.provider === 'youtube') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = {
                        youtubeClientId: oauth.clientId,
                    }
                    if (oauth.clientSecret) {
                        body.apiKey = oauth.clientSecret
                    }
                }
            }

            // TikTok OAuth config
            if (integration.provider === 'tiktok') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { tiktokClientKey: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // Facebook OAuth config
            if (integration.provider === 'facebook') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { facebookClientId: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // Instagram OAuth config
            if (integration.provider === 'instagram') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { instagramClientId: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // LinkedIn OAuth config
            if (integration.provider === 'linkedin') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { linkedinClientId: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // X (Twitter) OAuth config
            if (integration.provider === 'x') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { xClientId: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // Pinterest OAuth config
            if (integration.provider === 'pinterest') {
                const oauth = oauthConfigs[integration.id]
                if (oauth) {
                    body.config = { pinterestClientId: oauth.clientId }
                    if (oauth.clientSecret) body.apiKey = oauth.clientSecret
                }
            }

            // AI model selections
            const ms = selectedModels[integration.id]
            if (ms?.text) body.defaultTextModel = ms.text
            if (ms?.image) body.defaultImageModel = ms.image
            if (ms?.video) body.defaultVideoModel = ms.video

            const res = await fetch('/api/admin/integrations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                toast.success(`${integration.name} updated`)
                setApiKeys((k) => ({ ...k, [integration.id]: '' }))
                fetchIntegrations()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to save')
            }
        } catch {
            toast.error('Failed to save')
        } finally {
            setSaving((s) => ({ ...s, [integration.id]: false }))
        }
    }

    const handleTest = async (integration: Integration) => {
        setTesting((t) => ({ ...t, [integration.id]: true }))
        setTestResults((r) => {
            const copy = { ...r }
            delete copy[integration.id]
            return copy
        })
        try {
            const res = await fetch('/api/admin/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: integration.id,
                    ...(integration.provider === 'smtp' && { testEmail: testEmails[integration.id] || '' }),
                }),
            })
            const result = await res.json()
            setTestResults((r) => ({ ...r, [integration.id]: result }))

            if (result.success) {
                toast.success(result.message)
                fetchIntegrations()
            } else {
                toast.error(result.message || 'Test failed')
            }
        } catch {
            toast.error('Connection test failed')
        } finally {
            setTesting((t) => ({ ...t, [integration.id]: false }))
        }
    }

    const handleFetchModels = async (integration: Integration) => {
        setLoadingModels((l) => ({ ...l, [integration.id]: true }))
        try {
            const res = await fetch('/api/admin/integrations/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: integration.id }),
            })
            const data = await res.json()
            if (data.models) {
                setModels((m) => ({ ...m, [integration.id]: data.models }))
                toast.success(`Loaded ${data.models.length} models`)
            } else {
                toast.error(data.error || 'Failed to load models')
            }
        } catch {
            toast.error('Failed to fetch models')
        } finally {
            setLoadingModels((l) => ({ ...l, [integration.id]: false }))
        }
    }

    // ---------- Handle creating a Google Drive folder ----------
    const handleCreateFolder = async () => {
        setCreatingFolder(true)
        try {
            const res = await fetch('/api/admin/gdrive/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: folderName }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Folder "${data.folder.name}" created!`)
                setFolderName('')
                fetchIntegrations()
            } else {
                toast.error(data.error || 'Failed to create folder')
            }
        } catch {
            toast.error('Failed to create folder')
        } finally {
            setCreatingFolder(false)
        }
    }

    const grouped = integrations.reduce<Record<string, Integration[]>>((acc, i) => {
        acc[i.category] = acc[i.category] || []
        acc[i.category].push(i)
        return acc
    }, {})

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('integrations.title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('integrations.description')}
                    </p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Plug className="h-3 w-3" />
                    {integrations.filter((i) => i.hasApiKey).length}/{integrations.length} {t('common.configured')}
                </Badge>
            </div>

            {/* Integration Categories */}
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                        {categoryIcons[category]}
                        <h2 className="text-xl font-semibold">
                            {t(`integrations.categories.${category}`) || category}
                        </h2>
                        <Badge variant="secondary" className="ml-2">
                            {items.filter((i) => i.hasApiKey).length}/{items.length}
                        </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((integration) => (
                            <IntegrationCard
                                key={integration.id}
                                integration={integration}
                                apiKey={apiKeys[integration.id] || ''}
                                showKey={showKeys[integration.id] || false}
                                isSaving={saving[integration.id] || false}
                                isTesting={testing[integration.id] || false}
                                testResult={testResults[integration.id]}
                                providerModels={models[integration.id] || []}
                                isLoadingModels={loadingModels[integration.id] || false}
                                selectedModel={selectedModels[integration.id] || {}}
                                smtpConfig={smtpConfigs[integration.id]}
                                gdriveConfig={gdriveConfigs[integration.id]}
                                showSetupGuide={showGuide[integration.id] || false}
                                onApiKeyChange={(val: string) => setApiKeys((k) => ({ ...k, [integration.id]: val }))}
                                onToggleShow={() => setShowKeys((s) => ({ ...s, [integration.id]: !s[integration.id] }))}
                                onSave={() => handleSave(integration)}
                                onTest={() => handleTest(integration)}
                                testEmail={testEmails[integration.id] || ''}
                                onTestEmailChange={(val: string) => setTestEmails((e) => ({ ...e, [integration.id]: val }))}
                                onFetchModels={() => handleFetchModels(integration)}
                                onModelSelect={(type: string, modelId: string) =>
                                    setSelectedModels((s) => ({
                                        ...s,
                                        [integration.id]: { ...s[integration.id], [type]: modelId },
                                    }))
                                }
                                onSmtpChange={(field: string, value: string) =>
                                    setSmtpConfigs((s) => ({
                                        ...s,
                                        [integration.id]: { ...s[integration.id], [field]: value },
                                    }))
                                }
                                onGdriveChange={(field: string, value: string) =>
                                    setGdriveConfigs((s) => ({
                                        ...s,
                                        [integration.id]: { ...s[integration.id], [field]: value },
                                    }))
                                }
                                oauthConfig={oauthConfigs[integration.id]}
                                onOauthChange={(field: string, value: string) =>
                                    setOauthConfigs((s) => ({
                                        ...s,
                                        [integration.id]: { ...s[integration.id], [field]: value },
                                    }))
                                }
                                folderName={folderName}
                                onFolderNameChange={(val: string) => setFolderName(val)}
                                onCreateFolder={handleCreateFolder}
                                isCreatingFolder={creatingFolder}
                                onToggleGuide={() => setShowGuide((s) => ({ ...s, [integration.id]: !s[integration.id] }))}
                            />
                        ))}
                    </div>

                    <Separator className="mt-6" />
                </div>
            ))}
        </div>
    )
}

interface SmtpConfig {
    host: string
    port: string
    secure: string
    username: string
    password: string
    from: string
}

interface GDriveConfig {
    clientId: string
    clientSecret: string
}

interface OAuthConfig {
    clientId: string
    clientSecret: string
}

function IntegrationCard({
    integration,
    apiKey,
    showKey,
    isSaving,
    isTesting,
    testResult,
    providerModels,
    isLoadingModels,
    selectedModel,
    smtpConfig,
    gdriveConfig,
    showSetupGuide,
    onApiKeyChange,
    onToggleShow,
    onSave,
    onTest,
    testEmail,
    onTestEmailChange,
    onFetchModels,
    onModelSelect,
    onSmtpChange,
    onGdriveChange,
    oauthConfig,
    onOauthChange,
    folderName,
    onFolderNameChange,
    onCreateFolder,
    isCreatingFolder,
    onToggleGuide,
}: {
    integration: Integration
    apiKey: string
    showKey: boolean
    isSaving: boolean
    isTesting: boolean
    testResult?: { success: boolean; message: string }
    providerModels: ModelInfo[]
    isLoadingModels: boolean
    selectedModel: Record<string, string>
    smtpConfig?: SmtpConfig
    gdriveConfig?: GDriveConfig
    showSetupGuide: boolean
    onApiKeyChange: (val: string) => void
    onToggleShow: () => void
    onSave: () => void
    onTest: () => void
    testEmail: string
    onTestEmailChange: (value: string) => void
    onFetchModels: () => void
    onModelSelect: (type: string, modelId: string) => void
    onSmtpChange: (field: string, value: string) => void
    onGdriveChange: (field: string, value: string) => void
    oauthConfig?: OAuthConfig
    onOauthChange: (field: string, value: string) => void
    folderName: string
    onFolderNameChange: (value: string) => void
    onCreateFolder: () => void
    isCreatingFolder: boolean
    onToggleGuide: () => void
}) {
    const t = useTranslation()
    const isAI = integration.category === 'AI'
    const isSMTP = integration.provider === 'smtp'
    const isGDrive = integration.provider === 'gdrive'
    const isOAuth = ['youtube', 'tiktok', 'facebook', 'instagram', 'linkedin', 'x', 'pinterest'].includes(integration.provider)
    const textModels = providerModels.filter((m) => m.type === 'text')
    const imageModels = providerModels.filter((m) => m.type === 'image')
    const videoModels = providerModels.filter((m) => m.type === 'video')
    const hasModels = providerModels.length > 0
    const guideUrl = providerGuideUrls[integration.provider]
    const guideKey = `guides.${integration.provider}`

    return (
        <Card className={`relative transition-all hover:shadow-md ${providerColors[integration.provider] || ''} border`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        {integration.isDefault && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                                Default
                            </Badge>
                        )}
                    </div>
                    <StatusBadge
                        status={integration.status}
                        hasKey={integration.hasApiKey}
                    />
                </div>
                <CardDescription className="text-xs">
                    {integration.baseUrl || `${integration.provider} integration`}
                    {integration.lastTestedAt && (
                        <span className="ml-1">
                            • Tested {new Date(integration.lastTestedAt).toLocaleDateString()}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Setup Guide Toggle */}
                {guideUrl && (
                    <div>
                        <button
                            type="button"
                            onClick={onToggleGuide}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Info className="h-3.5 w-3.5" />
                            <span>{showSetupGuide ? t('integrations.hideGuide') : t('integrations.setupGuide')}</span>
                        </button>

                        {showSetupGuide && (
                            <div className="mt-2 rounded-lg border border-dashed p-3 space-y-2 bg-muted/30">
                                <p className="text-xs font-medium">{t(`${guideKey}.title`)}</p>
                                <ol className="text-[11px] text-muted-foreground space-y-1 pl-4 list-decimal">
                                    {(function () {
                                        const steps: string[] = []
                                        for (let i = 0; i < 10; i++) {
                                            const step = t(`${guideKey}.steps.${i}`)
                                            if (step === `${guideKey}.steps.${i}`) break
                                            steps.push(step)
                                        }
                                        return steps.map((step, i) => <li key={i}>{step}</li>)
                                    })()}
                                </ol>
                                <a
                                    href={guideUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {t(`${guideKey}.urlLabel`)}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* SMTP Config */}
                {isSMTP && smtpConfig ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[11px]">{t('integrations.smtpHost')}</Label>
                                <Input
                                    value={smtpConfig.host}
                                    onChange={(e) => onSmtpChange('host', e.target.value)}
                                    placeholder="smtp.gmail.com"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px]">{t('integrations.smtpPort')}</Label>
                                <Input
                                    value={smtpConfig.port}
                                    onChange={(e) => onSmtpChange('port', e.target.value)}
                                    placeholder="465"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.smtpSecurity')}</Label>
                            <Select
                                value={smtpConfig.secure}
                                onValueChange={(v) => onSmtpChange('secure', v)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ssl">{t('integrations.sslPort465')}</SelectItem>
                                    <SelectItem value="tls">{t('integrations.tlsPort587')}</SelectItem>
                                    <SelectItem value="none">{t('integrations.nonePort25')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.smtpUsername')}</Label>
                            <Input
                                value={smtpConfig.username}
                                onChange={(e) => onSmtpChange('username', e.target.value)}
                                placeholder="your@gmail.com"
                                className="h-8 text-xs"
                                type="email"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.smtpPassword')}</Label>
                            <div className="relative">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={smtpConfig.password}
                                    onChange={(e) => onSmtpChange('password', e.target.value)}
                                    placeholder={integration.hasApiKey ? '••••••••••••••••' : t('integrations.smtpAppPasswordPlaceholder')}
                                    className="pr-8 h-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={onToggleShow}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.smtpFrom')}</Label>
                            <Input
                                value={smtpConfig.from}
                                onChange={(e) => onSmtpChange('from', e.target.value)}
                                placeholder="noreply@asocial.app"
                                className="h-8 text-xs"
                                type="email"
                            />
                        </div>
                    </div>
                ) : isGDrive && gdriveConfig ? (
                    /* Google Drive OAuth2 Config */
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.gdriveClientId')}</Label>
                            <Input
                                value={gdriveConfig.clientId}
                                onChange={(e) => onGdriveChange('clientId', e.target.value)}
                                placeholder="xxxxx.apps.googleusercontent.com"
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">{t('integrations.gdriveClientSecret')}</Label>
                            <div className="relative">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={gdriveConfig.clientSecret || (showKey ? '' : (integration.apiKeyMasked || ''))}
                                    onChange={(e) => onGdriveChange('clientSecret', e.target.value)}
                                    placeholder={integration.hasApiKey ? '' : t('integrations.gdriveClientSecretPlaceholder')}
                                    className="pr-8 h-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={onToggleShow}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Connection Status & Folder Management */}
                        {(() => {
                            const config = integration.config as Record<string, string> | null
                            const isConnected = !!config?.gdriveEmail
                            const hasFolder = !!config?.parentFolderId

                            return (
                                <div className="space-y-3 pt-2 border-t border-dashed">
                                    {/* Connect Button or Connected Status */}
                                    {isConnected ? (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-emerald-600 font-medium">
                                                {t('integrations.gdriveConnected')}
                                            </span>
                                            <span className="text-muted-foreground truncate">
                                                ({config?.gdriveEmail})
                                            </span>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full h-8 text-xs gap-1"
                                            onClick={() => {
                                                window.location.href = '/api/admin/gdrive/auth'
                                            }}
                                            disabled={!gdriveConfig?.clientId || !gdriveConfig?.clientSecret}
                                        >
                                            <Link className="h-3 w-3" />
                                            {t('integrations.gdriveConnect')}
                                        </Button>
                                    )}

                                    {/* Parent Folder Section */}
                                    {isConnected && (
                                        <div className="space-y-2">
                                            {hasFolder ? (
                                                <div className="rounded-md bg-emerald-500/10 p-2 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <FolderPlus className="h-3.5 w-3.5 text-emerald-500" />
                                                        <span className="font-medium text-emerald-600">
                                                            {config?.parentFolderName || 'Parent Folder'}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={`https://drive.google.com/drive/folders/${config?.parentFolderId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        {t('integrations.gdriveOpenFolder')}
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px]">
                                                        {t('integrations.gdriveFolderName')}
                                                    </Label>
                                                    <div className="flex gap-1.5">
                                                        <Input
                                                            value={folderName}
                                                            onChange={(e) => onFolderNameChange(e.target.value)}
                                                            placeholder={t('integrations.gdriveFolderPlaceholder')}
                                                            className="h-8 text-xs flex-1"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-8 text-xs gap-1 whitespace-nowrap"
                                                            onClick={onCreateFolder}
                                                            disabled={isCreatingFolder || !folderName}
                                                        >
                                                            {isCreatingFolder ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <FolderPlus className="h-3 w-3" />
                                                            )}
                                                            {t('integrations.gdriveCreateFolder')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                ) : isOAuth && oauthConfig ? (
                    /* YouTube / TikTok OAuth2 Config */
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[11px]">
                                {{
                                    youtube: 'Google Client ID', tiktok: 'TikTok Client Key',
                                    facebook: 'Facebook App ID', instagram: 'Instagram App ID',
                                    linkedin: 'LinkedIn Client ID', x: 'X Client ID',
                                    pinterest: 'Pinterest App ID',
                                }[integration.provider] || 'Client ID'}
                            </Label>
                            <Input
                                value={oauthConfig.clientId}
                                onChange={(e) => onOauthChange('clientId', e.target.value)}
                                placeholder={'Enter Client ID / App ID'}
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">
                                {{
                                    youtube: 'Google Client Secret', tiktok: 'TikTok Client Secret',
                                    facebook: 'Facebook App Secret', instagram: 'Instagram App Secret',
                                    linkedin: 'LinkedIn Client Secret', x: 'X Client Secret',
                                    pinterest: 'Pinterest App Secret',
                                }[integration.provider] || 'Client Secret'}
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={oauthConfig.clientSecret || (showKey ? '' : (integration.apiKeyMasked || ''))}
                                    onChange={(e) => onOauthChange('clientSecret', e.target.value)}
                                    placeholder={integration.hasApiKey ? '' : 'Enter client secret...'}
                                    className="pr-8 h-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={onToggleShow}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-dashed">
                            <p className="text-[11px] text-muted-foreground">
                                {integration.provider === 'youtube'
                                    ? 'Create credentials at Google Cloud Console → APIs & Services → Credentials. Enable "YouTube Data API v3".'
                                    : 'Create an app at TikTok Developer Portal. Enable "Login Kit" and "Content Posting API".'}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Standard API Key Input */
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">{t('integrations.apiKey')}</Label>
                        <div className="flex gap-1.5">
                            <div className="relative flex-1">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey || ''}
                                    onChange={(e) => onApiKeyChange(e.target.value)}
                                    placeholder={integration.apiKeyMasked || t('integrations.enterApiKey')}
                                    className="pr-8 text-xs h-9"
                                />
                                <button
                                    type="button"
                                    onClick={onToggleShow}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Model Selection */}
                {isAI && integration.hasApiKey && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">{t('integrations.defaultModels')}</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={onFetchModels}
                                disabled={isLoadingModels}
                            >
                                {isLoadingModels ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3 w-3" />
                                )}
                                {hasModels ? t('common.refresh') : t('integrations.fetchModels')}
                            </Button>
                        </div>

                        {hasModels && (
                            <ScrollArea className="max-h-48">
                                <div className="space-y-2">
                                    {textModels.length > 0 && (
                                        <ModelSelect
                                            label={t('integrations.textChat')}
                                            models={textModels}
                                            value={selectedModel?.text || ''}
                                            onChange={(v) => onModelSelect('text', v)}
                                        />
                                    )}
                                    {imageModels.length > 0 && (
                                        <ModelSelect
                                            label={t('integrations.image')}
                                            models={imageModels}
                                            value={selectedModel?.image || ''}
                                            onChange={(v) => onModelSelect('image', v)}
                                        />
                                    )}
                                    {videoModels.length > 0 && (
                                        <ModelSelect
                                            label={t('integrations.video')}
                                            models={videoModels}
                                            value={selectedModel?.video || ''}
                                            onChange={(v) => onModelSelect('video', v)}
                                        />
                                    )}
                                </div>
                            </ScrollArea>
                        )}

                        {!hasModels && !isLoadingModels && (
                            <p className="text-[11px] text-muted-foreground text-center py-1">
                                {t('integrations.clickFetchModels')}
                            </p>
                        )}
                    </div>
                )}

                {/* Test Result */}
                {testResult && (
                    <div
                        className={`rounded-md p-2 text-xs ${testResult.success
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-destructive/10 text-destructive'
                            }`}
                    >
                        {testResult.success ? <Check className="h-3 w-3 inline mr-1" /> : <X className="h-3 w-3 inline mr-1" />}
                        {testResult.message}
                    </div>
                )}

                {/* SMTP Test Email */}
                {isSMTP && (
                    <div className="space-y-1">
                        <Label className="text-[11px]">{t('integrations.testEmailLabel')}</Label>
                        <Input
                            type="email"
                            value={testEmail}
                            onChange={(e) => onTestEmailChange(e.target.value)}
                            placeholder={t('integrations.testEmailPlaceholder')}
                            className="h-8 text-xs"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {t('common.save')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={onTest}
                        disabled={isTesting || (!integration.hasApiKey && !isSMTP)}
                    >
                        {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : isSMTP ? <Mail className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                        {isSMTP ? t('integrations.sendTest') : t('common.test')}
                    </Button>
                </div>
            </CardContent>
        </Card >
    )
}

function StatusBadge({ status, hasKey }: { status: string; hasKey: boolean }) {
    const t = useTranslation()
    if (!hasKey) {
        return (
            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                {t('common.notConfigured')}
            </Badge>
        )
    }

    const variants: Record<string, string> = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        ERROR: 'bg-destructive/10 text-destructive border-destructive/30',
        INACTIVE: 'bg-muted text-muted-foreground border-muted-foreground/30',
    }

    return (
        <Badge variant="outline" className={`text-[10px] ${variants[status] || variants.INACTIVE}`}>
            {status === 'ACTIVE' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />}
            {status}
        </Badge>
    )
}

function ModelSelect({
    label,
    models,
    value,
    onChange,
}: {
    label: string
    models: ModelInfo[]
    value: string
    onChange: (value: string) => void
}) {
    const [search, setSearch] = useState('')
    const showSearch = models.length > 10
    const displayModels = search.trim()
        ? models.filter(
            (m) =>
                m.name.toLowerCase().includes(search.toLowerCase()) ||
                m.id.toLowerCase().includes(search.toLowerCase())
        )
        : models

    return (
        <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-16 shrink-0">{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className={showSearch ? 'max-h-[300px]' : ''}>
                    {showSearch && (
                        <div className="sticky top-0 z-10 bg-popover px-2 pb-1.5 pt-1">
                            <input
                                className="w-full h-7 px-2 text-xs rounded-md border border-border bg-transparent outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                placeholder="Search models..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    {displayModels.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                            <span>{m.name}</span>
                            {m.description && (
                                <span className="ml-2 text-muted-foreground">— {m.description}</span>
                            )}
                        </SelectItem>
                    ))}
                    {displayModels.length === 0 && (
                        <div className="py-2 text-center text-xs text-muted-foreground">
                            No models found
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}

