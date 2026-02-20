'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    CheckCircle2,
    Circle,
    BrainCircuit,
    HardDrive,
    Megaphone,
    Share2,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/lib/i18n'

interface OnboardingStatus {
    isComplete: boolean
    steps: {
        hasAI: boolean
        hasGdrive: boolean
        hasChannel: boolean
        hasSocialPlatform: boolean
    }
    isAdmin: boolean
}

const DISMISSED_KEY = 'onboarding_dismissed_v1'

export function OnboardingChecklist() {
    const t = useTranslation()
    const [status, setStatus] = useState<OnboardingStatus | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        // Check if user has dismissed
        if (typeof window !== 'undefined') {
            setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
        }
        // Fetch onboarding status
        fetch('/api/onboarding/status')
            .then(r => r.json())
            .then(setStatus)
            .catch(() => { })
    }, [])

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, 'true')
        setDismissed(true)
    }

    // Don't render if dismissed, complete, or not loaded yet
    if (dismissed || !status || status.isComplete) return null

    const steps = [
        {
            key: 'hasAI',
            done: status.steps.hasAI,
            icon: BrainCircuit,
            label: t('onboarding.steps.ai'),
            description: t('onboarding.steps.aiDesc'),
            // Admin → shared integrations hub; regular user → their own API key page
            href: status.isAdmin ? '/admin/integrations' : '/dashboard/api-keys',
        },
        {
            key: 'hasGdrive',
            done: status.steps.hasGdrive,
            icon: HardDrive,
            label: t('onboarding.steps.gdrive'),
            description: t('onboarding.steps.gdriveDesc'),
            // Admin → integrations hub; regular user → their own api-keys page (has GDrive section)
            href: status.isAdmin ? '/admin/integrations' : '/dashboard/api-keys',
        },
        {
            key: 'hasChannel',
            done: status.steps.hasChannel,
            icon: Megaphone,
            label: t('onboarding.steps.channel'),
            description: t('onboarding.steps.channelDesc'),
            href: '/dashboard/channels',
        },
        {
            key: 'hasSocialPlatform',
            done: status.steps.hasSocialPlatform,
            icon: Share2,
            label: t('onboarding.steps.platform'),
            description: t('onboarding.steps.platformDesc'),
            href: '/dashboard/channels',
        },
    ]

    const completed = steps.filter(s => s.done).length
    const total = steps.length
    const progress = Math.round((completed / total) * 100)

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{t('onboarding.title')}</CardTitle>
                        <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                            {completed}/{total}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCollapsed(c => !c)}
                        >
                            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={handleDismiss}
                            title={t('common.dismiss')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('onboarding.subtitle')}</p>
            </CardHeader>

            {!collapsed && (
                <CardContent className="pt-0">
                    <div className="space-y-3 mt-2">
                        {steps.map((step) => {
                            const Icon = step.icon
                            return (
                                <div
                                    key={step.key}
                                    className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${step.done ? 'opacity-60' : 'bg-background/50 border border-border/50'}`}
                                >
                                    {step.done ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {!step.done && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                                        )}
                                    </div>
                                    {!step.done && (
                                        <Link href={step.href}>
                                            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                                                {t('onboarding.setup')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
