/**
 * Seed default billing plans.
 * Run: npx tsx prisma/seed-plans.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

function createPrismaClient() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

const DEFAULT_PLANS = [
    {
        name: 'Free',
        nameVi: 'Miễn phí',
        description: 'Perfect for getting started',
        descriptionVi: 'Lý tưởng để bắt đầu',
        priceMonthly: 0,
        priceAnnual: 0,
        maxChannels: 1,
        maxPostsPerMonth: 50,
        maxMembersPerChannel: 2,
        maxAiImagesPerMonth: 0,
        maxAiTextPerMonth: 20,
        maxStorageMB: 512,          // 512 MB
        hasAutoSchedule: false,
        hasWebhooks: false,
        hasAdvancedReports: false,
        hasPrioritySupport: false,
        hasWhiteLabel: false,
        isActive: true,
        isPublic: true,
        sortOrder: 0,
    },
    {
        name: 'Pro',
        nameVi: 'Chuyên nghiệp',
        description: 'For growing teams and brands',
        descriptionVi: 'Dành cho đội nhóm và thương hiệu đang phát triển',
        priceMonthly: 19,
        priceAnnual: 190,
        maxChannels: 5,
        maxPostsPerMonth: -1,
        maxMembersPerChannel: 10,
        maxAiImagesPerMonth: 50,
        maxAiTextPerMonth: 1000,
        maxStorageMB: 10240,        // 10 GB
        hasAutoSchedule: true,
        hasWebhooks: true,
        hasAdvancedReports: true,
        hasPrioritySupport: false,
        hasWhiteLabel: false,
        isActive: true,
        isPublic: true,
        sortOrder: 1,
    },
    {
        name: 'Business',
        nameVi: 'Doanh nghiệp',
        description: 'For agencies and large teams',
        descriptionVi: 'Dành cho agency và đội nhóm lớn',
        priceMonthly: 49,
        priceAnnual: 490,
        maxChannels: 20,
        maxPostsPerMonth: -1,
        maxMembersPerChannel: 50,
        maxAiImagesPerMonth: 200,
        maxAiTextPerMonth: 5000,
        maxStorageMB: 51200,        // 50 GB
        hasAutoSchedule: true,
        hasWebhooks: true,
        hasAdvancedReports: true,
        hasPrioritySupport: true,
        hasWhiteLabel: false,
        isActive: true,
        isPublic: true,
        sortOrder: 2,
    },
    {
        name: 'Enterprise',
        nameVi: 'Doanh nghiệp lớn',
        description: 'Unlimited everything for large organizations',
        descriptionVi: 'Không giới hạn dành cho tổ chức lớn',
        priceMonthly: 0,
        priceAnnual: 0,
        maxChannels: -1,
        maxPostsPerMonth: -1,
        maxMembersPerChannel: -1,
        maxAiImagesPerMonth: -1,
        maxAiTextPerMonth: -1,
        maxStorageMB: -1,           // Unlimited
        hasAutoSchedule: true,
        hasWebhooks: true,
        hasAdvancedReports: true,
        hasPrioritySupport: true,
        hasWhiteLabel: true,
        isActive: true,
        isPublic: true,
        sortOrder: 3,
    },
]

async function seedPlans() {
    console.log('[Seed] Seeding billing plans...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any

    for (const plan of DEFAULT_PLANS) {
        await p.plan.upsert({
            where: { id: `plan_${plan.name.toLowerCase()}` },
            update: plan,
            create: { id: `plan_${plan.name.toLowerCase()}`, ...plan },
        })
        console.log(`  ✓ ${plan.name} plan`)
    }
    console.log('[Seed] Plans seeded successfully.')
}

seedPlans()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
