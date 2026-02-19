import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { randomUUID } from 'crypto'
import {
    getGDriveAccessToken,
    getUserGDriveAccessToken,
    getOrCreateChannelFolder,
    getOrCreateMonthlyFolder,
    uploadFile,
    makeFilePublic,
} from '@/lib/gdrive'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/**
 * POST /api/admin/posts/generate-image
 * AI-generates an image from a prompt using the channel's configured image provider.
 * Downloads to disk (streaming), uploads to Google Drive, cleans up.
 *
 * Body: { channelId, prompt, width?, height? }
 * Returns: { mediaItem, provider }
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, prompt, width = 1024, height = 1024 } = await req.json()

    if (!channelId || !prompt) {
        return NextResponse.json({ error: 'channelId and prompt are required' }, { status: 400 })
    }

    // ─── Resolve image provider ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
    }) as any

    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Priority: channel image provider → channel AI provider → any image-capable key
    const imageProvider = channel.defaultImageProvider || null
    const imageModel = channel.defaultImageModel || null

    // Find user's API key for the image provider
    const providerCandidates = imageProvider
        ? [imageProvider]
        : ['runware', 'openai', 'gemini'] // fallback order

    let resolvedProvider = ''
    let apiKey = ''

    for (const provider of providerCandidates) {
        const userKey = await prisma.userApiKey.findFirst({
            where: { userId: session.user.id, provider },
        })
        if (userKey) {
            resolvedProvider = provider
            apiKey = decrypt(userKey.apiKeyEncrypted)
            break
        }
    }

    if (!resolvedProvider || !apiKey) {
        return NextResponse.json(
            { error: 'No image AI provider configured. Add a Runware, OpenAI, or Gemini API key in AI API Keys.' },
            { status: 400 }
        )
    }

    // ─── Generate image via provider ──────────────────
    let imageUrl: string
    let mimeType = 'image/png'

    try {
        switch (resolvedProvider) {
            case 'runware': {
                const model = imageModel || 'runware:100@1' // FLUX.1 [Dev]
                imageUrl = await generateWithRunware(apiKey, prompt, model, width, height)
                break
            }
            case 'openai': {
                const model = imageModel || 'dall-e-3'
                const result = await generateWithOpenAI(apiKey, prompt, model, width, height)
                imageUrl = result.url
                break
            }
            case 'gemini': {
                const model = imageModel || 'imagen-3.0-generate-002'
                const result = await generateWithGemini(apiKey, prompt, model)
                imageUrl = result.url
                mimeType = result.mimeType || 'image/png'
                break
            }
            default:
                return NextResponse.json({ error: `Unsupported image provider: ${resolvedProvider}` }, { status: 400 })
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Image generation failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }

    // ─── Download to disk (streaming) → upload to GDrive → cleanup ───
    const tmpPath = path.join(os.tmpdir(), `asoc_img_${randomUUID()}.png`)
    try {
        // Download image to temp file (streaming, minimal RAM)
        const downloadRes = await fetch(imageUrl)
        if (!downloadRes.ok || !downloadRes.body) {
            throw new Error('Failed to download generated image')
        }

        const writer = fs.createWriteStream(tmpPath)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pipeline(Readable.fromWeb(downloadRes.body as any), writer)

        // Read file for upload
        const fileBuffer = fs.readFileSync(tmpPath)
        const fileSize = fs.statSync(tmpPath).size

        // Get Google Drive access
        let accessToken: string
        let targetFolderId: string

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { gdriveRefreshToken: true, gdriveFolderId: true },
        })

        if (user?.gdriveRefreshToken && user?.gdriveFolderId) {
            accessToken = await getUserGDriveAccessToken(session.user.id)
            const channelName = channel.displayName || channel.name || 'General'
            const channelFolder = await getOrCreateChannelFolder(accessToken, user.gdriveFolderId, channelName)
            const monthlyFolder = await getOrCreateMonthlyFolder(accessToken, channelFolder.id)
            targetFolderId = monthlyFolder.id
        } else {
            accessToken = await getGDriveAccessToken()
            const integration = await prisma.apiIntegration.findFirst({
                where: { provider: 'gdrive' },
            })
            const gdriveConfig = (integration?.config || {}) as Record<string, string>
            if (!gdriveConfig.parentFolderId) {
                throw new Error('Google Drive not configured. Set up Google Drive in API Hub first.')
            }
            const channelName = channel.displayName || channel.name || 'General'
            const channelFolder = await getOrCreateChannelFolder(accessToken, gdriveConfig.parentFolderId, channelName)
            targetFolderId = channelFolder.id
        }

        // Upload to Google Drive
        const now = new Date()
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`
        const shortId = randomUUID().slice(0, 6)
        const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png'
        const uniqueName = `ai-image ${shortId} - ${dateStr}.${ext}`

        const driveFile = await uploadFile(accessToken, uniqueName, mimeType, fileBuffer, targetFolderId)
        const publicUrl = await makeFilePublic(accessToken, driveFile.id, mimeType)
        const thumbnailUrl = `https://lh3.googleusercontent.com/d/${driveFile.id}=s400`

        // Create MediaItem in database
        const mediaItem = await prisma.mediaItem.create({
            data: {
                channelId,
                url: publicUrl,
                thumbnailUrl,
                storageFileId: driveFile.id,
                type: 'image',
                source: 'ai_generated',
                originalName: uniqueName,
                fileSize: fileSize,
                mimeType,
                aiMetadata: {
                    provider: resolvedProvider,
                    model: imageModel || 'default',
                    prompt,
                    gdriveFolderId: targetFolderId,
                    webViewLink: driveFile.webViewLink,
                },
            },
        })

        return NextResponse.json({ mediaItem, provider: resolvedProvider })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to process image'
        return NextResponse.json({ error: msg }, { status: 500 })
    } finally {
        // Always clean up temp file
        fs.unlink(tmpPath, () => { })
    }
}

// ─── Provider implementations ──────────────────────────

async function generateWithRunware(
    apiKey: string,
    prompt: string,
    model: string,
    width: number,
    height: number,
): Promise<string> {
    const res = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify([
            {
                taskType: 'imageInference',
                taskUUID: randomUUID(),
                positivePrompt: prompt,
                model,
                width,
                height,
                numberResults: 1,
                outputFormat: 'PNG',
            },
        ]),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Runware error: ${err.error || res.statusText}`)
    }

    const data = await res.json()
    const imageData = data.data?.[0]
    if (!imageData?.imageURL) {
        throw new Error('Runware returned no image')
    }
    return imageData.imageURL
}

async function generateWithOpenAI(
    apiKey: string,
    prompt: string,
    model: string,
    width: number,
    height: number,
): Promise<{ url: string }> {
    // Map dimensions to OpenAI sizes
    let size = '1024x1024'
    if (width > height) size = '1792x1024'
    else if (height > width) size = '1024x1792'

    const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            prompt,
            n: 1,
            size,
            response_format: 'url',
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    return { url: data.data[0].url }
}

async function generateWithGemini(
    apiKey: string,
    prompt: string,
    model: string,
): Promise<{ url: string; mimeType?: string }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
                sampleCount: 1,
            },
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Gemini Imagen error: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    const prediction = data.predictions?.[0]
    if (!prediction?.bytesBase64Encoded) {
        throw new Error('Gemini returned no image')
    }

    // Gemini returns base64 — write to a temp data URI for the download step
    const mime = prediction.mimeType || 'image/png'
    const dataUrl = `data:${mime};base64,${prediction.bytesBase64Encoded}`
    return { url: dataUrl, mimeType: mime }
}
