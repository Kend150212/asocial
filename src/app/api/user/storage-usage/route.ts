import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserStorageSummary } from '@/lib/storage-quota'
import { getUserGDriveAccessToken } from '@/lib/gdrive'
import { prisma } from '@/lib/prisma'

// GET /api/user/storage-usage
// - If user has own GDrive: try to fetch real GDrive quota, else return unlimited
// - If no GDrive: return plan-based limit
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gdriveRefreshToken: true, gdriveFolderId: true, role: true },
    })

    const hasGdrive = !!(user?.gdriveRefreshToken && user?.gdriveFolderId)
    const isAdmin = user?.role === 'ADMIN'

    // ── User has own GDrive → no plan limit, try fetching real Drive quota ──
    if (hasGdrive) {
        try {
            const accessToken = await getUserGDriveAccessToken(userId)
            const res = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (res.ok) {
                const data = await res.json()
                const q = data.storageQuota as {
                    limit?: string
                    usage?: string
                    usageInDrive?: string
                }
                const limitBytes = q.limit ? Number(q.limit) : -1 // -1 = unlimited (e.g. Workspace)
                const usedBytes = Number(q.usageInDrive ?? q.usage ?? 0)
                const limitMB = limitBytes === -1 ? -1 : Math.round(limitBytes / (1024 * 1024))
                const usedMB = Math.round(usedBytes / (1024 * 1024) * 10) / 10
                const percentUsed = limitBytes === -1 ? 0 : Math.min(100, Math.round((usedBytes / limitBytes) * 100))

                return NextResponse.json({
                    hasGdrive: true,
                    isAdmin,
                    isOwnGdrive: true,
                    usedBytes,
                    usedMB,
                    limitMB,
                    limitBytes,
                    percentUsed,
                    unlimited: limitBytes === -1,
                })
            }
        } catch {
            // Can't fetch Drive quota — just show unlimited with 0 usage
        }

        // Fallback: has GDrive but couldn't fetch quota
        return NextResponse.json({
            hasGdrive: true,
            isAdmin,
            isOwnGdrive: true,
            unlimited: true,
            usedBytes: 0,
            usedMB: 0,
            limitMB: -1,
            limitBytes: -1,
            percentUsed: 0,
        })
    }

    // ── No own GDrive → apply plan-based limit ──────────────────────────────
    const summary = await getUserStorageSummary(userId)
    return NextResponse.json({
        hasGdrive: false,
        isAdmin,
        isOwnGdrive: false,
        unlimited: false,
        ...summary,
    })
}
