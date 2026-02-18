import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserGDriveAccessToken } from '@/lib/gdrive'
import { prisma } from '@/lib/prisma'

// GET /api/user/gdrive/picker-config — returns config needed for Google Picker
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get user's access token
        const accessToken = await getUserGDriveAccessToken(session.user.id)

        // Get admin's GDrive integration for Client ID (used as Developer Key / App ID)
        const integration = await prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive' },
        })

        if (!integration) {
            return NextResponse.json({ error: 'Google Drive not configured' }, { status: 400 })
        }

        const config = (integration.config as Record<string, unknown>) || {}
        const clientId = config.clientId as string

        // Extract project number from Client ID (format: <number>-<hash>.apps.googleusercontent.com)
        const appId = (clientId || '').split('-')[0] || ''

        return NextResponse.json({
            accessToken,
            clientId,
            appId,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to get picker config'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
