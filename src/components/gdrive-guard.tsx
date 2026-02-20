'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { HardDrive, AlertTriangle, ExternalLink, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StorageInfo {
    hasGdrive: boolean
    isAdmin: boolean
    usedMB: number
    limitMB: number
    percentUsed: number
}

/**
 * GDriveGuard — shows:
 * 1. A blocking error banner if user hasn't connected their Google Drive
 * 2. A storage usage bar showing X MB / Y GB used
 */
export function GDriveGuard() {
    const { data: session } = useSession()
    const [info, setInfo] = useState<StorageInfo | null>(null)

    useEffect(() => {
        if (!session?.user) return
        fetch('/api/user/storage-usage')
            .then(r => r.json())
            .then(data => setInfo(data))
            .catch(() => setInfo(null)) // fail open
    }, [session])

    if (!info) return null

    const setupHref = info.isAdmin ? '/admin/integrations' : '/dashboard/api-keys'
    const limitLabel = info.limitMB === -1 ? 'Unlimited' : info.limitMB >= 1024 ? `${(info.limitMB / 1024).toFixed(0)} GB` : `${info.limitMB} MB`
    const usedLabel = info.usedMB >= 1024 ? `${(info.usedMB / 1024).toFixed(2)} GB` : `${info.usedMB} MB`

    // ─── No GDrive connected ─────────────────────────────────────────────────
    if (!info.hasGdrive) {
        return (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                <CloudOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-destructive">Google Drive chưa được kết nối</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Bạn cần kết nối Google Drive để upload và quản lý media. Tất cả file sẽ được lưu trên Drive của bạn.
                    </p>
                </div>
                <Link href={setupHref} className="shrink-0">
                    <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Kết nối ngay
                    </Button>
                </Link>
            </div>
        )
    }

    // ─── GDrive connected — show storage bar ─────────────────────────────────
    const isNearLimit = info.percentUsed >= 80
    const isAtLimit = info.percentUsed >= 100

    return (
        <div className={`mb-4 rounded-xl border p-3 ${isAtLimit ? 'border-destructive/40 bg-destructive/10' : isNearLimit ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-border bg-muted/30'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <HardDrive className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Google Drive Storage</span>
                </div>
                <span className={`text-xs font-mono tabular-nums ${isAtLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                    {usedLabel} / {limitLabel}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(info.percentUsed, 100)}%` }}
                />
            </div>

            {isAtLimit && (
                <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">Dung lượng đã đầy. Không thể upload thêm. Nâng cấp plan để tăng dung lượng.</p>
                </div>
            )}
            {isNearLimit && !isAtLimit && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5">
                    Sắp hết dung lượng ({info.percentUsed}% đã dùng).
                </p>
            )}
        </div>
    )
}
