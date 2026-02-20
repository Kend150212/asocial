/**
 * Run this once on the server to add the Google OAuth integration row:
 *   node scripts/seed-google-oauth.mjs
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const exists = await prisma.apiIntegration.findFirst({
        where: { provider: 'google_oauth' },
    })

    if (exists) {
        console.log('[seed] google_oauth integration already exists, skipping.')
    } else {
        await prisma.apiIntegration.create({
            data: {
                name: 'Google Sign-In (OAuth)',
                provider: 'google_oauth',
                category: 'OAuth',
                status: 'INACTIVE',
                config: {},
                isDefault: false,
            },
        })
        console.log('[seed] ✅ google_oauth integration created.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
