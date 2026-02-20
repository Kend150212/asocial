'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'

// Simple locale detection — reads from localStorage (same as sidebar lang switcher)
function useLocale() {
    const [locale, setLocale] = useState('en')
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLocale(localStorage.getItem('language') || 'en')
        }
    }, [])
    return locale
}

export type UpgradeReason = {
    feature: string
    limit?: number
    current?: number
    message: string
    messageVi: string
}

interface UpgradeModalProps {
    open: boolean
    onClose: () => void
    reason?: UpgradeReason
}

type Plan = {
    id: string
    name: string
    nameVi: string
    priceMonthly: number
    priceAnnual: number
    maxChannels: number
    maxPostsPerMonth: number
    maxMembersPerChannel: number
    hasAutoSchedule: boolean
    hasWebhooks: boolean
    hasAdvancedReports: boolean
    stripePriceIdMonthly: string | null
    stripePriceIdAnnual: string | null
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
    const locale = useLocale()

    const [plans, setPlans] = useState<Plan[]>([])
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
    const [loading, setLoading] = useState<string | null>(null)
    const [coupon, setCoupon] = useState('')

    useEffect(() => {
        if (open) {
            fetch('/api/billing/plans')
                .then(r => r.json())
                .then(setPlans)
                .catch(console.error)
        }
    }, [open])

    const handleUpgrade = async (planId: string) => {
        setLoading(planId)
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, interval, couponCode: coupon || undefined }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            console.error('Checkout error:', err)
        } finally {
            setLoading(null)
        }
    }

    const paidPlans = plans.filter(p => p.priceMonthly > 0 || p.priceAnnual > 0 || plans.indexOf(p) > 0)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {locale === 'vi' ? 'Nâng cấp gói dịch vụ' : 'Upgrade Your Plan'}
                    </DialogTitle>
                    {reason && (
                        <DialogDescription className="text-sm text-red-500">
                            {locale === 'vi' ? reason.messageVi : reason.message}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Monthly / Annual toggle */}
                <div className="flex items-center justify-center gap-3 my-4">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={`text-sm px-4 py-1.5 rounded-full transition-colors ${interval === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {locale === 'vi' ? 'Hàng tháng' : 'Monthly'}
                    </button>
                    <button
                        onClick={() => setInterval('annual')}
                        className={`text-sm px-4 py-1.5 rounded-full transition-colors ${interval === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {locale === 'vi' ? 'Hàng năm' : 'Annual'}
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {locale === 'vi' ? 'Tiết kiệm 2 tháng' : '2 months free'}
                        </Badge>
                    </button>
                </div>

                {/* Plans grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paidPlans.slice(0, 3).map((plan) => {
                        const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
                        const priceLabel = price === 0 ? (locale === 'vi' ? 'Liên hệ' : 'Contact us') : `$${price}`
                        const perLabel = price === 0 ? '' : (interval === 'annual' ? (locale === 'vi' ? '/năm' : '/yr') : (locale === 'vi' ? '/tháng' : '/mo'))
                        const hasPriceId = interval === 'annual' ? !!plan.stripePriceIdAnnual : !!plan.stripePriceIdMonthly

                        return (
                            <div key={plan.id} className="rounded-xl border p-5 flex flex-col gap-4 relative">
                                <div>
                                    <h3 className="font-semibold text-lg">{locale === 'vi' ? plan.nameVi : plan.name}</h3>
                                    <div className="flex items-end gap-1 mt-1">
                                        <span className="text-2xl font-bold">{priceLabel}</span>
                                        <span className="text-sm text-muted-foreground mb-0.5">{perLabel}</span>
                                    </div>
                                </div>

                                <ul className="space-y-1.5 text-sm flex-1">
                                    <Feature label={plan.maxChannels === -1 ? (locale === 'vi' ? 'Kênh không giới hạn' : 'Unlimited channels') : `${plan.maxChannels} ${locale === 'vi' ? 'kênh' : 'channels'}`} />
                                    <Feature label={plan.maxPostsPerMonth === -1 ? (locale === 'vi' ? 'Bài đăng không giới hạn' : 'Unlimited posts') : `${plan.maxPostsPerMonth} ${locale === 'vi' ? 'bài/tháng' : 'posts/mo'}`} />
                                    <Feature label={plan.maxMembersPerChannel === -1 ? (locale === 'vi' ? 'Thành viên không giới hạn' : 'Unlimited members') : `${plan.maxMembersPerChannel} ${locale === 'vi' ? 'thành viên/kênh' : 'members/channel'}`} />
                                    {plan.hasAutoSchedule && <Feature label={locale === 'vi' ? 'Lên lịch tự động' : 'Auto scheduling'} />}
                                    {plan.hasWebhooks && <Feature label="Webhooks" />}
                                    {plan.hasAdvancedReports && <Feature label={locale === 'vi' ? 'Báo cáo nâng cao' : 'Advanced reports'} />}
                                </ul>

                                <Button
                                    onClick={() => hasPriceId ? handleUpgrade(plan.id) : undefined}
                                    disabled={!!loading || !hasPriceId}
                                    className="w-full"
                                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                                >
                                    {loading === plan.id
                                        ? (locale === 'vi' ? 'Đang xử lý...' : 'Processing...')
                                        : !hasPriceId
                                            ? (locale === 'vi' ? 'Liên hệ' : 'Contact Sales')
                                            : (locale === 'vi' ? 'Nâng cấp' : 'Upgrade')}
                                </Button>
                            </div>
                        )
                    })}
                </div>

                {/* Coupon input */}
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={coupon}
                        onChange={e => setCoupon(e.target.value)}
                        placeholder={locale === 'vi' ? 'Mã giảm giá (nếu có)' : 'Coupon code (optional)'}
                        className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Feature({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span>{label}</span>
        </li>
    )
}
