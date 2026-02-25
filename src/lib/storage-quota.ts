/**
 * Storage quota management for user media uploads.
 * Storage is on Cloudflare R2 — quotas are enforced per subscription plan + add-ons.
 *
 * Storage is measured by summing MediaItem.fileSize for channels the user owns.
 * Effective limit: Plan.maxStorageMB + Σ(storage add-ons) (-1 = unlimited)
 */
import { prisma } from '@/lib/prisma'
import { getEffectiveLimits } from '@/lib/addon-resolver'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export type StorageQuotaResult = {
    allowed: boolean
    usedBytes: number
    limitBytes: number   // -1 = unlimited
    usedMB: number
    limitMB: number
    reason?: string
}

/**
 * Returns total bytes used across all media items in channels owned by this user.
 */
export async function getUserStorageUsedBytes(userId: string): Promise<number> {
    // Find all channels where user is OWNER
    const ownedChannels = await db.channelMember.findMany({
        where: { userId, role: 'OWNER' },
        select: { channelId: true },
    })
    const channelIds = ownedChannels.map((m: { channelId: string }) => m.channelId)

    if (channelIds.length === 0) return 0

    const agg = await db.mediaItem.aggregate({
        where: { channelId: { in: channelIds } },
        _sum: { fileSize: true },
    })

    return agg._sum?.fileSize ?? 0
}

/**
 * Check if user has enough storage quota to upload a file of `fileSizeBytes`.
 * Uses effective limits (plan + add-ons).
 */
export async function checkStorageQuota(
    userId: string,
    fileSizeBytes: number,
): Promise<StorageQuotaResult> {
    try {
        const limits = await getEffectiveLimits(userId)
        const limitMB = limits.maxStorageMB
        const limitBytes = limitMB === -1 ? -1 : limitMB * 1024 * 1024

        const usedBytes = await getUserStorageUsedBytes(userId)
        const usedMB = Math.round(usedBytes / (1024 * 1024) * 10) / 10

        if (limitBytes === -1) {
            return { allowed: true, usedBytes, limitBytes: -1, usedMB, limitMB: -1 }
        }

        if (usedBytes + fileSizeBytes > limitBytes) {
            const newFileMB = Math.round(fileSizeBytes / (1024 * 1024) * 10) / 10
            return {
                allowed: false,
                usedBytes,
                limitBytes,
                usedMB,
                limitMB,
                reason: `Storage limit reached: ${usedMB} MB used of ${limitMB} MB. This file is ${newFileMB} MB. Upgrade your plan or purchase an add-on.`,
            }
        }

        return { allowed: true, usedBytes, limitBytes, usedMB, limitMB }
    } catch {
        // Fail open if DB column not migrated yet
        return { allowed: true, usedBytes: 0, limitBytes: -1, usedMB: 0, limitMB: -1 }
    }
}

/**
 * Get storage usage summary for display on billing / media page.
 * Uses effective limits (plan + add-ons).
 */
export async function getUserStorageSummary(userId: string): Promise<{
    usedBytes: number
    usedMB: number
    limitMB: number
    limitBytes: number
    percentUsed: number
}> {
    try {
        const limits = await getEffectiveLimits(userId)
        const limitMB = limits.maxStorageMB
        const limitBytes = limitMB === -1 ? -1 : limitMB * 1024 * 1024
        const usedBytes = await getUserStorageUsedBytes(userId)
        const usedMB = Math.round(usedBytes / (1024 * 1024) * 10) / 10
        const percentUsed = limitBytes === -1 ? 0 : Math.min(100, Math.round((usedBytes / limitBytes) * 100))

        return { usedBytes, usedMB, limitMB, limitBytes, percentUsed }
    } catch {
        return { usedBytes: 0, usedMB: 0, limitMB: 512, limitBytes: 512 * 1024 * 1024, percentUsed: 0 }
    }
}
