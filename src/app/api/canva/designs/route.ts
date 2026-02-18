import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// Helper: get Canva access token for the current user
async function getCanvaToken(userId: string): Promise<{ token: string | null; connected: boolean }> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })
    if (!integration) return { token: null, connected: false }
    const config = (integration.config || {}) as Record<string, string | null>
    const encryptedToken = config[`canvaToken_${userId}`]
    if (!encryptedToken) return { token: null, connected: false }
    return { token: decrypt(encryptedToken), connected: true }
}

// Helper: Upload an image to Canva as an asset, return asset ID
async function uploadImageToCanva(token: string, imageUrl: string): Promise<string | null> {
    try {
        // Download the image
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) {
            console.error('Failed to download image for Canva upload:', imgRes.status)
            return null
        }
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

        // Upload to Canva Asset Upload API
        // Content-Type MUST be application/octet-stream per Canva docs
        const uploadRes = await fetch('https://api.canva.com/rest/v1/asset-uploads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/octet-stream',
                'Asset-Upload-Metadata': JSON.stringify({
                    name_base64: Buffer.from(`ASocial-Upload-${Date.now()}`).toString('base64'),
                }),
            },
            body: imgBuffer,
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            console.error('Canva asset upload failed:', uploadRes.status, errText)
            return null
        }

        const uploadData = await uploadRes.json()
        console.log('Canva asset upload response:', JSON.stringify(uploadData))

        // If already completed, return asset ID directly
        if (uploadData.job?.status === 'success' && uploadData.job?.asset?.id) {
            return uploadData.job.asset.id
        }

        // Otherwise poll for completion (async job)
        const jobId = uploadData.job?.id
        if (!jobId) {
            console.error('No job ID from Canva asset upload')
            return null
        }

        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000))

            const statusRes = await fetch(`https://api.canva.com/rest/v1/asset-uploads/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })

            if (!statusRes.ok) {
                console.error('Canva asset upload status check failed:', statusRes.status)
                continue
            }

            const statusData = await statusRes.json()
            console.log('Canva asset upload job status:', JSON.stringify(statusData))

            if (statusData.job?.status === 'success' && statusData.job?.asset?.id) {
                return statusData.job.asset.id
            }
            if (statusData.job?.status === 'failed') {
                console.error('Canva asset upload job failed:', statusData.job.error)
                return null
            }
            // status is 'in_progress', keep polling
        }

        console.error('Canva asset upload timed out')
        return null
    } catch (err) {
        console.error('Error uploading image to Canva:', err)
        return null
    }
}

// POST /api/canva/designs — Create a new Canva design
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token, connected } = await getCanvaToken(session.user.id)
    if (!connected || !token) {
        return NextResponse.json({
            error: 'canva_not_connected',
            message: 'Please connect your Canva account first.',
            connectUrl: `/api/oauth/canva?returnUrl=${encodeURIComponent('/dashboard/posts/compose')}`,
        }, { status: 401 })
    }

    const { designType, width, height, title, imageUrl } = await req.json()

    // If editing an existing image, upload it to Canva as an asset first
    let assetId: string | undefined
    if (imageUrl) {
        console.log('Uploading image to Canva:', imageUrl)
        const uploadedAssetId = await uploadImageToCanva(token, imageUrl)
        if (uploadedAssetId) {
            assetId = uploadedAssetId
            console.log('Successfully uploaded asset to Canva:', assetId)
        } else {
            console.warn('Failed to upload image to Canva, creating blank design instead')
        }
    }

    // Build design_type
    let design_type: Record<string, unknown>
    if (designType === 'custom' && width && height) {
        design_type = { type: 'custom', width: Number(width), height: Number(height) }
    } else {
        design_type = { type: 'custom', width: width || 1080, height: height || 1080 }
    }

    const body: Record<string, unknown> = {
        design_type,
        title: title || 'ASocial Design',
    }
    if (assetId) body.asset_id = assetId

    console.log('Creating Canva design with body:', JSON.stringify(body))

    const res = await fetch('https://api.canva.com/rest/v1/designs', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('Canva create design failed:', errorText)
        return NextResponse.json({ error: 'Failed to create Canva design', detail: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
        designId: data.design?.id,
        editUrl: data.design?.urls?.edit_url,
        viewUrl: data.design?.urls?.view_url,
        title: data.design?.title,
        thumbnail: data.design?.thumbnail,
        hasAsset: !!assetId,
    })
}

// GET /api/canva/designs?designId=xxx — Export a design as PNG
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token, connected } = await getCanvaToken(session.user.id)
    if (!connected || !token) {
        return NextResponse.json({ error: 'Canva not connected' }, { status: 400 })
    }

    const designId = req.nextUrl.searchParams.get('designId')
    if (!designId) return NextResponse.json({ error: 'designId required' }, { status: 400 })

    // Create export job
    const exportRes = await fetch(`https://api.canva.com/rest/v1/exports`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            design_id: designId,
            format: { type: 'png' },
        }),
    })

    if (!exportRes.ok) {
        const errorText = await exportRes.text()
        console.error('Canva export failed:', errorText)
        return NextResponse.json({ error: 'Failed to export design', detail: errorText }, { status: exportRes.status })
    }

    const exportData = await exportRes.json()
    const jobId = exportData.job?.id

    if (!jobId) {
        return NextResponse.json({ error: 'No export job ID returned' }, { status: 500 })
    }

    // Poll for export completion (max 30 seconds)
    for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const statusRes = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!statusRes.ok) continue

        const statusData = await statusRes.json()

        if (statusData.job?.status === 'success') {
            return NextResponse.json({
                status: 'success',
                urls: statusData.job.urls || [],
            })
        }

        if (statusData.job?.status === 'failed') {
            return NextResponse.json({ error: 'Export failed', detail: statusData.job.error }, { status: 500 })
        }
    }

    return NextResponse.json({ error: 'Export timed out' }, { status: 408 })
}
