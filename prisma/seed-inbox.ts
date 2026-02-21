/**
 * Seed inbox conversations and messages for testing.
 * 
 * Usage: npx tsx prisma/seed-inbox.ts
 * 
 * This script finds existing channels and platform accounts,
 * then creates realistic Vietnamese conversations with AI bot responses.
 */
import { PrismaClient, ConversationMode } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding inbox data...\n')

    // Find existing user (admin)
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    })
    if (!admin) {
        console.error('❌ No admin user found. Run `npm run db:seed` first.')
        process.exit(1)
    }
    console.log(`👤 Using admin: ${admin.email}`)

    // Find existing channels
    const channels = await prisma.channel.findMany({
        include: { platforms: true },
    })

    if (channels.length === 0) {
        console.error('❌ No channels found. Create a channel first via the dashboard.')
        process.exit(1)
    }

    const channel = channels[0]
    console.log(`📢 Using channel: ${channel.displayName || channel.name}`)

    // Ensure we have platform accounts
    let platformAccounts = channel.platforms
    if (platformAccounts.length === 0) {
        console.log('📱 No platform accounts found, creating demo ones...')
        const platforms = [
            { platform: 'facebook', accountId: 'fb_luxhome_001', accountName: 'Lux Home Official' },
            { platform: 'facebook', accountId: 'fb_luxhome_002', accountName: 'Lux Home VN' },
            { platform: 'instagram', accountId: 'ig_luxhome_001', accountName: '@luxhome.vn' },
            { platform: 'tiktok', accountId: 'tt_luxhome_001', accountName: '@luxhome' },
            { platform: 'zalo', accountId: 'zalo_luxhome_001', accountName: 'Lux Home Zalo' },
        ]

        for (const p of platforms) {
            await prisma.channelPlatform.create({
                data: {
                    channelId: channel.id,
                    ...p,
                    isActive: true,
                },
            })
        }

        platformAccounts = await prisma.channelPlatform.findMany({
            where: { channelId: channel.id },
        })
        console.log(`   Created ${platformAccounts.length} platform accounts`)
    }

    // Helper to get a random platform account
    const getPA = (platform?: string) => {
        const filtered = platform
            ? platformAccounts.filter(p => p.platform === platform)
            : platformAccounts
        return filtered[Math.floor(Math.random() * filtered.length)]
    }

    // ─── Conversations ────────────────────
    const conversationData = [
        {
            platform: 'facebook',
            externalUserId: 'fb_user_thanh_dan',
            externalUserName: 'Thanh Dan',
            status: 'new',
            mode: ConversationMode.BOT,
            tags: ['order', 'sofa'],
            sentiment: 'positive',
            intent: 'buy',
            priority: 80,
            unreadCount: 2,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Chào shop, em muốn hỏi về sản phẩm sofa góc L', time: -4 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ chào anh/chị! 🤖 Em là trợ lý AI của Lux Home. Anh/chị muốn hỏi về sofa góc L model nào ạ? Hiện tại shop đang có 3 mẫu:\n\n1. Sofa góc L Classic - 15.900.000đ\n2. Sofa góc L Premium - 22.500.000đ\n3. Sofa góc L Luxury - 35.000.000đ\n\nAnh/chị quan tâm mẫu nào ạ?', conf: 0.92, time: -3.9 },
                { dir: 'inbound', sender: 'customer', content: 'Em muốn đặt sofa Premium, có thể trả góp không shop?', time: -3 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ sofa góc L Premium giá 22.500.000đ ạ! Shop hiện hỗ trợ trả góp 0% qua:\n\n🏦 Thẻ tín dụng: 3-12 tháng\n💳 Ví điện tử: MoMo, ZaloPay\n\nAnh/chị muốn tìm hiểu thêm chi tiết trả góp không ạ?', conf: 0.85, time: -2.9 },
            ],
        },
        {
            platform: 'instagram',
            externalUserId: 'ig_user_vinh_nguyen',
            externalUserName: 'Vinh Nguyen',
            status: 'open',
            mode: ConversationMode.AGENT,
            assignedTo: admin.id,
            tags: ['support'],
            sentiment: 'neutral',
            intent: 'support',
            priority: 50,
            unreadCount: 0,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Shop ơi bàn coffee table gỗ walnut có mấy size ạ?', time: -12 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ chào bạn! Hiện tại shop có 3 size bàn coffee table gỗ walnut:\n\n📏 Size S: 80x50cm - 4.500.000đ\n📏 Size M: 100x60cm - 6.200.000đ\n📏 Size L: 120x70cm - 8.900.000đ\n\nBạn quan tâm size nào ạ?', conf: 0.88, time: -11.5 },
                { dir: 'inbound', sender: 'customer', content: 'Size M nhưng muốn đổi sang màu oak được không?', time: -10 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ câu hỏi này em xin phép chuyển cho nhân viên tư vấn chi tiết hơn ạ! Xin anh/chị đợi trong giây lát. 🙏', conf: 0.45, time: -9.8 },
                { dir: 'outbound', sender: 'agent', content: 'Chào anh Vinh! Em là tư vấn viên. Về bàn coffee table size M đổi sang gỗ oak:\n\n✅ Shop hoàn toàn custom được ạ\n💰 Giá oak nhẹ hơn walnut: 5.800.000đ\n⏰ Thời gian sản xuất: 7-10 ngày\n\nAnh muốn em lên đơn không ạ?', time: -8 },
            ],
        },
        {
            platform: 'zalo',
            externalUserId: 'zalo_user_mai_linh',
            externalUserName: 'Mai Linh',
            status: 'new',
            mode: ConversationMode.BOT,
            tags: ['complaint', 'urgent'],
            sentiment: 'negative',
            intent: 'complaint',
            priority: 95,
            unreadCount: 5,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Shop ơi, sản phẩm bị lỗi rồi! Mình đặt ghế sofa mà giao đến bị rách bọc da', time: -2 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ rất xin lỗi anh/chị về sự bất tiện này! 😔 Em ghi nhận phản hồi của mình. Để xử lý nhanh nhất, anh/chị vui lòng:\n\n📸 Chụp ảnh sản phẩm bị lỗi\n📋 Cung cấp mã đơn hàng\n\nEm sẽ chuyển cho bộ phận đổi trả xử lý ngay ạ!', conf: 0.78, time: -1.9 },
                { dir: 'inbound', sender: 'customer', content: 'Đây, mã đơn là LH202402-0089. Mình đã chụp ảnh rồi', time: -1.5 },
                { dir: 'inbound', sender: 'customer', content: 'Mình muốn đổi sản phẩm mới chứ không muốn hoàn tiền', time: -1.3 },
                { dir: 'inbound', sender: 'customer', content: 'Hello? Có ai trả lời không?', time: -0.5 },
            ],
        },
        {
            platform: 'facebook',
            externalUserId: 'fb_user_hung_tran',
            externalUserName: 'Hùng Trần',
            status: 'done',
            mode: ConversationMode.AGENT,
            assignedTo: admin.id,
            tags: [],
            sentiment: 'positive',
            intent: 'info',
            priority: 20,
            unreadCount: 0,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Shop mở cửa mấy giờ ạ?', time: -48 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ shop mở cửa:\n\n🕘 Thứ 2 - Thứ 6: 9:00 - 21:00\n🕙 Thứ 7 - CN: 10:00 - 20:00\n📍 Địa chỉ: 123 Nguyễn Huệ, Q1, TP.HCM\n\nAnh/chị cần tư vấn gì thêm không ạ?', conf: 0.95, time: -47.5 },
                { dir: 'inbound', sender: 'customer', content: 'Cảm ơn shop đã tư vấn! Weekend này mình sẽ ghé 👍', time: -24 },
                { dir: 'outbound', sender: 'agent', content: 'Dạ shop rất vui được phục vụ anh Hùng! Hẹn gặp anh cuối tuần ạ 🎉', time: -23 },
            ],
        },
        {
            platform: 'tiktok',
            externalUserId: 'tt_user_bao_ngoc',
            externalUserName: 'Bảo Ngọc',
            status: 'new',
            mode: ConversationMode.BOT,
            tags: ['shipping'],
            sentiment: 'positive',
            intent: 'buy',
            priority: 70,
            unreadCount: 1,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Cho mình hỏi có ship COD toàn quốc không ạ?', time: -0.5 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ có ạ! Shop hỗ trợ giao hàng COD toàn quốc:\n\n🚚 Nội thành TP.HCM, Hà Nội: 1-2 ngày\n🚚 Tỉnh/thành khác: 3-5 ngày\n💰 Phí ship: FREE cho đơn trên 5.000.000đ\n\nBạn muốn đặt sản phẩm nào ạ?', conf: 0.91, time: -0.4 },
            ],
        },
        {
            platform: 'facebook',
            externalUserId: 'fb_user_phuong_anh',
            externalUserName: 'Phương Anh',
            status: 'new',
            mode: ConversationMode.BOT,
            tags: ['design'],
            sentiment: 'positive',
            intent: 'buy',
            priority: 60,
            unreadCount: 3,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Mình muốn thiết kế nội thất phòng khách 25m2, shop có tư vấn miễn phí không ạ?', time: -6 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ chào bạn! Shop có dịch vụ tư vấn thiết kế nội thất MIỄN PHÍ ạ! 🏡\n\nĐể tư vấn tốt nhất, bạn vui lòng cung cấp:\n📐 Layout phòng (ảnh hoặc bản vẽ)\n🎨 Phong cách yêu thích (hiện đại, tối giản, scandinavian...)\n💰 Ngân sách dự kiến\n\nShop sẽ lên phương án 3D render trong 2-3 ngày!', conf: 0.87, time: -5.5 },
                { dir: 'inbound', sender: 'customer', content: 'Mình thích phong cách Japandi, ngân sách khoảng 80 triệu có được không?', time: -5 },
                { dir: 'inbound', sender: 'customer', content: 'Mình gửi ảnh layout phòng nè', time: -4.5 },
            ],
        },
        {
            platform: 'instagram',
            externalUserId: 'ig_user_minh_duc',
            externalUserName: 'Minh Đức',
            status: 'open',
            mode: ConversationMode.AGENT,
            assignedTo: admin.id,
            tags: ['warranty'],
            sentiment: 'neutral',
            intent: 'support',
            priority: 40,
            unreadCount: 1,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Mình mua bộ bàn ăn từ tháng trước, muốn hỏi bảo hành thế nào?', time: -25 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ chào bạn! Chính sách bảo hành của Lux Home:\n\n🛡️ Bàn ăn: BH 2 năm khung + 1 năm mặt gỗ\n🔧 Sửa chữa miễn phí trong thời hạn BH\n📞 Hotline BH: 1900-xxxx\n\nBạn gặp vấn đề gì ạ?', conf: 0.82, time: -24.5 },
                { dir: 'inbound', sender: 'customer', content: 'Mặt bàn bị trầy xước nhẹ, có đánh bóng lại được không?', time: -20 },
                { dir: 'outbound', sender: 'agent', content: 'Chào anh Minh Đức! Trầy xước nhẹ mặt bàn gỗ hoàn toàn đánh bóng lại được ạ. Shop có 2 option:\n\n1⃣ Tự đánh bóng tại nhà: Shop gửi kit đánh bóng FREE\n2⃣ Shop cử thợ đến nhà: Miễn phí (trong TP.HCM)\n\nAnh chọn option nào ạ?', time: -18 },
                { dir: 'inbound', sender: 'customer', content: 'Option 2 nha shop. Mình ở quận 7', time: -5 },
            ],
        },
        {
            platform: 'zalo',
            externalUserId: 'zalo_user_hoang_yen',
            externalUserName: 'Hoàng Yến',
            status: 'new',
            mode: ConversationMode.BOT,
            tags: ['bulk-order'],
            sentiment: 'positive',
            intent: 'buy',
            priority: 90,
            unreadCount: 4,
            messages: [
                { dir: 'inbound', sender: 'customer', content: 'Mình đang làm dự án homestay, cần mua sỉ nội thất cho 10 phòng. Shop có giá sỉ không?', time: -3 },
                { dir: 'outbound', sender: 'bot', content: 'Dạ chào bạn! 🎉 Shop rất vui khi được hợp tác dự án homestay! Đối với đơn sỉ từ 10 phòng, shop hỗ trợ:\n\n💰 Giảm 15-25% giá niêm yết\n🎨 Thiết kế riêng theo concept homestay\n📦 Giao hàng + lắp đặt miễn phí\n\nĐể báo giá chi tiết, bạn vui lòng cho shop biết:\n1. Diện tích mỗi phòng\n2. Phong cách mong muốn\n3. Danh sách nội thất cần', conf: 0.89, time: -2.8 },
                { dir: 'inbound', sender: 'customer', content: 'Mỗi phòng 20m2, phong cách tropical. Cần: 1 giường, 1 tủ, 1 bàn làm việc, 2 ghế', time: -2.5 },
                { dir: 'inbound', sender: 'customer', content: 'Budget khoảng 500 triệu cho 10 phòng', time: -2.3 },
                { dir: 'inbound', sender: 'customer', content: 'Có thể gặp trực tiếp để trao đổi chi tiết được không?', time: -1.8 },
            ],
        },
    ]

    let created = 0
    for (const conv of conversationData) {
        // Find a suitable platform account
        const pa = getPA(conv.platform)
        if (!pa) {
            console.log(`  ⚠ No platform account for ${conv.platform}, skipping...`)
            continue
        }

        // Check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                channelId: channel.id,
                platform: conv.platform,
                externalUserId: conv.externalUserId,
            },
        })
        if (existing) {
            console.log(`  ⏭ Conversation with ${conv.externalUserName} already exists`)
            continue
        }

        // Create conversation
        const lastMsg = conv.messages[conv.messages.length - 1]
        const conversation = await prisma.conversation.create({
            data: {
                channelId: channel.id,
                platformAccountId: pa.id,
                platform: conv.platform,
                externalUserId: conv.externalUserId,
                externalUserName: conv.externalUserName,
                status: conv.status,
                mode: conv.mode,
                assignedTo: conv.assignedTo || null,
                tags: conv.tags,
                sentiment: conv.sentiment,
                intent: conv.intent,
                priority: conv.priority,
                unreadCount: conv.unreadCount,
                lastMessageAt: new Date(Date.now() + lastMsg.time * 3600000),
            },
        })

        // Create messages
        for (const msg of conv.messages) {
            await prisma.inboxMessage.create({
                data: {
                    conversationId: conversation.id,
                    direction: msg.dir,
                    senderType: msg.sender,
                    content: msg.content,
                    confidence: (msg as any).conf || null,
                    sentAt: new Date(Date.now() + msg.time * 3600000),
                },
            })
        }

        created++
        console.log(`  ✅ ${conv.externalUserName} (${conv.platform}) — ${conv.messages.length} messages`)
    }

    console.log(`\n🎉 Seeded ${created} conversations with messages!`)
    console.log('   Open /dashboard/inbox to see them')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        await pool.end()
        process.exit(1)
    })
