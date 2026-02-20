'use client'

import { useEffect, useState } from 'react'
import { Paintbrush, Save, Upload, Loader2, CheckCircle2 } from 'lucide-react'
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
        appName: 'ASocial',
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
            const res = await fetch('/api/admin/branding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            if (res.ok) {
                toast.success('Branding saved! Refresh to see changes everywhere.')
            } else {
                toast.error('Failed to save branding settings')
            }
        } catch {
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        // For now, use the file name as URL (user should upload to /public)
        // In production, could upload to S3/media API
        const reader = new FileReader()
        reader.onload = () => {
            // Save as data URL for preview, but suggest putting in /public
            setSettings(s => ({ ...s, logoUrl: reader.result as string }))
        }
        reader.readAsDataURL(file)
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
                                        value={settings.logoUrl.startsWith('data:') ? '(uploaded)' : settings.logoUrl}
                                        onChange={e => setSettings(s => ({ ...s, logoUrl: e.target.value }))}
                                        placeholder="/logo.png"
                                        className="mb-1.5"
                                    />
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                                            <Upload className="h-3 w-3" /> Upload image
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Favicon URL</label>
                            <Input
                                value={settings.faviconUrl}
                                onChange={e => setSettings(s => ({ ...s, faviconUrl: e.target.value }))}
                                placeholder="/favicon.ico"
                            />
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

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border">
                <strong>ℹ️ How it works:</strong> These settings replace all hardcoded branding across the app —
                sidebar, login pages, email templates, webhook notifications, legal pages, and more.
                After saving, refresh the page (or ask users to refresh) to see changes everywhere.
            </div>
        </div>
    )
}
