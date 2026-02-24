#!/usr/bin/env node
/**
 * Properly fix all OAuth initiation routes to support easyToken.
 * The previous sed attempt added easyToken line but left session.user broken.
 * This script fixes those routes correctly.
 */

const fs = require('fs')
const path = require('path')

const BASE = path.join(__dirname, '../src/app/api/oauth')

// Pattern to insert easyToken auth logic
// Each platform file: replace the mangled header with correct easyToken-aware header.

function fixRoute(platformDir, stateExtra = '') {
    const file = path.join(BASE, platformDir, 'route.ts')
    if (!fs.existsSync(file)) { console.log(`SKIP: ${file}`); return }

    let src = fs.readFileSync(file, 'utf8')

    // Remove the broken sed-inserted line that references undefined session
    // Pattern: const easyToken = req...  \n    if (!session?.user)
    src = src.replace(
        /const easyToken = req\.nextUrl\.searchParams\.get\("easyToken"\)\s*\n(\s*)if \(!session\?\.user\)/g,
        (_, indent) =>
            `const easyToken = req.nextUrl.searchParams.get('easyToken')\n${indent}` +
            `let _userId = 'easyconnect'\n${indent}` +
            `if (easyToken) {\n${indent}` +
            `    const link = await prisma.easyConnectLink.findUnique({ where: { token: easyToken } })\n${indent}` +
            `    const _cid = req.nextUrl.searchParams.get('channelId') || ''\n${indent}` +
            `    if (!link || !link.isEnabled || link.channelId !== _cid) {\n${indent}` +
            `        return NextResponse.json({ error: 'Invalid EasyConnect link' }, { status: 403 })\n${indent}` +
            `    }\n${indent}` +
            `} else {\n${indent}` +
            `    const session = await auth()\n${indent}` +
            `    if (!session?.user)`
    )

    // Close the else block — after the session guard close brace, add closing }
    // We look for: if (!session?.user) { return ... } followed by the next line
    // Insert } after the session guard block's closing brace:
    src = src.replace(
        /(if \(!session\?\.user\)[^}]*\})/g,
        (match) => match + '\n    _userId = session.user.id\n    }'
    )

    // Fix state encoding to use _userId and optionally include easyToken
    src = src.replace(
        /JSON\.stringify\(\{\s*channelId,\s*userId: session\.user\.id(.*?)\}\)/gs,
        (match, extra) => {
            const cleanExtra = extra.replace(/\s/g, '')
            if (cleanExtra) {
                return `JSON.stringify({ channelId, userId: _userId${extra}, ...(easyToken ? { easyToken } : {}) })`
            }
            return `JSON.stringify({ channelId, userId: _userId, ...(easyToken ? { easyToken } : {}) })`
        }
    )

    fs.writeFileSync(file, src)
    console.log(`✅ Fixed: ${platformDir}`)
}

// Fix all broken routes
const platforms = ['instagram', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'threads', 'gbp']
for (const p of platforms) fixRoute(p)

console.log('All OAuth initiation routes fixed!')
