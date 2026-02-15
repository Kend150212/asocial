'use client'

import { useEffect, useState, useCallback } from 'react'
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
}

const categoryLabels: Record<string, string> = {
    SOCIAL: 'Social Media',
    AI: 'AI Providers',
    STORAGE: 'Cloud Storage',
    EMAIL: 'Email Service',
    WEBHOOK: 'Webhooks',
}

const providerColors: Record<string, string> = {
    vbout: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    openai: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    gemini: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    runware: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    gdrive: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    smtp: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
}

interface SetupGuide {
    title: string
    steps: string[]
    url: string
    urlLabel: string
}

const providerGuides: Record<string, SetupGuide> = {
    vbout: {
        title: 'VBOUT API Key',
        steps: [
            'Login vào tài khoản VBOUT',
            'Vào Settings → API Integrations',
            'Copy API Key',
        ],
        url: 'https://app.vbout.com/Settings#tab-api',
        urlLabel: 'Mở VBOUT Settings',
    },
    openai: {
        title: 'OpenAI API Key',
        steps: [
            'Đăng nhập tại platform.openai.com',
            'Vào API Keys → Create new secret key',
            'Đặt tên key và copy',
            'Lưu ý: Cần có billing plan để sử dụng',
        ],
        url: 'https://platform.openai.com/api-keys',
        urlLabel: 'Mở OpenAI Dashboard',
    },
    gemini: {
        title: 'Google Gemini API Key',
        steps: [
            'Truy cập Google AI Studio',
            'Click "Get API Key" ở góc trên',
            'Tạo API key mới hoặc chọn project có sẵn',
            'Copy API key — miễn phí với giới hạn RPM',
        ],
        url: 'https://aistudio.google.com/apikey',
        urlLabel: 'Mở Google AI Studio',
    },
    runware: {
        title: 'Runware API Key',
        steps: [
            'Đăng ký tại runware.ai',
            'Vào Dashboard → API Keys',
            'Tạo key mới và copy',
            'Hỗ trợ: FLUX, SDXL, DALL-E, Kling Video...',
        ],
        url: 'https://my.runware.ai/keys',
        urlLabel: 'Mở Runware Dashboard',
    },
    gdrive: {
        title: 'Google Drive API',
        steps: [
            'Truy cập Google Cloud Console',
            'Tạo Project mới hoặc chọn project',
            'Bật Google Drive API tại Library',
            'Tạo Credentials → Service Account',
            'Download JSON key file',
            'Share folder Google Drive với email service account',
        ],
        url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        urlLabel: 'Mở Google Cloud Console',
    },
    smtp: {
        title: 'Gmail SMTP Setup',
        steps: [
            'Bật 2-Factor Authentication cho Google Account',
            'Vào Google Account → Security → App passwords',
            'Tạo App Password mới (chọn "Mail")',
            'Copy 16-ký tự app password (không có khoảng trắng)',
            'Dùng email Gmail làm Username, App Password làm Password',
        ],
        url: 'https://myaccount.google.com/apppasswords',
        urlLabel: 'Tạo App Password',
    },
}

export default function IntegrationsPage() {
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
    const [showGuide, setShowGuide] = useState<Record<string, boolean>>({})

    const fetchIntegrations = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/integrations')
            const data = await res.json()
            setIntegrations(data)

            // Initialize selected models and SMTP config from config
            const modelSelections: Record<string, Record<string, string>> = {}
            const smtpConfigMap: Record<string, SmtpConfig> = {}
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
            }
            setSelectedModels(modelSelections)
            setSmtpConfigs(smtpConfigMap)
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
                body: JSON.stringify({ id: integration.id }),
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
                    <h1 className="text-3xl font-bold tracking-tight">API Hub</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage API integrations, keys, and default AI models
                    </p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Plug className="h-3 w-3" />
                    {integrations.filter((i) => i.hasApiKey).length}/{integrations.length} configured
                </Badge>
            </div>

            {/* Integration Categories */}
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                        {categoryIcons[category]}
                        <h2 className="text-xl font-semibold">
                            {categoryLabels[category] || category}
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
                                showSetupGuide={showGuide[integration.id] || false}
                                onApiKeyChange={(val: string) => setApiKeys((k) => ({ ...k, [integration.id]: val }))}
                                onToggleShow={() => setShowKeys((s) => ({ ...s, [integration.id]: !s[integration.id] }))}
                                onSave={() => handleSave(integration)}
                                onTest={() => handleTest(integration)}
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
    showSetupGuide,
    onApiKeyChange,
    onToggleShow,
    onSave,
    onTest,
    onFetchModels,
    onModelSelect,
    onSmtpChange,
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
    showSetupGuide: boolean
    onApiKeyChange: (val: string) => void
    onToggleShow: () => void
    onSave: () => void
    onTest: () => void
    onFetchModels: () => void
    onModelSelect: (type: string, modelId: string) => void
    onSmtpChange: (field: string, value: string) => void
    onToggleGuide: () => void
}) {
    const isAI = integration.category === 'AI'
    const isSMTP = integration.provider === 'smtp'
    const textModels = providerModels.filter((m) => m.type === 'text')
    const imageModels = providerModels.filter((m) => m.type === 'image')
    const videoModels = providerModels.filter((m) => m.type === 'video')
    const hasModels = providerModels.length > 0
    const guide = providerGuides[integration.provider]

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
                {guide && (
                    <div>
                        <button
                            type="button"
                            onClick={onToggleGuide}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Info className="h-3.5 w-3.5" />
                            <span>{showSetupGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn lấy API Key'}</span>
                        </button>

                        {showSetupGuide && (
                            <div className="mt-2 rounded-lg border border-dashed p-3 space-y-2 bg-muted/30">
                                <p className="text-xs font-medium">{guide.title}</p>
                                <ol className="text-[11px] text-muted-foreground space-y-1 pl-4 list-decimal">
                                    {guide.steps.map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                                <a
                                    href={guide.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {guide.urlLabel}
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
                                <Label className="text-[11px]">SMTP Host</Label>
                                <Input
                                    value={smtpConfig.host}
                                    onChange={(e) => onSmtpChange('host', e.target.value)}
                                    placeholder="smtp.gmail.com"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px]">Port</Label>
                                <Input
                                    value={smtpConfig.port}
                                    onChange={(e) => onSmtpChange('port', e.target.value)}
                                    placeholder="465"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">Security</Label>
                            <Select
                                value={smtpConfig.secure}
                                onValueChange={(v) => onSmtpChange('secure', v)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                                    <SelectItem value="tls">TLS/STARTTLS (Port 587)</SelectItem>
                                    <SelectItem value="none">None (Port 25)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">Username (Email)</Label>
                            <Input
                                value={smtpConfig.username}
                                onChange={(e) => onSmtpChange('username', e.target.value)}
                                placeholder="your@gmail.com"
                                className="h-8 text-xs"
                                type="email"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px]">Password / App Password</Label>
                            <div className="relative">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={smtpConfig.password}
                                    onChange={(e) => onSmtpChange('password', e.target.value)}
                                    placeholder={integration.hasApiKey ? '••••••••••••••••' : 'App Password 16 ký tự'}
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
                            <Label className="text-[11px]">From Email</Label>
                            <Input
                                value={smtpConfig.from}
                                onChange={(e) => onSmtpChange('from', e.target.value)}
                                placeholder="noreply@asocial.app"
                                className="h-8 text-xs"
                                type="email"
                            />
                        </div>
                    </div>
                ) : (
                    /* Standard API Key Input */
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">API Key</Label>
                        <div className="flex gap-1.5">
                            <div className="relative flex-1">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey || ''}
                                    onChange={(e) => onApiKeyChange(e.target.value)}
                                    placeholder={integration.apiKeyMasked || 'Enter API key...'}
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
                            <Label className="text-xs font-medium">Default Models</Label>
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
                                {hasModels ? 'Refresh' : 'Fetch Models'}
                            </Button>
                        </div>

                        {hasModels && (
                            <ScrollArea className="max-h-48">
                                <div className="space-y-2">
                                    {textModels.length > 0 && (
                                        <ModelSelect
                                            label="Text / Chat"
                                            models={textModels}
                                            value={selectedModel?.text || ''}
                                            onChange={(v) => onModelSelect('text', v)}
                                        />
                                    )}
                                    {imageModels.length > 0 && (
                                        <ModelSelect
                                            label="Image"
                                            models={imageModels}
                                            value={selectedModel?.image || ''}
                                            onChange={(v) => onModelSelect('image', v)}
                                        />
                                    )}
                                    {videoModels.length > 0 && (
                                        <ModelSelect
                                            label="Video"
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
                                Click &quot;Fetch Models&quot; to load available models
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

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={onTest}
                        disabled={isTesting || !integration.hasApiKey}
                    >
                        {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        Test
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status, hasKey }: { status: string; hasKey: boolean }) {
    if (!hasKey) {
        return (
            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                Not configured
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
    return (
        <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-16 shrink-0">{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                    {models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                            <span>{m.name}</span>
                            {m.description && (
                                <span className="ml-2 text-muted-foreground">— {m.description}</span>
                            )}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
