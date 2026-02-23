import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// ─── Token refresh helpers per platform ──────────────────────────────────────

async function refreshFacebookToken(accessToken: string): Promise<{ token: string; expiresIn?: number } | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const appId = config.appId || process.env.FACEBOOK_APP_ID || ''
    let appSecret = process.env.FACEBOOK_APP_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { appSecret = decrypt(integration.apiKeyEncrypted) } catch { appSecret = integration.apiKeyEncrypted }
    }
    if (!appId || !appSecret) return null

    const res = await fetch(
        `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ? { token: data.access_token, expiresIn: data.expires_in } : null
}

async function refreshGoogleToken(refreshToken: string, provider: string): Promise<{ token: string; expiresIn?: number } | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config[`${provider}ClientId`] || config.gbpClientId || process.env.GOOGLE_CLIENT_ID || ''
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return null

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ? { token: data.access_token, expiresIn: data.expires_in } : null
}

async function refreshPinterestToken(refreshToken: string): Promise<{ token: string; newRefresh?: string; expiresIn?: number } | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'pinterest' } })
    const config = (integration?.config || {}) as Record<string, string>
    if (config.pinterestSandbox === 'true') return null // sandbox tokens cannot be refreshed
    const clientId = config.pinterestClientId || process.env.PINTEREST_CLIENT_ID || ''
    let clientSecret = process.env.PINTEREST_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return null

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ? { token: data.access_token, newRefresh: data.refresh_token, expiresIn: data.expires_in } : null
}

async function refreshTikTokToken(refreshToken: string): Promise<{ token: string; newRefresh?: string; expiresIn?: number } | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'tiktok' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientKey = config.clientKey || process.env.TIKTOK_CLIENT_KEY || ''
    let clientSecret = process.env.TIKTOK_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientKey || !clientSecret) return null

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_key: clientKey,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.access_token
        ? { token: data.data.access_token, newRefresh: data.data.refresh_token, expiresIn: data.data.expires_in }
        : null
}

async function refreshLinkedInToken(refreshToken: string): Promise<{ token: string; newRefresh?: string; expiresIn?: number } | null> {
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'linkedin' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.clientId || process.env.LINKEDIN_CLIENT_ID || ''
    let clientSecret = process.env.LINKEDIN_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return null

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ? { token: data.access_token, newRefresh: data.refresh_token, expiresIn: data.expires_in } : null
}

async function refreshBlueskyToken(platformId: string, refreshJwt: string): Promise<{ token: string; newRefresh?: string } | null> {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshJwt}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Update DID in case it changed
    if (data.accessJwt) {
        await prisma.channelPlatform.update({
            where: { id: platformId },
            data: { accessToken: data.accessJwt, refreshToken: data.refreshJwt },
        })
    }
    return data.accessJwt ? { token: data.accessJwt, newRefresh: data.refreshJwt } : null
}

// ─── GET /api/admin/cron/refresh-tokens?secret=CRON_SECRET ───────────────────
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const REFRESH_WINDOW_DAYS = 7
    const threshold = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    // Find all platform tokens expiring within 7 days (or expired), with refresh tokens
    const platforms = await prisma.channelPlatform.findMany({
        where: {
            isActive: true,
            refreshToken: { not: null },
            tokenExpiresAt: { lt: threshold },
        },
    })

    const results = { refreshed: 0, failed: 0, skipped: 0, details: [] as string[] }

    for (const p of platforms) {
        const tag = `[${p.platform}] ${p.accountName}`

        try {
            let refreshed: { token: string; newRefresh?: string; expiresIn?: number } | null = null

            switch (p.platform) {
                case 'facebook':
                case 'instagram':
                    refreshed = await refreshFacebookToken(p.accessToken || '')
                    break
                case 'youtube':
                    if (p.refreshToken) refreshed = await refreshGoogleToken(p.refreshToken, 'youtube')
                    break
                case 'gbp':
                    if (p.refreshToken) refreshed = await refreshGoogleToken(p.refreshToken, 'gbp')
                    break
                case 'pinterest':
                    if (p.refreshToken) {
                        const r = await refreshPinterestToken(p.refreshToken)
                        if (r) refreshed = r
                    }
                    break
                case 'tiktok':
                    if (p.refreshToken) {
                        const r = await refreshTikTokToken(p.refreshToken)
                        if (r) refreshed = r
                    }
                    break
                case 'linkedin':
                    if (p.refreshToken) {
                        const r = await refreshLinkedInToken(p.refreshToken)
                        if (r) refreshed = r
                    }
                    break
                case 'bluesky':
                    if (p.refreshToken) {
                        const r = await refreshBlueskyToken(p.id, p.refreshToken)
                        if (r) refreshed = r
                    }
                    break
                default:
                    results.skipped++
                    results.details.push(`${tag}: skipped (platform not configured for refresh)`)
                    continue
            }

            if (refreshed) {
                await prisma.channelPlatform.update({
                    where: { id: p.id },
                    data: {
                        accessToken: refreshed.token,
                        ...(refreshed.newRefresh ? { refreshToken: refreshed.newRefresh } : {}),
                        ...(refreshed.expiresIn ? { tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000) } : {}),
                    },
                })
                results.refreshed++
                results.details.push(`${tag}: ✓ refreshed`)
            } else {
                results.failed++
                results.details.push(`${tag}: ✗ refresh failed`)
            }
        } catch (err) {
            results.failed++
            results.details.push(`${tag}: ✗ error — ${err instanceof Error ? err.message : String(err)}`)
        }
    }

    console.log('[Cron] Token refresh complete:', results)
    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        total: platforms.length,
        ...results,
    })
}
