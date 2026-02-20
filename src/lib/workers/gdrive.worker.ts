/**
 * Google Drive Sync Worker — BullMQ consumer for 'gdrive-sync' queue.
 * Imports new media files from a Google Drive folder into the media library.
 */

import { Worker } from 'bullmq'
import { QUEUE_NAMES, REDIS_URL } from '@/lib/queue'
import { prisma } from '@/lib/prisma'
import { listDriveFiles, refreshAccessToken } from '@/lib/gdrive'
import { decrypt } from '@/lib/encryption'
import type { GdriveSyncJobData } from '@/lib/queue'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']

function getMimeCategory(mimeType: string): 'image' | 'video' | null {
    if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video'
    return null
}

async function processGdriveSync(data: GdriveSyncJobData): Promise<void> {
    const { channelId, integrationId, folderId } = data
    console.log(`[GDriveWorker] Syncing folder ${folderId} for channel ${channelId}`)

    // Get integration config
    const integration = await prisma.apiIntegration.findUnique({
        where: { id: integrationId },
        select: { config: true, apiKeyEncrypted: true },
    })

    if (!integration) throw new Error(`ApiIntegration ${integrationId} not found`)

    const config = (integration.config || {}) as Record<string, string>
    const clientId = config.gdriveClientId
    const encryptedRefreshToken = config.gdriveRefreshToken
    const encryptedClientSecret = integration.apiKeyEncrypted

    if (!clientId || !encryptedRefreshToken || !encryptedClientSecret) {
        throw new Error('Missing Google Drive credentials in integration config')
    }

    const clientSecret = decrypt(encryptedClientSecret)
    const refreshToken = decrypt(encryptedRefreshToken)

    // Get fresh access token via refresh
    const { accessToken } = await refreshAccessToken(refreshToken, clientId, clientSecret)

    // List files in the Drive folder
    const files = await listDriveFiles(accessToken, folderId)
    console.log(`[GDriveWorker] Found ${files.length} files in folder`)

    let imported = 0
    let skipped = 0

    for (const file of files) {
        if (!file.id || !file.name || !file.mimeType) continue

        const mediaType = getMimeCategory(file.mimeType)
        if (!mediaType) { skipped++; continue }

        // Skip already-imported files (dedup by storageFileId)
        const existing = await prisma.mediaItem.findFirst({
            where: { channelId, storageFileId: file.id },
            select: { id: true },
        })

        if (existing) { skipped++; continue }

        const driveUrl = `https://lh3.googleusercontent.com/d/${file.id}`

        await prisma.mediaItem.create({
            data: {
                channelId,
                originalName: file.name,
                url: driveUrl,
                thumbnailUrl: file.thumbnailLink || null,
                type: mediaType,
                mimeType: file.mimeType,
                fileSize: file.size ? parseInt(file.size, 10) : null,
                source: 'upload',
                storageFileId: file.id,
            },
        })

        imported++
        console.log(`[GDriveWorker] Imported: ${file.name}`)
    }

    // Update last sync timestamp on integration
    await prisma.apiIntegration.update({
        where: { id: integrationId },
        data: { updatedAt: new Date() },
    })

    console.log(`[GDriveWorker] Done — imported: ${imported}, skipped: ${skipped}`)
}

export function startGdriveWorker(): Worker {
    const worker = new Worker<GdriveSyncJobData>(
        QUEUE_NAMES.GDRIVE,
        async (job) => { await processGdriveSync(job.data) },
        { connection: { url: REDIS_URL }, concurrency: 2 }
    )

    worker.on('completed', j => console.log(`[GDriveWorker] Job ${j.id} completed`))
    worker.on('failed', (j, err) => console.error(`[GDriveWorker] Job ${j?.id} failed:`, err.message))
    worker.on('error', err => console.error('[GDriveWorker] Error:', err))

    console.log('[GDriveWorker] Started')
    return worker
}
