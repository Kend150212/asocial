import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// ─── OAuth 1.0a helpers ──────────────────────────────────────────────────────

function oauthSign(
    method: string,
    url: string,
    params: Record<string, string>,
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessTokenSecret: string,
): string {
    const oauthParams: Record<string, string> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0',
    }

    const allParams = { ...params, ...oauthParams }
    const sortedParams = Object.keys(allParams)
        .sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
        .join('&')

    const baseString = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(sortedParams)].join('&')
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')

    oauthParams['oauth_signature'] = signature

    return (
        'OAuth ' +
        Object.keys(oauthParams)
            .sort()
            .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
            .join(', ')
    )
}

// POST /api/oauth/x/connect — Connect X account via user-provided API credentials
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { apiKey, apiKeySecret, accessToken, accessTokenSecret, channelId } = await req.json()

    if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret || !channelId) {
        return NextResponse.json({ error: 'All 4 credentials and channelId are required' }, { status: 400 })
    }

    try {
        // Verify credentials by calling GET /2/users/me
        const verifyUrl = 'https://api.twitter.com/2/users/me'
        const authHeader = oauthSign('GET', verifyUrl, {}, apiKey, apiKeySecret, accessToken, accessTokenSecret)

        const res = await fetch(verifyUrl, {
            headers: { Authorization: authHeader },
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            const msg = err.detail || err.title || err.errors?.[0]?.message || 'Invalid credentials'
            return NextResponse.json({ error: msg }, { status: 400 })
        }

        const data = await res.json()
        const user = data.data
        if (!user?.id) return NextResponse.json({ error: 'Could not retrieve account info' }, { status: 400 })

        // Store credentials in DB — access_token = JSON-encoded all 4 keys
        const credentialPayload = JSON.stringify({ apiKey, apiKeySecret, accessToken, accessTokenSecret })

        await prisma.channelPlatform.upsert({
            where: { channelId_platform_accountId: { channelId, platform: 'x', accountId: user.id } },
            update: {
                accountName: user.name || user.username || `@${user.username}`,
                accessToken: credentialPayload,
                connectedBy: session.user.id,
                isActive: true,
                tokenExpiresAt: null, // OAuth 1.0a tokens don't expire
            },
            create: {
                channelId,
                platform: 'x',
                accountId: user.id,
                accountName: user.name || user.username || `@${user.username}`,
                accessToken: credentialPayload,
                connectedBy: session.user.id,
                isActive: true,
                tokenExpiresAt: null,
                config: { username: user.username },
            },
        })

        return NextResponse.json({
            success: true,
            platform: 'x',
            accountId: user.id,
            accountName: user.name || user.username,
            username: user.username,
        })
    } catch (err) {
        console.error('[X] Connection error:', err)
        return NextResponse.json({ error: 'Failed to connect X account' }, { status: 500 })
    }
}
