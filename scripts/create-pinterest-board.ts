/**
 * One-off script: create a Pinterest board using the stored access token.
 * Usage: npx ts-node -P tsconfig.json scripts/create-pinterest-board.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BOARD_NAME = 'NeeFlow'
const BOARD_PRIVACY = 'PUBLIC'

async function main() {
    // Find Pinterest platform entries
    const platforms = await prisma.channelPlatform.findMany({
        where: { platform: 'pinterest', isActive: true },
    })
    console.log(`Found ${platforms.length} Pinterest account(s)`)

    // Check sandbox mode
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'pinterest' } })
    const config = (integration?.config || {}) as Record<string, string>
    const useSandbox = config.pinterestSandbox === 'true' || config.pinterestSandbox === '1'
    const apiBase = useSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com'
    console.log(`Using API: ${apiBase}`)

    for (const p of platforms) {
        console.log(`\n→ Account: ${p.accountName} (${p.accountId})`)

        if (!p.accessToken) {
            console.log('  ✗ No access token')
            continue
        }

        // Try to create board
        const res = await fetch(`${apiBase}/v5/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${p.accessToken}`,
            },
            body: JSON.stringify({
                name: BOARD_NAME,
                description: 'Board for NeeFlow publishing',
                privacy: BOARD_PRIVACY,
            }),
        })

        const data = await res.json()
        if (res.ok) {
            console.log(`  ✓ Board created: id=${data.id} name="${data.name}"`)
        } else {
            console.log(`  ✗ Failed (${res.status}):`, JSON.stringify(data))
            // If auth error, also show token expiry
            if (p.tokenExpiresAt) {
                console.log(`    Token expires at: ${p.tokenExpiresAt.toISOString()} (now: ${new Date().toISOString()})`)
            }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
