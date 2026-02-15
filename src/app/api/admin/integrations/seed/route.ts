import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/integrations/seed — create missing integration records
export async function POST() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const missingProviders = [
        {
            category: 'AI' as const,
            provider: 'openrouter',
            name: 'OpenRouter',
            isActive: false,
            isDefault: false,
            status: 'INACTIVE' as const,
            baseUrl: 'https://openrouter.ai/api/v1',
        },
        {
            category: 'AI' as const,
            provider: 'synthetic',
            name: 'Synthetic',
            isActive: false,
            isDefault: false,
            status: 'INACTIVE' as const,
            baseUrl: 'https://api.glhf.chat/v1',
        },
    ]

    const results = []

    for (const p of missingProviders) {
        const result = await prisma.apiIntegration.upsert({
            where: {
                category_provider: {
                    category: p.category,
                    provider: p.provider,
                },
            },
            update: {},
            create: p,
        })
        results.push({ provider: result.provider, id: result.id, created: true })
    }

    return NextResponse.json({ success: true, results })
}
