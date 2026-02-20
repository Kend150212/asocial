'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
    CreditCard, Zap, Calendar, AlertCircle, CheckCircle2,
    ExternalLink, ArrowUpRight, Clock
} from 'lucide-react'
import { UpgradeModal } from '@/components/billing/UpgradeModal'

type BillingInfo = {
    plan: {
        planName: string
        planNameVi: string
        priceMonthly: number
        priceAnnual: number
        billingInterval: string
        status: string
        currentPeriodEnd: string | null
        cancelAtPeriodEnd: boolean
        maxChannels: number
        maxPostsPerMonth: number
        maxMembersPerChannel: number
        hasAutoSchedule: boolean
        hasWebhooks: boolean
        hasAdvancedReports: boolean
    }
    subscription: {
        status: string
        billingInterval: string
        currentPeriodEnd: string
        cancelAtPeriodEnd: boolean
        hasStripeSubscription: boolean
    } | null
    usage: {
        postsThisMonth: number
        channelCount: number
        month: string
    }
}

export default function BillingPage() {
    const [info, setInfo] = useState<BillingInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
    const [upgradeOpen, setUpgradeOpen] = useState(false)
    const [coupon, setCoupon] = useState('')
    const [portalLoading, setPortalLoading] = useState(false)

    // Detect locale
    const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('vi') ? 'vi' : 'en'

    useEffect(() => {
        fetch('/api/billing')
            .then(r => r.json())
            .then(data => { setInfo(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const openPortal = async () => {
        setPortalLoading(true)
        const res = await fetch('/api/billing/portal', { method: 'POST' })
        const data = await res.json()
        if (data.url) window.location.href = data.url
        setPortalLoading(false)
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
                </div>
            </div>
        )
    }

    if (!info) return null

    const { plan, subscription, usage } = info
    const isFree = plan.priceMonthly === 0 && plan.priceAnnual === 0
    const postsPercent = plan.maxPostsPerMonth === -1 ? 0 : Math.min(100, (usage.postsThisMonth / plan.maxPostsPerMonth) * 100)
    const channelsPercent = plan.maxChannels === -1 ? 0 : Math.min(100, (usage.channelCount / plan.maxChannels) * 100)

    const statusColor = subscription?.status === 'active' ? 'text-green-500' : subscription?.status === 'past_due' ? 'text-red-500' : 'text-orange-500'
    const StatusIcon = subscription?.status === 'active' ? CheckCircle2 : AlertCircle

    return (
        <div className="space-y-6 p-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold">{locale === 'vi' ? 'Gói dịch vụ & Thanh toán' : 'Billing & Plans'}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {locale === 'vi' ? 'Quản lý gói và theo dõi mức sử dụng' : 'Manage your plan and monitor usage'}
                </p>
            </div>

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {locale === 'vi' ? 'Gói hiện tại' : 'Current Plan'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="text-xl font-bold flex items-center gap-2">
                                    {locale === 'vi' ? plan.planNameVi : plan.planName}
                                    {!isFree && (
                                        <Badge variant="secondary" className="text-xs">
                                            {subscription?.billingInterval === 'annual'
                                                ? (locale === 'vi' ? 'Hàng năm' : 'Annual')
                                                : (locale === 'vi' ? 'Hàng tháng' : 'Monthly')}
                                        </Badge>
                                    )}
                                </div>
                                {subscription && (
                                    <div className={`flex items-center gap-1.5 text-sm mt-1 ${statusColor}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        <span className="capitalize">{subscription.status.replace('_', ' ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {isFree ? (
                                <Button onClick={() => setUpgradeOpen(true)} className="gap-2">
                                    <Zap className="h-4 w-4" />
                                    {locale === 'vi' ? 'Nâng cấp' : 'Upgrade Plan'}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => setUpgradeOpen(true)} className="gap-1">
                                        <ArrowUpRight className="h-4 w-4" />
                                        {locale === 'vi' ? 'Đổi gói' : 'Change Plan'}
                                    </Button>
                                    {subscription?.hasStripeSubscription && (
                                        <Button variant="outline" onClick={openPortal} disabled={portalLoading} className="gap-1">
                                            <ExternalLink className="h-4 w-4" />
                                            {locale === 'vi' ? 'Quản lý thanh toán' : 'Manage Billing'}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {subscription?.cancelAtPeriodEnd && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-600 text-sm">
                            <Clock className="h-4 w-4" />
                            {locale === 'vi'
                                ? `Gói sẽ hủy vào ${new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}`
                                : `Plan cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                        </div>
                    )}

                    {subscription?.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {locale === 'vi'
                                ? `Gia hạn ngày ${new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}`
                                : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Usage Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {locale === 'vi' ? 'Bài đăng tháng này' : 'Posts This Month'} ({usage.month})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold">{usage.postsThisMonth}</span>
                            <span className="text-sm text-muted-foreground">
                                / {plan.maxPostsPerMonth === -1 ? '∞' : plan.maxPostsPerMonth}
                            </span>
                        </div>
                        {plan.maxPostsPerMonth !== -1 && (
                            <Progress value={postsPercent} className="h-2" />
                        )}
                        {plan.maxPostsPerMonth === -1 && (
                            <p className="text-xs text-green-500">{locale === 'vi' ? 'Không giới hạn' : 'Unlimited'}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {locale === 'vi' ? 'Kênh' : 'Channels'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold">{usage.channelCount}</span>
                            <span className="text-sm text-muted-foreground">
                                / {plan.maxChannels === -1 ? '∞' : plan.maxChannels}
                            </span>
                        </div>
                        {plan.maxChannels !== -1 && (
                            <Progress value={channelsPercent} className="h-2" />
                        )}
                        {plan.maxChannels === -1 && (
                            <p className="text-xs text-green-500">{locale === 'vi' ? 'Không giới hạn' : 'Unlimited'}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upgrade modal */}
            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
        </div>
    )
}
