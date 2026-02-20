'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Sparkles, X, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrialInfo {
    isInTrial: boolean
    daysLeft: number
    trialEndsAt: string | null
}

/**
 * TrialBanner — shown in the dashboard when user is in their 14-day Pro trial.
 * Dismissable per session (stored in sessionStorage).
 */
export function TrialBanner() {
    const { data: session } = useSession()
    const [info, setInfo] = useState<TrialInfo | null>(null)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('trial-banner-dismissed')) {
            setDismissed(true)
            return
        }
        if (!session?.user) return
        fetch('/api/user/trial-status')
            .then(r => r.json())
            .then(data => setInfo(data))
            .catch(() => { })
    }, [session])

    const handleDismiss = () => {
        setDismissed(true)
        sessionStorage.setItem('trial-banner-dismissed', '1')
    }

    if (!info?.isInTrial || dismissed) return null

    const urgency = info.daysLeft <= 3

    return (
        <div className={`relative flex items-center gap-3 px-4 py-2.5 text-sm ${urgency ? 'bg-amber-500/90 text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'}`}>
            {urgency ? (
                <Clock className="h-4 w-4 shrink-0" />
            ) : (
                <Sparkles className="h-4 w-4 shrink-0" />
            )}

            <span className="flex-1 font-medium">
                {urgency
                    ? `⚠️ Còn ${info.daysLeft} ngày dùng thử Pro — Nâng cấp để không mất tính năng!`
                    : `🎉 Bạn đang dùng thử Pro miễn phí — Còn ${info.daysLeft} ngày. Trải nghiệm toàn bộ tính năng!`}
            </span>

            <div className="flex items-center gap-2 shrink-0">
                <Link href="/dashboard/billing">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-3 text-xs font-semibold gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                        <Zap className="h-3 w-3" />
                        Nâng cấp ngay
                    </Button>
                </Link>
                <button
                    onClick={handleDismiss}
                    className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                    aria-label="Đóng"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}
