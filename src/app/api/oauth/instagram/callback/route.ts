import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/instagram/callback
// Instagram Business accounts are linked to Facebook Pages
// Flow: User token → me/accounts → check each page for instagram_business_account → get IG details
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    // Get client credentials — try instagram integration first, then fallback to facebook
    let clientId = ''
    let clientSecret = ''

    const igIntegration = await prisma.apiIntegration.findFirst({ where: { provider: 'instagram' } })
    if (igIntegration) {
        const igConfig = (igIntegration.config || {}) as Record<string, string>
        clientId = igConfig.instagramClientId || ''
        if (igIntegration.apiKeyEncrypted) {
            try { clientSecret = decrypt(igIntegration.apiKeyEncrypted) } catch { clientSecret = igIntegration.apiKeyEncrypted }
        }
    }

    // Fallback to Facebook App credentials
    if (!clientId || !clientSecret) {
        const fbIntegration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
        const fbConfig = (fbIntegration?.config || {}) as Record<string, string>
        if (!clientId) clientId = fbConfig.facebookClientId || process.env.FACEBOOK_CLIENT_ID || ''
        if (!clientSecret && fbIntegration?.apiKeyEncrypted) {
            try { clientSecret = decrypt(fbIntegration.apiKeyEncrypted) } catch { clientSecret = fbIntegration.apiKeyEncrypted }
        }
        if (!clientSecret) clientSecret = process.env.FACEBOOK_CLIENT_SECRET || ''
    }

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))
    }

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/instagram/callback`

    try {
        // Step 1: Exchange code for user access token
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
        tokenUrl.searchParams.set('client_id', clientId)
        tokenUrl.searchParams.set('client_secret', clientSecret)
        tokenUrl.searchParams.set('code', code)
        tokenUrl.searchParams.set('redirect_uri', redirectUri)

        const tokenRes = await fetch(tokenUrl.toString())
        if (!tokenRes.ok) {
            console.error('[Instagram OAuth] Token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const userAccessToken = tokens.access_token

        // Step 2: Get ALL Facebook pages with pagination
        let pages: Array<{ id: string; name: string; instagram_business_account?: { id: string } }> = []
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&limit=100&access_token=${userAccessToken}`

        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl)
            const pagesData: {
                data?: Array<{ id: string; name: string; instagram_business_account?: { id: string } }>
                paging?: { next?: string }
                error?: { message: string }
            } = await pagesRes.json()

            if (pagesData.error) {
                console.error('[Instagram OAuth] API error:', pagesData.error.message)
                break
            }
            if (pagesData.data) pages = pages.concat(pagesData.data)
            pagesUrl = pagesData.paging?.next || null
        }

        console.log(`[Instagram OAuth] Found ${pages.length} Facebook pages, checking for Instagram accounts...`)

        // Step 3: For each page with an Instagram Business account, get IG details
        interface IgAccountInfo {
            igId: string
            igUsername: string
            igName: string
            profilePic: string | null
            pageId: string
            pageName: string
        }
        const igAccounts: IgAccountInfo[] = []

        for (const page of pages) {
            const igAccount = page.instagram_business_account
            if (!igAccount) continue

            try {
                const igRes = await fetch(
                    `https://graph.facebook.com/v19.0/${igAccount.id}?fields=id,username,name,profile_picture_url,followers_count&access_token=${userAccessToken}`
                )
                const igData = await igRes.json()

                if (igData.error) {
                    console.error(`[Instagram OAuth]   ❌ Error fetching IG for ${page.name}:`, igData.error.message)
                    continue
                }

                igAccounts.push({
                    igId: igData.id || igAccount.id,
                    igUsername: igData.username || igData.name || page.name,
                    igName: igData.name || igData.username || page.name,
                    profilePic: igData.profile_picture_url || null,
                    pageId: page.id,
                    pageName: page.name,
                })
                console.log(`[Instagram OAuth]   ✅ Found: @${igData.username || igData.name} (${igData.id}) linked to page ${page.name}`)
            } catch (err) {
                console.error(`[Instagram OAuth]   ❌ Failed to fetch IG for ${page.name}:`, err)
            }
        }

        if (igAccounts.length === 0) {
            console.log('[Instagram OAuth] No Instagram Business accounts found')
            const errorUrl = `/dashboard/channels/${state.channelId}?tab=platforms&error=no_ig_accounts`
            return new NextResponse(
                `<!DOCTYPE html><html><head><title>No Instagram Accounts</title></head><body>
                <script>
                    if (window.opener) { window.opener.postMessage({ type: 'oauth-error', platform: 'instagram', error: 'no_ig_accounts' }, '*'); window.close(); }
                    else { window.location.href = '${errorUrl}'; }
                </script><p>No Instagram Business accounts found. Make sure your Instagram is connected to a Facebook Page as a Business or Creator account.</p></body></html>`,
                { headers: { 'Content-Type': 'text/html' } }
            )
        }

        // Check which accounts are already connected
        const existingPlatforms = await prisma.channelPlatform.findMany({
            where: { channelId: state.channelId, platform: 'instagram' },
            select: { accountId: true },
        })
        const connectedIds = new Set(existingPlatforms.map(p => p.accountId))

        // Encrypt payload for the confirm endpoint
        const { encrypt } = await import('@/lib/encryption')
        const payload = JSON.stringify({
            channelId: state.channelId,
            userId: state.userId,
            userAccessToken,
            accounts: igAccounts,
            timestamp: Date.now(),
        })
        const encryptedPayload = encrypt(payload)

        // Render account selection UI
        const accountCheckboxes = igAccounts.map(acc => {
            const isConnected = connectedIds.has(acc.igId)
            return `
                <label class="page-option ${isConnected ? 'connected' : ''}" data-id="${acc.igId}">
                    <input type="checkbox" name="accounts" value="${acc.igId}" ${isConnected ? 'checked' : ''}>
                    <div class="page-info">
                        ${acc.profilePic ? `<img src="${acc.profilePic}" class="avatar">` : '<span class="page-icon">📸</span>'}
                        <div>
                            <div class="page-name">@${acc.igUsername}</div>
                            <div class="page-id">via ${acc.pageName}</div>
                            ${isConnected ? '<span class="badge">Already connected</span>' : ''}
                        </div>
                    </div>
                </label>`
        }).join('')

        return new NextResponse(
            `<!DOCTYPE html>
<html><head><title>Select Instagram Accounts</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 480px; width: 100%; }
    h2 { font-size: 20px; margin-bottom: 4px; color: #fff; }
    .subtitle { color: #888; font-size: 13px; margin-bottom: 16px; }
    .pages-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 400px; overflow-y: auto; }
    .page-option { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #333; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .page-option:hover { border-color: #e1306c; background: rgba(225,48,108,0.05); }
    .page-option.selected { border-color: #e1306c; background: rgba(225,48,108,0.1); }
    .page-option input { width: 18px; height: 18px; accent-color: #e1306c; flex-shrink: 0; }
    .page-info { display: flex; align-items: center; gap: 10px; }
    .page-icon { font-size: 24px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .page-name { font-weight: 600; font-size: 14px; }
    .page-id { font-size: 11px; color: #666; }
    .badge { font-size: 10px; color: #e1306c; background: rgba(225,48,108,0.1); padding: 2px 6px; border-radius: 4px; }
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-primary { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #fff; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; opacity: 1; }
    .btn-secondary { background: #222; color: #ccc; border: 1px solid #333; }
    .btn-secondary:hover { background: #333; }
    .select-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .select-actions button { background: none; border: none; color: #e1306c; cursor: pointer; font-size: 12px; font-weight: 600; }
    .count { font-size: 12px; color: #888; margin-bottom: 12px; }
    .loading { display: none; }
    .loading.active { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 16px; height: 16px; border: 2px solid #333; border-top: 2px solid #e1306c; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>
<div class="container">
    <h2>📸 Select Instagram Accounts</h2>
    <p class="subtitle">Choose which accounts to connect to this channel</p>
    <div class="select-actions">
        <button onclick="selectAll()">Select All</button>
        <button onclick="selectNone()">Deselect All</button>
    </div>
    <div class="count" id="count">${igAccounts.length} accounts available</div>
    <form id="selectForm">
        <div class="pages-list">${accountCheckboxes}</div>
        <input type="hidden" name="payload" value="${encryptedPayload.replace(/"/g, '&quot;')}">
        <div class="actions">
            <button type="button" class="btn btn-secondary" onclick="cancelOAuth()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="connectBtn">Connect Selected</button>
        </div>
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <span style="font-size: 13px; color: #888;">Connecting accounts...</span>
        </div>
    </form>
</div>
<script>
    const form = document.getElementById('selectForm');
    const connectBtn = document.getElementById('connectBtn');
    const loading = document.getElementById('loading');
    const countEl = document.getElementById('count');

    function updateCount() {
        const checked = document.querySelectorAll('input[name="accounts"]:checked').length;
        const total = document.querySelectorAll('input[name="accounts"]').length;
        countEl.textContent = checked + ' of ' + total + ' accounts selected';
        connectBtn.disabled = checked === 0;
        document.querySelectorAll('.page-option').forEach(el => {
            el.classList.toggle('selected', el.querySelector('input').checked);
        });
    }

    document.querySelectorAll('input[name="accounts"]').forEach(cb => {
        cb.addEventListener('change', updateCount);
    });

    function selectAll() {
        document.querySelectorAll('input[name="accounts"]').forEach(cb => cb.checked = true);
        updateCount();
    }
    function selectNone() {
        document.querySelectorAll('input[name="accounts"]').forEach(cb => cb.checked = false);
        updateCount();
    }

    function cancelOAuth() {
        if (window.opener) {
            window.opener.postMessage({ type: 'oauth-cancel', platform: 'instagram' }, '*');
            window.close();
        } else {
            window.location.href = '/dashboard';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedIds = Array.from(document.querySelectorAll('input[name="accounts"]:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        connectBtn.disabled = true;
        connectBtn.style.display = 'none';
        loading.classList.add('active');

        try {
            const res = await fetch('/api/oauth/instagram/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: document.querySelector('input[name="payload"]').value,
                    selectedAccountIds: selectedIds,
                }),
            });
            const data = await res.json();

            if (data.success) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'oauth-success', platform: 'instagram' }, '*');
                    window.close();
                } else {
                    window.location.href = data.redirectUrl || '/dashboard';
                }
            } else {
                alert('Error: ' + (data.error || 'Failed to connect'));
                connectBtn.disabled = false;
                connectBtn.style.display = '';
                loading.classList.remove('active');
            }
        } catch (err) {
            alert('Failed to connect. Please try again.');
            connectBtn.disabled = false;
            connectBtn.style.display = '';
            loading.classList.remove('active');
        }
    });

    updateCount();
</script>
</body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('[Instagram OAuth] Callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
