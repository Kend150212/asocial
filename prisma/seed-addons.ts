/**
 * Seed default add-ons.
 * Run: npx tsx prisma/seed-addons.ts
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

const DEFAULT_ADDONS = [
    // ─── Storage ─────────────────────────────────────────
    {
        name: 'extra_storage_5gb',
        displayName: 'Extra Storage 5 GB',
        displayNameVi: 'Thêm 5 GB dung lượng',
        description: 'Add 5 GB of media storage on top of your plan.',
        descriptionVi: 'Thêm 5 GB dung lượng lưu trữ media.',
        category: 'quota',
        quotaField: 'maxStorageMB',
        quotaAmount: 5120,
        priceMonthly: 3,
        priceAnnual: 30,
        icon: 'hard-drive',
        sortOrder: 0,
    },
    {
        name: 'extra_storage_20gb',
        displayName: 'Extra Storage 20 GB',
        displayNameVi: 'Thêm 20 GB dung lượng',
        description: 'Add 20 GB of media storage on top of your plan.',
        descriptionVi: 'Thêm 20 GB dung lượng lưu trữ media.',
        category: 'quota',
        quotaField: 'maxStorageMB',
        quotaAmount: 20480,
        priceMonthly: 10,
        priceAnnual: 100,
        icon: 'hard-drive',
        sortOrder: 1,
    },
    {
        name: 'extra_storage_50gb',
        displayName: 'Extra Storage 50 GB',
        displayNameVi: 'Thêm 50 GB dung lượng',
        description: 'Add 50 GB of media storage on top of your plan.',
        descriptionVi: 'Thêm 50 GB dung lượng lưu trữ media.',
        category: 'quota',
        quotaField: 'maxStorageMB',
        quotaAmount: 51200,
        priceMonthly: 20,
        priceAnnual: 200,
        icon: 'hard-drive',
        sortOrder: 2,
    },

    // ─── Channels ─────────────────────────────────────────
    {
        name: 'extra_channels_3',
        displayName: 'Extra 3 Channels',
        displayNameVi: 'Thêm 3 kênh',
        description: 'Add 3 social media channels to your plan.',
        descriptionVi: 'Thêm 3 kênh mạng xã hội.',
        category: 'quota',
        quotaField: 'maxChannels',
        quotaAmount: 3,
        priceMonthly: 5,
        priceAnnual: 50,
        icon: 'tv',
        sortOrder: 10,
    },
    {
        name: 'extra_channels_10',
        displayName: 'Extra 10 Channels',
        displayNameVi: 'Thêm 10 kênh',
        description: 'Add 10 social media channels to your plan.',
        descriptionVi: 'Thêm 10 kênh mạng xã hội.',
        category: 'quota',
        quotaField: 'maxChannels',
        quotaAmount: 10,
        priceMonthly: 12,
        priceAnnual: 120,
        icon: 'tv',
        sortOrder: 11,
    },

    // ─── AI Image Credits ─────────────────────────────────
    {
        name: 'extra_ai_images_100',
        displayName: 'AI Image Credits +100',
        displayNameVi: 'Thêm 100 ảnh AI/tháng',
        description: 'Generate 100 additional AI images per month.',
        descriptionVi: 'Tạo thêm 100 ảnh AI mỗi tháng.',
        category: 'quota',
        quotaField: 'maxAiImagesPerMonth',
        quotaAmount: 100,
        priceMonthly: 5,
        priceAnnual: 50,
        icon: 'image',
        sortOrder: 20,
    },
    {
        name: 'extra_ai_images_500',
        displayName: 'AI Image Credits +500',
        displayNameVi: 'Thêm 500 ảnh AI/tháng',
        description: 'Generate 500 additional AI images per month.',
        descriptionVi: 'Tạo thêm 500 ảnh AI mỗi tháng.',
        category: 'quota',
        quotaField: 'maxAiImagesPerMonth',
        quotaAmount: 500,
        priceMonthly: 15,
        priceAnnual: 150,
        icon: 'image',
        sortOrder: 21,
    },

    // ─── AI Text Credits ──────────────────────────────────
    {
        name: 'extra_ai_text_500',
        displayName: 'AI Text Credits +500',
        displayNameVi: 'Thêm 500 nội dung AI/tháng',
        description: 'Generate 500 additional AI text per month (captions, descriptions, hashtags).',
        descriptionVi: 'Tạo thêm 500 nội dung AI mỗi tháng.',
        category: 'quota',
        quotaField: 'maxAiTextPerMonth',
        quotaAmount: 500,
        priceMonthly: 5,
        priceAnnual: 50,
        icon: 'pen-tool',
        sortOrder: 30,
    },
    {
        name: 'extra_ai_text_2000',
        displayName: 'AI Text Credits +2000',
        displayNameVi: 'Thêm 2000 nội dung AI/tháng',
        description: 'Generate 2000 additional AI text per month (captions, descriptions, hashtags).',
        descriptionVi: 'Tạo thêm 2000 nội dung AI mỗi tháng.',
        category: 'quota',
        quotaField: 'maxAiTextPerMonth',
        quotaAmount: 2000,
        priceMonthly: 12,
        priceAnnual: 120,
        icon: 'pen-tool',
        sortOrder: 31,
    },

    // ─── Team Members ─────────────────────────────────────
    {
        name: 'extra_members_5',
        displayName: 'Extra 5 Team Members',
        displayNameVi: 'Thêm 5 thành viên/kênh',
        description: 'Add 5 additional team members per channel.',
        descriptionVi: 'Thêm 5 thành viên cho mỗi kênh.',
        category: 'quota',
        quotaField: 'maxMembersPerChannel',
        quotaAmount: 5,
        priceMonthly: 3,
        priceAnnual: 30,
        icon: 'users',
        sortOrder: 40,
    },
    {
        name: 'extra_members_20',
        displayName: 'Extra 20 Team Members',
        displayNameVi: 'Thêm 20 thành viên/kênh',
        description: 'Add 20 additional team members per channel.',
        descriptionVi: 'Thêm 20 thành viên cho mỗi kênh.',
        category: 'quota',
        quotaField: 'maxMembersPerChannel',
        quotaAmount: 20,
        priceMonthly: 8,
        priceAnnual: 80,
        icon: 'users',
        sortOrder: 41,
    },

    // ─── API Access ───────────────────────────────────────
    {
        name: 'api_access_1k',
        displayName: 'API Access 1,000 calls/mo',
        displayNameVi: 'API 1.000 lượt/tháng',
        description: 'Access the developer API with 1,000 calls per month.',
        descriptionVi: 'Truy cập API với 1.000 lượt gọi mỗi tháng.',
        category: 'quota',
        quotaField: 'maxApiCallsPerMonth',
        quotaAmount: 1000,
        priceMonthly: 10,
        priceAnnual: 100,
        icon: 'code-2',
        sortOrder: 50,
    },
    {
        name: 'api_access_10k',
        displayName: 'API Access 10,000 calls/mo',
        displayNameVi: 'API 10.000 lượt/tháng',
        description: 'Access the developer API with 10,000 calls per month.',
        descriptionVi: 'Truy cập API với 10.000 lượt gọi mỗi tháng.',
        category: 'quota',
        quotaField: 'maxApiCallsPerMonth',
        quotaAmount: 10000,
        priceMonthly: 25,
        priceAnnual: 250,
        icon: 'code-2',
        sortOrder: 51,
    },

    // ─── Feature Add-ons ──────────────────────────────────
    {
        name: 'feature_auto_schedule',
        displayName: 'Auto Schedule',
        displayNameVi: 'Tự động lên lịch',
        description: 'Enable automatic scheduling for your posts.',
        descriptionVi: 'Bật tự động lên lịch cho bài viết.',
        category: 'feature',
        featureField: 'hasAutoSchedule',
        priceMonthly: 5,
        priceAnnual: 50,
        icon: 'calendar-clock',
        sortOrder: 60,
    },
    {
        name: 'feature_advanced_reports',
        displayName: 'Advanced Reports',
        displayNameVi: 'Báo cáo nâng cao',
        description: 'Unlock advanced analytics and reporting.',
        descriptionVi: 'Mở khóa phân tích và báo cáo nâng cao.',
        category: 'feature',
        featureField: 'hasAdvancedReports',
        priceMonthly: 8,
        priceAnnual: 80,
        icon: 'bar-chart-3',
        sortOrder: 61,
    },
    {
        name: 'feature_white_label',
        displayName: 'White Label',
        displayNameVi: 'Nhãn trắng',
        description: 'Remove branding and use your own custom domain.',
        descriptionVi: 'Xóa thương hiệu và dùng tên miền riêng.',
        category: 'feature',
        featureField: 'hasWhiteLabel',
        priceMonthly: 20,
        priceAnnual: 200,
        icon: 'tag',
        sortOrder: 62,
    },
    {
        name: 'feature_priority_support',
        displayName: 'Priority Support',
        displayNameVi: 'Hỗ trợ ưu tiên',
        description: 'Get priority chat support with SLA 4h response time.',
        descriptionVi: 'Hỗ trợ ưu tiên qua chat, phản hồi trong 4 giờ.',
        category: 'feature',
        featureField: 'hasPrioritySupport',
        priceMonthly: 10,
        priceAnnual: 100,
        icon: 'headphones',
        sortOrder: 63,
    },
]

async function seedAddons() {
    console.log('[Seed] Seeding add-ons...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any

    for (const addon of DEFAULT_ADDONS) {
        await p.addon.upsert({
            where: { name: addon.name },
            update: addon,
            create: addon,
        })
        console.log(`  ✓ ${addon.displayName}`)
    }
    console.log(`[Seed] ${DEFAULT_ADDONS.length} add-ons seeded successfully.`)
}

seedAddons()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
