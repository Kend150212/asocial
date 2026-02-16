'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Channel {
    id: string
    name: string
    displayName: string
    isActive: boolean
    language: string
    createdAt: string
    platforms: ChannelPlatform[]
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
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)

    // Create form
    const [newName, setNewName] = useState('')
    const [newDisplayName, setNewDisplayName] = useState('')
    const [newLanguage, setNewLanguage] = useState('en')
    const [creating, setCreating] = useState(false)

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

    const handleCreate = async () => {
        if (!newName || !newDisplayName) return
        setCreating(true)
        try {
            const res = await fetch('/api/admin/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    displayName: newDisplayName,
                    language: newLanguage,
                }),
            })
            if (res.ok) {
                toast.success(t('channels.created'))
                setShowCreateDialog(false)
                setNewName('')
                setNewDisplayName('')
                setNewLanguage('en')
                fetchChannels()
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Megaphone className="h-6 w-6" />
                        {t('channels.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{t('channels.description')}</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('channels.addChannel')}
                </Button>
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
                    {!search && (
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                {/* Platform pills */}
                                {channel.platforms.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {channel.platforms.map((p, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted"
                                                title={p.accountName}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: platformColors[p.platform] || '#888' }}
                                                />
                                                {p.platform}
                                            </span>
                                        ))}
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
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('channels.addChannel')}</DialogTitle>
                        <DialogDescription>{t('channels.addChannelDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('channels.displayName')}</Label>
                            <Input
                                placeholder="e.g. My Brand"
                                value={newDisplayName}
                                onChange={(e) => {
                                    setNewDisplayName(e.target.value)
                                    // Auto-generate slug from display name
                                    if (!newName || newName === newDisplayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, -1) || newName === e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, -1)) {
                                        setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('channels.slug')}</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">/</span>
                                <Input
                                    placeholder="my-brand"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">{t('channels.slugHint')}</p>
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleCreate} disabled={!newName || !newDisplayName || creating}>
                            {creating ? t('common.creating') : t('channels.addChannel')}
                        </Button>
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
