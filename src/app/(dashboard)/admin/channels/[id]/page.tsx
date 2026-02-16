'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
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

interface ChannelDetail {
    id: string
    name: string
    displayName: string
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
    google_sheet: 'Google Sheet',
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
    const [channel, setChannel] = useState<ChannelDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    // Editable fields
    const [displayName, setDisplayName] = useState('')
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

    const fetchChannel = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/channels/${id}`)
            if (res.ok) {
                const data = await res.json()
                setChannel(data)
                setDisplayName(data.displayName)
                setLanguage(data.language)
                setIsActive(data.isActive)
                setNotificationEmail(data.notificationEmail || '')
                setRequireApproval(data.requireApproval)
                setVibeTone(data.vibeTone || {})
                setKnowledgeEntries(data.knowledgeBase || [])
                setTemplates(data.contentTemplates || [])
                setHashtags(data.hashtagGroups || [])
            } else {
                toast.error('Channel not found')
                router.push('/admin/channels')
            }
        } catch {
            toast.error('Failed to load channel')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchChannel()
    }, [fetchChannel])

    // ─── Save General Settings ──────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    language,
                    isActive,
                    notificationEmail: notificationEmail || null,
                    requireApproval,
                    vibeTone,
                }),
            })
            if (res.ok) {
                toast.success(t('channels.saved'))
                fetchChannel()
            } else {
                toast.error('Failed to save')
            }
        } catch {
            toast.error('Failed to save')
        } finally {
            setSaving(false)
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
                toast.success('Knowledge entry added')
            }
        } catch {
            toast.error('Failed to add entry')
        } finally {
            setAddingKb(false)
        }
    }

    const deleteKbEntry = async (entryId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/knowledge?entryId=${entryId}`, { method: 'DELETE' })
            setKnowledgeEntries(knowledgeEntries.filter((e) => e.id !== entryId))
            toast.success('Entry deleted')
        } catch {
            toast.error('Failed to delete')
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
                toast.success('Template added')
            }
        } catch {
            toast.error('Failed to add template')
        } finally {
            setAddingTpl(false)
        }
    }

    const deleteTemplate = async (templateId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/templates?templateId=${templateId}`, { method: 'DELETE' })
            setTemplates(templates.filter((t) => t.id !== templateId))
            toast.success('Template deleted')
        } catch {
            toast.error('Failed to delete')
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
                toast.success('Hashtag group added')
            }
        } catch {
            toast.error('Failed to add group')
        } finally {
            setAddingHash(false)
        }
    }

    const deleteHashtagGroup = async (groupId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/hashtags?groupId=${groupId}`, { method: 'DELETE' })
            setHashtags(hashtags.filter((h) => h.id !== groupId))
            toast.success('Group deleted')
        } catch {
            toast.error('Failed to delete')
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
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/channels')}>
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
                        {channel.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Settings className="h-3.5 w-3.5" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="vibe" className="gap-1.5 text-xs">
                        <Palette className="h-3.5 w-3.5" />
                        Vibe & Tone
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        Knowledge
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="gap-1.5 text-xs">
                        <Hash className="h-3.5 w-3.5" />
                        Hashtags
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
                        <Bell className="h-3.5 w-3.5" />
                        Webhooks
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
                            { label: 'Posts', value: channel._count.posts, icon: FileText },
                            { label: 'Media', value: channel._count.mediaItems, icon: Palette },
                            { label: 'Knowledge', value: knowledgeEntries.length, icon: BookOpen },
                            { label: 'Templates', value: templates.length, icon: FileText },
                        ].map((stat) => (
                            <Card key={stat.label} className="p-4 text-center">
                                <stat.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ─── Vibe & Tone Tab ───────────────── */}
                <TabsContent value="vibe" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Brand Voice & Writing Style</CardTitle>
                            <CardDescription>Define how AI generates content for this channel</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['personality', 'writingStyle', 'vocabulary', 'targetAudience', 'brandValues'].map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                    <Textarea
                                        placeholder={`Describe the ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}...`}
                                        value={vibeTone[field] || ''}
                                        onChange={(e) => setVibeTone({ ...vibeTone, [field]: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Knowledge Base Tab ─────────────── */}
                <TabsContent value="knowledge" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Knowledge Base
                            </CardTitle>
                            <CardDescription>
                                Add information sources for AI to reference. Supports text, URLs, and Google Sheets.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add new entry */}
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Entry title..."
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
                                    placeholder={newKbType === 'text' ? 'Enter knowledge content...' : 'Additional notes (optional)...'}
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
                                    Add Entry
                                </Button>
                            </div>

                            <Separator />

                            {/* Existing entries */}
                            {knowledgeEntries.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No knowledge entries yet</p>
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
                                Content Templates
                            </CardTitle>
                            <CardDescription>
                                Reusable templates for posts. Use {'{{variable}}'} syntax for dynamic content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <Input
                                    placeholder="Template name..."
                                    value={newTplName}
                                    onChange={(e) => setNewTplName(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Template content... Use {{variable}} for dynamic parts"
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
                                    Add Template
                                </Button>
                            </div>

                            <Separator />

                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No templates yet</p>
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
                                Hashtag Groups
                            </CardTitle>
                            <CardDescription>
                                Organize hashtags into groups for quick reuse in posts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <Input
                                    placeholder="Group name (e.g. Brand, Campaign, Trending)"
                                    value={newHashName}
                                    onChange={(e) => setNewHashName(e.target.value)}
                                />
                                <Textarea
                                    placeholder="#hashtag1, #hashtag2, #hashtag3"
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
                                    Add Group
                                </Button>
                            </div>

                            <Separator />

                            {hashtags.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hashtag groups yet</p>
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
                                                        {(group.hashtags as string[]).length} tags
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
                                                            +{(group.hashtags as string[]).length - 8} more
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
                                Webhook Notifications
                            </CardTitle>
                            <CardDescription>
                                Get notified when posts are published or approved.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['Discord', 'Telegram', 'Slack'].map((platform) => (
                                <div key={platform} className="space-y-2">
                                    <Label>{platform} Webhook URL</Label>
                                    <Input placeholder={`https://hooks.${platform.toLowerCase()}.com/...`} />
                                </div>
                            ))}
                            <Separator />
                            <div className="space-y-2">
                                <Label>Custom Webhook URL</Label>
                                <Input placeholder="https://your-server.com/webhook" />
                                <p className="text-xs text-muted-foreground">
                                    Receives POST requests with event payloads in JSON format.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
