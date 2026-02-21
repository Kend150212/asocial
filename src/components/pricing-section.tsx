'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Zap, Loader2 } from 'lucide-react'

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

function FeatureItem({ label }: { label: string }) {
    return (
        <li className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>{label}</span>
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

    return (
        <section id="pricing" className="py-24 scroll-mt-24">
            <div className="mx-auto max-w-6xl px-6">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-4">
                        <Zap className="h-3.5 w-3.5" />
                        Pricing
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                        Start free. Upgrade when you need more power. No hidden fees.
                    </p>

                    {/* Interval toggle */}
                    <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border bg-muted/30">
                        <button
                            onClick={() => setInterval('monthly')}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${interval === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setInterval('annual')}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${interval === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Annual
                            <Badge className="text-xs bg-green-500 text-white border-0 px-1.5">2 months free</Badge>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : plans.length === 0 ? (
                    <p className="text-center text-muted-foreground">No plans available yet.</p>
                ) : (
                    <div className={`grid gap-6 ${plans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                        {plans.map((plan) => {
                            const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
                            const isContact = price === 0 && (plan.maxChannels === -1 || plan.name === 'Enterprise')
                            const isPopular = plan.name === 'Pro'
                            const isFree = price === 0 && !isContact
                            const saving = annualSaving(plan)

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-all ${isPopular
                                        ? 'border-primary shadow-lg shadow-primary/10 bg-primary/[0.02]'
                                        : 'bg-card hover:shadow-md'
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Plan header */}
                                    <div>
                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        {plan.description && (
                                            <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div>
                                        {isContact ? (
                                            <div className="text-2xl font-bold">Contact us</div>
                                        ) : (
                                            <>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-3xl font-bold">${price}</span>
                                                    <span className="text-sm text-muted-foreground mb-1">
                                                        {interval === 'annual' ? '/yr' : '/mo'}
                                                    </span>
                                                </div>
                                                {interval === 'annual' && saving && (
                                                    <p className="text-xs text-green-500 mt-0.5">Save ${saving}/year</p>
                                                )}
                                                {isFree && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">Free forever</p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2 flex-1">
                                        <FeatureItem
                                            label={plan.maxChannels === -1
                                                ? 'Unlimited channels'
                                                : `${plan.maxChannels} channel${plan.maxChannels > 1 ? 's' : ''}`}
                                        />
                                        <FeatureItem
                                            label={plan.maxPostsPerMonth === -1
                                                ? 'Unlimited posts'
                                                : `${plan.maxPostsPerMonth} posts/month`}
                                        />
                                        <FeatureItem
                                            label={plan.maxMembersPerChannel === -1
                                                ? 'Unlimited members'
                                                : `${plan.maxMembersPerChannel} members/channel`}
                                        />
                                        {plan.hasAutoSchedule && <FeatureItem label="Auto scheduling" />}
                                        {plan.maxAiTextPerMonth !== 0 && (
                                            <FeatureItem label={plan.maxAiTextPerMonth === -1
                                                ? 'Unlimited AI content'
                                                : `${plan.maxAiTextPerMonth} AI content/mo`} />
                                        )}
                                        {plan.maxAiImagesPerMonth !== 0 && (
                                            <FeatureItem label={plan.maxAiImagesPerMonth === -1
                                                ? 'Unlimited AI images'
                                                : `${plan.maxAiImagesPerMonth} AI images/mo`} />
                                        )}
                                        {plan.maxStorageMB > 0 && (
                                            <FeatureItem label={plan.maxStorageMB === -1
                                                ? 'Unlimited storage'
                                                : plan.maxStorageMB >= 1024
                                                    ? `${(plan.maxStorageMB / 1024).toFixed(0)} GB storage`
                                                    : `${plan.maxStorageMB} MB storage`} />
                                        )}
                                        {plan.maxApiCallsPerMonth !== 0 && (
                                            <FeatureItem label={plan.maxApiCallsPerMonth === -1
                                                ? 'Unlimited API calls'
                                                : `${plan.maxApiCallsPerMonth.toLocaleString()} API calls/mo`} />
                                        )}
                                        {plan.hasWebhooks && <FeatureItem label="Webhooks" />}
                                        {plan.hasAdvancedReports && <FeatureItem label="Advanced reports" />}
                                        {plan.hasPrioritySupport && <FeatureItem label="Priority support" />}
                                        {plan.hasWhiteLabel && <FeatureItem label="White label" />}
                                    </ul>

                                    {/* CTA */}
                                    {isContact ? (
                                        <Button variant="outline" asChild className="w-full">
                                            <a href="mailto:support@kendymarketing.com">Contact Sales</a>
                                        </Button>
                                    ) : isFree ? (
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href="/register">Start for Free</Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={isPopular ? 'default' : 'outline'}
                                            className="w-full"
                                            asChild
                                        >
                                            <Link href="/register">Get Started</Link>
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Notes */}
                <div className="mt-10 text-center space-y-1.5 text-sm text-muted-foreground">
                    <p>All plans use your own API keys — no extra AI fees.</p>
                    <p>Media stored on your Google Drive — no storage limits.</p>
                    <p>Cancel anytime. No lock-in.</p>
                </div>
            </div>
        </section>
    )
}
