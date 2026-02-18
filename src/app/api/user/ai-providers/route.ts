import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/ai-providers — list AI providers from API Hub (for any authenticated user)
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get AI providers from the admin-configured API Hub
    const integrations = await prisma.apiIntegration.findMany({
        where: { category: 'AI' },
        orderBy: { provider: 'asc' },
        select: {
            id: true,
            provider: true,
            name: true,
            status: true,
            baseUrl: true,
        },
    })

    return NextResponse.json(integrations)
}
