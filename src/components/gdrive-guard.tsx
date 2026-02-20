'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
    HardDrive,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

/**
 * GDriveGuard — shows a notice if Google Drive is not configured.
 * Renders as a banner below the page header.
 */
export function GDriveGuard() {
    const t = useTranslation()
    const { data: session } = useSession()
    const [hasGdrive, setHasGdrive] = useState<boolean | null>(null)

    useEffect(() => {
        if (!session?.user) return
        fetch('/api/onboarding/status')
            .then(r => r.json())
            .then(data => {
                setHasGdrive(data?.steps?.hasGdrive ?? false)
            })
            .catch(() => setHasGdrive(true)) // fail open — assume ok
    }, [session])

    // Not loaded yet, or gdrive is configured → don't block
    if (hasGdrive === null || hasGdrive === true) return null

    return (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        {t('media.gdriveRequired')}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('media.gdriveRequiredDesc')}
                </p>
            </div>
            <Link href="/admin/integrations" className="shrink-0">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-yellow-500/40 hover:bg-yellow-500/10">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('media.gdriveSetupBtn')}
                </Button>
            </Link>
        </div>
    )
}
