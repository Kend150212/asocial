'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Plus,
    Search,
    Megaphone,
    Globe,
    Users,
    FileText,
    MoreHorizontal,
    Pencil,
    Trash2,
    ExternalLink,
    Hash,
    BookOpen,
    ChevronRight,
    ChevronLeft,
    Check,
    Sparkles,
    Palette,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Platform icon colors
const platformColors: Record<string, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    x: '#000000',
    twitter: '#1DA1F2',
    tiktok: '#00F2EA',
    youtube: '#FF0000',
    linkedin: '#0A66C2',
    pinterest: '#E60023',
    gbp: '#4285F4',
}

interface ChannelPlatform {
    platform: string
    accountName: string
    isActive: boolean
}

interface ChannelMember {
    role: string
    user: { name: string | null; email: string }
}

interface Channel {
    id: string
    name: string
    displayName: string
    isActive: boolean
    language: string
    createdAt: string
    platforms: ChannelPlatform[]
    members: ChannelMember[]
    _count: {
        members: number
        posts: number
        knowledgeBase: number
        platforms: number
    }
}

export default function AdminChannelsPage() {
    const t = useTranslation()
    const router = useRouter()
    const { data: session } = useSession()
    const canCreateChannel = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER'
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)

    // Wizard state
    const [wizardStep, setWizardStep] = useState(1)
    const [newName, setNewName] = useState('')
    const [newDisplayName, setNewDisplayName] = useState('')
    const [newLanguage, setNewLanguage] = useState('en')
    const [newDescription, setNewDescription] = useState('')
    const [newAiProvider, setNewAiProvider] = useState('')
    const [newVibe, setNewVibe] = useState('')
    const [creating, setCreating] = useState(false)
    const [userProviders, setUserProviders] = useState<{ provider: string; name: string }[]>([])

    const vibePresets = [
        { id: 'professional', label: '💼 Professional', tone: 'formal, authoritative, polished' },
        { id: 'casual', label: '😊 Casual', tone: 'friendly, approachable, conversational' },
        { id: 'fun', label: '🎉 Fun & Playful', tone: 'witty, humorous, entertaining' },
        { id: 'educational', label: '📚 Educational', tone: 'informative, clear, helpful' },
        { id: 'luxury', label: '✨ Luxury', tone: 'elegant, sophisticated, premium' },
        { id: 'bold', label: '🔥 Bold & Edgy', tone: 'provocative, daring, attention-grabbing' },
    ]

    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/channels')
            if (res.ok) {
                const data = await res.json()
                setChannels(data)
            }
        } catch {
            toast.error('Failed to load channels')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchChannels()
    }, [fetchChannels])

    // Fetch user's AI providers when wizard opens
    useEffect(() => {
        if (!showCreateDialog) return
        const fetchProviders = async () => {
            try {
                const [keysRes, providersRes] = await Promise.all([
                    fetch('/api/user/api-keys'),
                    fetch('/api/user/ai-providers').catch(() => null),
                ])
                if (keysRes.ok) {
                    const keys = await keysRes.json()
                    const providerNames: Record<string, string> = {
                        openai: 'OpenAI', gemini: 'Google Gemini', anthropic: 'Anthropic',
                        openrouter: 'OpenRouter', runware: 'Runware', synthetic: 'Synthetic',
                    }
                    setUserProviders(keys.map((k: { provider: string }) => ({
                        provider: k.provider,
                        name: providerNames[k.provider] || k.provider,
                    })))
                }
            } catch { /* ignore */ }
        }
        fetchProviders()
    }, [showCreateDialog])

    const resetWizard = () => {
        setWizardStep(1)
        setNewName('')
        setNewDisplayName('')
        setNewLanguage('en')
        setNewDescription('')
        setNewAiProvider('')
        setNewVibe('')
    }

    const handleCreate = async () => {
        if (!newName || !newDisplayName) return
        setCreating(true)
        try {
            const vibeData = newVibe ? vibePresets.find(v => v.id === newVibe) : null
            const res = await fetch('/api/admin/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    displayName: newDisplayName,
                    language: newLanguage,
                    description: newDescription || null,
                    defaultAiProvider: newAiProvider || null,
                    vibeTone: vibeData ? { style: vibeData.id, tone: vibeData.tone } : null,
                }),
            })
            if (res.ok) {
                const channel = await res.json()
                toast.success(t('channels.created'))
                setShowCreateDialog(false)
                resetWizard()
                router.push(`/dashboard/channels/${channel.id}`)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to create channel')
            }
        } catch {
            toast.error('Failed to create channel')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (channel: Channel) => {
        try {
            const res = await fetch(`/api/admin/channels/${channel.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success(t('channels.deleted'))
                setDeleteTarget(null)
                fetchChannels()
            } else {
                toast.error('Failed to delete channel')
            }
        } catch {
            toast.error('Failed to delete channel')
        }
    }

    const filtered = channels.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.displayName.toLowerCase().includes(search.toLowerCase())
    )

    const languageLabel = (lang: string) => {
        const map: Record<string, string> = { en: 'English', vi: 'Vietnamese', fr: 'French', de: 'German', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', es: 'Spanish', pt: 'Portuguese', th: 'Thai' }
        return map[lang] || lang.toUpperCase()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
                        {t('channels.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{t('channels.description')}</p>
                </div>
                {canCreateChannel && (
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        {t('channels.addChannel')}
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t('channels.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Channel Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-3">
                                <div className="h-5 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">
                        {search ? t('channels.noResults') : t('channels.noChannels')}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        {search ? t('channels.noResultsDesc') : t('channels.noChannelsDesc')}
                    </p>
                    {!search && canCreateChannel && (
                        <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t('channels.createFirst')}
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((channel) => (
                        <Card
                            key={channel.id}
                            className="group cursor-pointer hover:border-primary/30 transition-all duration-200"
                            onClick={() => router.push(`/dashboard/channels/${channel.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-base truncate text-primary">
                                                {channel.displayName}
                                            </h3>
                                            <Badge variant={channel.isActive ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                                {channel.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 font-mono">/{channel.name}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/channels/${channel.id}`) }}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                {t('channels.editSettings')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(channel) }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t('channels.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Admin info */}
                                {channel.members?.[0] && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold shrink-0">
                                            {(channel.members[0].user.name || channel.members[0].user.email)[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate text-xs">
                                                {channel.members[0].user.name || 'Admin'}
                                            </p>
                                            <p className="truncate text-[10px]">
                                                {channel.members[0].user.email}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1" title="Members">
                                        <Users className="h-3.5 w-3.5" />
                                        {channel._count.members}
                                    </span>
                                    <span className="flex items-center gap-1" title="Posts">
                                        <FileText className="h-3.5 w-3.5" />
                                        {channel._count.posts}
                                    </span>
                                    <span className="flex items-center gap-1" title="Knowledge Base">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {channel._count.knowledgeBase}
                                    </span>
                                    <span className="flex items-center gap-1" title="Language">
                                        <Globe className="h-3.5 w-3.5" />
                                        {channel.language.toUpperCase()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Channel Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetWizard() }}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{t('channels.addChannel')}</DialogTitle>
                        <DialogDescription>
                            Step {wizardStep} of 3 — {wizardStep === 1 ? 'Basic Info' : wizardStep === 2 ? 'AI Configuration' : 'Vibe & Tone'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 py-2">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center gap-2 flex-1">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${step < wizardStep ? 'bg-primary text-primary-foreground' :
                                    step === wizardStep ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                    {step < wizardStep ? <Check className="h-4 w-4" /> : step}
                                </div>
                                {step < 3 && <div className={`h-0.5 flex-1 rounded ${step < wizardStep ? 'bg-primary' : 'bg-muted'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Basics */}
                    {wizardStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('channels.displayName')}</Label>
                                <Input
                                    placeholder="e.g. My Brand"
                                    value={newDisplayName}
                                    onChange={(e) => {
                                        setNewDisplayName(e.target.value)
                                        setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('channels.slug')}</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-sm">/</span>
                                    <Input
                                        placeholder="my-brand"
                                        value={newName}
                                        readOnly
                                        className="font-mono text-sm bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="What is this channel about? (optional)"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('channels.language')}</Label>
                                <Select value={newLanguage} onValueChange={setNewLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="vi">Vietnamese</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="de">German</SelectItem>
                                        <SelectItem value="ja">Japanese</SelectItem>
                                        <SelectItem value="ko">Korean</SelectItem>
                                        <SelectItem value="zh">Chinese</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="pt">Portuguese</SelectItem>
                                        <SelectItem value="th">Thai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: AI Configuration */}
                    {wizardStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Default AI Provider for this channel</p>
                            </div>
                            {userProviders.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-orange-500/30 bg-orange-500/5 p-4 text-center space-y-2">
                                    <p className="text-sm text-orange-400">No AI providers configured yet</p>
                                    <p className="text-xs text-muted-foreground">You can set up API keys later in AI API Keys</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {userProviders.map((p) => (
                                        <button
                                            key={p.provider}
                                            type="button"
                                            onClick={() => setNewAiProvider(newAiProvider === p.provider ? '' : p.provider)}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all cursor-pointer ${newAiProvider === p.provider
                                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                                }`}
                                        >
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{p.provider}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Optional — you can change this later in channel settings</p>
                        </div>
                    )}

                    {/* Step 3: Vibe & Tone */}
                    {wizardStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Choose a content style</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {vibePresets.map((vibe) => (
                                    <button
                                        key={vibe.id}
                                        type="button"
                                        onClick={() => setNewVibe(newVibe === vibe.id ? '' : vibe.id)}
                                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${newVibe === vibe.id
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                    >
                                        <p className="text-sm font-medium">{vibe.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{vibe.tone}</p>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Optional — defines AI writing style for this channel</p>
                        </div>
                    )}

                    <DialogFooter className="flex !justify-between">
                        <div>
                            {wizardStep > 1 && (
                                <Button variant="ghost" onClick={() => setWizardStep(wizardStep - 1)} className="gap-1 cursor-pointer">
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {wizardStep < 3 ? (
                                <Button
                                    onClick={() => setWizardStep(wizardStep + 1)}
                                    disabled={wizardStep === 1 && (!newName || !newDisplayName)}
                                    className="gap-1 cursor-pointer"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleCreate} disabled={creating} className="gap-1 cursor-pointer">
                                    {creating ? 'Creating...' : <><Check className="h-4 w-4" /> Create Channel</>}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('channels.deleteConfirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Are you sure you want to delete "${deleteTarget?.displayName}"? All posts, media, and settings will be permanently removed.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && handleDelete(deleteTarget)}
                        >
                            {t('channels.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
