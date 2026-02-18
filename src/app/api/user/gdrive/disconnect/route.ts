import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/user/gdrive/disconnect — disconnect Google Drive from user account
export async function POST() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            gdriveRefreshToken: null,
            gdriveFolderId: null,
            gdriveFolderName: null,
            gdriveEmail: null,
            gdriveConnectedAt: null,
        },
    })

    return NextResponse.json({ success: true })
}
