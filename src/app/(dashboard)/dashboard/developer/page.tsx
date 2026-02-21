'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
    Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Shield,
    Play, ChevronDown, ChevronRight, Send, Code2, BookOpen, Zap,
    Globe, Lock, BarChart3, FileText, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────
interface ApiKey {
    id: string
    name: string
    keyPrefix: string
    isActive: boolean
    lastUsedAt: string | null
    createdAt: string
    apiKey?: string
}

interface EndpointDef {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    title: string
    description: string
    category: string
    bodyExample?: Record<string, unknown>
    queryParams?: { name: string; desc: string; required?: boolean }[]
    pathParams?: { name: string; desc: string }[]
}

// ─── API Endpoint Definitions ───────────────────────────────────
const ENDPOINTS: EndpointDef[] = [
    // Channels
    {
        method: 'GET', path: '/api/v1/channels', title: 'List Channels',
        description: 'List all channels you have access to, including connected platforms.',
        category: 'Channels',
    },
    // Posts
    {
        method: 'GET', path: '/api/v1/posts', title: 'List Posts',
        description: 'List posts with filtering options. Supports pagination.',
        category: 'Posts',
        queryParams: [
            { name: 'channelId', desc: 'Filter by channel ID' },
            { name: 'status', desc: 'Filter by status (DRAFT, SCHEDULED, PUBLISHED, etc.)' },
            { name: 'limit', desc: 'Max results (default 20, max 100)' },
            { name: 'offset', desc: 'Offset for pagination (default 0)' },
        ],
    },
    {
        method: 'POST', path: '/api/v1/posts', title: 'Create Post',
        description: 'Create a new post with multi-platform support. Supports per-platform content and scheduling.',
        category: 'Posts',
        bodyExample: {
            channelId: '<CHANNEL_ID>',
            content: 'Your main post content here ✨',
            contentPerPlatform: { facebook: 'Facebook version...', instagram: 'IG version with #hashtags' },
            platforms: ['facebook', 'instagram'],
            status: 'DRAFT',
            scheduledAt: null,
            mediaIds: [],
        },
    },
    {
        method: 'GET', path: '/api/v1/posts/{id}', title: 'Get Post Detail',
        description: 'Get full post details including media, platform statuses, and approval history.',
        category: 'Posts',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
    },
    {
        method: 'PUT', path: '/api/v1/posts/{id}', title: 'Update Post',
        description: 'Update a draft, scheduled, or rejected post. Cannot update published posts.',
        category: 'Posts',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
        bodyExample: { content: 'Updated content', scheduledAt: '2026-03-01T10:00:00Z' },
    },
    {
        method: 'DELETE', path: '/api/v1/posts/{id}', title: 'Delete Post',
        description: 'Permanently delete a post.',
        category: 'Posts',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
    },
    // Post Actions
    {
        method: 'POST', path: '/api/v1/posts/{id}/publish', title: 'Publish Post',
        description: 'Queue a post for immediate publishing. Status changes to PUBLISHING and the worker handles delivery.',
        category: 'Post Actions',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
    },
    {
        method: 'POST', path: '/api/v1/posts/{id}/schedule', title: 'Schedule Post',
        description: 'Schedule a post for future publishing.',
        category: 'Post Actions',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
        bodyExample: { scheduledAt: '2026-03-15T14:00:00Z' },
    },
    // Approvals
    {
        method: 'GET', path: '/api/v1/posts/{id}/approvals', title: 'List Approvals',
        description: 'Get approval history for a post.',
        category: 'Approvals',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
    },
    {
        method: 'POST', path: '/api/v1/posts/{id}/approvals', title: 'Approve / Reject Post',
        description: 'Approve or reject a post pending approval.',
        category: 'Approvals',
        pathParams: [{ name: 'id', desc: 'Post ID' }],
        bodyExample: { action: 'APPROVED', comment: 'Looks great! 👍' },
    },
    // AI
    {
        method: 'POST', path: '/api/v1/ai/generate', title: 'Generate AI Content',
        description: 'Generate platform-optimized social media content using AI. Uses the channel\'s knowledge base, brand voice, and hashtag groups.',
        category: 'AI Content',
        bodyExample: {
            channelId: '<CHANNEL_ID>',
            topic: 'Summer collection launch with 30% discount',
            platforms: ['facebook', 'instagram', 'tiktok', 'x'],
            language: 'en',
        },
    },
    // Usage
    {
        method: 'GET', path: '/api/v1/usage', title: 'Get Usage & Limits',
        description: 'Get your current plan details, usage this month, and feature flags.',
        category: 'Account',
    },
    // Keys
    {
        method: 'GET', path: '/api/v1/keys', title: 'List API Keys',
        description: 'List all your API keys (requires session auth from the dashboard — not API key auth).',
        category: 'Key Management',
    },
    {
        method: 'POST', path: '/api/v1/keys', title: 'Create API Key',
        description: 'Generate a new API key. The raw key is shown only once.',
        category: 'Key Management',
        bodyExample: { name: 'My Production App' },
    },
    {
        method: 'DELETE', path: '/api/v1/keys', title: 'Revoke API Key',
        description: 'Permanently deactivate an API key.',
        category: 'Key Management',
        bodyExample: { keyId: '<KEY_ID>' },
    },
]

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const CATEGORIES = [...new Set(ENDPOINTS.map(e => e.category))]

// ─── Component ──────────────────────────────────────────────────
export default function DeveloperPortalPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<'docs' | 'playground' | 'keys'>('docs')

    // Key management state
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [keysLoading, setKeysLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [showNewKey, setShowNewKey] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Playground state
    const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null)
    const [apiKey, setApiKey] = useState('')
    const [playgroundBody, setPlaygroundBody] = useState('')
    const [playgroundPath, setPlaygroundPath] = useState('')
    const [playgroundQuery, setPlaygroundQuery] = useState('')
    const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null)
    const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null)
    const [playgroundLoading, setPlaygroundLoading] = useState(false)
    const [playgroundHeaders, setPlaygroundHeaders] = useState<Record<string, string>>({})

    // Docs state
    const [expandedCategory, setExpandedCategory] = useState<string>(CATEGORIES[0])
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)

    const responseRef = useRef<HTMLPreElement>(null)

    useEffect(() => { fetchKeys() }, [])

    async function fetchKeys() {
        try {
            const res = await fetch('/api/v1/keys')
            const data = await res.json()
            if (data.success) setKeys(data.data)
        } catch { /* ignore */ } finally {
            setKeysLoading(false)
        }
    }

    async function createKey() {
        if (!newKeyName.trim()) { toast.error('Please enter a key name'); return }
        setCreating(true)
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName }),
            })
            const data = await res.json()
            if (data.success) {
                setShowNewKey(data.data.apiKey)
                setApiKey(data.data.apiKey)
                setNewKeyName('')
                fetchKeys()
                toast.success('API key created!')
            } else toast.error(data.error?.message || 'Failed')
        } catch { toast.error('Failed') } finally { setCreating(false) }
    }

    async function revokeKey(keyId: string) {
        if (!confirm('Revoke this key? It will be permanently deactivated.')) return
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyId }),
            })
            const data = await res.json()
            if (data.success) { fetchKeys(); toast.success('Key revoked') }
        } catch { toast.error('Failed') }
    }

    function copyText(text: string, id: string) {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const selectEndpoint = useCallback((ep: EndpointDef) => {
        setSelectedEndpoint(ep)
        setPlaygroundPath(ep.path)
        setPlaygroundBody(ep.bodyExample ? JSON.stringify(ep.bodyExample, null, 2) : '')
        setPlaygroundQuery(ep.queryParams ? ep.queryParams.map(q => `${q.name}=`).join('&') : '')
        setPlaygroundResponse(null)
        setPlaygroundStatus(null)
        setPlaygroundHeaders({})
        setActiveTab('playground')
    }, [])

    async function executeRequest() {
        if (!apiKey.trim()) { toast.error('Enter your API key first'); return }
        if (!selectedEndpoint) return

        setPlaygroundLoading(true)
        setPlaygroundResponse(null)

        try {
            let url = playgroundPath
            // Replace path params
            const pathParamMatches = url.match(/\{(\w+)\}/g)
            if (pathParamMatches) {
                // Path params should already be filled in playgroundPath
            }

            if (playgroundQuery) url += `?${playgroundQuery}`

            const opts: RequestInit = {
                method: selectedEndpoint.method,
                headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
            }
            if (['POST', 'PUT', 'DELETE'].includes(selectedEndpoint.method) && playgroundBody.trim()) {
                opts.body = playgroundBody
            }

            const res = await fetch(url, opts)
            const headers: Record<string, string> = {}
            res.headers.forEach((v, k) => {
                if (k.startsWith('x-ratelimit') || k === 'content-type') headers[k] = v
            })
            setPlaygroundHeaders(headers)
            setPlaygroundStatus(res.status)

            const text = await res.text()
            try {
                setPlaygroundResponse(JSON.stringify(JSON.parse(text), null, 2))
            } catch {
                setPlaygroundResponse(text)
            }
        } catch (err) {
            setPlaygroundResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
            setPlaygroundStatus(0)
        } finally {
            setPlaygroundLoading(false)
        }
    }

    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

    // ─── Render ─────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Code2 className="h-6 w-6 text-primary" />
                        Developer API
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Programmatic access to channels, posts, AI generation, and more.
                    </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-3 py-1">
                    <Globe className="h-3 w-3" />
                    <span className="font-mono">{domain}/api/v1</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
                {[
                    { key: 'docs', icon: BookOpen, label: 'Documentation' },
                    { key: 'playground', icon: Play, label: 'Playground' },
                    { key: 'keys', icon: Key, label: 'API Keys' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as 'docs' | 'playground' | 'keys')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── DOCS TAB ──────────────────────────────────────── */}
            {activeTab === 'docs' && (
                <div className="space-y-6">
                    {/* Authentication Guide */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Lock className="h-4 w-4 text-primary" /> Authentication
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p>All API requests require an API key passed via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code> header.</p>
                            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                                {`curl -H "X-API-Key: ask_xxxxxxxxxxxxxxxx" \\
  ${domain}/api/v1/channels`}
                            </pre>
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                <div className="text-xs">
                                    <strong>Security:</strong> API keys are hashed using bcrypt — the raw key is shown only once at creation. Treat your key like a password and rotate regularly.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rate Limiting */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> Rate Limiting
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p>API calls are quota-limited per plan per month. Check your limits in the response headers:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {[
                                    { header: 'X-RateLimit-Limit', desc: 'Monthly quota' },
                                    { header: 'X-RateLimit-Remaining', desc: 'Calls remaining' },
                                    { header: 'X-RateLimit-Reset', desc: 'Reset timestamp (ISO 8601)' },
                                ].map(h => (
                                    <div key={h.header} className="bg-muted/30 rounded-lg p-3">
                                        <code className="text-xs font-mono text-primary">{h.header}</code>
                                        <p className="text-xs text-muted-foreground mt-1">{h.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">When your quota is exhausted, the API returns <code className="bg-muted px-1 rounded">429 Too Many Requests</code>.</p>
                        </CardContent>
                    </Card>

                    {/* Response Format */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Response Format
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <p>All responses follow this structure:</p>
                            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                                {`// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}`}
                            </pre>
                        </CardContent>
                    </Card>

                    {/* Endpoint Reference */}
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" /> Endpoint Reference
                        </h2>

                        {CATEGORIES.map(cat => (
                            <Card key={cat} className="overflow-hidden">
                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === cat ? '' : cat)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                                >
                                    <span className="font-semibold text-sm">{cat}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{ENDPOINTS.filter(e => e.category === cat).length}</Badge>
                                        {expandedCategory === cat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                </button>
                                {expandedCategory === cat && (
                                    <CardContent className="pt-0 pb-2 space-y-1">
                                        {ENDPOINTS.filter(e => e.category === cat).map((ep, i) => {
                                            const epKey = `${ep.method}-${ep.path}`
                                            const isExpanded = expandedEndpoint === epKey
                                            return (
                                                <div key={i} className="border rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedEndpoint(isExpanded ? null : epKey)}
                                                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
                                                    >
                                                        <Badge variant="outline" className={`text-[10px] font-mono font-bold px-2 shrink-0 ${METHOD_COLORS[ep.method]}`}>
                                                            {ep.method}
                                                        </Badge>
                                                        <code className="text-xs font-mono flex-1 text-muted-foreground">{ep.path}</code>
                                                        <span className="text-xs text-foreground shrink-0">{ep.title}</span>
                                                        {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 space-y-3 border-t bg-muted/10">
                                                            <p className="text-xs text-muted-foreground pt-2">{ep.description}</p>

                                                            {ep.pathParams && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold mb-1">Path Parameters</h4>
                                                                    {ep.pathParams.map(p => (
                                                                        <div key={p.name} className="flex gap-2 text-xs">
                                                                            <code className="bg-muted px-1 rounded font-mono text-primary">{`{${p.name}}`}</code>
                                                                            <span className="text-muted-foreground">{p.desc}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {ep.queryParams && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold mb-1">Query Parameters</h4>
                                                                    <div className="space-y-1">
                                                                        {ep.queryParams.map(q => (
                                                                            <div key={q.name} className="flex gap-2 text-xs">
                                                                                <code className="bg-muted px-1 rounded font-mono text-primary">{q.name}</code>
                                                                                <span className="text-muted-foreground">{q.desc}</span>
                                                                                {q.required && <Badge variant="destructive" className="text-[9px] h-4">required</Badge>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {ep.bodyExample && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold mb-1">Request Body</h4>
                                                                    <pre className="bg-muted/50 rounded p-2 text-[11px] font-mono overflow-x-auto">
                                                                        {JSON.stringify(ep.bodyExample, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            {/* curl Example */}
                                                            <div>
                                                                <h4 className="text-xs font-semibold mb-1">Example</h4>
                                                                <div className="relative">
                                                                    <pre className="bg-muted/50 rounded p-2 text-[11px] font-mono overflow-x-auto">
                                                                        {`curl${ep.method !== 'GET' ? ` -X ${ep.method}` : ''} \\
  -H "X-API-Key: YOUR_KEY" \\${ep.bodyExample ? `
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(ep.bodyExample)}' \\` : ''}
  ${domain}${ep.path}${ep.queryParams ? '?' + ep.queryParams.map(q => q.name + '=...').join('&') : ''}`}
                                                                    </pre>
                                                                </div>
                                                            </div>

                                                            <Button size="sm" variant="outline" className="text-xs" onClick={() => selectEndpoint(ep)}>
                                                                <Play className="h-3 w-3 mr-1" /> Try in Playground
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── PLAYGROUND TAB ─────────────────────────────────── */}
            {activeTab === 'playground' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Request */}
                    <div className="space-y-4">
                        {/* API Key Input */}
                        <Card>
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Lock className="h-3.5 w-3.5" /> API Key
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Input
                                    type="password"
                                    placeholder="ask_xxxxxxxxxxxxxxxx"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    className="font-mono text-xs"
                                />
                                {!apiKey && keys.length === 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        No API key yet? Go to the <button onClick={() => setActiveTab('keys')} className="text-primary underline">API Keys</button> tab to create one.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Endpoint Selector */}
                        <Card>
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm">Select Endpoint</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-1 max-h-60 overflow-y-auto">
                                {ENDPOINTS.filter(e => e.category !== 'Key Management').map((ep, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectEndpoint(ep)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted/50 transition-colors ${selectedEndpoint === ep ? 'bg-primary/10 border border-primary/30' : ''
                                            }`}
                                    >
                                        <Badge variant="outline" className={`text-[9px] font-mono font-bold px-1.5 shrink-0 ${METHOD_COLORS[ep.method]}`}>
                                            {ep.method}
                                        </Badge>
                                        <span className="text-xs truncate">{ep.title}</span>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Request Config */}
                        {selectedEndpoint && (
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[10px] font-mono font-bold ${METHOD_COLORS[selectedEndpoint.method]}`}>
                                            {selectedEndpoint.method}
                                        </Badge>
                                        {selectedEndpoint.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-3">
                                    <p className="text-xs text-muted-foreground">{selectedEndpoint.description}</p>

                                    {/* Path */}
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">URL Path</label>
                                        <Input
                                            value={playgroundPath}
                                            onChange={e => setPlaygroundPath(e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                        {selectedEndpoint.pathParams && (
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Replace <code>{'{id}'}</code> with an actual ID
                                            </p>
                                        )}
                                    </div>

                                    {/* Query Params */}
                                    {selectedEndpoint.queryParams && (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Query Parameters</label>
                                            <Input
                                                value={playgroundQuery}
                                                onChange={e => setPlaygroundQuery(e.target.value)}
                                                placeholder="key=value&key2=value2"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    )}

                                    {/* Body */}
                                    {['POST', 'PUT', 'DELETE'].includes(selectedEndpoint.method) && (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Request Body (JSON)</label>
                                            <textarea
                                                value={playgroundBody}
                                                onChange={e => setPlaygroundBody(e.target.value)}
                                                rows={Math.min(12, (playgroundBody.split('\n').length || 3) + 1)}
                                                className="w-full bg-muted/30 border rounded-lg p-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                spellCheck={false}
                                            />
                                        </div>
                                    )}

                                    <Button onClick={executeRequest} disabled={playgroundLoading} className="w-full">
                                        {playgroundLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                                        Send Request
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {!selectedEndpoint && (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                <Play className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                Select an endpoint from the list above to start testing
                            </div>
                        )}
                    </div>

                    {/* Right: Response */}
                    <div className="space-y-4">
                        <Card className="sticky top-4">
                            <CardHeader className="py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm">Response</CardTitle>
                                {playgroundStatus !== null && (
                                    <Badge variant={playgroundStatus >= 200 && playgroundStatus < 300 ? 'default' : 'destructive'} className="text-xs">
                                        {playgroundStatus}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="pt-0">
                                {/* Rate Limit Headers */}
                                {Object.keys(playgroundHeaders).length > 0 && (
                                    <div className="mb-3 space-y-1">
                                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Response Headers</h4>
                                        {Object.entries(playgroundHeaders).map(([k, v]) => (
                                            <div key={k} className="flex gap-2 text-[11px]">
                                                <code className="text-primary font-mono">{k}:</code>
                                                <code className="text-muted-foreground font-mono">{v}</code>
                                            </div>
                                        ))}
                                        <Separator className="my-2" />
                                    </div>
                                )}

                                {playgroundResponse ? (
                                    <div className="relative">
                                        <pre
                                            ref={responseRef}
                                            className="bg-muted/30 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap"
                                        >
                                            {playgroundResponse}
                                        </pre>
                                        <Button
                                            variant="ghost" size="sm"
                                            className="absolute top-2 right-2 h-7 w-7 p-0"
                                            onClick={() => copyText(playgroundResponse, 'response')}
                                        >
                                            {copiedId === 'response' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                ) : playgroundLoading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        <p className="text-xs text-muted-foreground mt-2">Sending request...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground text-xs">
                                        Response will appear here after sending a request
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ─── KEYS TAB ────────────────────────────────────────── */}
            {activeTab === 'keys' && (
                <div className="max-w-2xl space-y-4">
                    {/* Create */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Create New API Key</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Key name (e.g. My App)"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && createKey()}
                                    disabled={creating}
                                    className="flex-1"
                                />
                                <Button onClick={createKey} disabled={creating}>
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                                    Create
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Newly created */}
                    {showNewKey && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                <Shield className="h-4 w-4" />
                                API Key Created — Copy Now!
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-background rounded px-3 py-2 text-sm font-mono break-all">
                                    {showNewKey}
                                </code>
                                <Button variant="outline" size="sm" onClick={() => copyText(showNewKey, 'new')}>
                                    {copiedId === 'new' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                This key will not be shown again. Store it securely.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowNewKey(null)} className="text-xs">
                                    Dismiss
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setActiveTab('playground'); setShowNewKey(null) }} className="text-xs">
                                    <Play className="h-3 w-3 mr-1" /> Try in Playground
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Your API Keys ({keys.length}/10)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {keysLoading ? (
                                <div className="text-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                </div>
                            ) : keys.length === 0 ? (
                                <p className="text-center py-6 text-sm text-muted-foreground">No keys yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {keys.map(key => (
                                        <div
                                            key={key.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${key.isActive ? 'bg-background' : 'bg-muted/30 opacity-50'
                                                }`}
                                        >
                                            <Key className={`h-4 w-4 shrink-0 ${key.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{key.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••</div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground text-right shrink-0">
                                                <div>{key.lastUsedAt ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}</div>
                                                <div>Created {new Date(key.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            {key.isActive ? (
                                                <Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
