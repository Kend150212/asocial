import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/gdrive/status — get user's Google Drive connection status
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            gdriveEmail: true,
            gdriveFolderId: true,
            gdriveFolderName: true,
            gdriveConnectedAt: true,
        },
    })

    // Check if admin has configured Google Drive in API Hub
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'gdrive' },
    })
    const config = (integration?.config || {}) as Record<string, string>
    const isAdminConfigured = !!(config.gdriveClientId && integration?.apiKeyEncrypted)

    return NextResponse.json({
        connected: !!user?.gdriveEmail,
        email: user?.gdriveEmail || null,
        folderId: user?.gdriveFolderId || null,
        folderName: user?.gdriveFolderName || null,
        folderUrl: user?.gdriveFolderId
            ? `https://drive.google.com/drive/folders/${user.gdriveFolderId}`
            : null,
        connectedAt: user?.gdriveConnectedAt || null,
        isAdminConfigured,
    })
}
