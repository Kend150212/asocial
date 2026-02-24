import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/zalo/callback — Handle Zalo OA OAuth callback
// Exchanges the authorization code for access + refresh tokens, saves to channel
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin

    if (!code || !stateParam) {
        const errorUrl = new URL('/dashboard/channels?zalo=error&message=Missing+code+or+state', host)
        return NextResponse.redirect(errorUrl)
    }

    let state: { channelId: string; userId: string; nonce: string }
    try {
        state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    } catch {
        const errorUrl = new URL('/dashboard/channels?zalo=error&message=Invalid+state', host)
        return NextResponse.redirect(errorUrl)
    }

    // Get Zalo integration credentials from API Hub
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'zalo' } })
    const config = (integration?.config || {}) as Record<string, string>
    const appId = config.zaloAppId || process.env.ZALO_APP_ID || ''
    let secretKey = process.env.ZALO_APP_SECRET || ''
    if (!secretKey && integration?.apiKeyEncrypted) {
        secretKey = decrypt(integration.apiKeyEncrypted)
    }

    if (!appId || !secretKey) {
        const errorUrl = new URL('/dashboard/channels?zalo=error&message=Zalo+credentials+not+configured', host)
        return NextResponse.redirect(errorUrl)
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'secret_key': secretKey,
        },
        body: new URLSearchParams({
            code,
            app_id: appId,
            grant_type: 'authorization_code',
        }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
        console.error('[Zalo OAuth] Token exchange failed:', tokenData)
        const errorUrl = new URL(`/dashboard/channels/${state.channelId}?zalo=error&message=Token+exchange+failed`, host)
        return NextResponse.redirect(errorUrl)
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token

    // Get OA info using the new access token
    let oaName = 'Zalo OA'
    let oaId = ''
    try {
        const oaRes = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
            headers: { access_token: accessToken },
        })
        if (oaRes.ok) {
            const oaData = await oaRes.json()
            if (oaData.data) {
                oaName = oaData.data.name || 'Zalo OA'
                oaId = oaData.data.oa_id || ''
            }
        }
    } catch (e) {
        console.error('[Zalo OAuth] Failed to fetch OA info:', e)
    }

    // Save tokens to channel's webhookZalo field
    const existingChannel = await prisma.channel.findUnique({
        where: { id: state.channelId },
        select: { webhookZalo: true },
    })

    const existingZalo = (existingChannel?.webhookZalo || {}) as Record<string, string>

    const updatedZalo = {
        ...existingZalo,
        accessToken,
        refreshToken,
        userId: existingZalo.userId || '', // preserve existing userId
        oaName,
        oaId,
        connectedAt: new Date().toISOString(),
        connectedBy: state.userId,
    }

    await prisma.channel.update({
        where: { id: state.channelId },
        data: { webhookZalo: updatedZalo },
    })

    // Redirect back to channel settings with success
    const successUrl = new URL(`/dashboard/channels/${state.channelId}?zalo=connected`, host)
    return NextResponse.redirect(successUrl)
}
