import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any)
    const db = prisma as any

    await db.apiIntegration.upsert({
        where: { category_provider: { category: 'BILLING', provider: 'stripe' } },
        update: {},
        create: {
            name: 'Stripe',
            provider: 'stripe',
            category: 'BILLING',
            isActive: false,
        },
    })
    console.log('✓ Stripe integration seeded!')
    await prisma.$disconnect()
}

main().catch(console.error)
