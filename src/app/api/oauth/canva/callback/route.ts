import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt, encrypt } from '@/lib/encryption'

// GET /api/oauth/canva/callback — Handle Canva OAuth callback with PKCE
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin

    if (!code || !stateParam) {
        return NextResponse.redirect(new URL('/admin/integrations?canva=error&message=Missing+code+or+state', host))
    }

    let state: { channelId: string; userId: string; codeVerifier: string; returnUrl?: string }
    try {
        state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    } catch {
        return NextResponse.redirect(new URL('/admin/integrations?canva=error&message=Invalid+state', host))
    }

    // Get Canva integration credentials from API Hub
    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'canva' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.canvaClientId || process.env.CANVA_CLIENT_ID || ''
    let clientSecret = process.env.CANVA_CLIENT_SECRET || ''
    if (!clientSecret && integration?.apiKeyEncrypted) {
        clientSecret = decrypt(integration.apiKeyEncrypted)
    }

    const redirectUri = `${host}/api/oauth/canva/callback`

    // Exchange authorization code for access token (Basic Auth + PKCE code_verifier)
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: state.codeVerifier,
        }),
    })

    if (!tokenRes.ok) {
        const errorText = await tokenRes.text()
        console.error('Canva token exchange failed:', errorText)
        return NextResponse.redirect(new URL('/admin/integrations?canva=error&message=Token+exchange+failed', host))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token

    // Get user profile from Canva
    let displayName = 'Canva User'
    try {
        const profileRes = await fetch('https://api.canva.com/rest/v1/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (profileRes.ok) {
            const profile = await profileRes.json()
            displayName = profile.display_name || 'Canva User'
        }
    } catch (e) {
        console.error('Failed to fetch Canva profile:', e)
    }

    // Store Canva connection per-user (each user has their own Canva account)
    if (integration) {
        const existingConfig = (integration.config || {}) as Record<string, string | null>
        const updatedConfig = {
            ...existingConfig,
            [`canvaToken_${state.userId}`]: encrypt(accessToken),
            [`canvaRefresh_${state.userId}`]: refreshToken ? encrypt(refreshToken) : null,
            [`canvaUser_${state.userId}`]: displayName,
            [`canvaConnectedAt_${state.userId}`]: new Date().toISOString(),
        }
        await prisma.apiIntegration.update({
            where: { id: integration.id },
            data: {
                status: 'ACTIVE',
                isActive: true,
                config: updatedConfig,
            },
        })
    }

    // Redirect to returnUrl (compose page or integrations page)
    const returnUrl = state.returnUrl || '/admin/integrations'
    const redirectTo = new URL(returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`, host)
    redirectTo.searchParams.set('canva', 'connected')
    return NextResponse.redirect(redirectTo)
}
