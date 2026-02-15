import { PrismaClient, UserRole, IntegrationCategory, IntegrationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({})

async function main() {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@asocial.app' },
        update: {},
        create: {
            email: 'admin@asocial.app',
            name: 'Ken Dao',
            passwordHash: adminPassword,
            role: UserRole.ADMIN,
            isActive: true,
        },
    })

    console.log('✅ Admin user created:', admin.email)

    // Create admin preference
    await prisma.userPreference.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            theme: 'dark',
            locale: 'vi',
        },
    })

    // Create default API integrations
    const integrations = [
        {
            category: IntegrationCategory.SOCIAL,
            provider: 'vbout',
            name: 'Vbout',
            isActive: true,
            isDefault: true,
            status: IntegrationStatus.ACTIVE,
            rateLimitPerSec: 10,
            baseUrl: 'https://api.vbout.com/1',
        },
        {
            category: IntegrationCategory.AI,
            provider: 'openai',
            name: 'OpenAI',
            isActive: false,
            isDefault: true,
            status: IntegrationStatus.INACTIVE,
            baseUrl: 'https://api.openai.com/v1',
        },
        {
            category: IntegrationCategory.AI,
            provider: 'gemini',
            name: 'Google Gemini',
            isActive: false,
            isDefault: false,
            status: IntegrationStatus.INACTIVE,
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
        {
            category: IntegrationCategory.AI,
            provider: 'runware',
            name: 'Runware',
            isActive: false,
            isDefault: false,
            status: IntegrationStatus.INACTIVE,
            baseUrl: 'https://api.runware.ai/v1',
        },
        {
            category: IntegrationCategory.STORAGE,
            provider: 'gdrive',
            name: 'Google Drive',
            isActive: false,
            isDefault: true,
            status: IntegrationStatus.INACTIVE,
        },
        {
            category: IntegrationCategory.EMAIL,
            provider: 'smtp',
            name: 'SMTP (Nodemailer)',
            isActive: false,
            isDefault: true,
            status: IntegrationStatus.INACTIVE,
        },
    ]

    for (const integration of integrations) {
        await prisma.apiIntegration.upsert({
            where: {
                category_provider: {
                    category: integration.category,
                    provider: integration.provider,
                },
            },
            update: {},
            create: integration,
        })
    }

    console.log('✅ API integrations seeded:', integrations.length)
    console.log('')
    console.log('🎉 Database seeded successfully!')
    console.log('   Login: admin@asocial.app / admin123')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
