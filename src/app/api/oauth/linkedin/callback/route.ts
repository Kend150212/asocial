import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/linkedin/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'linkedin' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.linkedinClientId || process.env.LINKEDIN_CLIENT_ID
    let clientSecret = process.env.LINKEDIN_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/linkedin/callback`

    try {
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        })
        if (!tokenRes.ok) {
            console.error('LinkedIn token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const accessToken = tokens.access_token
        const expiresIn = tokens.expires_in

        // Get LinkedIn profile using OpenID userinfo
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        let profileName = 'LinkedIn Profile'
        let profileId = 'unknown'
        if (profileRes.ok) {
            const profile = await profileRes.json()
            profileName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profileName
            profileId = profile.sub || profileId
        }

        // Save personal profile
        await prisma.channelPlatform.upsert({
            where: {
                channelId_platform_accountId: {
                    channelId: state.channelId,
                    platform: 'linkedin',
                    accountId: profileId,
                },
            },
            update: { accountName: `👤 ${profileName}`, accessToken, tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null, connectedBy: state.userId, isActive: true },
            create: {
                channelId: state.channelId, platform: 'linkedin', accountId: profileId, accountName: `👤 ${profileName}`,
                accessToken, tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                connectedBy: state.userId, isActive: true, config: { source: 'oauth', type: 'person' },
            },
        })

        // Fetch organizations the user manages (Company Pages) — only if org scopes were requested
        let importedCount = 1 // personal profile already imported
        const orgEnabled = config.linkedinOrgEnabled === 'true'
        if (orgEnabled) try {
            const orgsRes = await fetch('https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202602',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            })

            if (orgsRes.ok) {
                const orgsData = await orgsRes.json()
                const elements = orgsData.elements || []
                console.log(`[LinkedIn] Found ${elements.length} managed organization(s)`)

                for (const el of elements) {
                    const org = el['organization~']
                    if (!org) continue
                    const orgId = String(org.id)
                    const orgName = org.localizedName || org.vanityName || `Org ${orgId}`

                    await prisma.channelPlatform.upsert({
                        where: {
                            channelId_platform_accountId: {
                                channelId: state.channelId,
                                platform: 'linkedin',
                                accountId: `org_${orgId}`,
                            },
                        },
                        update: {
                            accountName: `🏢 ${orgName}`,
                            accessToken,
                            tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                            connectedBy: state.userId,
                            isActive: true,
                        },
                        create: {
                            channelId: state.channelId,
                            platform: 'linkedin',
                            accountId: `org_${orgId}`,
                            accountName: `🏢 ${orgName}`,
                            accessToken,
                            tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                            connectedBy: state.userId,
                            isActive: true,
                            config: { source: 'oauth', type: 'organization', orgId },
                        },
                    })
                    importedCount++
                    console.log(`[LinkedIn] Imported organization: ${orgName} (${orgId})`)
                }
            } else {
                console.warn('[LinkedIn] Failed to fetch organizations:', await orgsRes.text())
            }
        } catch (orgErr) {
            console.warn('[LinkedIn] Error fetching organizations:', orgErr)
        }

        const successUrl = `/dashboard/channels/${state.channelId}?tab=platforms&oauth=linkedin&imported=${importedCount}`
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>LinkedIn Connected</title></head><body>
            <script>
                if (window.opener) { window.opener.postMessage({ type: 'oauth-success', platform: 'linkedin' }, '*'); window.close(); }
                else { window.location.href = '${successUrl}'; }
            </script><p>LinkedIn connected! ${importedCount} account(s) imported. Redirecting...</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('LinkedIn OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
