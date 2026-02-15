import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAuthUrl, getRedirectUri } from '@/lib/gdrive'
import crypto from 'crypto'

// GET /api/admin/gdrive/auth — redirect admin to Google OAuth consent screen
export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'gdrive' },
    })

    if (!integration) {
        return NextResponse.json({ error: 'Google Drive integration not found' }, { status: 404 })
    }

    const config = (integration.config || {}) as Record<string, string>
    const clientId = config.gdriveClientId

    if (!clientId) {
        return NextResponse.json(
            { error: 'Client ID not configured — please save Client ID first' },
            { status: 400 }
        )
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(16).toString('hex')

    const redirectUri = getRedirectUri()
    const authUrl = getGDriveAuthUrl(clientId, redirectUri, state)

    return NextResponse.redirect(authUrl)
}
