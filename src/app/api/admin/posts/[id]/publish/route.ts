import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ───────────────────────────────────────────────────────────

interface MediaInfo {
    url: string
    type: string // 'image' | 'video' from database
    originalName?: string
}

// ─── Platform publishers ─────────────────────────────────────────────

function isVideoMedia(media: MediaInfo): boolean {
    // Primary: trust the database type field
    if (media.type === 'video') return true
    // Fallback: check extension in URL or originalName
    const str = (media.originalName || media.url || '').toLowerCase()
    return /\.(mp4|mov|webm|avi|mkv|ogg|3gp|flv|wmv|mpeg)(\?|$)/i.test(str)
}

async function publishToFacebook(
    accessToken: string,
    accountId: string,
    content: string,
    mediaItems: MediaInfo[],
    postType: string,
): Promise<{ externalId: string }> {
    // Facebook Graph API — Post to Page

    if (mediaItems.length > 0 && postType !== 'story') {
        const firstMedia = mediaItems[0]

        if (isVideoMedia(firstMedia)) {
            // ── Video: use /videos endpoint ──
            const videoUrl = `https://graph.facebook.com/v21.0/${accountId}/videos`
            const videoBody: Record<string, string> = {
                description: content,
                file_url: firstMedia.url, // Facebook fetches the video from this URL
                access_token: accessToken,
            }
            const res = await fetch(videoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(videoBody),
            })
            const data = await res.json()
            if (data.error) {
                throw new Error(data.error.message || 'Facebook video upload error')
            }
            return { externalId: data.id || data.post_id }
        } else {
            // ── Image: use /photos endpoint ──
            const photoUrl = `https://graph.facebook.com/v21.0/${accountId}/photos`
            const photoBody: Record<string, string> = {
                caption: content,
                url: firstMedia.url, // Facebook fetches the image from this URL
                access_token: accessToken,
            }
            const res = await fetch(photoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(photoBody),
            })
            const data = await res.json()
            if (data.error) {
                throw new Error(data.error.message || 'Facebook photo upload error')
            }
            return { externalId: data.id || data.post_id }
        }
    }

    // ── Text-only post: use /feed endpoint ──
    const url = `https://graph.facebook.com/v21.0/${accountId}/feed`
    const body: Record<string, string> = {
        message: content,
        access_token: accessToken,
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) {
        throw new Error(data.error.message || 'Facebook API error')
    }
    return { externalId: data.id }
}

async function publishToInstagram(
    accessToken: string,
    accountId: string,
    content: string,
    mediaItems: MediaInfo[],
): Promise<{ externalId: string }> {
    if (mediaItems.length === 0) {
        throw new Error('Instagram requires at least one image or video')
    }

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
    const containerBody: Record<string, string> = {
        caption: content,
        access_token: accessToken,
    }

    // Determine media type from database type field
    const firstMedia = mediaItems[0]
    if (isVideoMedia(firstMedia)) {
        containerBody.media_type = 'VIDEO'
        containerBody.video_url = firstMedia.url
    } else {
        containerBody.image_url = firstMedia.url
    }

    const containerRes = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
    })
    const containerData = await containerRes.json()
    if (containerData.error) {
        throw new Error(containerData.error.message || 'Instagram container creation failed')
    }

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v21.0/${accountId}/media_publish`
    const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creation_id: containerData.id,
            access_token: accessToken,
        }),
    })
    const publishData = await publishRes.json()
    if (publishData.error) {
        throw new Error(publishData.error.message || 'Instagram publish failed')
    }
    return { externalId: publishData.id }
}

// ─── YouTube token refresh ──────────────────────────────────────────

async function refreshYouTubeToken(refreshToken: string): Promise<string> {
    // Read YouTube OAuth credentials from database
    const { decrypt } = await import('@/lib/encryption')
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'youtube' },
    })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.youtubeClientId || process.env.GOOGLE_CLIENT_ID || ''
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

    if (integration?.apiKeyEncrypted) {
        try {
            clientSecret = decrypt(integration.apiKeyEncrypted)
        } catch {
            clientSecret = integration.apiKeyEncrypted
        }
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`YouTube token refresh failed: ${err}`)
    }

    const data = await res.json()
    return data.access_token
}

// ─── YouTube publisher ──────────────────────────────────────────────

async function publishToYouTube(
    accessToken: string,
    refreshToken: string | null,
    accountId: string,
    content: string,
    mediaItems: MediaInfo[],
    platformId: string,
): Promise<{ externalId: string }> {
    // YouTube requires a video
    const videoMedia = mediaItems.find((m) => isVideoMedia(m))
    if (!videoMedia) {
        throw new Error('YouTube requires a video. Please attach a video to your post.')
    }

    // Refresh token if we have a refresh token
    let token = accessToken
    if (refreshToken) {
        try {
            token = await refreshYouTubeToken(refreshToken)
            // Update stored access token
            await prisma.channelPlatform.update({
                where: { id: platformId },
                data: { accessToken: token, tokenExpiresAt: new Date(Date.now() + 3600 * 1000) },
            })
        } catch (err) {
            console.warn('YouTube token refresh failed, using existing token:', err)
        }
    }

    // Extract title from first line of content, rest as description
    const lines = content.split('\n')
    const title = (lines[0] || 'Untitled').slice(0, 100) // YouTube title max 100 chars
    const description = lines.slice(1).join('\n').trim() || content

    // Step 1: Download the video file from URL
    const videoRes = await fetch(videoMedia.url)
    if (!videoRes.ok) {
        throw new Error(`Failed to download video: ${videoRes.statusText}`)
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
    const contentType = videoRes.headers.get('content-type') || 'video/mp4'

    // Step 2: Start resumable upload
    const metadata = {
        snippet: {
            title,
            description,
            categoryId: '22', // People & Blogs
        },
        status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
        },
    }

    const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Length': String(videoBuffer.length),
                'X-Upload-Content-Type': contentType,
            },
            body: JSON.stringify(metadata),
        }
    )

    if (!initRes.ok) {
        const err = await initRes.text()
        throw new Error(`YouTube upload init failed: ${err}`)
    }

    const uploadUrl = initRes.headers.get('location')
    if (!uploadUrl) {
        throw new Error('YouTube upload: no resumable upload URL returned')
    }

    // Step 3: Upload the actual video bytes
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'Content-Length': String(videoBuffer.length),
        },
        body: videoBuffer,
    })

    if (!uploadRes.ok) {
        const err = await uploadRes.text()
        throw new Error(`YouTube video upload failed: ${err}`)
    }

    const uploadData = await uploadRes.json()
    return { externalId: uploadData.id }
}

// Generic placeholder for other platforms (mark as pending-integration)
async function publishPlaceholder(platform: string): Promise<{ externalId: string }> {
    // TODO: Implement TikTok, LinkedIn, X, Pinterest publishing
    throw new Error(`${platform} publishing not yet integrated. Coming soon!`)
}

// ─── Main handler ────────────────────────────────────────────────────

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            channel: {
                include: {
                    platforms: { where: { isActive: true } },
                },
            },
            media: {
                include: { mediaItem: true },
                orderBy: { sortOrder: 'asc' },
            },
            platformStatuses: true,
        },
    })

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Update status to PUBLISHING
    await prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHING' },
    })

    const results: { platform: string; accountId: string; success: boolean; error?: string; externalId?: string }[] = []

    // Get pending platform statuses
    const pendingStatuses = post.platformStatuses.filter((ps) => ps.status === 'pending')

    // Build media info objects (URL + type) for platform APIs
    const mediaItems: MediaInfo[] = post.media.map((m) => {
        let url = m.mediaItem.url
        // If URL is already absolute (starts with http), use as-is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // For Google Drive: use drive.google.com/uc URL that external APIs can fetch
            if (m.mediaItem.storageFileId && url.includes('googleusercontent.com')) {
                url = `https://drive.google.com/uc?export=download&id=${m.mediaItem.storageFileId}`
            }
        } else {
            // Legacy/local media — prefix with base URL
            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            url = `${baseUrl}${url}`
        }
        return {
            url,
            type: m.mediaItem.type || 'image',
            originalName: m.mediaItem.originalName || undefined,
        }
    })

    for (const ps of pendingStatuses) {
        try {
            // Find the platform connection
            const platformConn = post.channel.platforms.find(
                (p) => p.platform === ps.platform && p.accountId === ps.accountId
            )

            if (!platformConn) {
                await prisma.postPlatformStatus.update({
                    where: { id: ps.id },
                    data: { status: 'failed', errorMsg: 'Platform connection not found or inactive' },
                })
                results.push({ platform: ps.platform, accountId: ps.accountId, success: false, error: 'Connection not found' })
                continue
            }

            if (!platformConn.accessToken) {
                await prisma.postPlatformStatus.update({
                    where: { id: ps.id },
                    data: { status: 'failed', errorMsg: 'No access token. Please reconnect this account.' },
                })
                results.push({ platform: ps.platform, accountId: ps.accountId, success: false, error: 'No access token' })
                continue
            }

            let publishResult: { externalId: string }

            // Get post type from platform status config or default to 'feed'
            const psConfig = (ps as Record<string, unknown>).config as Record<string, string> | undefined
            const postType = psConfig?.postType || 'feed'

            switch (ps.platform) {
                case 'facebook':
                    publishResult = await publishToFacebook(
                        platformConn.accessToken,
                        platformConn.accountId,
                        post.content || '',
                        mediaItems,
                        postType,
                    )
                    break

                case 'instagram':
                    publishResult = await publishToInstagram(
                        platformConn.accessToken,
                        platformConn.accountId,
                        post.content || '',
                        mediaItems,
                    )
                    break

                case 'youtube':
                    publishResult = await publishToYouTube(
                        platformConn.accessToken,
                        platformConn.refreshToken || null,
                        platformConn.accountId,
                        post.content || '',
                        mediaItems,
                        platformConn.id,
                    )
                    break

                default:
                    publishResult = await publishPlaceholder(ps.platform)
            }

            await prisma.postPlatformStatus.update({
                where: { id: ps.id },
                data: {
                    status: 'published',
                    externalId: publishResult.externalId,
                    publishedAt: new Date(),
                },
            })

            results.push({ platform: ps.platform, accountId: ps.accountId, success: true, externalId: publishResult.externalId })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            await prisma.postPlatformStatus.update({
                where: { id: ps.id },
                data: { status: 'failed', errorMsg },
            })
            results.push({ platform: ps.platform, accountId: ps.accountId, success: false, error: errorMsg })
        }
    }

    // Determine final post status
    const allPublished = results.length > 0 && results.every((r) => r.success)
    const anyPublished = results.some((r) => r.success)

    await prisma.post.update({
        where: { id },
        data: {
            status: allPublished ? 'PUBLISHED' : anyPublished ? 'PUBLISHED' : 'FAILED',
            publishedAt: anyPublished ? new Date() : null,
        },
    })

    return NextResponse.json({
        success: anyPublished,
        results,
        allPublished,
    })
}
