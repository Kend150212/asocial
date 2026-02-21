'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    Save, Plus, Trash2, Loader2, Bot,
    MessageSquare, Brain, Shield, Clock, Target,
    Image as ImageIcon, Video, HelpCircle, FileText,
    Link as LinkIcon, FileSpreadsheet, ExternalLink,
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
interface BotConfigData {
    isEnabled: boolean
    botName: string
    greeting: string
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
    trainingPairs: { q: string; a: string }[]
    exampleConvos: string[]
    enabledPlatforms: string[]
    applyToComments: boolean
    applyToMessages: boolean
}

interface ChatBotTabProps {
    channelId: string
}

export default function ChatBotTab({ channelId }: ChatBotTabProps) {
    const [config, setConfig] = useState<BotConfigData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Training inputs
    const [newTrainingText, setNewTrainingText] = useState('')
    const [newTrainingUrl, setNewTrainingUrl] = useState('')
    const [newQaPair, setNewQaPair] = useState({ q: '', a: '' })
    const [newVideoTitle, setNewVideoTitle] = useState('')
    const [newVideoUrl, setNewVideoUrl] = useState('')
    const [newVideoDesc, setNewVideoDesc] = useState('')
    const [newEscalateKeyword, setNewEscalateKeyword] = useState('')
    const [newForbiddenTopic, setNewForbiddenTopic] = useState('')
    const [newGreetingImage, setNewGreetingImage] = useState('')

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
                        <h3 className="font-semibold">Chat Bot Settings</h3>
                        <p className="text-xs text-muted-foreground">Configure AI auto-reply behavior and training</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="bot-enable" className="text-sm">Enable Bot</Label>
                        <Switch
                            id="bot-enable"
                            checked={config.isEnabled}
                            onCheckedChange={v => update('isEnabled', v)}
                        />
                    </div>
                    <Button onClick={saveConfig} disabled={saving} size="sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Bot Settings
                    </Button>
                </div>
            </div>

            {!config.isEnabled && (
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
                    <CardContent className="py-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            ⚠️ Bot is disabled. Enable it to auto-reply to customer messages.
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
                            <span className="font-medium">General</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Bot Name</Label>
                                <Input
                                    value={config.botName}
                                    onChange={e => update('botName', e.target.value)}
                                    placeholder="AI Assistant"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Language</Label>
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

                        <div>
                            <Label className="text-xs">Greeting Message (first message to customer)</Label>
                            <Textarea
                                value={config.greeting}
                                onChange={e => update('greeting', e.target.value)}
                                placeholder="Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?"
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        {/* Greeting Images */}
                        <div>
                            <Label className="text-xs flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" /> Greeting Images (sent with greeting)
                            </Label>
                            <div className="mt-1 space-y-2">
                                {config.greetingImages.map((url, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <img src={url} alt="" className="h-10 w-10 rounded object-cover border" />
                                        <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                                        <Button
                                            size="sm" variant="ghost"
                                            onClick={() => update('greetingImages', config.greetingImages.filter((_, j) => j !== i))}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Input
                                        value={newGreetingImage}
                                        onChange={e => setNewGreetingImage(e.target.value)}
                                        placeholder="Paste image URL..."
                                        className="text-xs"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => {
                                        if (newGreetingImage.trim()) {
                                            update('greetingImages', [...config.greetingImages, newGreetingImage.trim()])
                                            setNewGreetingImage('')
                                        }
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Personality & Instructions</Label>
                            <Textarea
                                value={config.personality}
                                onChange={e => update('personality', e.target.value)}
                                placeholder="Bạn là trợ lý thân thiện, chuyên nghiệp. Trả lời ngắn gọn, chính xác. Khi không biết thông tin, hãy để lại số điện thoại của khách để nhân viên liên hệ lại."
                                rows={4}
                                className="mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Đây là hướng dẫn cho bot cách trả lời khách hàng. Càng chi tiết càng tốt.
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
                            <span className="font-medium">Training</span>
                            <Badge variant="secondary" className="text-[9px]">Core</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pb-4">

                        {/* ── Text Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    Text Training
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Nhập thông tin sản phẩm/dịch vụ để bot học và trả lời khách hàng
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                <Textarea
                                    value={newTrainingText}
                                    onChange={e => setNewTrainingText(e.target.value)}
                                    placeholder={`Nhập thông tin theo mẫu:\n\n📦 Sản phẩm: Cà phê sữa đá\n💰 Giá: 35.000đ\n📝 Mô tả: Cà phê nguyên chất pha phin truyền thống...\n📍 Địa chỉ: 123 Nguyễn Huệ, Q1\n📞 Hotline: 0909 123 456\n\nHoặc nhập FAQ:\nHỏi: Giờ mở cửa?\nĐáp: Chúng tôi mở cửa từ 7h - 22h hàng ngày.`}
                                    rows={6}
                                />
                                <Button
                                    size="sm" variant="outline"
                                    onClick={async () => {
                                        if (!newTrainingText.trim()) return
                                        await addKnowledgeEntry(
                                            `Training text - ${new Date().toLocaleDateString()}`,
                                            newTrainingText.trim(),
                                            'text'
                                        )
                                        setNewTrainingText('')
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Text Training
                                </Button>
                            </CardContent>
                        </Card>

                        {/* ── URL Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-green-500" />
                                    URL Training
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Nhập URL website → hệ thống sẽ crawl nội dung để bot học
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newTrainingUrl}
                                        onChange={e => setNewTrainingUrl(e.target.value)}
                                        placeholder="https://example.com/san-pham"
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
                                        <Plus className="h-3 w-3 mr-1" /> Add URL
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Google Sheet Training ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                    Google Sheet Training
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Nhập URL Google Sheet chứa dữ liệu sản phẩm/dịch vụ
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
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
                                        <ExternalLink className="h-3 w-3 mr-1" /> Add Sheet
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Image Library ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-orange-500" />
                                    Image Library
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Kho hình ảnh từ Google Drive. Bot sẽ tìm hình theo tên và gửi cho khách hàng.
                                    <br />
                                    Ví dụ: Hình tên "Phong-109.jpg" → khi khách hỏi "cho xem phòng 109" → bot gửi hình đó.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                <div>
                                    <Label className="text-xs">Google Drive Folder ID</Label>
                                    <Input
                                        value={config.imageFolderId || ''}
                                        onChange={e => update('imageFolderId', e.target.value || null)}
                                        placeholder="Paste Google Drive folder ID (from URL)"
                                        className="mt-1 text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Lấy ID từ URL: drive.google.com/drive/folders/<strong>FOLDER_ID</strong>
                                    </p>
                                </div>
                                {config.imageFolderId && (
                                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2">
                                        <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                                            ✅ Image folder connected. Bot will search images by filename when customers ask.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Video Consultation ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Video className="h-4 w-4 text-red-500" />
                                    Video Consultation
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Video hướng dẫn tư vấn. Bot sẽ gửi link video khi khách hỏi liên quan.
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
                                        placeholder="Video title (e.g. Hướng dẫn đặt phòng)"
                                        className="text-sm"
                                    />
                                    <Input
                                        value={newVideoUrl}
                                        onChange={e => setNewVideoUrl(e.target.value)}
                                        placeholder="Video URL (YouTube, Vimeo...)"
                                        className="text-sm"
                                    />
                                    <Input
                                        value={newVideoDesc}
                                        onChange={e => setNewVideoDesc(e.target.value)}
                                        placeholder="Short description (optional)"
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
                                        <Plus className="h-3 w-3 mr-1" /> Add Video
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Q&A Training Pairs ── */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-indigo-500" />
                                    Q&A Training Pairs
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    Các cặp câu hỏi → trả lời. Bot sẽ ưu tiên dùng câu trả lời chính xác nếu khớp.
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
                                        placeholder="Question: Giờ mở cửa?"
                                        className="text-sm"
                                    />
                                    <Textarea
                                        value={newQaPair.a}
                                        onChange={e => setNewQaPair({ ...newQaPair, a: e.target.value })}
                                        placeholder="Answer: Chúng tôi mở cửa từ 7h - 22h hàng ngày, kể cả lễ tết."
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
                                        <Plus className="h-3 w-3 mr-1" /> Add Q&A Pair
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
                            <span className="font-medium">Behavior</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div>
                            <Label className="text-xs">Confidence Threshold: {(config.confidenceThreshold * 100).toFixed(0)}%</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                Bot chỉ trả lời nếu độ tự tin ≥ ngưỡng này. Dưới ngưỡng → chuyển cho nhân viên.
                            </p>
                            <Slider
                                value={[config.confidenceThreshold]}
                                min={0} max={1} step={0.05}
                                onValueChange={([v]) => update('confidenceThreshold', v)}
                            />
                        </div>

                        <div>
                            <Label className="text-xs">Max Bot Replies (before escalation)</Label>
                            <Input
                                type="number" min={1} max={100}
                                value={config.maxBotReplies}
                                onChange={e => update('maxBotReplies', parseInt(e.target.value) || 10)}
                                className="mt-1 w-24"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Sau {config.maxBotReplies} lần trả lời → tự động chuyển cho nhân viên.
                            </p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'autoTagEnabled' as const, label: 'Auto Tag', desc: 'Tự động tag conversation' },
                                { key: 'sentimentEnabled' as const, label: 'Sentiment Analysis', desc: 'Phân tích cảm xúc khách' },
                                { key: 'spamFilterEnabled' as const, label: 'Spam Filter', desc: 'Lọc tin nhắn spam' },
                                { key: 'autoTranslate' as const, label: 'Auto Translate', desc: 'Tự dịch ngôn ngữ khách' },
                                { key: 'smartAssignEnabled' as const, label: 'Smart Assign', desc: 'Giao cho agent phù hợp' },
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
                            <span className="font-medium">Escalation</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div>
                            <Label className="text-xs">Auto-Escalate Keywords</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                Khi khách nhắn chứa từ khóa này → chuyển ngay cho nhân viên.
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
                                    placeholder="e.g. refund, complaint, angry..."
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
                            <Label className="text-xs">Forbidden Topics</Label>
                            <p className="text-[10px] text-muted-foreground mb-2">
                                Bot sẽ KHÔNG trả lời về các chủ đề này → thông báo liên hệ nhân viên.
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
                                    placeholder="e.g. giá cả, khuyến mãi, bảo hành..."
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
                            <span className="font-medium">Working Hours</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium">Only respond during working hours</p>
                                <p className="text-[10px] text-muted-foreground">Ngoài giờ làm việc → gửi tin nhắn off-hours</p>
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
                                        <Label className="text-xs">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={config.workingHoursStart || '08:00'}
                                            onChange={e => update('workingHoursStart', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">End Time</Label>
                                        <Input
                                            type="time"
                                            value={config.workingHoursEnd || '22:00'}
                                            onChange={e => update('workingHoursEnd', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Off-Hours Message</Label>
                                    <Textarea
                                        value={config.offHoursMessage || ''}
                                        onChange={e => update('offHoursMessage', e.target.value)}
                                        placeholder="Cảm ơn bạn đã liên hệ! Hiện tại ngoài giờ làm việc. Chúng tôi sẽ phản hồi sớm nhất vào ngày mai. 🙏"
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
                            <span className="font-medium">Scope</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div>
                                    <p className="text-xs font-medium">Apply to Messages</p>
                                    <p className="text-[10px] text-muted-foreground">Bot trả lời tin nhắn DM</p>
                                </div>
                                <Switch
                                    checked={config.applyToMessages}
                                    onCheckedChange={v => update('applyToMessages', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div>
                                    <p className="text-xs font-medium">Apply to Comments</p>
                                    <p className="text-[10px] text-muted-foreground">Bot trả lời comment</p>
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
                    Save Bot Settings
                </Button>
            </div>
        </div>
    )
}
