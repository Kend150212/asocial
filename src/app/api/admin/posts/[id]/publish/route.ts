import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPinterestApiBase } from '@/lib/pinterest'
import { sendPublishWebhooks } from '@/lib/webhook-notify'

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
    config?: Record<string, unknown>,
): Promise<{ externalId: string }> {
    // Facebook Graph API — Post to Page
    const carousel = config?.carousel === true

    // ── Reel: use /video_reels endpoint ──
    if (postType === 'reel') {
        const videoMedia = mediaItems.find(m => isVideoMedia(m))
        if (!videoMedia) throw new Error('Reels require a video attachment')
        const reelUrl = `https://graph.facebook.com/v21.0/${accountId}/video_reels`
        const reelBody: Record<string, string> = {
            upload_phase: 'finish',
            video_url: videoMedia.url,
            description: content,
            access_token: accessToken,
        }
        const res = await fetch(reelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reelBody),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'Facebook Reel upload error')
        const postId = data.id || data.post_id
        return { externalId: postId }
    }

    if (mediaItems.length > 0 && postType !== 'story') {
        const firstMedia = mediaItems[0]

        if (isVideoMedia(firstMedia)) {
            // ── Video: use /videos endpoint ──
            const videoUrl = `https://graph.facebook.com/v21.0/${accountId}/videos`
            const videoBody: Record<string, string> = {
                description: content,
                file_url: firstMedia.url,
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
            const postId = data.id || data.post_id
            return { externalId: postId }
        } else if (carousel && mediaItems.length > 1) {
            // ── Carousel: upload each photo unpublished, then batch ──
            const photoIds: string[] = []
            for (const media of mediaItems) {
                if (isVideoMedia(media)) continue
                const photoUrl = `https://graph.facebook.com/v21.0/${accountId}/photos`
                const photoBody: Record<string, string | boolean> = {
                    url: media.url,
                    published: 'false',
                    access_token: accessToken,
                }
                const res = await fetch(photoUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(photoBody),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message || 'Facebook carousel photo error')
                if (data.id) photoIds.push(data.id)
            }
            // Batch publish
            const feedUrl = `https://graph.facebook.com/v21.0/${accountId}/feed`
            const feedBody: Record<string, unknown> = {
                message: content,
                access_token: accessToken,
            }
            photoIds.forEach((pid, i) => {
                feedBody[`attached_media[${i}]`] = JSON.stringify({ media_fbid: pid })
            })
            const res = await fetch(feedUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedBody),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error.message || 'Facebook carousel publish error')
            const postId = data.id
            return { externalId: postId }
        } else {
            // ── Single Image: use /photos endpoint ──
            const photoUrl = `https://graph.facebook.com/v21.0/${accountId}/photos`
            const photoBody: Record<string, string> = {
                caption: content,
                url: firstMedia.url,
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
            const postId = data.id || data.post_id
            return { externalId: postId }
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
    const postId = data.id
    return { externalId: postId }
}

/** Post a first comment on a Facebook post */
async function postFirstComment(accessToken: string, postId: string, message: string) {
    // Retry a few times with delay — reels/videos may need processing time
    const maxRetries = 3
    const delayMs = 3000
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
            const res = await fetch(`https://graph.facebook.com/v21.0/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, access_token: accessToken }),
            })
            const data = await res.json()
            if (data.error) {
                console.warn(`[FirstComment] Attempt ${attempt + 1}/${maxRetries} failed:`, data.error.message, `(code: ${data.error.code})`)
                // If it's a "page not found" or similar non-retryable error, stop
                if (data.error.code === 100 || data.error.code === 190) {
                    console.error(`[FirstComment] Non-retryable error, stopping.`)
                    return
                }
                continue
            }
            console.log(`[FirstComment] Successfully posted comment on ${postId}`)
            return
        } catch (err) {
            console.warn(`[FirstComment] Network error attempt ${attempt + 1}:`, err)
        }
    }
    console.error(`[FirstComment] All ${maxRetries} attempts failed for post ${postId}`)
}

async function publishToInstagram(
    accessToken: string,
    accountId: string,
    content: string,
    mediaItems: MediaInfo[],
    config?: Record<string, unknown>,
): Promise<{ externalId: string }> {
    if (mediaItems.length === 0) {
        throw new Error('Instagram requires at least one image or video')
    }

    const postType = (config?.postType as string) || 'feed'
    const collaborators = (config?.collaborators as string) || ''
    const collaboratorUsernames = collaborators
        .split(',')
        .map(c => c.trim().replace(/^@/, ''))
        .filter(Boolean)
        .slice(0, 3)

    // ── Story: use STORIES media type ──
    if (postType === 'story') {
        const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
        const firstMedia = mediaItems[0]
        const containerBody: Record<string, string> = {
            media_type: 'STORIES',
            access_token: accessToken,
        }
        if (isVideoMedia(firstMedia)) {
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
        if (containerData.error) throw new Error(containerData.error.message || 'Instagram Story creation failed')
        // Wait for container to be ready
        await waitForIgContainer(accessToken, containerData.id)
        const publishRes = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
        })
        const publishData = await publishRes.json()
        if (publishData.error) throw new Error(publishData.error.message || 'Instagram Story publish failed')
        return { externalId: publishData.id }
    }

    // ── Reel: use REELS media type ──
    if (postType === 'reel') {
        const videoMedia = mediaItems.find(m => isVideoMedia(m))
        if (!videoMedia) throw new Error('Reels require a video attachment')
        const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
        const containerBody: Record<string, unknown> = {
            media_type: 'REELS',
            video_url: videoMedia.url,
            caption: content,
            access_token: accessToken,
        }
        if (collaboratorUsernames.length > 0) {
            containerBody.collaborators = collaboratorUsernames
        }
        const containerRes = await fetch(containerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(containerBody),
        })
        const containerData = await containerRes.json()
        if (containerData.error) throw new Error(containerData.error.message || 'Instagram Reel creation failed')
        await waitForIgContainer(accessToken, containerData.id)
        const publishRes = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
        })
        const publishData = await publishRes.json()
        if (publishData.error) throw new Error(publishData.error.message || 'Instagram Reel publish failed')
        return { externalId: publishData.id }
    }

    // ── Carousel: multiple images/videos ──
    if (mediaItems.length > 1) {
        const childIds: string[] = []
        for (const media of mediaItems) {
            const childUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
            const childBody: Record<string, string> = {
                is_carousel_item: 'true',
                access_token: accessToken,
            }
            if (isVideoMedia(media)) {
                childBody.media_type = 'VIDEO'
                childBody.video_url = media.url
            } else {
                childBody.image_url = media.url
            }
            const childRes = await fetch(childUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(childBody),
            })
            const childData = await childRes.json()
            if (childData.error) throw new Error(childData.error.message || 'Instagram carousel item creation failed')
            await waitForIgContainer(accessToken, childData.id)
            childIds.push(childData.id)
        }
        const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
        const containerBody: Record<string, unknown> = {
            media_type: 'CAROUSEL',
            children: childIds,
            caption: content,
            access_token: accessToken,
        }
        if (collaboratorUsernames.length > 0) {
            containerBody.collaborators = collaboratorUsernames
        }
        const containerRes = await fetch(containerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(containerBody),
        })
        const containerData = await containerRes.json()
        if (containerData.error) throw new Error(containerData.error.message || 'Instagram carousel container creation failed')
        const publishRes = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
        })
        const publishData = await publishRes.json()
        if (publishData.error) throw new Error(publishData.error.message || 'Instagram carousel publish failed')
        return { externalId: publishData.id }
    }

    // ── Single image/video feed post ──
    const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
    const containerBody: Record<string, unknown> = {
        caption: content,
        access_token: accessToken,
    }

    const firstMedia = mediaItems[0]
    if (isVideoMedia(firstMedia)) {
        containerBody.media_type = 'VIDEO'
        containerBody.video_url = firstMedia.url
    } else {
        containerBody.image_url = firstMedia.url
    }
    if (collaboratorUsernames.length > 0) {
        containerBody.collaborators = collaboratorUsernames
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

    // Wait for container to be ready
    await waitForIgContainer(accessToken, containerData.id)

    // Publish
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

/** Wait for Instagram media container to finish processing (videos especially) */
async function waitForIgContainer(accessToken: string, containerId: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`)
        const data = await res.json()
        if (data.status_code === 'FINISHED') return
        if (data.status_code === 'ERROR') throw new Error('Instagram container processing failed')
        await new Promise(resolve => setTimeout(resolve, 2000)) // wait 2s
    }
    throw new Error('Instagram container processing timed out')
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
    config?: Record<string, unknown>,
): Promise<{ externalId: string }> {
    // YouTube requires a video
    const videoMedia = mediaItems.find((m) => isVideoMedia(m))
    if (!videoMedia) {
        throw new Error('YouTube requires a video. Please attach a video to your post.')
    }

    // Read config values
    const ytPostType = (config?.postType as string) || 'video'
    const ytVideoTitle = (config?.videoTitle as string) || ''
    const ytCategory = (config?.category as string) || ''
    const ytTags = (config?.tags as string) || ''
    const ytPrivacy = (config?.privacy as string) || 'public'
    const ytNotifySubscribers = config?.notifySubscribers !== false
    const ytMadeForKids = config?.madeForKids === true

    // YouTube category ID mapping
    const categoryMap: Record<string, string> = {
        'Film & Animation': '1', 'Autos & Vehicles': '2', 'Music': '10', 'Pets & Animals': '15',
        'Sports': '17', 'Travel & Events': '19', 'Gaming': '20', 'People & Blogs': '22',
        'Comedy': '23', 'Entertainment': '24', 'News & Politics': '25', 'Howto & Style': '26',
        'Education': '27', 'Science & Technology': '28', 'Nonprofits & Activism': '29',
    }
    const categoryId = categoryMap[ytCategory] || '22' // Default to People & Blogs

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

    // Get title: from config, or from first line of content, or 'Untitled'
    const lines = content.split('\n')
    const title = (ytVideoTitle || lines[0] || 'Untitled').slice(0, 100)
    const description = ytVideoTitle ? content : (lines.slice(1).join('\n').trim() || content)

    // Parse tags
    const tags = ytTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

    // For Shorts, add #Shorts tag if not present
    if (ytPostType === 'shorts' && !tags.some(t => t.toLowerCase() === 'shorts' || t.toLowerCase() === '#shorts')) {
        tags.push('Shorts')
    }

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
            categoryId,
            ...(tags.length > 0 ? { tags } : {}),
        },
        status: {
            privacyStatus: ytPrivacy,
            selfDeclaredMadeForKids: ytMadeForKids,
        },
    }

    const uploadParams = new URLSearchParams({
        uploadType: 'resumable',
        part: 'snippet,status',
        notifySubscribers: String(ytNotifySubscribers),
    })

    const initRes = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?${uploadParams}`,
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

// ─── Pinterest publisher ─────────────────────────────────────────────

async function publishToPinterest(
    accessToken: string,
    content: string,
    mediaItems: MediaInfo[],
    config?: Record<string, unknown>,
): Promise<{ externalId: string }> {
    // Pinterest API v5 — Create a Pin
    const pinterestBase = await getPinterestApiBase()
    let boardId = (config?.boardId as string) || ''
    const pinTitle = (config?.pinTitle as string) || ''
    const pinLink = (config?.pinLink as string) || ''

    // If no board selected, fetch user's first board
    if (!boardId) {
        const boardsRes = await fetch(`${pinterestBase}/v5/boards`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (boardsRes.ok) {
            const boardsData = await boardsRes.json()
            if (boardsData.items?.length > 0) {
                boardId = boardsData.items[0].id
            }
        }
        if (!boardId) throw new Error('No Pinterest board found. Please create a board first.')
    }

    // Build pin body
    const pinBody: Record<string, unknown> = {
        board_id: boardId,
        description: content.slice(0, 500), // Pinterest limit: 500 chars
    }
    if (pinTitle) pinBody.title = pinTitle.slice(0, 100) // Pinterest limit: 100 chars
    if (pinLink) pinBody.link = pinLink

    // Add media source — Pinterest requires an image
    const imageMedia = mediaItems.find(m => !isVideoMedia(m))
    const videoMedia = mediaItems.find(m => isVideoMedia(m))

    if (imageMedia) {
        pinBody.media_source = {
            source_type: 'image_url',
            url: imageMedia.url,
        }
    } else if (videoMedia) {
        // Video pins require a more complex flow, but try with video URL
        pinBody.media_source = {
            source_type: 'video_url',
            url: videoMedia.url,
            cover_image_url: videoMedia.url, // fallback
        }
    } else {
        // Pinterest requires an image or video — fail early with a clear message
        throw new Error('Pinterest requires an image. Please attach an image to your post before publishing to Pinterest.')
    }

    const res = await fetch(`${pinterestBase}/v5/pins`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(pinBody),
    })
    const data = await res.json()

    if (!res.ok || data.code) {
        console.error('[Pinterest] Create pin error:', JSON.stringify(data))
        throw new Error(data.message || data.error?.message || 'Pinterest publish failed')
    }

    return { externalId: data.id }
}

// ─── LinkedIn publisher ──────────────────────────────────────────────

/** Auto-generate LinkedIn API version (YYYYMM) — uses 1 month behind current date for safety */
function getLinkedInVersion(): string {
    const now = new Date()
    // Use previous month to ensure it's always an active version
    now.setMonth(now.getMonth() - 1)
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}${m}`
}

async function publishToLinkedIn(
    accessToken: string,
    accountId: string,
    content: string,
    mediaItems: MediaInfo[],
): Promise<{ externalId: string }> {
    // Determine if this is an organization or personal account
    const isOrg = accountId.startsWith('org_')
    const authorUrn = isOrg
        ? `urn:li:organization:${accountId.replace('org_', '')}`
        : `urn:li:person:${accountId}`
    console.log(`[LinkedIn] Publishing as ${isOrg ? 'organization' : 'person'}: ${authorUrn}`)

    // If we have images, upload them first
    const imageUrns: string[] = []
    for (const media of mediaItems) {
        if (isVideoMedia(media)) continue // LinkedIn video requires different flow

        try {
            // Step 1: Register image upload
            const registerRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    'LinkedIn-Version': getLinkedInVersion(),
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify({
                    initializeUploadRequest: {
                        owner: authorUrn,
                    },
                }),
            })

            if (!registerRes.ok) {
                const errText = await registerRes.text()
                console.error('[LinkedIn] Image register failed:', errText)
                continue
            }

            const registerData = await registerRes.json()
            const uploadUrl = registerData.value?.uploadUrl
            const imageUrn = registerData.value?.image

            if (!uploadUrl || !imageUrn) {
                console.error('[LinkedIn] Missing uploadUrl or image URN')
                continue
            }

            // Step 2: Download image and upload binary to LinkedIn
            const imageRes = await fetch(media.url)
            if (!imageRes.ok) {
                console.error('[LinkedIn] Failed to download image:', media.url)
                continue
            }
            const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg',
                },
                body: imageBuffer,
            })

            if (!uploadRes.ok) {
                const errText = await uploadRes.text()
                console.error('[LinkedIn] Image upload failed:', errText)
                continue
            }

            imageUrns.push(imageUrn)
        } catch (err) {
            console.error('[LinkedIn] Image upload error:', err)
        }
    }

    // Build LinkedIn post body using Community Management API
    const postBody: Record<string, unknown> = {
        author: authorUrn,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
    }

    // Add media content if we have uploaded images
    if (imageUrns.length === 1) {
        postBody.content = {
            media: {
                id: imageUrns[0],
            },
        }
    } else if (imageUrns.length > 1) {
        postBody.content = {
            multiImage: {
                images: imageUrns.map(urn => ({ id: urn })),
            },
        }
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': getLinkedInVersion(),
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
    })

    if (!res.ok) {
        const errText = await res.text()
        console.error('[LinkedIn] Create post error:', errText)
        throw new Error(`LinkedIn publish failed: ${errText}`)
    }

    // LinkedIn returns the post URN in x-restli-id header
    const postUrn = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || ''
    console.log('[LinkedIn] Published successfully, URN:', postUrn)

    return { externalId: postUrn }
}

// Generic placeholder for other platforms (mark as pending-integration)
async function publishPlaceholder(platform: string): Promise<{ externalId: string }> {
    // TODO: Implement TikTok, X publishing
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

    // Resolve per-platform content: use platform-specific override if available, else master content
    const contentPerPlatform = ((post?.contentPerPlatform) || {}) as Record<string, string>
    function getContent(platform: string): string {
        return contentPerPlatform[platform]?.trim() || post?.content || ''
    }

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
            const psConfig = (ps.config as Record<string, unknown>) || undefined
            const postType = (psConfig?.postType as string) || 'feed'
            console.log(`[Publish] Platform: ${ps.platform}, PostType: ${postType}, Config:`, JSON.stringify(psConfig || {}))

            switch (ps.platform) {
                case 'facebook':
                    publishResult = await publishToFacebook(
                        platformConn.accessToken,
                        platformConn.accountId,
                        getContent('facebook'),
                        mediaItems,
                        postType,
                        psConfig,
                    )
                    break

                case 'instagram':
                    publishResult = await publishToInstagram(
                        platformConn.accessToken,
                        platformConn.accountId,
                        getContent('instagram'),
                        mediaItems,
                        psConfig,
                    )
                    break

                case 'youtube':
                    publishResult = await publishToYouTube(
                        platformConn.accessToken,
                        platformConn.refreshToken || null,
                        platformConn.accountId,
                        getContent('youtube'),
                        mediaItems,
                        platformConn.id,
                        psConfig,
                    )
                    break

                case 'pinterest':
                    publishResult = await publishToPinterest(
                        platformConn.accessToken,
                        getContent('pinterest'),
                        mediaItems,
                        psConfig,
                    )
                    break

                case 'linkedin':
                    publishResult = await publishToLinkedIn(
                        platformConn.accessToken,
                        platformConn.accountId,
                        getContent('linkedin'),
                        mediaItems,
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

    // ── Post-publish: First Comments ──────────────────────────────────
    // Run AFTER all platforms are published, with a delay to ensure
    // Facebook has fully processed the posts (especially reels/videos)
    const fbFirstCommentTasks = results
        .filter(r => r.success && r.platform === 'facebook' && r.externalId)
        .map(r => {
            const ps = pendingStatuses.find(p => p.platform === r.platform && p.accountId === r.accountId)
            const cfg = ps ? ((ps.config as Record<string, unknown>) || {}) : {}
            const firstComment = (cfg.firstComment as string) || ''
            if (!firstComment) return null
            // Find the access token for this platform
            const platformConn = post.channel.platforms.find(
                pc => pc.platform === r.platform && pc.accountId === r.accountId
            )
            if (!platformConn?.accessToken) return null
            return { accessToken: platformConn.accessToken, postId: r.externalId!, message: firstComment }
        })
        .filter(Boolean) as { accessToken: string; postId: string; message: string }[]

    if (fbFirstCommentTasks.length > 0) {
        // Wait 5 seconds for Facebook to finish processing the posts
        console.log(`[FirstComment] Waiting 5s before posting ${fbFirstCommentTasks.length} first comment(s)...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        for (const task of fbFirstCommentTasks) {
            await postFirstComment(task.accessToken, task.postId, task.message)
        }
    }

    // ── Post-publish: Webhook Notifications ────────────────────────────
    try {
        await sendPublishWebhooks(
            {
                webhookDiscord: post.channel.webhookDiscord as Record<string, string> | null,
                webhookTelegram: post.channel.webhookTelegram as Record<string, string> | null,
                webhookSlack: post.channel.webhookSlack as Record<string, string> | null,
                webhookCustom: post.channel.webhookCustom as Record<string, string> | null,
                webhookEvents: post.channel.webhookEvents as string[] | null,
            },
            {
                postId: id,
                content: post.content || '',
                publishedBy: session.user.name || session.user.email || 'Unknown',
                publishedAt: new Date(),
                channelName: post.channel.name,
                results,
                mediaCount: post.media.length,
            },
        )
    } catch (err) {
        console.warn('[Webhook] Notification error:', err)
    }

    return NextResponse.json({
        success: anyPublished,
        results,
        allPublished,
    })
}
