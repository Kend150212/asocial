import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/facebook/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    const integration = await prisma.apiIntegration.findFirst({ where: { provider: 'facebook' } })
    const config = (integration?.config || {}) as Record<string, string>
    const clientId = config.facebookClientId || process.env.FACEBOOK_CLIENT_ID
    let clientSecret = process.env.FACEBOOK_CLIENT_SECRET || ''
    if (integration?.apiKeyEncrypted) {
        try { clientSecret = decrypt(integration.apiKeyEncrypted) } catch { clientSecret = integration.apiKeyEncrypted }
    }
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/dashboard?error=not_configured', req.nextUrl.origin))

    const host = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const redirectUri = `${host}/api/oauth/facebook/callback`

    try {
        // Exchange code for user access token
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
        tokenUrl.searchParams.set('client_id', clientId)
        tokenUrl.searchParams.set('client_secret', clientSecret)
        tokenUrl.searchParams.set('code', code)
        tokenUrl.searchParams.set('redirect_uri', redirectUri)

        const tokenRes = await fetch(tokenUrl.toString())
        if (!tokenRes.ok) {
            console.error('Facebook token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=token_failed`, req.nextUrl.origin))
        }
        const tokens = await tokenRes.json()
        const userAccessToken = tokens.access_token

        // Save user token for debugging
        if (integration) {
            await prisma.apiIntegration.update({
                where: { id: integration.id },
                data: { config: { ...config, facebookUserToken: userAccessToken } },
            })
        }

        // Get ALL user's Facebook pages (with pagination)
        let pages: Array<{ id: string; name: string; access_token: string }> = []
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${userAccessToken}`
        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl)
            const pagesData: { data?: Array<{ id: string; name: string; access_token: string }>; paging?: { next?: string }; error?: { message: string } } = await pagesRes.json()
            if (pagesData.error) break
            if (pagesData.data) pages = pages.concat(pagesData.data)
            pagesUrl = pagesData.paging?.next || null
        }
        console.log(`[Facebook OAuth] Found ${pages.length} pages`)

        if (pages.length === 0) {
            const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userAccessToken}`)
            const me = await meRes.json()
            pages = [{ id: me.id, name: me.name || 'My Profile', access_token: userAccessToken }]
        }

        // Check which pages are already connected to this channel
        const existingPlatforms = await prisma.channelPlatform.findMany({
            where: { channelId: state.channelId, platform: 'facebook' },
            select: { accountId: true },
        })
        const connectedIds = new Set(existingPlatforms.map(p => p.accountId))

        // Store data encrypted in a hidden field for the confirm endpoint
        const { encrypt } = await import('@/lib/encryption')
        const payload = JSON.stringify({
            channelId: state.channelId,
            userId: state.userId,
            pages: pages.map(p => ({ id: p.id, name: p.name, access_token: p.access_token })),
            timestamp: Date.now(),
        })
        const encryptedPayload = encrypt(payload)

        // Render page selection UI
        const pageCheckboxes = pages.map(p => {
            const isConnected = connectedIds.has(p.id)
            return `
                <label class="page-option ${isConnected ? 'connected' : ''}" data-id="${p.id}">
                    <input type="checkbox" name="pages" value="${p.id}" ${isConnected ? 'checked' : ''}>
                    <div class="page-info">
                        <span class="page-icon">📘</span>
                        <div>
                            <div class="page-name">${p.name}</div>
                            <div class="page-id">${p.id}</div>
                            ${isConnected ? '<span class="badge">Already connected</span>' : ''}
                        </div>
                    </div>
                </label>`
        }).join('')

        return new NextResponse(
            `<!DOCTYPE html>
<html><head><title>Select Facebook Pages</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 480px; width: 100%; }
    h2 { font-size: 20px; margin-bottom: 4px; color: #fff; }
    .subtitle { color: #888; font-size: 13px; margin-bottom: 16px; }
    .pages-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 400px; overflow-y: auto; }
    .page-option { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #333; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .page-option:hover { border-color: #1877f2; background: rgba(24,119,242,0.05); }
    .page-option.selected { border-color: #1877f2; background: rgba(24,119,242,0.1); }
    .page-option input { width: 18px; height: 18px; accent-color: #1877f2; flex-shrink: 0; }
    .page-info { display: flex; align-items: center; gap: 10px; }
    .page-icon { font-size: 24px; }
    .page-name { font-weight: 600; font-size: 14px; }
    .page-id { font-size: 11px; color: #666; }
    .badge { font-size: 10px; color: #1877f2; background: rgba(24,119,242,0.1); padding: 2px 6px; border-radius: 4px; }
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-primary { background: #1877f2; color: #fff; }
    .btn-primary:hover { background: #1565c0; }
    .btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; }
    .btn-secondary { background: #222; color: #ccc; border: 1px solid #333; }
    .btn-secondary:hover { background: #333; }
    .select-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .select-actions button { background: none; border: none; color: #1877f2; cursor: pointer; font-size: 12px; font-weight: 600; }
    .count { font-size: 12px; color: #888; margin-bottom: 12px; }
    .loading { display: none; }
    .loading.active { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 16px; height: 16px; border: 2px solid #333; border-top: 2px solid #1877f2; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>
<div class="container">
    <h2>📘 Select Facebook Pages</h2>
    <p class="subtitle">Choose which pages to connect to this channel</p>
    <div class="select-actions">
        <button onclick="selectAll()">Select All</button>
        <button onclick="selectNone()">Deselect All</button>
    </div>
    <div class="count" id="count">${pages.length} pages available</div>
    <form id="selectForm">
        <div class="pages-list">${pageCheckboxes}</div>
        <input type="hidden" name="payload" value="${encryptedPayload.replace(/"/g, '&quot;')}">
        <div class="actions">
            <button type="button" class="btn btn-secondary" onclick="cancelOAuth()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="connectBtn">Connect Selected</button>
        </div>
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <span style="font-size: 13px; color: #888;">Connecting pages...</span>
        </div>
    </form>
</div>
<script>
    const form = document.getElementById('selectForm');
    const connectBtn = document.getElementById('connectBtn');
    const loading = document.getElementById('loading');
    const countEl = document.getElementById('count');

    // Update selected count
    function updateCount() {
        const checked = document.querySelectorAll('input[name="pages"]:checked').length;
        const total = document.querySelectorAll('input[name="pages"]').length;
        countEl.textContent = checked + ' of ' + total + ' pages selected';
        connectBtn.disabled = checked === 0;
        // Update visual selection
        document.querySelectorAll('.page-option').forEach(el => {
            el.classList.toggle('selected', el.querySelector('input').checked);
        });
    }

    document.querySelectorAll('input[name="pages"]').forEach(cb => {
        cb.addEventListener('change', updateCount);
    });

    function selectAll() {
        document.querySelectorAll('input[name="pages"]').forEach(cb => cb.checked = true);
        updateCount();
    }
    function selectNone() {
        document.querySelectorAll('input[name="pages"]').forEach(cb => cb.checked = false);
        updateCount();
    }

    function cancelOAuth() {
        if (window.opener) {
            window.opener.postMessage({ type: 'oauth-cancel', platform: 'facebook' }, '*');
            window.close();
        } else {
            window.location.href = '/dashboard';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedIds = Array.from(document.querySelectorAll('input[name="pages"]:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        connectBtn.disabled = true;
        connectBtn.style.display = 'none';
        loading.classList.add('active');

        try {
            const res = await fetch('/api/oauth/facebook/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: document.querySelector('input[name="payload"]').value,
                    selectedPageIds: selectedIds,
                }),
            });
            const data = await res.json();

            if (data.success) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'oauth-success', platform: 'facebook' }, '*');
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
        console.error('Facebook OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
