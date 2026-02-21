'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface ApiKey {
    id: string
    name: string
    keyPrefix: string
    isActive: boolean
    lastUsedAt: string | null
    createdAt: string
    apiKey?: string
}

export default function DeveloperApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [showNewKey, setShowNewKey] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => { fetchKeys() }, [])

    async function fetchKeys() {
        try {
            const res = await fetch('/api/v1/keys')
            const data = await res.json()
            if (data.success) setKeys(data.data)
        } catch {
            toast.error('Failed to load API keys')
        } finally {
            setLoading(false)
        }
    }

    async function createKey() {
        if (!newKeyName.trim()) {
            toast.error('Please enter a key name')
            return
        }
        setCreating(true)
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName }),
            })
            const data = await res.json()
            if (data.success) {
                setShowNewKey(data.data.apiKey)
                setNewKeyName('')
                fetchKeys()
                toast.success('API key created! Copy it now — it won\'t be shown again.')
            } else {
                toast.error(data.error?.message || 'Failed to create API key')
            }
        } catch {
            toast.error('Failed to create API key')
        } finally {
            setCreating(false)
        }
    }

    async function revokeKey(keyId: string) {
        if (!confirm('Are you sure? This key will be permanently deactivated.')) return
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyId }),
            })
            const data = await res.json()
            if (data.success) {
                fetchKeys()
                toast.success('API key revoked')
            }
        } catch {
            toast.error('Failed to revoke key')
        }
    }

    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Key className="h-6 w-6" />
                    Developer API Keys
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Create API keys for programmatic access to your account via the REST API.
                </p>
            </div>

            {/* Create New Key */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Create New API Key</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Key name (e.g. My Production App)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createKey()}
                            disabled={creating}
                            className="flex-1"
                        />
                        <Button onClick={createKey} disabled={creating}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                            Create Key
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Newly Created Key — Show Once */}
            {showNewKey && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <Shield className="h-4 w-4" />
                        New API Key Created — Copy Now!
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background rounded px-3 py-2 text-sm font-mono break-all">
                            {showNewKey}
                        </code>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(showNewKey, 'new')}>
                            {copiedId === 'new' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        This key will not be shown again. Store it securely.
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewKey(null)} className="text-xs">
                        I&apos;ve copied it, dismiss
                    </Button>
                </div>
            )}

            {/* Key List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Your API Keys ({keys.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Loading...
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No API keys yet. Create one above to get started.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {keys.map((key) => (
                                <div
                                    key={key.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${key.isActive ? 'bg-background' : 'bg-muted/30 opacity-60'
                                        }`}
                                >
                                    <Key className={`h-4 w-4 shrink-0 ${key.isActive ? 'text-green-400' : 'text-muted-foreground'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">{key.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {key.keyPrefix}••••••••••••
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right shrink-0">
                                        {key.lastUsedAt ? (
                                            <div>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</div>
                                        ) : (
                                            <div>Never used</div>
                                        )}
                                        <div>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    {key.isActive ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => revokeKey(key.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-red-400 font-medium px-2">Revoked</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Use your API key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header:
                    </p>
                    <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                        {`# List your channels
curl -H "X-API-Key: ask_your_key_here" \\
  ${domain}/api/v1/channels

# Generate AI content for multiple platforms
curl -X POST \\
  -H "X-API-Key: ask_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"channelId":"...","topic":"Summer sale","platforms":["facebook","instagram"]}' \\
  ${domain}/api/v1/ai/generate

# Create & schedule a post
curl -X POST \\
  -H "X-API-Key: ask_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"channelId":"...","content":"...","platforms":["facebook"],"scheduledAt":"2026-03-01T10:00:00Z","status":"SCHEDULED"}' \\
  ${domain}/api/v1/posts

# Check your usage & limits
curl -H "X-API-Key: ask_your_key_here" \\
  ${domain}/api/v1/usage`}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
