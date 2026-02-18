import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserGDriveAccessToken } from '@/lib/gdrive'

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'

// GET /api/user/gdrive/files — browse user's entire Google Drive
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId') || 'root' // default = Drive root
    const pageToken = searchParams.get('pageToken') || undefined
    const mediaOnly = searchParams.get('mediaOnly') === 'true'

    try {
        const accessToken = await getUserGDriveAccessToken(session.user.id)

        // Build query: list items in folder, not trashed
        let query = `'${folderId}' in parents and trashed=false`

        // Optionally filter to only media files + folders
        if (mediaOnly) {
            query += ` and (mimeType contains 'image/' or mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder')`
        }

        const fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink,imageMediaMetadata)'

        const url = new URL(`${GOOGLE_DRIVE_API}/files`)
        url.searchParams.set('q', query)
        url.searchParams.set('fields', fields)
        url.searchParams.set('pageSize', '50')
        url.searchParams.set('orderBy', 'folder,name')
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
            // For images: use direct link, for videos: use webViewLink
            url: (f.mimeType as string)?.startsWith('image/')
                ? `https://drive.google.com/uc?id=${f.id}&export=download`
                : (f.webContentLink as string) || `https://drive.google.com/uc?id=${f.id}&export=download`,
            isFolder: f.mimeType === 'application/vnd.google-apps.folder',
        }))

        return NextResponse.json({
            files,
            nextPageToken: data.nextPageToken || null,
            folderId,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to list files'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
