import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserGDriveAccessToken } from '@/lib/gdrive'

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'

// GET /api/user/gdrive/files — list files from user's Google Drive folder
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')
    const pageToken = searchParams.get('pageToken') || undefined

    try {
        const accessToken = await getUserGDriveAccessToken(session.user.id)

        // If no folderId provided, use user's root ASocial folder
        let targetFolderId = folderId
        if (!targetFolderId) {
            const { prisma } = await import('@/lib/prisma')
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { gdriveFolderId: true },
            })
            targetFolderId = user?.gdriveFolderId || null
        }

        if (!targetFolderId) {
            return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 })
        }

        // Query files in folder (images, videos, and subfolders)
        const query = `'${targetFolderId}' in parents and trashed=false`
        const fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink,imageMediaMetadata)'

        const url = new URL(`${GOOGLE_DRIVE_API}/files`)
        url.searchParams.set('q', query)
        url.searchParams.set('fields', fields)
        url.searchParams.set('pageSize', '50')
        url.searchParams.set('orderBy', 'createdTime desc')
        if (pageToken) url.searchParams.set('pageToken', pageToken)

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error?.message || 'Failed to list files')
        }

        const data = await res.json()

        // Transform files for frontend
        const files = (data.files || []).map((f: Record<string, unknown>) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size ? Number(f.size) : null,
            createdTime: f.createdTime,
            thumbnailUrl: f.thumbnailLink || null,
            webViewLink: f.webViewLink || null,
            // Use webContentLink for direct download, or construct one
            url: f.webContentLink
                || `https://drive.google.com/uc?id=${f.id}&export=download`,
            isFolder: f.mimeType === 'application/vnd.google-apps.folder',
        }))

        return NextResponse.json({
            files,
            nextPageToken: data.nextPageToken || null,
            folderId: targetFolderId,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to list files'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
