'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    CreditCard, Zap, Calendar, AlertCircle, CheckCircle2,
    ExternalLink, ArrowUpRight, Clock, Check, X, ImageIcon, KeyRound, HardDrive, Bot
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
        maxStorageMB: number
        maxAiImagesPerMonth: number
        hasAutoSchedule: boolean
        hasWebhooks: boolean
        hasAdvancedReports: boolean
        hasPrioritySupport: boolean
        hasWhiteLabel: boolean
        isInTrial: boolean
        daysLeftInTrial: number
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
        imagesThisMonth: number
    }
    aiImage: {
        hasByokKey: boolean
        byokProvider: string | null
        maxPerMonth: number
    }
}

function fmtStorage(mb: number, locale: string): string {
    if (mb === -1) return locale === 'vi' ? '∞ Không giới hạn' : '∞ Unlimited'
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
    return `${mb} MB`
}

export default function BillingPage() {
    const [info, setInfo] = useState<BillingInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
    const [upgradeOpen, setUpgradeOpen] = useState(false)
    const [portalLoading, setPortalLoading] = useState(false)
    const [locale, setLocale] = useState<'vi' | 'en'>('en')

    useEffect(() => {
        // Detect browser language on client only
        const detected = typeof navigator !== 'undefined' && navigator.language.startsWith('vi') ? 'vi' : 'en'
        setLocale(detected)
        fetch('/api/billing')
            .then(r => r.json())
            .then(data => { setInfo(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const t = (vi: string, en: string) => locale === 'vi' ? vi : en

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

    const { plan, subscription, usage, aiImage } = info
    const isFree = plan.priceMonthly === 0 && plan.priceAnnual === 0 && !plan.isInTrial
    const postsPercent = plan.maxPostsPerMonth === -1 ? 0 : Math.min(100, (usage.postsThisMonth / plan.maxPostsPerMonth) * 100)
    const channelsPercent = plan.maxChannels === -1 ? 0 : Math.min(100, (usage.channelCount / plan.maxChannels) * 100)
    const imagesPercent = aiImage.maxPerMonth <= 0 ? 0 : Math.min(100, (usage.imagesThisMonth / aiImage.maxPerMonth) * 100)

    const statusColor = subscription?.status === 'active' ? 'text-green-500' : subscription?.status === 'past_due' ? 'text-red-500' : 'text-orange-500'
    const StatusIcon = subscription?.status === 'active' ? CheckCircle2 : AlertCircle

    return (
        <div className="space-y-6 p-6 max-w-5xl">
            {/* Header + Lang toggle */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{t('Gói dịch vụ & Thanh toán', 'Billing & Plans')}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t('Quản lý gói và theo dõi mức sử dụng', 'Manage your plan and monitor usage')}
                    </p>
                </div>
                {/* Language toggle */}
                <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5 text-xs">
                    <button
                        onClick={() => setLocale('vi')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${locale === 'vi' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        🇻🇳 VI
                    </button>
                    <button
                        onClick={() => setLocale('en')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${locale === 'en' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        🇺🇸 EN
                    </button>
                </div>
            </div>

            {/* Trial banner */}
            {plan.isInTrial && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>
                        {t(
                            `🎉 Bạn đang trong giai đoạn dùng thử Pro — Còn ${plan.daysLeftInTrial} ngày. Nâng cấp để tiếp tục sau khi trial kết thúc.`,
                            `🎉 You're on a Pro trial — ${plan.daysLeftInTrial} days remaining. Upgrade to keep Pro features after trial ends.`
                        )}
                    </span>
                    <Button size="sm" className="ml-auto h-7 text-xs gap-1" onClick={() => setUpgradeOpen(true)}>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {t('Nâng cấp', 'Upgrade')}
                    </Button>
                </div>
            )}

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('Gói hiện tại', 'Current Plan')}
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
                                                ? t('Hàng năm', 'Annual')
                                                : t('Hàng tháng', 'Monthly')}
                                        </Badge>
                                    )}
                                    {plan.isInTrial && (
                                        <Badge className="text-xs bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                            {t('Dùng thử', 'Trial')}
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
                                    {t('Nâng cấp', 'Upgrade Plan')}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => setUpgradeOpen(true)} className="gap-1">
                                        <ArrowUpRight className="h-4 w-4" />
                                        {t('Đổi gói', 'Change Plan')}
                                    </Button>
                                    {subscription?.hasStripeSubscription && (
                                        <Button variant="outline" onClick={openPortal} disabled={portalLoading} className="gap-1">
                                            <ExternalLink className="h-4 w-4" />
                                            {t('Quản lý thanh toán', 'Manage Billing')}
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
                            {t('Bài đăng tháng này', 'Posts This Month')} ({usage.month})
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
                            <p className="text-xs text-green-500">{t('Không giới hạn', 'Unlimited')}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('Kênh', 'Channels')}
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
                            <p className="text-xs text-green-500">{t('Không giới hạn', 'Unlimited')}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Image Generation Usage */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {t('AI tạo hình ảnh tháng này', 'AI Images This Month')} ({usage.month})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {aiImage.hasByokKey && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                            <KeyRound className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>
                                {t(
                                    `BYOK đang dùng: ${aiImage.byokProvider} — không giới hạn`,
                                    `BYOK active: ${aiImage.byokProvider} key — unlimited generation`
                                )}
                            </span>
                        </div>
                    )}
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold">{usage.imagesThisMonth}</span>
                        <span className="text-sm text-muted-foreground">
                            / {aiImage.maxPerMonth === -1
                                ? t('∞ không giới hạn', '∞ unlimited')
                                : aiImage.maxPerMonth === 0
                                    ? 'BYOK only'
                                    : aiImage.maxPerMonth}
                        </span>
                    </div>
                    {aiImage.maxPerMonth > 0 && aiImage.maxPerMonth !== -1 && (
                        <Progress
                            value={imagesPercent}
                            className={`h-2 ${imagesPercent >= 90 ? '[&>div]:bg-red-500' : imagesPercent >= 70 ? '[&>div]:bg-orange-500' : ''}`}
                        />
                    )}
                    {aiImage.maxPerMonth === -1 && (
                        <p className="text-xs text-green-500">{t('Không giới hạn', 'Unlimited')}</p>
                    )}
                    {aiImage.maxPerMonth === 0 && !aiImage.hasByokKey && (
                        <p className="text-xs text-orange-500">
                            {t(
                                'Gói của bạn chưa có AI tạo ảnh. Thêm API key của bạn hoặc nâng cấp gói.',
                                'Your plan has no AI image quota. Add your own API key or upgrade.'
                            )}
                        </p>
                    )}
                    {aiImage.maxPerMonth > 0 && imagesPercent >= 90 && !aiImage.hasByokKey && (
                        <p className="text-xs text-red-500">
                            {t('Gần hết hạn mức tháng này!', 'Approaching monthly quota limit!')}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Plan Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {t('Tính năng gói', 'Plan Features')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                        {/* Numeric limits */}
                        {[
                            {
                                icon: <Zap className="h-3.5 w-3.5 text-muted-foreground" />,
                                label: t('Kênh tối đa', 'Max channels'),
                                value: plan.maxChannels === -1 ? '∞' : plan.maxChannels,
                            },
                            {
                                icon: <Bot className="h-3.5 w-3.5 text-muted-foreground" />,
                                label: t('AI post/tháng', 'AI posts/month'),
                                value: plan.maxPostsPerMonth === -1 ? '∞' : plan.maxPostsPerMonth,
                            },
                            {
                                icon: <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />,
                                label: t('AI ảnh/tháng', 'AI images/month'),
                                value: plan.maxAiImagesPerMonth === -1
                                    ? '∞'
                                    : plan.maxAiImagesPerMonth === 0
                                        ? t('BYOK', 'BYOK only')
                                        : plan.maxAiImagesPerMonth,
                            },
                            {
                                icon: <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />,
                                label: t('Lưu trữ (GDrive)', 'Storage (GDrive)'),
                                value: fmtStorage(plan.maxStorageMB, locale),
                            },
                            {
                                icon: <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />,
                                label: t('Thành viên/kênh', 'Members per channel'),
                                value: plan.maxMembersPerChannel === -1 ? '∞' : plan.maxMembersPerChannel,
                            },
                        ].map(({ icon, label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
                                <span className="font-semibold text-sm">{value}</span>
                            </div>
                        ))}
                        {/* Boolean features */}
                        {[
                            { label: t('Lên lịch tự động', 'Auto scheduling'), value: plan.hasAutoSchedule },
                            { label: 'Webhooks', value: plan.hasWebhooks },
                            { label: t('Báo cáo nâng cao', 'Advanced reports'), value: plan.hasAdvancedReports },
                            { label: t('Hỗ trợ ưu tiên', 'Priority support'), value: plan.hasPrioritySupport },
                            { label: 'White label', value: plan.hasWhiteLabel },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <span className="text-sm text-muted-foreground">{label}</span>
                                {value
                                    ? <Check className="h-4 w-4 text-emerald-500" />
                                    : <X className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade modal */}
            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
        </div>
    )
}
