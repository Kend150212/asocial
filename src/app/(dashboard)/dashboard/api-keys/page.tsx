'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
    Key,
    Plus,
    Trash2,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface UserApiKeyInfo {
    id: string
    provider: string
    name: string
    defaultModel: string | null
    isActive: boolean
    createdAt: string
}

interface AiProviderOption {
    provider: string
    name: string
}

const PROVIDER_OPTIONS: AiProviderOption[] = [
    { provider: 'gemini', name: 'Google Gemini' },
    { provider: 'openai', name: 'OpenAI' },
    { provider: 'anthropic', name: 'Anthropic (Claude)' },
    { provider: 'openrouter', name: 'OpenRouter' },
    { provider: 'groq', name: 'Groq' },
]

function getProviderDisplayName(provider: string) {
    return PROVIDER_OPTIONS.find(p => p.provider === provider)?.name || provider
}

function getProviderColor(provider: string) {
    switch (provider) {
        case 'gemini': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        case 'openai': return 'bg-green-500/10 text-green-500 border-green-500/20'
        case 'anthropic': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
        case 'openrouter': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
        case 'groq': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
}

export default function UserApiKeysPage() {
    const { data: session } = useSession()
    const [keys, setKeys] = useState<UserApiKeyInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [deletingProvider, setDeletingProvider] = useState<string | null>(null)

    // Form state
    const [selectedProvider, setSelectedProvider] = useState('')
    const [apiKeyValue, setApiKeyValue] = useState('')
    const [keyName, setKeyName] = useState('')

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

    const handleSave = async () => {
        if (!selectedProvider || !apiKeyValue.trim()) {
            toast.error('Please select a provider and enter an API key')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedProvider,
                    name: keyName || getProviderDisplayName(selectedProvider),
                    apiKey: apiKeyValue.trim(),
                }),
            })

            if (res.ok) {
                toast.success(`${getProviderDisplayName(selectedProvider)} API key saved!`)
                setShowForm(false)
                setSelectedProvider('')
                setApiKeyValue('')
                setKeyName('')
                fetchKeys()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save API key')
            }
        } catch {
            toast.error('Failed to save API key')
        }
        setSaving(false)
    }

    const handleDelete = async (provider: string) => {
        setDeletingProvider(provider)
        try {
            const res = await fetch(`/api/user/api-keys?provider=${provider}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                toast.success(`${getProviderDisplayName(provider)} API key removed`)
                fetchKeys()
            }
        } catch {
            toast.error('Failed to delete API key')
        }
        setDeletingProvider(null)
    }

    // Providers that don't have a key yet
    const availableToAdd = PROVIDER_OPTIONS.filter(
        p => !keys.some(k => k.provider === p.provider)
    )

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">AI API Keys</h1>
                    <p className="text-muted-foreground">
                        Manage your AI provider API keys. These keys are used for AI content generation across all your channels.
                    </p>
                </div>
            </div>

            {/* Existing Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Your API Keys
                    </CardTitle>
                    <CardDescription>
                        Each provider needs its own API key. Your keys are encrypted and stored securely.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No API keys configured</p>
                            <p className="text-sm">Add your first AI provider key to start generating content.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {keys.map((key) => (
                                <div
                                    key={key.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={getProviderColor(key.provider)}>
                                            {getProviderDisplayName(key.provider)}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{key.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                Key configured • ••••••••
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive cursor-pointer"
                                        onClick={() => handleDelete(key.provider)}
                                        disabled={deletingProvider === key.provider}
                                    >
                                        {deletingProvider === key.provider ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Separator />

                    {/* Add New Key */}
                    {showForm ? (
                        <div className="space-y-4 p-4 rounded-lg border border-dashed">
                            <div className="space-y-2">
                                <Label>AI Provider</Label>
                                <Select value={selectedProvider} onValueChange={(v) => {
                                    setSelectedProvider(v)
                                    setKeyName(getProviderDisplayName(v))
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a provider..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableToAdd.map((p) => (
                                            <SelectItem key={p.provider} value={p.provider}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="sk-... or AIza..."
                                    value={apiKeyValue}
                                    onChange={(e) => setApiKeyValue(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Your API key will be encrypted before storage. We never expose your full key.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={saving || !selectedProvider || !apiKeyValue.trim()} className="cursor-pointer">
                                    {saving ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                                    ) : (
                                        'Save Key'
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => { setShowForm(false); setSelectedProvider(''); setApiKeyValue(''); setKeyName('') }} className="cursor-pointer">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        availableToAdd.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(true)}
                                className="w-full cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add AI Provider Key
                            </Button>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">How it works:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Set up your API keys here once — they&apos;ll be used across all channels you manage.</li>
                            <li>When generating AI content, the system uses your key for the selected provider.</li>
                            <li>Each key is encrypted at rest and never exposed in the UI.</li>
                            <li>You can get API keys from each provider&apos;s website (e.g., <a href="https://aistudio.google.com/apikey" target="_blank" className="underline text-primary">Google AI Studio</a>, <a href="https://platform.openai.com/api-keys" target="_blank" className="underline text-primary">OpenAI Platform</a>).</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
