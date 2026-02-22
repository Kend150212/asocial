'use client'

import { useEffect, useState, useMemo } from 'react'
import { Paintbrush, Save, Upload, Loader2, CheckCircle2, Copy, Check, ChevronDown, ChevronUp, ExternalLink, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import NextImage from 'next/image'

interface Settings {
    appName: string
    tagline: string
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    supportEmail: string
    copyrightText: string
}

export default function AdminBrandingPage() {
    const [settings, setSettings] = useState<Settings>({
        appName: 'NeeFlow',
        tagline: 'Social Media Management',
        logoUrl: '/logo.png',
        faviconUrl: '/favicon.ico',
        primaryColor: '#7c3aed',
        supportEmail: '',
        copyrightText: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/branding')
            .then(r => r.json())
            .then(d => { setSettings(s => ({ ...s, ...d })); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    async function handleSave() {
        setSaving(true)
        try {
            console.log('[Branding Page] Saving settings:', JSON.stringify(settings))
            const res = await fetch('/api/admin/branding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            const data = await res.json()
            console.log('[Branding Page] Response:', res.status, JSON.stringify(data))
            if (res.ok) {
                toast.success('Branding saved! Refresh to see changes everywhere.')
            } else {
                toast.error(`Failed to save: ${data.error || res.statusText}`)
            }
        } catch (err) {
            console.error('[Branding Page] Network error:', err)
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        setUploading(type)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', type)

            const res = await fetch('/api/admin/branding/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) {
                toast.error(`Upload failed: ${data.error}`)
                return
            }

            if (type === 'logo') {
                setSettings(s => ({ ...s, logoUrl: data.url }))
            } else {
                setSettings(s => ({ ...s, faviconUrl: data.url }))
            }
            toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded! Click "Save Changes" to apply.`)
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Upload failed — check your Google Drive connection')
        } finally {
            setUploading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Paintbrush className="h-6 w-6" />
                        Branding / Whitelabel
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Customize your app name, logo, colors, and email branding
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Live Preview */}
            <Card className="border-violet-500/30 bg-violet-500/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-violet-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Live Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                        {settings.logoUrl && (
                            <NextImage
                                src={settings.logoUrl}
                                alt="Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                                unoptimized
                            />
                        )}
                        <div>
                            <p className="font-bold text-lg">{settings.appName || 'Your App'}</p>
                            <p className="text-xs text-muted-foreground">{settings.tagline}</p>
                        </div>
                        <div
                            className="ml-auto w-8 h-8 rounded-full border-2"
                            style={{ backgroundColor: settings.primaryColor }}
                            title="Primary Color"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* App Identity */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">App Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">App Name</label>
                            <Input
                                value={settings.appName}
                                onChange={e => setSettings(s => ({ ...s, appName: e.target.value }))}
                                placeholder="Your App Name"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tagline</label>
                            <Input
                                value={settings.tagline}
                                onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))}
                                placeholder="Social Media Management"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Support Email</label>
                            <Input
                                value={settings.supportEmail}
                                onChange={e => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
                                placeholder="support@yourdomain.com"
                                type="email"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Copyright Text</label>
                            <Input
                                value={settings.copyrightText}
                                onChange={e => setSettings(s => ({ ...s, copyrightText: e.target.value }))}
                                placeholder="© 2026 Your Company. All rights reserved."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Visual Identity */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Visual Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo</label>
                            <div className="flex items-center gap-3">
                                {settings.logoUrl && (
                                    <NextImage
                                        src={settings.logoUrl}
                                        alt="Logo"
                                        width={48}
                                        height={48}
                                        className="rounded-lg border"
                                        unoptimized
                                    />
                                )}
                                <div className="flex-1">
                                    <Input
                                        value={settings.logoUrl}
                                        onChange={e => setSettings(s => ({ ...s, logoUrl: e.target.value }))}
                                        placeholder="/logo.png or https://..."
                                        className="mb-1.5"
                                    />
                                    <label className={`cursor-pointer ${uploading === 'logo' ? 'pointer-events-none opacity-50' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, 'logo')}
                                            className="hidden"
                                        />
                                        <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                                            {uploading === 'logo' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                            {uploading === 'logo' ? 'Uploading to Google Drive...' : 'Upload image'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Favicon</label>
                            <div className="flex items-center gap-3">
                                {settings.faviconUrl && (
                                    <NextImage
                                        src={settings.faviconUrl}
                                        alt="Favicon"
                                        width={32}
                                        height={32}
                                        className="rounded border"
                                        unoptimized
                                    />
                                )}
                                <div className="flex-1">
                                    <Input
                                        value={settings.faviconUrl}
                                        onChange={e => setSettings(s => ({ ...s, faviconUrl: e.target.value }))}
                                        placeholder="/favicon.ico or https://..."
                                        className="mb-1.5"
                                    />
                                    <label className={`cursor-pointer ${uploading === 'favicon' ? 'pointer-events-none opacity-50' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, 'favicon')}
                                            className="hidden"
                                        />
                                        <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                                            {uploading === 'favicon' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                            {uploading === 'favicon' ? 'Uploading to Google Drive...' : 'Upload favicon'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary Brand Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.primaryColor}
                                    onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                                    className="h-10 w-14 rounded-lg border cursor-pointer bg-transparent"
                                />
                                <Input
                                    value={settings.primaryColor}
                                    onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                                    placeholder="#7c3aed"
                                    className="flex-1 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OAuth Callback URLs Reference */}
            <CallbackUrlsSection />

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border">
                <strong>ℹ️ How it works:</strong> These settings replace all hardcoded branding across the app —
                sidebar, login pages, email templates, webhook notifications, legal pages, and more.
                After saving, refresh the page (or ask users to refresh) to see changes everywhere.
            </div>
        </div>
    )
}

// ─── Callback URLs Reference Section ───

const CALLBACK_URLS = [
    {
        group: 'Social Platforms', items: [
            { platform: 'YouTube', path: '/api/oauth/youtube/callback', console: 'https://console.cloud.google.com', consoleName: 'Google Cloud Console' },
            { platform: 'Facebook', path: '/api/oauth/facebook/callback', console: 'https://developers.facebook.com', consoleName: 'Meta Developer' },
            { platform: 'Instagram', path: '/api/oauth/instagram/callback', console: 'https://developers.facebook.com', consoleName: 'Meta Developer' },
            { platform: 'TikTok', path: '/api/oauth/tiktok/callback', console: 'https://developers.tiktok.com', consoleName: 'TikTok Developer' },
            { platform: 'Pinterest', path: '/api/oauth/pinterest/callback', console: 'https://developers.pinterest.com', consoleName: 'Pinterest Developer' },
            { platform: 'LinkedIn', path: '/api/oauth/linkedin/callback', console: 'https://developer.linkedin.com', consoleName: 'LinkedIn Developer' },
            { platform: 'X (Twitter)', path: '/api/oauth/x/callback', console: 'https://developer.x.com', consoleName: 'X Developer' },
        ]
    },
    {
        group: 'Storage & Design', items: [
            { platform: 'Google Drive (Admin)', path: '/api/admin/gdrive/callback', console: 'https://console.cloud.google.com', consoleName: 'Google Cloud Console' },
            { platform: 'Google Drive (User)', path: '/api/user/gdrive/callback', console: 'https://console.cloud.google.com', consoleName: 'Google Cloud Console' },
            { platform: 'Canva', path: '/api/oauth/canva/callback', console: 'https://www.canva.dev', consoleName: 'Canva Developer' },
        ]
    },
    {
        group: 'Authentication', items: [
            { platform: 'Google Login', path: '/api/auth/callback/google', console: 'https://console.cloud.google.com', consoleName: 'Google Cloud Console' },
        ]
    },
]

function CallbackUrlsSection() {
    const [expanded, setExpanded] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState<string | null>(null)

    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

    function copyUrl(url: string, key: string) {
        navigator.clipboard.writeText(url)
        setCopiedIdx(key)
        setTimeout(() => setCopiedIdx(null), 2000)
    }

    function copyAll() {
        const all = CALLBACK_URLS.flatMap(g => g.items.map(i => `${i.platform}: ${domain}${i.path}`)).join('\n')
        navigator.clipboard.writeText(all)
        setCopiedIdx('all')
        setTimeout(() => setCopiedIdx(null), 2000)
    }

    return (
        <Card className="border-dashed">
            <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        OAuth Callback URLs ({CALLBACK_URLS.reduce((sum, g) => sum + g.items.length, 0)} endpoints)
                    </span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
            </CardHeader>

            {expanded && (
                <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Register these URLs in each platform&apos;s developer console. They auto-update based on your domain.
                        </p>
                        <Button variant="outline" size="sm" onClick={copyAll} className="text-xs shrink-0 ml-2">
                            {copiedIdx === 'all' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copiedIdx === 'all' ? 'Copied!' : 'Copy All'}
                        </Button>
                    </div>

                    {CALLBACK_URLS.map((group) => (
                        <div key={group.group}>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.group}</h4>
                            <div className="space-y-1.5">
                                {group.items.map((item) => {
                                    const fullUrl = `${domain}${item.path}`
                                    const key = item.path
                                    return (
                                        <div key={key} className="flex items-center gap-2 group rounded-md hover:bg-muted/50 p-1.5 -mx-1.5">
                                            <span className="text-xs font-medium w-36 shrink-0 truncate">{item.platform}</span>
                                            <code className="text-[11px] text-muted-foreground flex-1 truncate font-mono">{fullUrl}</code>
                                            <button
                                                onClick={() => copyUrl(fullUrl, key)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                                                title="Copy URL"
                                            >
                                                {copiedIdx === key
                                                    ? <Check className="h-3 w-3 text-green-400" />
                                                    : <Copy className="h-3 w-3 text-muted-foreground" />
                                                }
                                            </button>
                                            <a
                                                href={item.console}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                                                title={`Open ${item.consoleName}`}
                                            >
                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            </a>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="text-[11px] text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5">
                        <strong>⚠️ Domain Change:</strong> When you change your domain, you must manually update these callback URLs
                        in each platform&apos;s developer console. This cannot be automated.
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
