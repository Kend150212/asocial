'use client'

import { useTranslation } from '@/lib/i18n'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
    Save, Plus, Trash2, Loader2, Bot,
    MessageSquare, Brain, Shield, Clock, Target,
    Image as ImageIcon, Video, HelpCircle, FileText,
    Link as LinkIcon, FileSpreadsheet, ExternalLink,
    Upload, FolderOpen, X, Check, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'

// ─── Types ──────────────────────────────────────────────
interface MediaItem {
    id: string; url: string; thumbnailUrl?: string | null
    originalName?: string | null; type: string
}
interface BotConfigData {
    isEnabled: boolean
    botName: string
    greeting: string
    greetingMode: 'template' | 'auto'
    greetingImages: string[]
    personality: string
    language: string
    imageFolderId: string | null
    consultVideos: { title: string; url: string; description: string }[]
    confidenceThreshold: number
    maxBotReplies: number
    autoTagEnabled: boolean
    sentimentEnabled: boolean
    spamFilterEnabled: boolean
    autoTranslate: boolean
    smartAssignEnabled: boolean
    autoEscalateKeywords: string[]
    forbiddenTopics: string[]
    workingHoursOnly: boolean
    workingHoursStart: string | null
    workingHoursEnd: string | null
    offHoursMessage: string | null
    trainingPairs: { q: string; a: string; images?: string[] }[]
    exampleConvos: string[]
    enabledPlatforms: string[]
    applyToComments: boolean
    applyToMessages: boolean
}

interface ChatBotTabProps {
    channelId: string
}

export default function ChatBotTab({ channelId }: ChatBotTabProps) {
    const t = useTranslation()
    const [config, setConfig] = useState<BotConfigData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Training inputs
    const [newTrainingText, setNewTrainingText] = useState('')
    const [newTrainingImages, setNewTrainingImages] = useState<string[]>([])
    const [newTrainingUrl, setNewTrainingUrl] = useState('')
    const [newQaPair, setNewQaPair] = useState({ q: '', a: '' })
    const [newVideoTitle, setNewVideoTitle] = useState('')
    const [newVideoUrl, setNewVideoUrl] = useState('')
    const [newVideoDesc, setNewVideoDesc] = useState('')
    const [newEscalateKeyword, setNewEscalateKeyword] = useState('')
    const [newForbiddenTopic, setNewForbiddenTopic] = useState('')

    // Media state
    const [uploading, setUploading] = useState(false)
    const [mediaBrowserTarget, setMediaBrowserTarget] = useState<'greeting' | 'training' | 'library' | null>(null)
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [mediaLoading, setMediaLoading] = useState(false)
    const [botFolderId, setBotFolderId] = useState<string | null>(null)
    const [libraryImages, setLibraryImages] = useState<MediaItem[]>([])
    const greetingDropRef = useRef<HTMLDivElement>(null)
    const trainingDropRef = useRef<HTMLDivElement>(null)
    const libraryDropRef = useRef<HTMLDivElement>(null)
    const [dragOver, setDragOver] = useState<string | null>(null)

    // ─── Upload helper ────────────────────────────────────
    const uploadFiles = async (files: FileList | File[], targetFolderId?: string): Promise<string[]> => {
        const urls: string[] = []
        setUploading(true)
        for (const file of Array.from(files)) {
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('channelId', channelId)
                if (targetFolderId) formData.append('folderId', targetFolderId)
                const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
                if (res.ok) {
                    const data = await res.json()
                    urls.push(data.url || data.media?.url)
                } else {
                    const data = await res.json().catch(() => ({}))
                    if (res.status === 403 && data.code === 'GDRIVE_NOT_CONNECTED') {
                        toast.error('Chưa kết nối Google Drive', {
                            description: 'Vào Settings → API Keys để kết nối.',
                            action: { label: 'Kết nối', onClick: () => window.location.href = '/dashboard/api-keys' },
                        })
                        break
                    }
                    toast.error(`Upload failed: ${file.name}`)
                }
            } catch { toast.error(`Upload error: ${file.name}`) }
        }
        setUploading(false)
        return urls
    }

    // ─── Ensure bot media folder exists ───────────────────
    const ensureBotFolder = useCallback(async (): Promise<string | null> => {
        if (botFolderId) return botFolderId
        try {
            // Check if "ChatBot" folder exists
            const listRes = await fetch(`/api/admin/media/folders?channelId=${channelId}`)
            if (listRes.ok) {
                const { folders } = await listRes.json()
                const existing = folders.find((f: any) => f.name === 'ChatBot')
                if (existing) { setBotFolderId(existing.id); return existing.id }
            }
            // Create it
            const createRes = await fetch('/api/admin/media/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, name: 'ChatBot' }),
            })
            if (createRes.ok) {
                const { folder } = await createRes.json()
                setBotFolderId(folder.id)
                return folder.id
            }
        } catch { }
        return null
    }, [channelId, botFolderId])

    // ─── Load media browser items ─────────────────────────
    const loadMediaItems = useCallback(async (folderId?: string) => {
        setMediaLoading(true)
        try {
            const params = new URLSearchParams({ channelId, type: 'image' })
            if (folderId) params.set('folderId', folderId)
            const res = await fetch(`/api/admin/media?${params}`)
            if (res.ok) {
                const data = await res.json()
                setMediaItems(data.media || data.items || [])
            }
        } catch { }
        setMediaLoading(false)
    }, [channelId])

    // ─── Load library images ──────────────────────────────
    const loadLibraryImages = useCallback(async () => {
        if (!config?.imageFolderId) return
        try {
            const params = new URLSearchParams({ channelId, type: 'image', folderId: config.imageFolderId })
            const res = await fetch(`/api/admin/media?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLibraryImages(data.media || data.items || [])
            }
        } catch { }
    }, [channelId, config?.imageFolderId])

    // ─── Drag & drop handler factory ──────────────────────
    const makeDragHandlers = (zone: string, onDrop: (files: FileList) => void) => ({
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(zone) },
        onDragLeave: () => setDragOver(null),
        onDrop: (e: React.DragEvent) => {
            e.preventDefault(); setDragOver(null)
            if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files)
        },
    })

    // ─── Fetch config ─────────────────────────────────────
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`/api/admin/channels/${channelId}/bot-config`)
                if (res.ok) {
                    const data = await res.json()
                    setConfig({
                        isEnabled: data.isEnabled ?? true,
                        botName: data.botName || 'AI Assistant',
                        greeting: data.greeting || '',
                        greetingMode: data.greetingMode || 'template',
                        greetingImages: data.greetingImages || [],
                        personality: data.personality || '',
                        language: data.language || 'vi',
                        imageFolderId: data.imageFolderId || null,
                        consultVideos: data.consultVideos || [],
                        confidenceThreshold: data.confidenceThreshold ?? 0.7,
                        maxBotReplies: data.maxBotReplies ?? 10,
                        autoTagEnabled: data.autoTagEnabled ?? true,
                        sentimentEnabled: data.sentimentEnabled ?? true,
                        spamFilterEnabled: data.spamFilterEnabled ?? true,
                        autoTranslate: data.autoTranslate ?? false,
                        smartAssignEnabled: data.smartAssignEnabled ?? false,
                        autoEscalateKeywords: data.autoEscalateKeywords || [],
                        forbiddenTopics: data.forbiddenTopics || [],
                        workingHoursOnly: data.workingHoursOnly ?? false,
                        workingHoursStart: data.workingHoursStart || null,
                        workingHoursEnd: data.workingHoursEnd || null,
                        offHoursMessage: data.offHoursMessage || null,
                        trainingPairs: data.trainingPairs || [],
                        exampleConvos: data.exampleConvos || [],
                        enabledPlatforms: data.enabledPlatforms || ['all'],
                        applyToComments: data.applyToComments ?? true,
                        applyToMessages: data.applyToMessages ?? true,
                    })
                }
            } catch { /* ignore */ }
            setLoading(false)
        }
        fetchConfig()
    }, [channelId])

    // ─── Save config ──────────────────────────────────────
    const saveConfig = useCallback(async () => {
        if (!config) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/channels/${channelId}/bot-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            })
            if (res.ok) {
                toast.success('Bot settings saved!')
            } else {
                toast.error('Failed to save bot settings')
            }
        } catch {
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }, [channelId, config])

    // ─── Helper to update config ──────────────────────────
    const update = <K extends keyof BotConfigData>(key: K, value: BotConfigData[K]) => {
        setConfig(prev => prev ? { ...prev, [key]: value } : prev)
    }

    // ─── Add training via Knowledge Base API ──────────────
    const addKnowledgeEntry = async (title: string, content: string, sourceType: string, sourceUrl?: string) => {
        try {
            const res = await fetch(`/api/admin/channels/${channelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    knowledgeBase: [{
                        action: 'add',
                        title,
                        content,
                        sourceType,
                        sourceUrl: sourceUrl || null,
                    }],
                }),
            })
            if (res.ok) {
                toast.success(`Training data added: ${title}`)
            } else {
                toast.error('Failed to add training data')
            }
        } catch {
            toast.error('Network error')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!config) return null

    return (
        <div className="space-y-4">
            {/* ─── Header with Save ─────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="font-semibold">{t('chatbot.title')}</h3>
                        <p className="text-xs text-muted-foreground">{t('chatbot.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="bot-enable" className="text-sm">{t('chatbot.enableBot')}</Label>
                        <Switch
                            id="bot-enable"
                            checked={config.isEnabled}
                            onCheckedChange={v => update('isEnabled', v)}
                        />
                    </div>
                    <Button onClick={saveConfig} disabled={saving} size="sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        {t('chatbot.save')}
                    </Button>
                </div>
            </div>

            {!config.isEnabled && (
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
                    <CardContent className="py-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            ⚠️ {t('chatbot.botDisabled')}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Accordion type="multiple" defaultValue={['general', 'training']} className="space-y-2">
                {/* ═══════════════════════════════════════ */}
                {/* GENERAL SETTINGS                       */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="general" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{t('chatbot.general.title')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">{t('chatbot.general.botName')}</Label>
                                <Input
                                    value={config.botName}
                                    onChange={e => update('botName', e.target.value)}
                                    placeholder="AI Assistant"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">{t('chatbot.general.language')}</Label>
                                <select
                                    value={config.language}
                                    onChange={e => update('language', e.target.value)}
                                    className="w-full mt-1 h-9 px-3 text-sm rounded-md border border-input bg-background"
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">English</option>
                                    <option value="fr">Français</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                    <option value="zh">中文</option>
                                </select>
                            </div>
                        </div>
                        {/* Greeting Mode Toggle */}
                        <div>
                            <Label className="text-xs">{t('chatbot.general.greetingMode')}</Label>
                            <div className="flex gap-2 mt-1">
                                <Button size="sm" variant={config.greetingMode === 'template' ? 'default' : 'outline'}
                                    onClick={() => update('greetingMode', 'template')} className="text-xs gap-1">
                                    <MessageSquare className="h-3 w-3" /> {t('chatbot.general.modeTemplate')}
                                </Button>
                                <Button size="sm" variant={config.greetingMode === 'auto' ? 'default' : 'outline'}
                                    onClick={() => update('greetingMode', 'auto')} className="text-xs gap-1">
                                    <Sparkles className="h-3 w-3" /> {t('chatbot.general.modeAuto')}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {config.greetingMode === 'template'
                                    ? t('chatbot.general.modeTemplateDesc')
                                    : t('chatbot.general.modeAutoDesc')}
                            </p>
                        </div>

                        {config.greetingMode === 'template' && (
                            <div>
                                <Label className="text-xs">{t('chatbot.general.greetingMessage')}</Label>
                                <Textarea
                                    value={config.greeting}
                                    onChange={e => update('greeting', e.target.value)}
                                    placeholder={t('chatbot.general.greetingPlaceholder')}
                                    rows={3} className="mt-1"
                                />
                            </div>
                        )}

                        {/* Greeting Images — Drag & Drop + Media Browse */}
                        <div>
                            <Label className="text-xs flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" /> {t('chatbot.general.greetingImages')}
                            </Label>
                            {config.greetingImages.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {config.greetingImages.map((url, i) => (
                                        <div key={i} className="relative group">
                                            <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border" />
                                            <button
                                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => update('greetingImages', config.greetingImages.filter((_, j) => j !== i))}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div
                                ref={greetingDropRef}
                                className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                                    ${dragOver === 'greeting' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                                {...makeDragHandlers('greeting', async (files) => {
                                    const folderId = await ensureBotFolder()
                                    const urls = await uploadFiles(files, folderId || undefined)
                                    if (urls.length) update('greetingImages', [...config.greetingImages, ...urls])
                                })}
                                onClick={() => { setMediaBrowserTarget('greeting'); loadMediaItems() }}
                            >
                                {uploading ? (
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> {t('chatbot.mediaBrowser.uploading')}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">{t('chatbot.mediaBrowser.dragDropHint')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">{t('chatbot.general.personality')}</Label>
                            <Textarea
                                value={config.personality}
                                onChange={e => update('personality', e.target.value)}
                                placeholder={t('chatbot.general.personalityPlaceholder')}
                                rows={4}
                                className="mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {t('chatbot.general.personalityHint')}
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ═══════════════════════════════════════ */}
                {/* TRAINING (CORE)                        */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="training" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{t('chatbot.training.title')}</span>
                            <Badge variant="secondary" className="text-[9px]">{t('chatbot.training.core')}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pb-4">

                        {/* ── Text Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    {t('chatbot.training.textTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.textDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-3">
                                <Textarea
                                    value={newTrainingText}
                                    onChange={e => setNewTrainingText(e.target.value)}
                                    placeholder={t('chatbot.training.textPlaceholder')}
                                    rows={6}
                                />
                                {/* Training Image Attachments */}
                                {newTrainingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newTrainingImages.map((url, i) => (
                                            <div key={i} className="relative group">
                                                <img src={url} alt="" className="h-12 w-12 rounded object-cover border" />
                                                <button className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setNewTrainingImages(prev => prev.filter((_, j) => j !== i))}>
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    ref={trainingDropRef}
                                    className={`border-2 border-dashed rounded-md p-2 text-center transition-colors
                                        ${dragOver === 'training' ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}
                                    {...makeDragHandlers('training', async (files) => {
                                        const folderId = await ensureBotFolder()
                                        const urls = await uploadFiles(files, folderId || undefined)
                                        if (urls.length) setNewTrainingImages(prev => [...prev, ...urls])
                                    })}
                                >
                                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                        <ImageIcon className="h-3 w-3" /> {t('chatbot.training.dragImagesHint')}
                                    </p>
                                </div>
                                <Button
                                    size="sm" variant="outline"
                                    onClick={async () => {
                                        if (!newTrainingText.trim()) return
                                        const content = newTrainingImages.length
                                            ? `${newTrainingText.trim()}\n\n[Attached images: ${newTrainingImages.join(', ')}]`
                                            : newTrainingText.trim()
                                        await addKnowledgeEntry(
                                            `Training text - ${new Date().toLocaleDateString()}`,
                                            content, 'text'
                                        )
                                        setNewTrainingText('')
                                        setNewTrainingImages([])
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> {t('chatbot.training.addTextTraining')}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* ── URL Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-green-500" />
                                    {t('chatbot.training.urlTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.urlDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newTrainingUrl}
                                        onChange={e => setNewTrainingUrl(e.target.value)}
                                        placeholder={t('chatbot.training.urlPlaceholder')}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm" variant="outline"
                                        onClick={async () => {
                                            if (!newTrainingUrl.trim()) return
                                            await addKnowledgeEntry(
                                                `URL: ${new URL(newTrainingUrl.trim()).hostname}`,
                                                `Source URL: ${newTrainingUrl.trim()}\n(Content will be crawled automatically)`,
                                                'url',
                                                newTrainingUrl.trim()
                                            )
                                            setNewTrainingUrl('')
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> {t('chatbot.training.addUrl')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Google Sheet Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                    {t('chatbot.training.sheetTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.sheetDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('chatbot.training.sheetPlaceholder')}
                                        className="text-sm"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const url = (e.target as HTMLInputElement).value.trim()
                                                if (!url) return
                                                await addKnowledgeEntry(
                                                    `Google Sheet: ${url.substring(0, 50)}...`,
                                                    `Source: ${url}\n(Data will be fetched)`,
                                                    'google_sheet',
                                                    url
                                                );
                                                (e.target as HTMLInputElement).value = ''
                                            }
                                        }}
                                    />
                                    <Button size="sm" variant="outline" className="shrink-0">
                                        <ExternalLink className="h-3 w-3 mr-1" /> {t('chatbot.training.addSheet')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Image Library ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-orange-500" />
                                    {t('chatbot.training.imageLibTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.imageLibDesc')}
                                    <br />
                                    {t('chatbot.training.imageLibExample')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-3">
                                {/* Auto-create or connect to dedicated folder */}
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="text-xs gap-1"
                                        onClick={async () => {
                                            const fId = await ensureBotFolder()
                                            if (fId) {
                                                update('imageFolderId', fId)
                                                toast.success(t('chatbot.training.folderReady'))
                                                loadLibraryImages()
                                            }
                                        }}>
                                        <FolderOpen className="h-3 w-3" /> {config.imageFolderId ? t('chatbot.training.refresh') : t('chatbot.training.createBotFolder')}
                                    </Button>
                                    {config.imageFolderId && (
                                        <Badge variant="secondary" className="text-[9px] gap-1">
                                            <Check className="h-2.5 w-2.5" /> {t('chatbot.training.folderConnected')}
                                        </Badge>
                                    )}
                                </div>

                                {/* Thumbnails grid */}
                                {libraryImages.length > 0 && (
                                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                                        {libraryImages.map(img => (
                                            <div key={img.id} className="relative group" title={img.originalName || ''}>
                                                <img src={img.thumbnailUrl || img.url} alt={img.originalName || ''}
                                                    className="h-14 w-full rounded object-cover border" />
                                                <p className="text-[8px] text-muted-foreground truncate mt-0.5">{img.originalName}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Drag-drop upload area */}
                                <div
                                    ref={libraryDropRef}
                                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                                        ${dragOver === 'library' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                                    {...makeDragHandlers('library', async (files) => {
                                        const fId = config.imageFolderId || await ensureBotFolder()
                                        if (fId && !config.imageFolderId) update('imageFolderId', fId)
                                        const urls = await uploadFiles(files, fId || undefined)
                                        if (urls.length) { toast.success(t('chatbot.training.imagesAdded').replace('{count}', String(urls.length))); loadLibraryImages() }
                                    })}
                                    onClick={() => { setMediaBrowserTarget('library'); loadMediaItems() }}
                                >
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" /> {t('chatbot.mediaBrowser.uploading')}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">{t('chatbot.training.dragOrBrowse')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Video Consultation ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Video className="h-4 w-4 text-red-500" />
                                    {t('chatbot.training.videoTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.videoDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                {config.consultVideos.map((v, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                                        <Video className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium">{v.title}</p>
                                            <a href={v.url} target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline truncate block">{v.url}</a>
                                            {v.description && <p className="text-[10px] text-muted-foreground mt-0.5">{v.description}</p>}
                                        </div>
                                        <Button
                                            size="sm" variant="ghost" className="shrink-0"
                                            onClick={() => update('consultVideos', config.consultVideos.filter((_, j) => j !== i))}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="space-y-2 border rounded-md p-3">
                                    <Input
                                        value={newVideoTitle}
                                        onChange={e => setNewVideoTitle(e.target.value)}
                                        placeholder={t('chatbot.training.videoTitleInput')}
                                        className="text-sm"
                                    />
                                    <Input
                                        value={newVideoUrl}
                                        onChange={e => setNewVideoUrl(e.target.value)}
                                        placeholder={t('chatbot.training.videoUrlInput')}
                                        className="text-sm"
                                    />
                                    <Input
                                        value={newVideoDesc}
                                        onChange={e => setNewVideoDesc(e.target.value)}
                                        placeholder={t('chatbot.training.videoDescInput')}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm" variant="outline"
                                        onClick={() => {
                                            if (!newVideoTitle.trim() || !newVideoUrl.trim()) return
                                            update('consultVideos', [
                                                ...config.consultVideos,
                                                { title: newVideoTitle.trim(), url: newVideoUrl.trim(), description: newVideoDesc.trim() },
                                            ])
                                            setNewVideoTitle('')
                                            setNewVideoUrl('')
                                            setNewVideoDesc('')
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> {t('chatbot.training.addVideo')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Q&A Training Pairs ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-indigo-500" />
                                    {t('chatbot.training.qaTitle')}
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {t('chatbot.training.qaDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                {config.trainingPairs.map((pair, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md text-xs">
                                        <div className="flex-1 min-w-0">
                                            <p><span className="font-medium text-blue-600">Q:</span> {pair.q}</p>
                                            <p><span className="font-medium text-green-600">A:</span> {pair.a}</p>
                                        </div>
                                        <Button
                                            size="sm" variant="ghost" className="shrink-0"
                                            onClick={() => update('trainingPairs', config.trainingPairs.filter((_, j) => j !== i))}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="space-y-2 border rounded-md p-3">
                                    <Input
                                        value={newQaPair.q}
                                        onChange={e => setNewQaPair({ ...newQaPair, q: e.target.value })}
                                        placeholder={t('chatbot.training.questionPlaceholder')}
                                        className="text-sm"
                                    />
                                    <Textarea
                                        value={newQaPair.a}
                                        onChange={e => setNewQaPair({ ...newQaPair, a: e.target.value })}
                                        placeholder={t('chatbot.training.answerPlaceholder')}
                                        rows={2}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm" variant="outline"
                                        onClick={() => {
                                            if (!newQaPair.q.trim() || !newQaPair.a.trim()) return
                                            update('trainingPairs', [
                                                ...config.trainingPairs,
                                                { q: newQaPair.q.trim(), a: newQaPair.a.trim() },
                                            ])
                                            setNewQaPair({ q: '', a: '' })
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> {t('chatbot.training.addQaPair')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </AccordionContent>
                </AccordionItem>

                {/* ═══════════════════════════════════════ */}
                {/* BEHAVIOR                               */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="behavior" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-cyan-500" />
                            <span className="font-medium">{t('chatbot.behavior.title')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div>
                            <Label className="text-xs">{t('chatbot.behavior.confidence')}: {(config.confidenceThreshold * 100).toFixed(0)}%</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                {t('chatbot.behavior.confidenceDesc')}
                            </p>
                            <Slider
                                value={[config.confidenceThreshold]}
                                min={0} max={1} step={0.05}
                                onValueChange={([v]) => update('confidenceThreshold', v)}
                            />
                        </div>

                        <div>
                            <Label className="text-xs">{t('chatbot.behavior.maxReplies')}</Label>
                            <Input
                                type="number" min={1} max={100}
                                value={config.maxBotReplies}
                                onChange={e => update('maxBotReplies', parseInt(e.target.value) || 10)}
                                className="mt-1 w-24"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {t('chatbot.behavior.maxRepliesDesc').replace('{count}', String(config.maxBotReplies))}
                            </p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'autoTagEnabled' as const, label: t('chatbot.behavior.autoTag'), desc: t('chatbot.behavior.autoTagDesc') },
                                { key: 'sentimentEnabled' as const, label: t('chatbot.behavior.sentiment'), desc: t('chatbot.behavior.sentimentDesc') },
                                { key: 'spamFilterEnabled' as const, label: t('chatbot.behavior.spamFilter'), desc: t('chatbot.behavior.spamFilterDesc') },
                                { key: 'autoTranslate' as const, label: t('chatbot.behavior.autoTranslate'), desc: t('chatbot.behavior.autoTranslateDesc') },
                                { key: 'smartAssignEnabled' as const, label: t('chatbot.behavior.smartAssign'), desc: t('chatbot.behavior.smartAssignDesc') },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                    <div>
                                        <p className="text-xs font-medium">{item.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <Switch
                                        checked={config[item.key]}
                                        onCheckedChange={v => update(item.key, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ═══════════════════════════════════════ */}
                {/* ESCALATION                             */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="escalation" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-500" />
                            <span className="font-medium">{t('chatbot.escalation.title')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div>
                            <Label className="text-xs">{t('chatbot.escalation.keywordsLabel')}</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                {t('chatbot.escalation.keywordsDesc')}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {config.autoEscalateKeywords.map((kw, i) => (
                                    <Badge key={i} variant="destructive" className="text-[10px] gap-1">
                                        {kw}
                                        <button onClick={() => update('autoEscalateKeywords', config.autoEscalateKeywords.filter((_, j) => j !== i))}>×</button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newEscalateKeyword}
                                    onChange={e => setNewEscalateKeyword(e.target.value)}
                                    placeholder={t('chatbot.escalation.keywordsPlaceholder')}
                                    className="text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newEscalateKeyword.trim()) {
                                            update('autoEscalateKeywords', [...config.autoEscalateKeywords, newEscalateKeyword.trim()])
                                            setNewEscalateKeyword('')
                                        }
                                    }}
                                />
                                <Button size="sm" variant="outline" onClick={() => {
                                    if (newEscalateKeyword.trim()) {
                                        update('autoEscalateKeywords', [...config.autoEscalateKeywords, newEscalateKeyword.trim()])
                                        setNewEscalateKeyword('')
                                    }
                                }}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <Label className="text-xs">{t('chatbot.escalation.forbiddenLabel')}</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                {t('chatbot.escalation.forbiddenDesc')}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {config.forbiddenTopics.map((topic, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] gap-1 border-red-300">
                                        {topic}
                                        <button onClick={() => update('forbiddenTopics', config.forbiddenTopics.filter((_, j) => j !== i))}>×</button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newForbiddenTopic}
                                    onChange={e => setNewForbiddenTopic(e.target.value)}
                                    placeholder={t('chatbot.escalation.forbiddenPlaceholder')}
                                    className="text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newForbiddenTopic.trim()) {
                                            update('forbiddenTopics', [...config.forbiddenTopics, newForbiddenTopic.trim()])
                                            setNewForbiddenTopic('')
                                        }
                                    }}
                                />
                                <Button size="sm" variant="outline" onClick={() => {
                                    if (newForbiddenTopic.trim()) {
                                        update('forbiddenTopics', [...config.forbiddenTopics, newForbiddenTopic.trim()])
                                        setNewForbiddenTopic('')
                                    }
                                }}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ═══════════════════════════════════════ */}
                {/* WORKING HOURS                          */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="hours" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">{t('chatbot.hours.title')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium">{t('chatbot.hours.enableLabel')}</p>
                                <p className="text-[10px] text-muted-foreground">{t('chatbot.hours.enableDesc')}</p>
                            </div>
                            <Switch
                                checked={config.workingHoursOnly}
                                onCheckedChange={v => update('workingHoursOnly', v)}
                            />
                        </div>

                        {config.workingHoursOnly && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs">{t('chatbot.hours.startTime')}</Label>
                                        <Input
                                            type="time"
                                            value={config.workingHoursStart || '08:00'}
                                            onChange={e => update('workingHoursStart', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">{t('chatbot.hours.endTime')}</Label>
                                        <Input
                                            type="time"
                                            value={config.workingHoursEnd || '22:00'}
                                            onChange={e => update('workingHoursEnd', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">{t('chatbot.hours.offHoursMessage')}</Label>
                                    <Textarea
                                        value={config.offHoursMessage || ''}
                                        onChange={e => update('offHoursMessage', e.target.value)}
                                        placeholder={t('chatbot.hours.offHoursPlaceholder')}
                                        rows={2}
                                        className="mt-1"
                                    />
                                </div>
                            </>
                        )}
                    </AccordionContent>
                </AccordionItem>

                {/* ═══════════════════════════════════════ */}
                {/* SCOPE                                  */}
                {/* ═══════════════════════════════════════ */}
                <AccordionItem value="scope" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-teal-500" />
                            <span className="font-medium">{t('chatbot.scope.title')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div>
                                    <p className="text-xs font-medium">{t('chatbot.scope.messages')}</p>
                                    <p className="text-[10px] text-muted-foreground">{t('chatbot.scope.messagesDesc')}</p>
                                </div>
                                <Switch
                                    checked={config.applyToMessages}
                                    onCheckedChange={v => update('applyToMessages', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div>
                                    <p className="text-xs font-medium">{t('chatbot.scope.comments')}</p>
                                    <p className="text-[10px] text-muted-foreground">{t('chatbot.scope.commentsDesc')}</p>
                                </div>
                                <Switch
                                    checked={config.applyToComments}
                                    onCheckedChange={v => update('applyToComments', v)}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* ─── Bottom Save ─────────────────────── */}
            <div className="flex justify-end pt-2">
                <Button onClick={saveConfig} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    {t('chatbot.save')}
                </Button>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* MEDIA BROWSER MODAL                    */}
            {mediaBrowserTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMediaBrowserTarget(null)}>
                    <div className="bg-background rounded-xl shadow-2xl w-[600px] max-h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> {t('chatbot.mediaBrowser.title')}
                            </h4>
                            <Button size="sm" variant="ghost" onClick={() => setMediaBrowserTarget(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {mediaLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : mediaItems.length === 0 ? (
                                <div className="text-center py-10 text-sm text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    {t('chatbot.mediaBrowser.empty')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {mediaItems.map(item => (
                                        <button key={item.id}
                                            className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
                                            onClick={() => {
                                                const url = item.url
                                                if (mediaBrowserTarget === 'greeting') {
                                                    update('greetingImages', [...(config?.greetingImages || []), url])
                                                } else if (mediaBrowserTarget === 'training') {
                                                    setNewTrainingImages(prev => [...prev, url])
                                                } else if (mediaBrowserTarget === 'library') {
                                                    // Copy image reference — it's already in media
                                                    toast.success(t('chatbot.mediaBrowser.selectedForLibrary'))
                                                }
                                                setMediaBrowserTarget(null)
                                            }}
                                        >
                                            <img src={item.thumbnailUrl || item.url} alt={item.originalName || ''}
                                                className="h-24 w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Check className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                            </div>
                                            <p className="text-[9px] text-muted-foreground p-1 truncate">{item.originalName}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
