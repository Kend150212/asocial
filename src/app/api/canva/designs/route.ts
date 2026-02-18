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

// Helper: Upload an image URL to Canva as an asset
async function uploadImageToCanva(token: string, imageUrl: string): Promise<string | null> {
    try {
        // Download the image first
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) {
            console.error('Failed to download image for Canva upload:', imgRes.status)
            return null
        }
        const imgBuffer = await imgRes.arrayBuffer()
        const contentType = imgRes.headers.get('content-type') || 'image/png'

        // Upload to Canva Asset Upload API
        const uploadRes = await fetch('https://api.canva.com/rest/v1/asset-uploads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': contentType,
                'Asset-Upload-Metadata': JSON.stringify({
                    name_base64: Buffer.from(`ASocial-Upload-${Date.now()}`).toString('base64'),
                }),
            },
            body: Buffer.from(imgBuffer),
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            console.error('Canva asset upload failed:', errText)
            return null
        }

        const uploadData = await uploadRes.json()
        const assetId = uploadData.job?.asset?.id

        if (assetId) return assetId

        // If the upload is async, poll for completion
        const jobId = uploadData.job?.id
        if (!jobId) return null

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1500))
            const statusRes = await fetch(`https://api.canva.com/rest/v1/asset-uploads/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!statusRes.ok) continue
            const statusData = await statusRes.json()
            if (statusData.job?.status === 'success' && statusData.job?.asset?.id) {
                return statusData.job.asset.id
            }
            if (statusData.job?.status === 'failed') {
                console.error('Canva asset upload job failed:', statusData.job.error)
                return null
            }
        }
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
        const uploadedAssetId = await uploadImageToCanva(token, imageUrl)
        if (uploadedAssetId) {
            assetId = uploadedAssetId
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
