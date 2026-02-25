import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserStorageSummary } from '@/lib/storage-quota'
import { prisma } from '@/lib/prisma'

// GET /api/user/storage-usage
// Returns R2/plan-based storage usage for the current user.
// Plan limit comes from the user's subscription (Plan.maxStorageMB).
// Usage is calculated by summing MediaItem.fileSize across owned channels.
export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })

    const isAdmin = user?.role === 'ADMIN'

    const summary = await getUserStorageSummary(userId)
    return NextResponse.json({
        isAdmin,
        unlimited: summary.limitMB === -1,
        ...summary,
    })
}
