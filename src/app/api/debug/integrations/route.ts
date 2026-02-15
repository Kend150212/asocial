import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary debug endpoint — DELETE after fixing SMTP issue
export async function GET() {
    const all = await prisma.apiIntegration.findMany({
        select: {
            id: true,
            category: true,
            provider: true,
            isActive: true,
            status: true,
            config: true,
        },
    })

    return NextResponse.json(all)
}
