import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * Cloudflare R2 storage client.
 * Credentials are stored in the `api_integrations` table (provider: 'r2').
 *
 * Config fields:
 * - r2AccountId: Cloudflare Account ID
 * - r2BucketName: R2 bucket name
 * - r2PublicUrl: Public URL for the bucket (custom domain or r2.dev)
 * - apiKeyEncrypted: R2 Access Key ID (encrypted)
 * - config.r2SecretAccessKey: R2 Secret Access Key (encrypted)
 */

interface R2Config {
    accountId: string
    bucketName: string
    publicUrl: string
    accessKeyId: string
    secretAccessKey: string
}

let cachedConfig: R2Config | null = null
let cachedAt = 0
const CACHE_TTL = 60_000 // Cache config for 1 minute

async function getR2Config(): Promise<R2Config> {
    const now = Date.now()
    if (cachedConfig && now - cachedAt < CACHE_TTL) {
        return cachedConfig
    }

    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'r2' },
    })

    if (!integration) {
        throw new Error('Cloudflare R2 not configured. Go to API Hub → Cloudflare R2 to set up.')
    }

    const config = (integration.config || {}) as Record<string, string>
    const accountId = config.r2AccountId
    const bucketName = config.r2BucketName
    const publicUrl = config.r2PublicUrl

    if (!accountId || !bucketName || !publicUrl) {
        throw new Error('Cloudflare R2 configuration incomplete. Please fill in all fields in API Hub.')
    }

    // Access Key ID is stored as the main API key (encrypted)
    if (!integration.apiKeyEncrypted) {
        throw new Error('R2 Access Key ID not configured')
    }
    const accessKeyId = decrypt(integration.apiKeyEncrypted)

    // Secret Access Key is stored in config (encrypted)
    const secretEncrypted = config.r2SecretAccessKey
    if (!secretEncrypted) {
        throw new Error('R2 Secret Access Key not configured')
    }
    const secretAccessKey = decrypt(secretEncrypted)

    cachedConfig = { accountId, bucketName, publicUrl, accessKeyId, secretAccessKey }
    cachedAt = now
    return cachedConfig
}

function createS3Client(config: R2Config): S3Client {
    return new S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    })
}

/**
 * Generate a unique R2 key for a media file.
 * Format: media/{channelId}/{YYYY-MM}/{uniqueId}.{ext}
 */
export function generateR2Key(channelId: string, fileName: string): string {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const ext = fileName.split('.').pop()?.toLowerCase() || 'bin'
    return `media/${channelId}/${month}/${uniqueId}.${ext}`
}

/**
 * Upload a file buffer to R2 and return the public URL.
 */
export async function uploadToR2(
    buffer: Buffer | ArrayBuffer,
    key: string,
    contentType: string,
): Promise<string> {
    const config = await getR2Config()
    const client = createS3Client(config)

    await client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer instanceof Buffer ? new Uint8Array(buffer) : new Uint8Array(buffer),
        ContentType: contentType,
    }))

    return getR2PublicUrl(key, config.publicUrl)
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
    const config = await getR2Config()
    const client = createS3Client(config)

    await client.send(new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    }))
}

/**
 * Generate a presigned PUT URL for client-side uploads.
 * Expires in 1 hour.
 */
export async function getR2PresignedUrl(
    key: string,
    contentType: string,
    fileSize?: number,
): Promise<string> {
    const config = await getR2Config()
    const client = createS3Client(config)

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: contentType,
        ...(fileSize ? { ContentLength: fileSize } : {}),
    })

    return await getSignedUrl(client, command, { expiresIn: 3600 })
}

/**
 * Get the public URL for an R2 key.
 */
export function getR2PublicUrl(key: string, publicUrl?: string): string {
    const baseUrl = publicUrl || cachedConfig?.publicUrl || ''
    // Remove trailing slash
    const base = baseUrl.replace(/\/$/, '')
    return `${base}/${key}`
}

/**
 * Check if R2 is configured and accessible.
 */
export async function isR2Configured(): Promise<boolean> {
    try {
        await getR2Config()
        return true
    } catch {
        return false
    }
}
