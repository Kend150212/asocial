import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/facebook/debug — check what pages Facebook API returns
// Admin only — for debugging
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = req.nextUrl.searchParams.get('channelId')

    // 1. Get all Facebook platforms stored in DB for this channel
    const dbPlatforms = channelId
        ? await prisma.channelPlatform.findMany({
            where: { channelId, platform: 'facebook' },
            select: { id: true, accountId: true, accountName: true, isActive: true, config: true, connectedBy: true },
        })
        : await prisma.channelPlatform.findMany({
            where: { platform: 'facebook' },
            select: { id: true, channelId: true, accountId: true, accountName: true, isActive: true, config: true, connectedBy: true },
        })

    // 2. Try to call Facebook API with any stored access token
    let facebookApiPages: unknown[] = []
    let facebookApiError: string | null = null

    // Find a platform entry with an access token
    const withToken = await prisma.channelPlatform.findFirst({
        where: { platform: 'facebook', accessToken: { not: null } },
        select: { accessToken: true, accountName: true },
    })

    if (withToken?.accessToken) {
        try {
            // Get user info first
            const meUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${withToken.accessToken}`
            const meRes = await fetch(meUrl)
            const meData = await meRes.json()

            // Get pages using this token
            let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token&limit=100&access_token=${withToken.accessToken}`
            while (pagesUrl) {
                const pagesRes: Response = await fetch(pagesUrl)
                const pagesData: { data?: Array<{ id: string; name: string; category: string }>; paging?: { next?: string }; error?: { message: string; code: number } } = await pagesRes.json()
                if (pagesData.error) {
                    facebookApiError = `${pagesData.error.message} (code: ${pagesData.error.code})`
                    break
                }
                if (pagesData.data) facebookApiPages = facebookApiPages.concat(pagesData.data)
                pagesUrl = pagesData.paging?.next || null
            }

            return NextResponse.json({
                status: 'ok',
                tokenFrom: withToken.accountName,
                facebookUser: meData,
                facebookPagesCount: facebookApiPages.length,
                facebookPages: facebookApiPages,
                facebookApiError,
                dbPlatformsCount: dbPlatforms.length,
                dbPlatforms,
            })
        } catch (err) {
            facebookApiError = String(err)
        }
    }

    return NextResponse.json({
        status: 'no_token',
        message: 'No stored access token found to test Facebook API',
        facebookApiError,
        dbPlatformsCount: dbPlatforms.length,
        dbPlatforms,
    })
}
