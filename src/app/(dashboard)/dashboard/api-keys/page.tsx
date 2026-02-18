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
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

// ─── Provider metadata (guide info per provider) ───────────
interface ProviderGuide {
    description: string
    placeholder: string
    guideUrl: string
    guideLabel: string
    guideSteps: { title: string; detail: string }[]
    tips?: string[]
}

const providerGuides: Record<string, ProviderGuide> = {
    gemini: {
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
    openai: {
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
        tips: ['GPT-4o mini is most cost-effective for content generation'],
    },
    anthropic: {
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
        tips: ['Claude 3.5 Sonnet is excellent for creative writing'],
    },
    openrouter: {
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
        tips: ['One key for all models (GPT, Claude, Llama, Mistral...)'],
    },
    runware: {
        description: 'Image generation — FLUX, SDXL, DALL-E',
        placeholder: 'Enter API key...',
        guideUrl: 'https://runware.ai',
        guideLabel: 'Open Runware Dashboard',
        guideSteps: [
            { title: 'Sign up', detail: 'Sign up at runware.ai' },
            { title: 'Go to API Keys', detail: 'Dashboard → API Keys' },
            { title: 'Create and copy', detail: 'Create new key and copy' },
        ],
    },
    synthetic: {
        description: 'AI video and image generation',
        placeholder: 'Enter API key...',
        guideUrl: 'https://synthetic.new/api-keys',
        guideLabel: 'Open Synthetic Dashboard',
        guideSteps: [
            { title: 'Sign up', detail: 'Sign up at synthetic.new' },
            { title: 'Get API Key', detail: 'Go to API Keys section' },
            { title: 'Copy key', detail: 'Create and copy your key' },
        ],
    },
}

const providerColors: Record<string, string> = {
    gemini: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    openai: 'bg-green-500/10 text-green-500 border-green-500/20',
    anthropic: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    openrouter: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    runware: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    synthetic: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
}

// ─── Types ─────────────────────────────────────────────────
interface AiProvider {
    id: string
    provider: string
    name: string
    status: string
}

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
    provider,
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
    provider: AiProvider
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
    const guide = providerGuides[provider.provider]
    const colorClass = providerColors[provider.provider] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    return (
        <Card className={`relative transition-all hover:shadow-md ${colorClass} border`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                    </div>
                    <StatusBadge hasKey={hasKey} />
                </div>
                <CardDescription className="text-xs">
                    {guide?.description || `${provider.provider} integration`}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Setup Guide Link */}
                {guide && (
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
                                    <DialogTitle className="text-xl">{provider.name} API Key</DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                                </DialogHeader>

                                <div className="space-y-3 mt-4">
                                    {guide.guideSteps.map((step, i) => (
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

                                {guide.tips && guide.tips.length > 0 && (
                                    <div className="mt-5 rounded-lg border border-dashed p-3 bg-muted/30">
                                        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                                            💡 Pro Tips
                                        </p>
                                        <ul className="space-y-1.5">
                                            {guide.tips.map((tip, i) => (
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
                                        href={guide.guideUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        {guide.guideLabel}
                                    </a>
                                    <Button variant="outline" size="sm" onClick={onToggleGuide} className="cursor-pointer">
                                        Close
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* API Key Input */}
                <div className="space-y-1">
                    <Label className="text-[11px]">API Key</Label>
                    <div className="relative">
                        <Input
                            type={showKey ? 'text' : 'password'}
                            value={apiKeyValue}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder={hasKey ? '••••••••••••••••' : (guide?.placeholder || 'Enter API key...')}
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
    const [providers, setProviders] = useState<AiProvider[]>([])
    const [keys, setKeys] = useState<UserApiKeyData[]>([])
    const [loading, setLoading] = useState(true)
    const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [deleting, setDeleting] = useState<Record<string, boolean>>({})
    const [showGuide, setShowGuide] = useState<Record<string, boolean>>({})

    // Fetch AI providers from API Hub
    const fetchProviders = useCallback(async () => {
        try {
            const res = await fetch('/api/user/ai-providers')
            if (res.ok) {
                const data = await res.json()
                setProviders(data)
            }
        } catch { /* */ }
    }, [])

    // Fetch user's saved API keys
    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/user/api-keys')
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch { /* */ }
    }, [])

    useEffect(() => {
        Promise.all([fetchProviders(), fetchKeys()]).then(() => setLoading(false))
    }, [fetchProviders, fetchKeys])

    const handleSave = async (providerSlug: string) => {
        const apiKey = apiKeyValues[providerSlug]
        if (!apiKey?.trim()) return

        setSaving(s => ({ ...s, [providerSlug]: true }))
        try {
            const prov = providers.find(p => p.provider === providerSlug)
            const res = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: providerSlug,
                    name: prov?.name || providerSlug,
                    apiKey: apiKey.trim(),
                }),
            })

            if (res.ok) {
                toast.success(`${prov?.name || providerSlug} API key saved!`)
                setApiKeyValues(v => ({ ...v, [providerSlug]: '' }))
                fetchKeys()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save')
            }
        } catch {
            toast.error('Failed to save')
        }
        setSaving(s => ({ ...s, [providerSlug]: false }))
    }

    const handleDelete = async (providerSlug: string) => {
        setDeleting(s => ({ ...s, [providerSlug]: true }))
        try {
            const res = await fetch(`/api/user/api-keys?provider=${providerSlug}`, { method: 'DELETE' })
            if (res.ok) {
                const prov = providers.find(p => p.provider === providerSlug)
                toast.success(`${prov?.name || providerSlug} key removed`)
                fetchKeys()
            }
        } catch {
            toast.error('Failed to delete')
        }
        setDeleting(s => ({ ...s, [providerSlug]: false }))
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
                    {configuredCount}/{providers.length} configured
                </Badge>
            </div>

            {/* AI Providers Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">AI Providers</h2>
                    <Badge variant="secondary" className="ml-2">
                        {configuredCount}/{providers.length}
                    </Badge>
                </div>

                {providers.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No AI providers available</p>
                            <p className="text-sm">Contact your admin to set up AI providers in the API Hub.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {providers.map((prov) => {
                            const existingKey = keys.find(k => k.provider === prov.provider)
                            return (
                                <ProviderCard
                                    key={prov.id}
                                    provider={prov}
                                    existingKey={existingKey}
                                    apiKeyValue={apiKeyValues[prov.provider] || ''}
                                    showKey={showKeys[prov.provider] || false}
                                    isSaving={saving[prov.provider] || false}
                                    isDeleting={deleting[prov.provider] || false}
                                    showGuide={showGuide[prov.provider] || false}
                                    onApiKeyChange={(val) => setApiKeyValues(v => ({ ...v, [prov.provider]: val }))}
                                    onToggleShow={() => setShowKeys(s => ({ ...s, [prov.provider]: !s[prov.provider] }))}
                                    onSave={() => handleSave(prov.provider)}
                                    onDelete={() => handleDelete(prov.provider)}
                                    onToggleGuide={() => setShowGuide(s => ({ ...s, [prov.provider]: !s[prov.provider] }))}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
