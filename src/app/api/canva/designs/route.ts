import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// Helper: get Canva access token (global — shared by all team users)
async function getCanvaToken(): Promise<string | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })
    if (!integration) return null
    const config = (integration.config || {}) as Record<string, string | null>
    const encryptedToken = config.canvaAccessToken
    if (!encryptedToken) return null
    return decrypt(encryptedToken)
}

// POST /api/canva/designs — Create a new Canva design
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = await getCanvaToken()
    if (!token) {
        return NextResponse.json({ error: 'Canva not connected. Please connect via API Hub.' }, { status: 400 })
    }

    const { designType, width, height, title, assetId } = await req.json()

    // Build design_type
    let design_type: Record<string, unknown>
    if (designType === 'custom' && width && height) {
        design_type = { type: 'custom', width: Number(width), height: Number(height) }
    } else {
        // Preset types: doc, whiteboard, presentation
        // For social media, use custom dimensions
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

    const token = await getCanvaToken()
    if (!token) {
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
