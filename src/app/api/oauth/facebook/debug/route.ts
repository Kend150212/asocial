import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/facebook/debug — comprehensive Facebook API debug
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const userToken = config.facebookUserToken

    const dbPlatforms = channelId
        ? await prisma.channelPlatform.findMany({
            where: { channelId, platform: 'facebook' },
            select: { id: true, accountId: true, accountName: true, isActive: true, config: true, connectedBy: true },
        })
        : await prisma.channelPlatform.findMany({
            where: { platform: 'facebook' },
            select: { id: true, channelId: true, accountId: true, accountName: true, isActive: true, config: true, connectedBy: true },
        })

    if (!userToken) {
        return NextResponse.json({ status: 'no_user_token', dbPlatformsCount: dbPlatforms.length, dbPlatforms })
    }

    // Test 1: Standard me/accounts call
    const test1 = await testMeAccounts(userToken, 'id,name,category,access_token')

    // Test 2: me/accounts WITHOUT access_token field (maybe that filters?)
    const test2 = await testMeAccounts(userToken, 'id,name,category')

    // Test 3: me/accounts with NO fields param at all
    const test3 = await testMeAccountsNoFields(userToken)

    // Test 4: Get user info + check permissions
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userToken}`)
    const meData = await meRes.json()

    // Test 5: Check granted permissions
    const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${userToken}`)
    const permData = await permRes.json()

    return NextResponse.json({
        facebookUser: meData,
        grantedPermissions: permData.data,
        test1_with_fields: { count: test1.length, pages: test1 },
        test2_no_token_field: { count: test2.length, pages: test2 },
        test3_no_fields: { count: test3.length, pages: test3 },
        dbPlatformsCount: dbPlatforms.length,
        dbPlatforms,
    })
}

async function testMeAccounts(token: string, fields: string) {
    const pages: Array<{ id: string; name: string; category?: string }> = []
    let url: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=${fields}&limit=100&access_token=${token}`
    while (url) {
        const res: Response = await fetch(url)
        const data: { data?: Array<{ id: string; name: string; category?: string }>; paging?: { next?: string }; error?: { message: string } } = await res.json()
        if (data.error) return [{ error: data.error.message }] as unknown as typeof pages
        if (data.data) pages.push(...data.data.map(p => ({ id: p.id, name: p.name, category: p.category })))
        url = data.paging?.next || null
    }
    return pages
}

async function testMeAccountsNoFields(token: string) {
    const pages: Array<{ id: string; name: string }> = []
    let url: string | null = `https://graph.facebook.com/v19.0/me/accounts?limit=100&access_token=${token}`
    while (url) {
        const res: Response = await fetch(url)
        const data: { data?: Array<{ id: string; name: string }>; paging?: { next?: string }; error?: { message: string } } = await res.json()
        if (data.error) return [{ error: data.error.message }] as unknown as typeof pages
        if (data.data) pages.push(...data.data.map(p => ({ id: p.id, name: p.name })))
        url = data.paging?.next || null
    }
    return pages
}
