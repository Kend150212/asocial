'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    HardDrive, Tv, Image as ImageIcon, PenTool, Users, Code2,
    CalendarClock, BarChart3, Tag, Headphones, Plus, Check, Loader2, X,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

// Icon map for add-on icons
const iconMap: Record<string, React.ReactNode> = {
    'hard-drive': <HardDrive className="h-5 w-5" />,
    'tv': <Tv className="h-5 w-5" />,
    'image': <ImageIcon className="h-5 w-5" />,
    'pen-tool': <PenTool className="h-5 w-5" />,
    'users': <Users className="h-5 w-5" />,
    'code-2': <Code2 className="h-5 w-5" />,
    'calendar-clock': <CalendarClock className="h-5 w-5" />,
    'bar-chart-3': <BarChart3 className="h-5 w-5" />,
    'tag': <Tag className="h-5 w-5" />,
    'headphones': <Headphones className="h-5 w-5" />,
    'plus': <Plus className="h-5 w-5" />,
}

type Addon = {
    id: string
    name: string
    displayName: string
    displayNameVi: string
    description: string | null
    descriptionVi: string | null
    category: string
    quotaField: string | null
    quotaAmount: number
    featureField: string | null
    priceMonthly: number
    priceAnnual: number
    icon: string
    sortOrder: number
}

type Props = {
    open: boolean
    onClose: () => void
    onPurchased?: () => void
}

export function AddonModal({ open, onClose, onPurchased }: Props) {
    const t = useTranslation()
    const [addons, setAddons] = useState<Addon[]>([])
    const [activeAddons, setActiveAddons] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setLoading(true)
        fetch('/api/addons')
            .then(r => r.json())
            .then(data => {
                setAddons(data.addons ?? [])
                setActiveAddons(data.activeAddons ?? {})
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [open])

    const handlePurchase = async (addon: Addon) => {
        setPurchasing(addon.id)
        try {
            const isActive = activeAddons[addon.id]
            const res = await fetch('/api/billing/addon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    addonId: addon.id,
                    action: isActive ? 'cancel' : 'purchase',
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Failed')
                return
            }

            if (data.action === 'purchased') {
                setActiveAddons(prev => ({ ...prev, [addon.id]: data.quantity }))
                toast.success(`${addon.displayName} activated!`)
            } else {
                setActiveAddons(prev => {
                    const next = { ...prev }
                    delete next[addon.id]
                    return next
                })
                toast.success(`${addon.displayName} canceled`)
            }

            onPurchased?.()
        } catch {
            toast.error('Something went wrong')
        } finally {
            setPurchasing(null)
        }
    }

    const quotaAddons = addons.filter(a => a.category === 'quota')
    const featureAddons = addons.filter(a => a.category === 'feature')

    // Helpers for locale-aware display
    const locale = t('lang') || 'en'
    const getName = (a: Addon) => locale === 'vi' && a.displayNameVi ? a.displayNameVi : a.displayName
    const getDesc = (a: Addon) => locale === 'vi' && a.descriptionVi ? a.descriptionVi : a.description

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Plus className="h-5 w-5 text-primary" />
                        Add-ons
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-2">
                        {/* Quota add-ons */}
                        {quotaAddons.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                    {locale === 'vi' ? 'Tăng dung lượng' : 'Boost Quotas'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {quotaAddons.map(addon => {
                                        const isActive = !!activeAddons[addon.id]
                                        const isProcessing = purchasing === addon.id
                                        return (
                                            <div
                                                key={addon.id}
                                                className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all ${isActive
                                                        ? 'border-primary/50 bg-primary/5'
                                                        : 'border-border hover:border-primary/30 hover:bg-accent/50'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {iconMap[addon.icon] ?? <Plus className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">{getName(addon)}</span>
                                                        {isActive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Active</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{getDesc(addon)}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs font-semibold">${addon.priceMonthly}/mo</span>
                                                        <Button
                                                            size="sm"
                                                            variant={isActive ? 'outline' : 'default'}
                                                            className="h-7 text-xs gap-1"
                                                            disabled={isProcessing}
                                                            onClick={() => handlePurchase(addon)}
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : isActive ? (
                                                                <><X className="h-3 w-3" /> Cancel</>
                                                            ) : (
                                                                <><Plus className="h-3 w-3" /> Add</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Feature add-ons */}
                        {featureAddons.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                    {locale === 'vi' ? 'Mở khóa tính năng' : 'Unlock Features'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {featureAddons.map(addon => {
                                        const isActive = !!activeAddons[addon.id]
                                        const isProcessing = purchasing === addon.id
                                        return (
                                            <div
                                                key={addon.id}
                                                className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all ${isActive
                                                        ? 'border-emerald-500/50 bg-emerald-500/5'
                                                        : 'border-border hover:border-emerald-500/30 hover:bg-accent/50'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                                    {iconMap[addon.icon] ?? <Plus className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">{getName(addon)}</span>
                                                        {isActive && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                                <Check className="h-2.5 w-2.5 mr-0.5" /> Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{getDesc(addon)}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs font-semibold">${addon.priceMonthly}/mo</span>
                                                        <Button
                                                            size="sm"
                                                            variant={isActive ? 'outline' : 'default'}
                                                            className="h-7 text-xs gap-1"
                                                            disabled={isProcessing}
                                                            onClick={() => handlePurchase(addon)}
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : isActive ? (
                                                                <><X className="h-3 w-3" /> Cancel</>
                                                            ) : (
                                                                <><Plus className="h-3 w-3" /> Add</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
