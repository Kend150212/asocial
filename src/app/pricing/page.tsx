'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import Link from 'next/link'

type Plan = {
    id: string
    name: string
    nameVi: string
    description: string | null
    descriptionVi: string | null
    priceMonthly: number
    priceAnnual: number
    maxChannels: number
    maxPostsPerMonth: number
    maxMembersPerChannel: number
    maxAiImagesPerMonth: number
    maxAiTextPerMonth: number
    maxStorageMB: number
    maxApiCallsPerMonth: number
    hasAutoSchedule: boolean
    hasWebhooks: boolean
    hasAdvancedReports: boolean
    hasPrioritySupport: boolean
    hasWhiteLabel: boolean
    stripePriceIdMonthly: string | null
    stripePriceIdAnnual: string | null
}

const POPULAR_PLAN = 'Pro'

export default function PricingPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
    const [loading, setLoading] = useState<string | null>(null)
    const [coupon, setCoupon] = useState('')

    // Detect locale
    const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('vi') ? 'vi' : 'en'

    useEffect(() => {
        fetch('/api/billing/plans')
            .then(r => r.json())
            .then(setPlans)
            .catch(console.error)
    }, [])

    const handleCheckout = async (planId: string) => {
        setLoading(planId)
        const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, interval, couponCode: coupon || undefined }),
        })
        const data = await res.json()
        if (data.url) {
            window.location.href = data.url
        } else {
            alert(data.error || 'Something went wrong')
        }
        setLoading(null)
    }

    const annualSaving = (plan: Plan) => {
        if (plan.priceMonthly === 0) return null
        const annual = plan.priceAnnual
        const fullMonthly = plan.priceMonthly * 12
        const saving = fullMonthly - annual
        return saving > 0 ? saving : null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="text-center py-16 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Zap className="h-4 w-4" />
                    {locale === 'vi' ? 'Giá minh bạch, không ẩn phí' : 'Simple, transparent pricing'}
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    {locale === 'vi' ? 'Chọn gói phù hợp' : 'Choose your plan'}
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                    {locale === 'vi'
                        ? 'Bắt đầu miễn phí. Nâng cấp khi cần thêm tính năng.'
                        : 'Start free. Upgrade when you need more power.'}
                </p>

                {/* Interval Toggle */}
                <div className="inline-flex items-center gap-1 p-1 rounded-full border bg-muted/30">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${interval === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {locale === 'vi' ? 'Hàng tháng' : 'Monthly'}
                    </button>
                    <button
                        onClick={() => setInterval('annual')}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${interval === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {locale === 'vi' ? 'Hàng năm' : 'Annual'}
                        <Badge className="text-xs bg-green-500 text-white border-0 px-1.5">
                            {locale === 'vi' ? '-2 tháng' : '2 months free'}
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="max-w-6xl mx-auto px-4 pb-16">
                <div className={`grid gap-6 ${plans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                    {plans.map((plan) => {
                        const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
                        const isContact = price === 0 && (plan.maxChannels === -1 || plan.name === 'Enterprise')
                        const isPopular = plan.name === POPULAR_PLAN
                        const saving = annualSaving(plan)
                        const hasPriceId = interval === 'annual' ? !!plan.stripePriceIdAnnual : !!plan.stripePriceIdMonthly

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-all ${isPopular ? 'border-primary shadow-lg shadow-primary/10 bg-primary/2' : 'bg-card hover:shadow-md'}`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                                            {locale === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}
                                        </Badge>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {locale === 'vi' ? plan.nameVi : plan.name}
                                    </h3>
                                    {(plan.description || plan.descriptionVi) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {locale === 'vi' ? plan.descriptionVi : plan.description}
                                        </p>
                                    )}
                                </div>

                                {/* Price */}
                                <div>
                                    {isContact ? (
                                        <div className="text-2xl font-bold">
                                            {locale === 'vi' ? 'Liên hệ' : 'Contact us'}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-end gap-1">
                                                <span className="text-3xl font-bold">${price}</span>
                                                <span className="text-sm text-muted-foreground mb-1">
                                                    {interval === 'annual'
                                                        ? (locale === 'vi' ? '/năm' : '/yr')
                                                        : (locale === 'vi' ? '/tháng' : '/mo')}
                                                </span>
                                            </div>
                                            {interval === 'annual' && saving && (
                                                <p className="text-xs text-green-500 mt-0.5">
                                                    {locale === 'vi' ? `Tiết kiệm $${saving}/năm` : `Save $${saving}/year`}
                                                </p>
                                            )}
                                            {price === 0 && !isContact && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {locale === 'vi' ? 'Miễn phí mãi mãi' : 'Free forever'}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 flex-1 text-sm">
                                    <FeatureItem
                                        label={plan.maxChannels === -1
                                            ? (locale === 'vi' ? 'Kênh không giới hạn' : 'Unlimited channels')
                                            : (locale === 'vi' ? `${plan.maxChannels} kênh` : `${plan.maxChannels} channel${plan.maxChannels > 1 ? 's' : ''}`)}
                                    />
                                    <FeatureItem
                                        label={plan.maxPostsPerMonth === -1
                                            ? (locale === 'vi' ? 'Bài đăng không giới hạn' : 'Unlimited posts')
                                            : (locale === 'vi' ? `${plan.maxPostsPerMonth} bài/tháng` : `${plan.maxPostsPerMonth} posts/month`)}
                                    />
                                    <FeatureItem
                                        label={plan.maxMembersPerChannel === -1
                                            ? (locale === 'vi' ? 'Thành viên không giới hạn' : 'Unlimited members')
                                            : (locale === 'vi' ? `${plan.maxMembersPerChannel} thành viên/kênh` : `${plan.maxMembersPerChannel} members/channel`)}
                                    />
                                    {plan.hasAutoSchedule && (
                                        <FeatureItem label={locale === 'vi' ? 'Lên lịch tự động' : 'Auto scheduling'} />
                                    )}
                                    {plan.maxAiTextPerMonth !== 0 && (
                                        <FeatureItem label={plan.maxAiTextPerMonth === -1
                                            ? (locale === 'vi' ? 'Tạo nội dung AI không giới hạn' : 'Unlimited AI content')
                                            : (locale === 'vi' ? `${plan.maxAiTextPerMonth} nội dung AI/tháng` : `${plan.maxAiTextPerMonth} AI content/mo`)} />
                                    )}
                                    {plan.maxAiImagesPerMonth !== 0 && (
                                        <FeatureItem label={plan.maxAiImagesPerMonth === -1
                                            ? (locale === 'vi' ? 'AI Image không giới hạn' : 'Unlimited AI images')
                                            : (locale === 'vi' ? `${plan.maxAiImagesPerMonth} AI Image/tháng` : `${plan.maxAiImagesPerMonth} AI images/mo`)} />
                                    )}
                                    {plan.maxApiCallsPerMonth !== 0 && (
                                        <FeatureItem label={plan.maxApiCallsPerMonth === -1
                                            ? 'Unlimited API calls'
                                            : `${plan.maxApiCallsPerMonth.toLocaleString()} API calls/mo`} />
                                    )}
                                    {plan.maxStorageMB > 0 && (
                                        <FeatureItem label={plan.maxStorageMB === -1
                                            ? (locale === 'vi' ? 'Lưu trữ không giới hạn' : 'Unlimited storage')
                                            : plan.maxStorageMB >= 1024
                                                ? `${(plan.maxStorageMB / 1024).toFixed(0)} GB storage`
                                                : `${plan.maxStorageMB} MB storage`} />
                                    )}
                                    {plan.hasWebhooks && <FeatureItem label="Webhooks" />}
                                    {plan.hasAdvancedReports && (
                                        <FeatureItem label={locale === 'vi' ? 'Báo cáo nâng cao' : 'Advanced reports'} />
                                    )}
                                    {plan.hasPrioritySupport && (
                                        <FeatureItem label={locale === 'vi' ? 'Hỗ trợ ưu tiên' : 'Priority support'} />
                                    )}
                                    {plan.hasWhiteLabel && (
                                        <FeatureItem label={locale === 'vi' ? 'White label' : 'White label'} />
                                    )}
                                </ul>

                                {/* CTA */}
                                {isContact ? (
                                    <Button variant="outline" asChild>
                                        <a href="mailto:hello@neeflow.com">
                                            {locale === 'vi' ? 'Liên hệ' : 'Contact Sales'}
                                        </a>
                                    </Button>
                                ) : price === 0 ? (
                                    <Button variant="outline" asChild>
                                        <Link href="/auth/signup">
                                            {locale === 'vi' ? 'Bắt đầu miễn phí' : 'Get Started Free'}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleCheckout(plan.id)}
                                        disabled={!!loading || !hasPriceId}
                                        variant={isPopular ? 'default' : 'outline'}
                                        className="w-full"
                                    >
                                        {loading === plan.id
                                            ? (locale === 'vi' ? 'Đang xử lý...' : 'Processing...')
                                            : (locale === 'vi' ? 'Bắt đầu dùng thử' : 'Start Free Trial')}
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Coupon */}
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {locale === 'vi' ? 'Có mã giảm giá?' : 'Have a coupon?'}
                        </span>
                        <input
                            type="text"
                            value={coupon}
                            onChange={e => setCoupon(e.target.value)}
                            placeholder={locale === 'vi' ? 'Nhập mã...' : 'Enter code...'}
                            className="px-3 py-1.5 text-sm border rounded-md bg-background w-36"
                        />
                    </div>
                </div>

                {/* FAQ / note */}
                <div className="mt-12 text-center space-y-2 text-sm text-muted-foreground">
                    <p>
                        {locale === 'vi'
                            ? 'Tất cả gói đều sử dụng API key của bạn — không tính phí AI.'
                            : 'All plans use your own API keys — no extra AI fees.'}
                    </p>
                    <p>
                        {locale === 'vi'
                            ? 'Media lưu trên Google Drive của bạn — không giới hạn storage.'
                            : 'Media stored on your Google Drive — no storage limits.'}
                    </p>
                    <p>
                        {locale === 'vi' ? 'Hủy bất cứ lúc nào. Không ràng buộc.' : 'Cancel anytime. No lock-in.'}
                    </p>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ label }: { label: string }) {
    return (
        <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>{label}</span>
        </li>
    )
}
