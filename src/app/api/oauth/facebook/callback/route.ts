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

        // Save user token
        if (integration) {
            await prisma.apiIntegration.update({
                where: { id: integration.id },
                data: { config: { ...config, facebookUserToken: userAccessToken } },
            })
        }

        // Get ALL user's Facebook pages with picture
        let pages: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> = []
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture.type(large)&limit=100&access_token=${userAccessToken}`
        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl)
            const pagesData: { data?: typeof pages; paging?: { next?: string }; error?: { message: string } } = await pagesRes.json()
            if (pagesData.error) break
            if (pagesData.data) pages = pages.concat(pagesData.data)
            pagesUrl = pagesData.paging?.next || null
        }
        console.log(`[Facebook OAuth] Found ${pages.length} pages`)

        if (pages.length === 0) {
            const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture.type(large)&access_token=${userAccessToken}`)
            const me = await meRes.json()
            pages = [{ id: me.id, name: me.name || 'My Profile', access_token: userAccessToken, picture: me.picture }]
        }

        // Check which pages are already connected
        const existingPlatforms = await prisma.channelPlatform.findMany({
            where: { channelId: state.channelId, platform: 'facebook' },
            select: { accountId: true },
        })
        const connectedIds = new Set(existingPlatforms.map(p => p.accountId))

        // Get channel name for display
        const channel = await prisma.channel.findUnique({
            where: { id: state.channelId },
            select: { name: true },
        })

        // Encrypt payload
        const { encrypt } = await import('@/lib/encryption')
        const payload = JSON.stringify({
            channelId: state.channelId,
            userId: state.userId,
            pages: pages.map(p => ({ id: p.id, name: p.name, access_token: p.access_token })),
            timestamp: Date.now(),
        })
        const encryptedPayload = encrypt(payload)

        // Build page items HTML
        const pageItems = pages.map(p => {
            const isConnected = connectedIds.has(p.id)
            const pic = p.picture?.data?.url || ''
            const initial = p.name.charAt(0).toUpperCase()
            // Random pastel color from name hash
            const colors = ['#4267B2', '#E4405F', '#1DA1F2', '#0077B5', '#BD081C', '#FF6900', '#25D366', '#7289DA']
            const colorIdx = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
            const avatarHtml = pic
                ? `<img src="${pic}" class="avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : ''
            const fallbackHtml = `<div class="avatar-fallback" style="background:${colors[colorIdx]};${pic ? 'display:none' : 'display:flex'}">${initial}</div>`

            return `
            <label class="account-row${isConnected ? ' connected' : ''}" data-name="${p.name.toLowerCase()}">
                <div class="account-left">
                    <input type="checkbox" name="pages" value="${p.id}" ${isConnected ? 'checked' : ''}>
                    <div class="avatar-wrap">
                        ${avatarHtml}
                        ${fallbackHtml}
                        <svg class="platform-badge" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path d="M16.5 12.05h-2.7V18h-2.93v-5.95H9.5v-2.5h1.37V7.88c0-1.97.84-3.13 3.17-3.13h1.95v2.5h-1.22c-.91 0-.97.34-.97.97v1.33h2.22l-.52 2.5z" fill="#fff"/></svg>
                    </div>
                    <div class="account-info">
                        <div class="account-name">${p.name}</div>
                        <div class="account-id">Facebook Page</div>
                    </div>
                </div>
                <div class="account-right">
                    ${isConnected ? '<span class="status-badge added">Added</span>' : '<span class="status-badge available">Available</span>'}
                </div>
            </label>`
        }).join('')

        return new NextResponse(
            `<!DOCTYPE html>
<html><head><title>Select Facebook Pages</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #111; color: #e5e5e5; min-height: 100vh; }

    .header { padding: 24px 28px 0; border-bottom: 1px solid #222; padding-bottom: 20px; }
    .header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
    .fb-logo { width: 32px; height: 32px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #fff; }
    .header p { color: #888; font-size: 13px; margin-top: 2px; margin-left: 44px; }
    .channel-name { color: #1877F2; font-weight: 600; }

    .search-wrap { padding: 16px 28px; border-bottom: 1px solid #1a1a1a; }
    .search-box { position: relative; }
    .search-box input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #333; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .search-box input:focus { border-color: #1877F2; }
    .search-box input::placeholder { color: #555; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555; }

    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 28px; }
    .toolbar-left { display: flex; gap: 12px; }
    .toolbar-left button { background: none; border: none; color: #1877F2; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 0; }
    .toolbar-left button:hover { text-decoration: underline; }
    .counter { font-size: 12px; color: #888; background: #1a1a1a; padding: 4px 10px; border-radius: 12px; }

    .accounts-list { padding: 0 28px; overflow-y: auto; max-height: calc(100vh - 260px); }

    .account-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 4px; }
    .account-row:hover { background: #1a1a1a; border-color: #252525; }
    .account-row.selected { background: rgba(24,119,242,0.06); border-color: rgba(24,119,242,0.3); }

    .account-left { display: flex; align-items: center; gap: 14px; }
    .account-left input[type="checkbox"] { display: none; }

    .avatar-wrap { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .avatar-fallback { width: 44px; height: 44px; border-radius: 50%; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
    .platform-badge { position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #111; }

    .account-info { display: flex; flex-direction: column; gap: 2px; }
    .account-name { font-weight: 600; font-size: 14px; color: #fff; }
    .account-id { font-size: 11px; color: #666; }

    .account-right { flex-shrink: 0; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
    .status-badge.added { color: #1877F2; background: rgba(24,119,242,0.1); }
    .status-badge.available { color: #666; background: #1a1a1a; }

    /* Custom checkbox visual */
    .account-row .check-icon { display: none; }
    .account-row.selected .status-badge.available { display: none; }
    .account-row.selected .status-badge.added { display: none; }
    .account-row.selected::after { content: '✓ Selected'; font-size: 11px; font-weight: 600; color: #1877F2; padding: 4px 10px; border-radius: 6px; background: rgba(24,119,242,0.1); position: absolute; right: 16px; }
    .account-row { position: relative; }
    .account-row.connected.selected::after { content: '✓ Added'; }

    .footer { padding: 16px 28px; border-top: 1px solid #222; display: flex; gap: 10px; background: #111; position: sticky; bottom: 0; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-cancel { background: #1a1a1a; color: #999; border: 1px solid #333; }
    .btn-cancel:hover { background: #222; color: #ccc; }
    .btn-connect { background: #1877F2; color: #fff; }
    .btn-connect:hover { background: #1565c0; }
    .btn-connect:disabled { background: #222; color: #555; cursor: not-allowed; }

    .loading { display: none; }
    .loading.active { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; }
    .spinner { width: 18px; height: 18px; border: 2px solid #333; border-top-color: #1877F2; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>

<div class="header">
    <div class="header-top">
        <svg class="fb-logo" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="#1877F2"/><path d="M25 18.05h-3.9V24h-3.6v-5.95h-2.3v-3h2.3V13c0-2.56 1.1-4 4.08-4h2.51v3h-1.57c-1.17 0-1.25.44-1.25 1.25v1.75H25l-.67 3h-2.5" fill="#fff"/></svg>
        <h1>Which Facebook pages do you want to add?</h1>
    </div>
    <p>Choose the pages you'd like to connect to <span class="channel-name">${channel?.name || 'this channel'}</span></p>
</div>

<div class="search-wrap">
    <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="searchInput" placeholder="Search by name or keyword">
    </div>
</div>

<div class="toolbar">
    <div class="toolbar-left">
        <button onclick="selectAll()">Select All</button>
        <button onclick="selectNone()">Deselect All</button>
    </div>
    <div class="counter" id="counter">${connectedIds.size} of ${pages.length} selected</div>
</div>

<form id="selectForm">
    <div class="accounts-list" id="accountsList">${pageItems}</div>
    <input type="hidden" name="payload" value="${encryptedPayload.replace(/"/g, '&quot;')}">

    <div class="footer">
        <button type="button" class="btn btn-cancel" onclick="cancelOAuth()">Cancel</button>
        <button type="submit" class="btn btn-connect" id="connectBtn">Connect Selected</button>
    </div>

    <div class="loading" id="loading">
        <div class="spinner"></div>
        <span style="font-size:13px;color:#888">Connecting pages...</span>
    </div>
</form>

<script>
    const form = document.getElementById('selectForm');
    const connectBtn = document.getElementById('connectBtn');
    const loading = document.getElementById('loading');
    const counterEl = document.getElementById('counter');
    const searchInput = document.getElementById('searchInput');

    function updateUI() {
        const checked = document.querySelectorAll('input[name="pages"]:checked').length;
        const total = document.querySelectorAll('input[name="pages"]').length;
        counterEl.textContent = checked + ' of ' + total + ' selected';
        connectBtn.disabled = checked === 0;

        document.querySelectorAll('.account-row').forEach(row => {
            const cb = row.querySelector('input[name="pages"]');
            row.classList.toggle('selected', cb && cb.checked);
        });
    }

    // Toggle on row click
    document.querySelectorAll('.account-row').forEach(row => {
        row.addEventListener('click', () => {
            const cb = row.querySelector('input[name="pages"]');
            if (cb) { cb.checked = !cb.checked; updateUI(); }
        });
    });

    // Search filter
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.account-row').forEach(row => {
            const name = row.getAttribute('data-name') || '';
            row.style.display = name.includes(q) ? '' : 'none';
        });
    });

    function selectAll() {
        document.querySelectorAll('.account-row').forEach(row => {
            if (row.style.display !== 'none') {
                const cb = row.querySelector('input[name="pages"]');
                if (cb) cb.checked = true;
            }
        });
        updateUI();
    }

    function selectNone() {
        document.querySelectorAll('input[name="pages"]').forEach(cb => cb.checked = false);
        updateUI();
    }

    function cancelOAuth() {
        if (window.opener) {
            window.opener.postMessage({ type: 'oauth-cancel', platform: 'facebook' }, '*');
            window.close();
        } else { window.location.href = '/dashboard'; }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedIds = Array.from(document.querySelectorAll('input[name="pages"]:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        connectBtn.disabled = true;
        document.querySelector('.footer').style.display = 'none';
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
                } else { window.location.href = data.redirectUrl || '/dashboard'; }
            } else {
                alert('Error: ' + (data.error || 'Failed to connect'));
                document.querySelector('.footer').style.display = '';
                connectBtn.disabled = false;
                loading.classList.remove('active');
            }
        } catch (err) {
            alert('Failed to connect. Please try again.');
            document.querySelector('.footer').style.display = '';
            connectBtn.disabled = false;
            loading.classList.remove('active');
        }
    });

    updateUI();
</script>
</body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    } catch (err) {
        console.error('Facebook OAuth callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
