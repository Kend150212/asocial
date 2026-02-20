import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGDriveAccessToken, getUserGDriveAccessToken, uploadFile, makeFilePublic, createFolder } from '@/lib/gdrive'

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'

/**
 * Find or create a "Whitelabel" folder in the admin's Google Drive.
 */
async function getOrCreateWhitelabelFolder(
    accessToken: string,
    parentFolderId: string,
    userName: string,
) {
    const folderName = `Whitelabel - ${userName}`

    // Check if it already exists
    const q = `name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const searchRes = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const searchData = await searchRes.json()

    if (searchData.files?.length > 0) {
        return searchData.files[0]
    }

    // Create it
    return createFolder(accessToken, folderName, parentFolderId)
}

/**
 * POST /api/admin/branding/upload
 * Upload a logo/favicon image to Google Drive and return the public URL.
 */
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, name: true, gdriveRefreshToken: true, gdriveFolderId: true },
    })
    if (admin?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const type = (formData.get('type') as string) || 'logo' // 'logo' or 'favicon'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate it's an image
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
        }

        // Max 5MB for branding images
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
        }

        // Get Google Drive access token
        let accessToken: string
        let parentFolderId: string

        // Try user's own GDrive first, then admin integration
        if (admin.gdriveRefreshToken && admin.gdriveFolderId) {
            accessToken = await getUserGDriveAccessToken(session.user.id)
            parentFolderId = admin.gdriveFolderId
        } else {
            accessToken = await getGDriveAccessToken()
            const integration = await prisma.apiIntegration.findFirst({
                where: { provider: 'gdrive' },
            })
            const config = (integration?.config || {}) as Record<string, string>
            parentFolderId = config.parentFolderId

            if (!parentFolderId) {
                return NextResponse.json(
                    { error: 'Google Drive not connected. Go to Settings → Integrations to connect Google Drive first.' },
                    { status: 400 },
                )
            }
        }

        // Get or create Whitelabel folder
        const whitelabelFolder = await getOrCreateWhitelabelFolder(
            accessToken,
            parentFolderId,
            admin.name || 'Admin',
        )

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Upload with descriptive name
        const ext = file.name.split('.').pop() || 'png'
        const timestamp = new Date().toISOString().slice(0, 10)
        const fileName = `${type}-${timestamp}.${ext}`

        console.log(`[Branding Upload] Uploading ${type}: ${fileName} to folder ${whitelabelFolder.name || whitelabelFolder.id}`)

        const uploaded = await uploadFile(
            accessToken,
            fileName,
            file.type,
            buffer,
            whitelabelFolder.id,
        )

        // Make it publicly accessible
        const publicUrl = await makeFilePublic(accessToken, uploaded.id, file.type)

        console.log(`[Branding Upload] ✓ Uploaded ${type}: ${publicUrl}`)

        return NextResponse.json({
            url: publicUrl,
            fileId: uploaded.id,
            fileName: uploaded.name,
        })
    } catch (error) {
        console.error('[Branding Upload] Error:', error)
        const msg = error instanceof Error ? error.message : 'Upload failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
