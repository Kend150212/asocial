import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/facebook/debug — comprehensive Facebook API debug
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const userToken = config.facebookUserToken

    if (!userToken) {
        return NextResponse.json({ status: 'no_user_token', message: 'Reconnect Facebook first' })
    }

    // 1. me/accounts — what Facebook returns
    const meAccountsPages: Array<{ id: string; name: string; category?: string }> = []
    let url: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category&limit=100&access_token=${userToken}`
    while (url) {
        const res: Response = await fetch(url)
        const data: { data?: Array<{ id: string; name: string; category?: string }>; paging?: { next?: string }; error?: { message: string } } = await res.json()
        if (data.error) break
        if (data.data) meAccountsPages.push(...data.data)
        url = data.paging?.next || null
    }

    // 2. Known missing page IDs (from Vbout data) — try accessing directly
    const missingPageIds = [
        { id: '838525306020156', name: 'LUXBlog' },
        { id: '731691343545717', name: 'Jade nails' },
        { id: '258387567355117', name: "Ken's Kitchen" },
        { id: '103034275234118', name: 'OH-La Travel' },
        { id: '111993454907147', name: 'Sai Sen' },
        { id: '106373758756606', name: 'Sài Sen Organic Vietnamese Coffee' },
        { id: '149723025857778', name: 'MAD CN' },
        { id: '280647768455478', name: 'UpdateX' },
    ]

    // Filter out pages already in me/accounts
    const meIds = new Set(meAccountsPages.map(p => p.id))
    const trulyMissing = missingPageIds.filter(p => !meIds.has(p.id))

    // Try to access each missing page directly by ID
    const directAccessResults = []
    for (const page of trulyMissing) {
        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=id,name,category,access_token&access_token=${userToken}`)
            const data = await res.json()
            directAccessResults.push({
                id: page.id,
                expectedName: page.name,
                response: data.error ? { error: data.error.message, code: data.error.code } : { name: data.name, category: data.category, hasAccessToken: !!data.access_token },
            })
        } catch (err) {
            directAccessResults.push({ id: page.id, expectedName: page.name, response: { error: String(err) } })
        }
    }

    // 3. Check permissions
    const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${userToken}`)
    const permData = await permRes.json()

    // 4. DB data
    const dbPlatforms = await prisma.channelPlatform.findMany({
        where: { platform: 'facebook' },
        select: { accountId: true, accountName: true, isActive: true, config: true },
    })

    return NextResponse.json({
        meAccountsCount: meAccountsPages.length,
        meAccountsPages,
        missingPagesDirectAccess: directAccessResults,
        permissions: permData.data,
        dbPlatformsCount: dbPlatforms.length,
        dbPlatforms,
    })
}
