'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Zap, Loader2, Sparkles, ArrowRight, Crown } from 'lucide-react'

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

/* ─── Color palette auto-assigned by plan index ──────────────────────────── */
const PLAN_THEMES = [
    { accent: '#6b7280', gradient: 'from-gray-500/10 to-gray-600/5', border: 'border-gray-500/20', glow: '', badge: 'bg-gray-500', check: 'text-gray-400', btnClass: '' },
    { accent: '#10b981', gradient: 'from-emerald-500/15 to-teal-500/5', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10', badge: 'bg-emerald-500', check: 'text-emerald-500', btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' },
    { accent: '#8b5cf6', gradient: 'from-violet-500/15 to-purple-500/5', border: 'border-violet-500/30', glow: 'shadow-violet-500/10', badge: 'bg-violet-500', check: 'text-violet-500', btnClass: 'bg-violet-600 hover:bg-violet-700 text-white border-0' },
    { accent: '#f59e0b', gradient: 'from-amber-500/15 to-orange-500/5', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', badge: 'bg-amber-500', check: 'text-amber-500', btnClass: 'bg-amber-600 hover:bg-amber-700 text-white border-0' },
    { accent: '#ef4444', gradient: 'from-red-500/15 to-rose-500/5', border: 'border-red-500/30', glow: 'shadow-red-500/10', badge: 'bg-red-500', check: 'text-red-500', btnClass: 'bg-red-600 hover:bg-red-700 text-white border-0' },
    { accent: '#06b6d4', gradient: 'from-cyan-500/15 to-sky-500/5', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10', badge: 'bg-cyan-500', check: 'text-cyan-500', btnClass: 'bg-cyan-600 hover:bg-cyan-700 text-white border-0' },
    { accent: '#ec4899', gradient: 'from-pink-500/15 to-fuchsia-500/5', border: 'border-pink-500/30', glow: 'shadow-pink-500/10', badge: 'bg-pink-500', check: 'text-pink-500', btnClass: 'bg-pink-600 hover:bg-pink-700 text-white border-0' },
    { accent: '#14b8a6', gradient: 'from-teal-500/15 to-emerald-500/5', border: 'border-teal-500/30', glow: 'shadow-teal-500/10', badge: 'bg-teal-500', check: 'text-teal-500', btnClass: 'bg-teal-600 hover:bg-teal-700 text-white border-0' },
]

/* Popular plan override — vibrant, unmistakable */
const POPULAR_THEME = {
    accent: '#10b981',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/5',
    border: 'border-emerald-400/50',
    glow: 'shadow-xl shadow-emerald-500/20',
    badge: 'bg-emerald-500',
    check: 'text-emerald-400',
    btnClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25',
}

function getTheme(index: number, isPopular: boolean) {
    if (isPopular) return POPULAR_THEME
    return PLAN_THEMES[index % PLAN_THEMES.length]
}

function FeatureItem({ label, checkColor }: { label: string; checkColor: string }) {
    return (
        <li className="flex items-start gap-2.5 text-sm">
            <div className={`mt-0.5 shrink-0 rounded-full p-0.5`}>
                <Check className={`h-3.5 w-3.5 ${checkColor}`} />
            </div>
            <span className="text-muted-foreground">{label}</span>
        </li>
    )
}

export function PricingSection() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/billing/plans')
            .then(r => r.json())
            .then(data => { setPlans(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const annualSaving = (plan: Plan) => {
        if (plan.priceMonthly === 0) return null
        const saving = plan.priceMonthly * 12 - plan.priceAnnual
        return saving > 0 ? saving : null
    }

    const gridCols = plans.length <= 3
        ? 'md:grid-cols-3'
        : plans.length === 4
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

    return (
        <section id="pricing" className="py-24 scroll-mt-24 relative">
            {/* Subtle bg glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
                        <Sparkles className="h-3.5 w-3.5" />
                        Pricing
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                        Start free. Upgrade when you need more power. No hidden fees.
                    </p>

                    {/* Interval toggle */}
                    <div className="mt-10 inline-flex items-center gap-1 p-1.5 rounded-full border bg-muted/40 backdrop-blur-sm">
                        <button
                            onClick={() => setInterval('monthly')}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${interval === 'monthly'
                                ? 'bg-background text-foreground shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setInterval('annual')}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${interval === 'annual'
                                ? 'bg-background text-foreground shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Annual
                            <Badge className="text-[10px] bg-emerald-500 text-white border-0 px-2 py-0 font-semibold">
                                SAVE 17%
                            </Badge>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : plans.length === 0 ? (
                    <p className="text-center text-muted-foreground">No plans available yet.</p>
                ) : (
                    <div className={`grid gap-6 items-stretch ${gridCols}`}>
                        {plans.map((plan, idx) => {
                            const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
                            const monthlyEquiv = interval === 'annual' && plan.priceAnnual > 0
                                ? Math.round(plan.priceAnnual / 12 * 100) / 100
                                : null
                            const isContact = price === 0 && (plan.maxChannels === -1 || plan.name.toLowerCase() === 'enterprise')
                            const isPopular = plan.name === 'Pro'
                            const isFree = price === 0 && !isContact
                            const saving = annualSaving(plan)
                            const theme = getTheme(idx, isPopular)

                            return (
                                <div
                                    key={plan.id}
                                    className={`
                                        relative rounded-2xl border p-px transition-all duration-300
                                        ${isPopular ? `${theme.border} ${theme.glow} scale-[1.02] z-10` : `border-border/60 hover:border-border hover:shadow-lg ${theme.glow}`}
                                    `}
                                >
                                    {/* Inner card with gradient bg */}
                                    <div className={`
                                        h-full rounded-[15px] p-6 flex flex-col gap-5
                                        bg-gradient-to-br ${theme.gradient}
                                        ${isPopular ? 'bg-card/80 backdrop-blur-sm' : 'bg-card/60'}
                                    `}>
                                        {/* Popular badge */}
                                        {isPopular && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                                <Badge className={`${theme.badge} text-white px-4 py-1 text-xs font-semibold shadow-lg flex items-center gap-1.5 border-0`}>
                                                    <Crown className="h-3 w-3" />
                                                    Most Popular
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Plan header */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{plan.name}</h3>
                                                {isContact && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">Custom</Badge>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
                                            )}
                                        </div>

                                        {/* Price block */}
                                        <div className="py-1">
                                            {isContact ? (
                                                <div className="text-2xl font-bold">Contact us</div>
                                            ) : (
                                                <>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-4xl font-extrabold tracking-tight">
                                                            ${interval === 'annual' && monthlyEquiv ? monthlyEquiv : price}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground mb-1.5 font-medium">
                                                            /mo
                                                        </span>
                                                    </div>
                                                    {interval === 'annual' && !isFree && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Billed ${plan.priceAnnual}/year
                                                            {saving && <span className="text-emerald-500 font-medium ml-1.5">Save ${saving}</span>}
                                                        </p>
                                                    )}
                                                    {isFree && (
                                                        <p className="text-xs text-muted-foreground mt-1">Free forever • No credit card</p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-border/50" />

                                        {/* Features */}
                                        <ul className="space-y-2.5 flex-1">
                                            <FeatureItem checkColor={theme.check}
                                                label={plan.maxChannels === -1
                                                    ? 'Unlimited channels'
                                                    : `${plan.maxChannels} channel${plan.maxChannels > 1 ? 's' : ''}`}
                                            />
                                            <FeatureItem checkColor={theme.check}
                                                label={plan.maxPostsPerMonth === -1
                                                    ? 'Unlimited posts'
                                                    : `${plan.maxPostsPerMonth} posts/month`}
                                            />
                                            <FeatureItem checkColor={theme.check}
                                                label={plan.maxMembersPerChannel === -1
                                                    ? 'Unlimited members'
                                                    : `${plan.maxMembersPerChannel} members/channel`}
                                            />
                                            {plan.hasAutoSchedule && <FeatureItem checkColor={theme.check} label="Auto scheduling" />}
                                            {plan.maxAiTextPerMonth !== 0 && (
                                                <FeatureItem checkColor={theme.check} label={plan.maxAiTextPerMonth === -1
                                                    ? 'Unlimited AI content'
                                                    : `${plan.maxAiTextPerMonth} AI content/mo`} />
                                            )}
                                            {plan.maxAiImagesPerMonth !== 0 && (
                                                <FeatureItem checkColor={theme.check} label={plan.maxAiImagesPerMonth === -1
                                                    ? 'Unlimited AI images'
                                                    : `${plan.maxAiImagesPerMonth} AI images/mo`} />
                                            )}
                                            {plan.maxStorageMB > 0 && (
                                                <FeatureItem checkColor={theme.check} label={plan.maxStorageMB === -1
                                                    ? 'Unlimited storage'
                                                    : plan.maxStorageMB >= 1024
                                                        ? `${(plan.maxStorageMB / 1024).toFixed(0)} GB storage`
                                                        : `${plan.maxStorageMB} MB storage`} />
                                            )}
                                            {plan.maxApiCallsPerMonth !== 0 && (
                                                <FeatureItem checkColor={theme.check} label={plan.maxApiCallsPerMonth === -1
                                                    ? 'Unlimited API calls'
                                                    : `${plan.maxApiCallsPerMonth.toLocaleString()} API calls/mo`} />
                                            )}
                                            {plan.hasWebhooks && <FeatureItem checkColor={theme.check} label="Webhooks" />}
                                            {plan.hasAdvancedReports && <FeatureItem checkColor={theme.check} label="Advanced reports" />}
                                            {plan.hasPrioritySupport && <FeatureItem checkColor={theme.check} label="Priority support" />}
                                            {plan.hasWhiteLabel && <FeatureItem checkColor={theme.check} label="White label" />}
                                        </ul>

                                        {/* CTA Button */}
                                        {isContact ? (
                                            <Button variant="outline" asChild className="w-full h-11 font-semibold">
                                                <a href="mailto:hello@neeflow.com">Contact Sales</a>
                                            </Button>
                                        ) : isFree ? (
                                            <Button variant="outline" asChild className="w-full h-11 font-semibold group">
                                                <Link href="/register">
                                                    Start for Free
                                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                className={`w-full h-11 font-semibold group transition-all duration-300 ${theme.btnClass || ''}`}
                                                variant={theme.btnClass ? undefined : 'outline'}
                                            >
                                                <Link href="/register">
                                                    Get Started
                                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Trust notes */}
                <div className="mt-14 text-center space-y-2 text-sm text-muted-foreground">
                    <p>All plans use your own API keys — no extra AI fees.</p>
                    <p>Media stored on your Google Drive — no storage limits.</p>
                    <p>Cancel anytime. No lock-in.</p>
                </div>
            </div>
        </section>
    )
}
