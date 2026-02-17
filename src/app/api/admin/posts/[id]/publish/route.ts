import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Platform publishers ─────────────────────────────────────────────

async function publishToFacebook(
    accessToken: string,
    accountId: string,
    content: string,
    mediaUrls: string[],
    postType: string,
): Promise<{ externalId: string }> {
    // Facebook Graph API — Post to Page Feed
    const url = `https://graph.facebook.com/v21.0/${accountId}/feed`

    const body: Record<string, string> = {
        message: content,
        access_token: accessToken,
    }

    // If there's a link in the content, Facebook will auto-preview it
    // For image posts, use /photos endpoint instead
    if (mediaUrls.length > 0 && postType !== 'story') {
        // For single photo posts
        const photoUrl = `https://graph.facebook.com/v21.0/${accountId}/photos`
        const photoBody: Record<string, string> = {
            caption: content,
            url: mediaUrls[0], // Facebook fetches the image from this URL
            access_token: accessToken,
        }
        const res = await fetch(photoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photoBody),
        })
        const data = await res.json()
        if (data.error) {
            throw new Error(data.error.message || 'Facebook API error')
        }
        return { externalId: data.id || data.post_id }
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
    mediaUrls: string[],
): Promise<{ externalId: string }> {
    if (mediaUrls.length === 0) {
        throw new Error('Instagram requires at least one image or video')
    }

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`
    const containerBody: Record<string, string> = {
        caption: content,
        access_token: accessToken,
    }

    // Determine media type
    const firstMedia = mediaUrls[0]
    const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(firstMedia)
    if (isVideo) {
        containerBody.media_type = 'VIDEO'
        containerBody.video_url = firstMedia
    } else {
        containerBody.image_url = firstMedia
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

// Generic placeholder for other platforms (mark as pending-integration)
async function publishPlaceholder(platform: string): Promise<{ externalId: string }> {
    // TODO: Implement TikTok, YouTube, LinkedIn, X, Pinterest publishing
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

    // Build public media URLs (for platform APIs that fetch media by URL)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const mediaUrls = post.media.map((m) => `${baseUrl}${m.mediaItem.url}`)

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
                        mediaUrls,
                        postType,
                    )
                    break

                case 'instagram':
                    publishResult = await publishToInstagram(
                        platformConn.accessToken,
                        platformConn.accountId,
                        post.content || '',
                        mediaUrls,
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
