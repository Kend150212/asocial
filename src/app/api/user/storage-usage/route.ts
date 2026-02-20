import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserStorageSummary } from '@/lib/storage-quota'
import { prisma } from '@/lib/prisma'

// GET /api/user/storage-usage — returns storage usage for the current user
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has GDrive connected
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gdriveRefreshToken: true, gdriveFolderId: true, role: true },
    })

    const hasGdrive = !!(user?.gdriveRefreshToken && user?.gdriveFolderId)
    const isAdmin = user?.role === 'ADMIN'

    const summary = await getUserStorageSummary(userId)

    return NextResponse.json({
        hasGdrive,
        isAdmin,
        ...summary,
    })
}
