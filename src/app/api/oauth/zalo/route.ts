import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import crypto from 'crypto'

// GET /api/oauth/zalo — Initiate Zalo OA OAuth flow
// Redirects the user to Zalo's permission page for OA authorization
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const channelId = req.nextUrl.searchParams.get('channelId')
    if (!channelId) {
        return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
    }

    // Get Zalo integration credentials from API Hub (admin-configured)
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'zalo' } })
    const config = (integration?.config || {}) as Record<string, string>
    const appId = config.zaloAppId || process.env.ZALO_APP_ID

    if (!appId) {
        return NextResponse.json({ error: 'Zalo OAuth is not configured. Please add Zalo App ID in API Hub (Admin → Integrations).' }, { status: 400 })
    }

    // Verify secret key exists
    let secretKey = process.env.ZALO_APP_SECRET || ''
    if (!secretKey && integration?.apiKeyEncrypted) {
        secretKey = decrypt(integration.apiKeyEncrypted)
    }
    if (!secretKey) {
        return NextResponse.json({ error: 'Zalo App Secret Key is not configured.' }, { status: 400 })
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/zalo/callback`

    // Generate a random state for CSRF protection, include channelId + userId
    const statePayload = {
        channelId,
        userId: session.user.id,
        nonce: crypto.randomBytes(16).toString('hex'),
    }
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url')

    // Zalo OA OAuth v4 permission URL
    const authUrl = new URL('https://oauth.zaloapp.com/v4/oa/permission')
    authUrl.searchParams.set('app_id', appId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
}
