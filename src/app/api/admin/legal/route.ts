import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * GET /api/admin/legal — public (needed for frontend pages)
 */
export async function GET() {
    try {
        const settings = await db.siteSettings.findUnique({
            where: { id: 'default' },
            select: {
                termsContent: true,
                privacyContent: true,
                appName: true,
                supportEmail: true,
            },
        })
        return NextResponse.json(settings ?? {
            termsContent: '',
            privacyContent: '',
            appName: 'NeeFlow',
            supportEmail: '',
        })
    } catch (err) {
        console.error('[Legal GET] Error:', err)
        return NextResponse.json({
            termsContent: '',
            privacyContent: '',
            appName: 'NeeFlow',
            supportEmail: '',
        })
    }
}

/**
 * PUT /api/admin/legal — admin only
 */
export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { termsContent, privacyContent } = body

    try {
        const settings = await db.siteSettings.upsert({
            where: { id: 'default' },
            update: {
                ...(termsContent !== undefined && { termsContent }),
                ...(privacyContent !== undefined && { privacyContent }),
            },
            create: {
                id: 'default',
                termsContent: termsContent ?? '',
                privacyContent: privacyContent ?? '',
            },
        })

        return NextResponse.json({
            termsContent: settings.termsContent,
            privacyContent: settings.privacyContent,
        })
    } catch (err) {
        console.error('[Legal PUT] DB Error:', err)
        return NextResponse.json({ error: 'Failed to save legal content' }, { status: 500 })
    }
}
