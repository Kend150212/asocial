import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, createFolder } from '@/lib/gdrive'

// POST /api/admin/gdrive/folder — create a folder in Google Drive
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    try {
        const accessToken = await getGDriveAccessToken()
        const folder = await createFolder(accessToken, name.trim())

        // Store parent folder ID in integration config
        const integration = await prisma.apiIntegration.findFirst({
            where: { provider: 'gdrive' },
        })

        if (integration) {
            const existingConfig = (integration.config as Record<string, unknown>) || {}
            await prisma.apiIntegration.update({
                where: { id: integration.id },
                data: {
                    config: {
                        ...existingConfig,
                        parentFolderId: folder.id,
                        parentFolderName: folder.name,
                    },
                },
            })
        }

        return NextResponse.json({
            success: true,
            folder: {
                id: folder.id,
                name: folder.name,
                url: folder.webViewLink,
            },
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create folder',
            },
            { status: 500 }
        )
    }
}
