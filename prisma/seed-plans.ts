/**
 * Seed default billing plans.
 * Run: npx ts-node prisma/seed-plans.ts
 * Or call seedPlans() from your seed.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
        maxPostsPerMonth: -1, // unlimited
        maxMembersPerChannel: 10,
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
        maxPostsPerMonth: -1, // unlimited
        maxMembersPerChannel: 50,
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
        priceMonthly: 0, // custom pricing — contact sales
        priceAnnual: 0,
        maxChannels: -1,
        maxPostsPerMonth: -1,
        maxMembersPerChannel: -1,
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

export async function seedPlans() {
    console.log('[Seed] Seeding billing plans...')

    for (const plan of DEFAULT_PLANS) {
        await prisma.plan.upsert({
            where: { id: `plan_${plan.name.toLowerCase()}` },
            update: plan,
            create: { id: `plan_${plan.name.toLowerCase()}`, ...plan },
        })
        console.log(`  ✓ ${plan.name} plan`)
    }

    console.log('[Seed] Plans seeded successfully.')
}

// Run directly
if (require.main === module) {
    seedPlans()
        .catch(console.error)
        .finally(() => prisma.$disconnect())
}
