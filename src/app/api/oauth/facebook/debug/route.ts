import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/facebook/debug — check what pages Facebook API returns
// Uses the saved USER token (not page token) for accurate results
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')

    // 1. Get the saved user token from integration config
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const userToken = config.facebookUserToken

    // 2. Get all Facebook platforms stored in DB
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
        return NextResponse.json({
            status: 'no_user_token',
            message: 'No user token saved. Please reconnect Facebook first to save the user token.',
            dbPlatformsCount: dbPlatforms.length,
            dbPlatforms,
        })
    }

    // 3. Call Facebook API with USER token (not page token)
    let facebookApiPages: Array<{ id: string; name: string; category?: string }> = []
    let facebookApiError: string | null = null
    let facebookUser: unknown = null

    try {
        // Get user info
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userToken}`)
        facebookUser = await meRes.json()

        // Get ALL pages with pagination
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category&limit=100&access_token=${userToken}`
        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl)
            const pagesData: { data?: Array<{ id: string; name: string; category?: string }>; paging?: { next?: string }; error?: { message: string; code: number } } = await pagesRes.json()
            if (pagesData.error) {
                facebookApiError = `${pagesData.error.message} (code: ${pagesData.error.code})`
                break
            }
            if (pagesData.data) facebookApiPages = facebookApiPages.concat(pagesData.data)
            pagesUrl = pagesData.paging?.next || null
        }
    } catch (err) {
        facebookApiError = String(err)
    }

    // 4. Compare: which DB pages are NOT in the API response?
    const apiPageIds = new Set(facebookApiPages.map(p => p.id))
    const missingFromApi = dbPlatforms.filter(p => !apiPageIds.has(p.accountId))
    const inApiButNotDb = facebookApiPages.filter(p => !dbPlatforms.some(db => db.accountId === p.id))

    return NextResponse.json({
        status: 'ok',
        facebookUser,
        facebookApiPagesCount: facebookApiPages.length,
        facebookApiPages,
        facebookApiError,
        dbPlatformsCount: dbPlatforms.length,
        dbPlatforms,
        comparison: {
            inDbButNotApi: missingFromApi.map(p => ({ id: p.accountId, name: p.accountName })),
            inApiButNotDb: inApiButNotDb.map(p => ({ id: p.id, name: p.name })),
        },
    })
}
