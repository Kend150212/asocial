import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/canva/status — Check current user's Canva connection status
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })

    if (!integration) {
        return NextResponse.json({
            connected: false,
            isAdminConfigured: false,
            userName: null,
            connectedAt: null,
        })
    }

    const config = (integration.config || {}) as Record<string, string | null>
    const hasToken = !!config[`canvaToken_${userId}`]
    const userName = config[`canvaUser_${userId}`] || null
    const connectedAt = config[`canvaConnectedAt_${userId}`] || null

    // Check if admin has configured Client ID
    const clientId = config.canvaClientId || process.env.CANVA_CLIENT_ID
    const isAdminConfigured = !!clientId

    return NextResponse.json({
        connected: hasToken,
        isAdminConfigured,
        userName,
        connectedAt,
    })
}
