'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Key,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    Save,
    Trash2,
    BrainCircuit,
    ExternalLink,
    Info,
    X,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

// ─── Provider definitions ──────────────────────────────────
interface ProviderDef {
    provider: string
    name: string
    description: string
    placeholder: string
    guideUrl: string
    guideLabel: string
    guideSteps: { title: string; detail: string }[]
    tips?: string[]
}

const AI_PROVIDERS: ProviderDef[] = [
    {
        provider: 'gemini',
        name: 'Google Gemini',
        description: 'Google AI Studio — Gemini Pro, Flash, Ultra',
        placeholder: 'AIza...',
        guideUrl: 'https://aistudio.google.com/apikey',
        guideLabel: 'Open Google AI Studio',
        guideSteps: [
            { title: 'Visit Google AI Studio', detail: 'Go to aistudio.google.com' },
            { title: 'Get API Key', detail: 'Click "Get API Key" at the top' },
            { title: 'Create or select project', detail: 'Create a new API key or select existing project' },
            { title: 'Copy API key', detail: 'Copy the key — free tier with RPM limits' },
        ],
        tips: ['Free tier supports 15 RPM for Gemini Flash', 'Gemini Pro/Flash available'],
    },
    {
        provider: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o, GPT-4o mini, o1, o3',
        placeholder: 'sk-...',
        guideUrl: 'https://platform.openai.com/api-keys',
        guideLabel: 'Open OpenAI Platform',
        guideSteps: [
            { title: 'Sign in', detail: 'Sign in at platform.openai.com' },
            { title: 'Navigate to API Keys', detail: 'Go to API Keys → Create new secret key' },
            { title: 'Name and copy', detail: 'Name your key and copy it' },
            { title: 'Billing required', detail: 'Note: Billing plan required for API usage' },
        ],
        tips: ['GPT-4o mini is most cost-effective for content generation', 'Set usage limits in your OpenAI dashboard'],
    },
    {
        provider: 'anthropic',
        name: 'Anthropic (Claude)',
        description: 'Claude 3.5 Sonnet, Haiku, Opus',
        placeholder: 'sk-ant-api...',
        guideUrl: 'https://console.anthropic.com/settings/keys',
        guideLabel: 'Open Anthropic Console',
        guideSteps: [
            { title: 'Create account', detail: 'Sign up at console.anthropic.com' },
            { title: 'Go to API Keys', detail: 'Navigate to Settings → API Keys' },
            { title: 'Create a key', detail: 'Click "Create Key" and copy it' },
            { title: 'Add credits', detail: 'Add billing credits to activate' },
        ],
        tips: ['Claude 3.5 Sonnet is excellent for creative writing', 'Haiku is fast and cost-effective'],
    },
    {
        provider: 'openrouter',
        name: 'OpenRouter',
        description: 'Access 100+ models via one API key',
        placeholder: 'sk-or-v1-...',
        guideUrl: 'https://openrouter.ai/keys',
        guideLabel: 'Open OpenRouter',
        guideSteps: [
            { title: 'Create account', detail: 'Sign up at openrouter.ai' },
            { title: 'Get API Key', detail: 'Go to Keys → Create Key' },
            { title: 'Add credits', detail: 'Add credits to your account' },
            { title: 'Choose models', detail: 'Access any model through a single API' },
        ],
        tips: ['One key for all models (GPT, Claude, Llama, Mistral...)', 'Pay-per-use pricing on all models'],
    },
    {
        provider: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference — Llama, Mixtral',
        placeholder: 'gsk_...',
        guideUrl: 'https://console.groq.com/keys',
        guideLabel: 'Open Groq Console',
        guideSteps: [
            { title: 'Create account', detail: 'Sign up at console.groq.com' },
            { title: 'Go to API Keys', detail: 'Navigate to API Keys section' },
            { title: 'Create key', detail: 'Create a new API key and copy it' },
        ],
        tips: ['Fastest inference speeds in the industry', 'Free tier available with rate limits'],
    },
]

const providerColors: Record<string, string> = {
    gemini: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    openai: 'bg-green-500/10 text-green-500 border-green-500/20',
    anthropic: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    openrouter: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    groq: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

// ─── Existing key data from API ────────────────────────────
interface UserApiKeyData {
    id: string
    provider: string
    name: string
    isActive: boolean
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ hasKey }: { hasKey: boolean }) {
    if (hasKey) {
        return (
            <Badge variant="outline" className="text-[10px] px-1.5 gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle className="h-3 w-3" />
                Configured
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="text-[10px] px-1.5 gap-1 bg-muted text-muted-foreground">
            Not configured
        </Badge>
    )
}

// ─── Provider Card ─────────────────────────────────────────
function ProviderCard({
    def,
    existingKey,
    apiKeyValue,
    showKey,
    isSaving,
    isDeleting,
    showGuide,
    onApiKeyChange,
    onToggleShow,
    onSave,
    onDelete,
    onToggleGuide,
}: {
    def: ProviderDef
    existingKey: UserApiKeyData | undefined
    apiKeyValue: string
    showKey: boolean
    isSaving: boolean
    isDeleting: boolean
    showGuide: boolean
    onApiKeyChange: (val: string) => void
    onToggleShow: () => void
    onSave: () => void
    onDelete: () => void
    onToggleGuide: () => void
}) {
    const hasKey = !!existingKey

    return (
        <Card className={`relative transition-all hover:shadow-md ${providerColors[def.provider] || ''} border`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{def.name}</CardTitle>
                    </div>
                    <StatusBadge hasKey={hasKey} />
                </div>
                <CardDescription className="text-xs">
                    {def.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Setup Guide Link */}
                <div>
                    <button
                        type="button"
                        onClick={onToggleGuide}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                        <Info className="h-3.5 w-3.5" />
                        <span>{showGuide ? 'Hide guide' : 'How to get API Key'}</span>
                    </button>

                    <Dialog open={showGuide} onOpenChange={onToggleGuide}>
                        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{def.name} API Key</DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">{def.description}</p>
                            </DialogHeader>

                            <div className="space-y-3 mt-4">
                                {def.guideSteps.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className="text-sm font-medium">{step.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {def.tips && def.tips.length > 0 && (
                                <div className="mt-5 rounded-lg border border-dashed p-3 bg-muted/30">
                                    <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                                        💡 Pro Tips
                                    </p>
                                    <ul className="space-y-1.5">
                                        {def.tips.map((tip, i) => (
                                            <li key={i} className="text-[11px] text-muted-foreground flex gap-2">
                                                <span className="text-yellow-500 mt-0.5">•</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-4 flex justify-between items-center">
                                <a
                                    href={def.guideUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {def.guideLabel}
                                </a>
                                <Button variant="outline" size="sm" onClick={onToggleGuide} className="cursor-pointer">
                                    Close
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* API Key Input */}
                <div className="space-y-1">
                    <Label className="text-[11px]">API Key</Label>
                    <div className="relative">
                        <Input
                            type={showKey ? 'text' : 'password'}
                            value={apiKeyValue}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder={hasKey ? '••••••••••••••••' : def.placeholder}
                            className="pr-8 h-8 text-xs"
                        />
                        <button
                            type="button"
                            onClick={onToggleShow}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1.5 cursor-pointer"
                        onClick={onSave}
                        disabled={isSaving || !apiKeyValue.trim()}
                    >
                        {isSaving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Save className="h-3 w-3" />
                        )}
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>

                    {hasKey && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 text-destructive hover:text-destructive cursor-pointer"
                            onClick={onDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Main Page ─────────────────────────────────────────────
export default function UserApiKeysPage() {
    const [keys, setKeys] = useState<UserApiKeyData[]>([])
    const [loading, setLoading] = useState(true)
    const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [deleting, setDeleting] = useState<Record<string, boolean>>({})
    const [showGuide, setShowGuide] = useState<Record<string, boolean>>({})

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/user/api-keys')
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch { /* */ }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchKeys()
    }, [fetchKeys])

    const handleSave = async (provider: string) => {
        const apiKey = apiKeyValues[provider]
        if (!apiKey?.trim()) return

        setSaving(s => ({ ...s, [provider]: true }))
        try {
            const def = AI_PROVIDERS.find(p => p.provider === provider)
            const res = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    name: def?.name || provider,
                    apiKey: apiKey.trim(),
                }),
            })

            if (res.ok) {
                toast.success(`${def?.name || provider} API key saved!`)
                setApiKeyValues(v => ({ ...v, [provider]: '' }))
                fetchKeys()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save')
            }
        } catch {
            toast.error('Failed to save')
        }
        setSaving(s => ({ ...s, [provider]: false }))
    }

    const handleDelete = async (provider: string) => {
        setDeleting(s => ({ ...s, [provider]: true }))
        try {
            const res = await fetch(`/api/user/api-keys?provider=${provider}`, { method: 'DELETE' })
            if (res.ok) {
                const def = AI_PROVIDERS.find(p => p.provider === provider)
                toast.success(`${def?.name || provider} key removed`)
                fetchKeys()
            }
        } catch {
            toast.error('Failed to delete')
        }
        setDeleting(s => ({ ...s, [provider]: false }))
    }

    const configuredCount = keys.length

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
                    <h1 className="text-3xl font-bold tracking-tight">AI API Keys</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your personal AI provider keys for content generation
                    </p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Key className="h-3 w-3" />
                    {configuredCount}/{AI_PROVIDERS.length} configured
                </Badge>
            </div>

            {/* AI Providers Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">AI Providers</h2>
                    <Badge variant="secondary" className="ml-2">
                        {configuredCount}/{AI_PROVIDERS.length}
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {AI_PROVIDERS.map((def) => {
                        const existingKey = keys.find(k => k.provider === def.provider)
                        return (
                            <ProviderCard
                                key={def.provider}
                                def={def}
                                existingKey={existingKey}
                                apiKeyValue={apiKeyValues[def.provider] || ''}
                                showKey={showKeys[def.provider] || false}
                                isSaving={saving[def.provider] || false}
                                isDeleting={deleting[def.provider] || false}
                                showGuide={showGuide[def.provider] || false}
                                onApiKeyChange={(val) => setApiKeyValues(v => ({ ...v, [def.provider]: val }))}
                                onToggleShow={() => setShowKeys(s => ({ ...s, [def.provider]: !s[def.provider] }))}
                                onSave={() => handleSave(def.provider)}
                                onDelete={() => handleDelete(def.provider)}
                                onToggleGuide={() => setShowGuide(s => ({ ...s, [def.provider]: !s[def.provider] }))}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
