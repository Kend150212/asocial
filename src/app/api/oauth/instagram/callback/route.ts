import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// GET /api/oauth/instagram/callback
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const stateParam = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    if (!code || !stateParam) return NextResponse.redirect(new URL('/dashboard?error=missing_params', req.nextUrl.origin))

    let state: { channelId: string; userId: string }
    try { state = JSON.parse(Buffer.from(stateParam, 'base64url').toString()) }
    catch { return NextResponse.redirect(new URL('/dashboard?error=invalid_state', req.nextUrl.origin)) }

    // Get client credentials
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
        // Exchange code for user access token
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

        // Get all Facebook pages with IG accounts
        let pages: Array<{ id: string; name: string; instagram_business_account?: { id: string } }> = []
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&limit=100&access_token=${userAccessToken}`

        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl)
            const pagesData: {
                data?: typeof pages
                paging?: { next?: string }
                error?: { message: string }
            } = await pagesRes.json()
            if (pagesData.error) break
            if (pagesData.data) pages = pages.concat(pagesData.data)
            pagesUrl = pagesData.paging?.next || null
        }

        console.log(`[Instagram OAuth] Found ${pages.length} Facebook pages, checking for IG accounts...`)

        // Get IG details for each page
        interface IgAccountInfo {
            igId: string
            igUsername: string
            igName: string
            profilePic: string | null
            followersCount: number
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
                if (igData.error) continue

                igAccounts.push({
                    igId: igData.id || igAccount.id,
                    igUsername: igData.username || igData.name || page.name,
                    igName: igData.name || igData.username || page.name,
                    profilePic: igData.profile_picture_url || null,
                    followersCount: igData.followers_count || 0,
                    pageId: page.id,
                    pageName: page.name,
                })
                console.log(`[Instagram OAuth] ✅ Found: @${igData.username} (${igData.id})`)
            } catch (err) {
                console.error(`[Instagram OAuth] ❌ Failed for ${page.name}:`, err)
            }
        }

        if (igAccounts.length === 0) {
            const errorUrl = `/dashboard/channels/${state.channelId}?tab=platforms&error=no_ig_accounts`
            return new NextResponse(
                `<!DOCTYPE html><html><head><title>No Instagram Accounts</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .container { max-width: 420px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 20px; color: #fff; margin-bottom: 8px; }
    p { color: #888; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 10px 24px; border: none; border-radius: 8px; background: #333; color: #ccc; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #444; }
</style></head><body>
<div class="container">
    <div class="icon">😔</div>
    <h2>No Instagram Business accounts found</h2>
    <p>Make sure your Instagram account is set to <strong>Business</strong> or <strong>Creator</strong> and linked to a Facebook Page.</p>
    <button class="btn" onclick="if(window.opener){window.opener.postMessage({type:'oauth-error',platform:'instagram'},'*');window.close()}else{window.location.href='${errorUrl}'}">Close</button>
</div></body></html>`,
                { headers: { 'Content-Type': 'text/html' } }
            )
        }

        // Check existing connected accounts
        const existingPlatforms = await prisma.channelPlatform.findMany({
            where: { channelId: state.channelId, platform: 'instagram' },
            select: { accountId: true },
        })
        const connectedIds = new Set(existingPlatforms.map(p => p.accountId))

        // Get channel name
        const channel = await prisma.channel.findUnique({
            where: { id: state.channelId },
            select: { name: true },
        })

        // Encrypt payload
        const { encrypt } = await import('@/lib/encryption')
        const payload = JSON.stringify({
            channelId: state.channelId,
            userId: state.userId,
            userAccessToken,
            accounts: igAccounts,
            timestamp: Date.now(),
        })
        const encryptedPayload = encrypt(payload)

        // Format followers count
        const formatFollowers = (n: number) => {
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
            return n.toString()
        }

        // Build account items
        const accountItems = igAccounts.map(acc => {
            const isConnected = connectedIds.has(acc.igId)
            const initial = acc.igUsername.charAt(0).toUpperCase()
            const colors = ['#E4405F', '#833AB4', '#C13584', '#F77737', '#FFDC80', '#405DE6', '#5B51D8', '#FD1D1D']
            const colorIdx = acc.igUsername.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length

            const avatarHtml = acc.profilePic
                ? `<img src="${acc.profilePic}" class="avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : ''
            const fallbackHtml = `<div class="avatar-fallback" style="background:${colors[colorIdx]};${acc.profilePic ? 'display:none' : 'display:flex'}">${initial}</div>`

            return `
            <label class="account-row${isConnected ? ' connected' : ''}" data-name="${acc.igUsername.toLowerCase()} ${acc.pageName.toLowerCase()}">
                <div class="account-left">
                    <input type="checkbox" name="accounts" value="${acc.igId}" ${isConnected ? 'checked' : ''}>
                    <div class="avatar-wrap">
                        ${avatarHtml}
                        ${fallbackHtml}
                        <svg class="platform-badge" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stop-color="#FED373"/><stop offset="25%" stop-color="#F15245"/><stop offset="50%" stop-color="#D92E7F"/><stop offset="75%" stop-color="#9B36B7"/><stop offset="100%" stop-color="#515ECF"/></linearGradient></defs><circle cx="12" cy="12" r="12" fill="url(#ig)"/><rect x="5" y="5" width="14" height="14" rx="4" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="16.5" cy="7.5" r="1" fill="#fff"/></svg>
                    </div>
                    <div class="account-info">
                        <div class="account-name">@${acc.igUsername}</div>
                        <div class="account-meta">
                            <span>${formatFollowers(acc.followersCount)} followers</span>
                            <span class="dot">·</span>
                            <span>via ${acc.pageName}</span>
                        </div>
                    </div>
                </div>
                <div class="account-right">
                    ${isConnected ? '<span class="status-badge added">Added</span>' : '<span class="status-badge available">Available</span>'}
                </div>
            </label>`
        }).join('')

        return new NextResponse(
            `<!DOCTYPE html>
<html><head><title>Select Instagram Accounts</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #111; color: #e5e5e5; min-height: 100vh; }

    .header { padding: 24px 28px 0; border-bottom: 1px solid #222; padding-bottom: 20px; }
    .header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
    .ig-logo { width: 32px; height: 32px; border-radius: 8px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #fff; }
    .header p { color: #888; font-size: 13px; margin-top: 2px; margin-left: 44px; }
    .channel-name { color: #E4405F; font-weight: 600; }

    .search-wrap { padding: 16px 28px; border-bottom: 1px solid #1a1a1a; }
    .search-box { position: relative; }
    .search-box input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #333; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .search-box input:focus { border-color: #E4405F; }
    .search-box input::placeholder { color: #555; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555; }

    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 28px; }
    .toolbar-left { display: flex; gap: 12px; }
    .toolbar-left button { background: none; border: none; color: #E4405F; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 0; }
    .toolbar-left button:hover { text-decoration: underline; }
    .counter { font-size: 12px; color: #888; background: #1a1a1a; padding: 4px 10px; border-radius: 12px; }

    .accounts-list { padding: 0 28px; overflow-y: auto; max-height: calc(100vh - 260px); }

    .account-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 4px; position: relative; }
    .account-row:hover { background: #1a1a1a; border-color: #252525; }
    .account-row.selected { background: rgba(228,64,95,0.06); border-color: rgba(228,64,95,0.3); }

    .account-left { display: flex; align-items: center; gap: 14px; }
    .account-left input[type="checkbox"] { display: none; }

    .avatar-wrap { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .avatar-fallback { width: 44px; height: 44px; border-radius: 50%; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
    .platform-badge { position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #111; }

    .account-info { display: flex; flex-direction: column; gap: 2px; }
    .account-name { font-weight: 600; font-size: 14px; color: #fff; }
    .account-meta { font-size: 11px; color: #666; display: flex; align-items: center; gap: 4px; }
    .dot { color: #444; }

    .account-right { flex-shrink: 0; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
    .status-badge.added { color: #E4405F; background: rgba(228,64,95,0.1); }
    .status-badge.available { color: #666; background: #1a1a1a; }

    .account-row.selected .status-badge.available { display: none; }
    .account-row.selected .status-badge.added { display: none; }
    .account-row.selected::after { content: '✓ Selected'; font-size: 11px; font-weight: 600; color: #E4405F; padding: 4px 10px; border-radius: 6px; background: rgba(228,64,95,0.1); position: absolute; right: 16px; }
    .account-row.connected.selected::after { content: '✓ Added'; }

    .footer { padding: 16px 28px; border-top: 1px solid #222; display: flex; gap: 10px; background: #111; position: sticky; bottom: 0; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-cancel { background: #1a1a1a; color: #999; border: 1px solid #333; }
    .btn-cancel:hover { background: #222; color: #ccc; }
    .btn-connect { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #fff; }
    .btn-connect:hover { opacity: 0.9; }
    .btn-connect:disabled { background: #222; color: #555; cursor: not-allowed; opacity: 1; }

    .loading { display: none; }
    .loading.active { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; }
    .spinner { width: 18px; height: 18px; border: 2px solid #333; border-top-color: #E4405F; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>

<div class="header">
    <div class="header-top">
        <svg class="ig-logo" viewBox="0 0 36 36" fill="none"><defs><linearGradient id="igh" x1="0" y1="36" x2="36" y2="0"><stop offset="0%" stop-color="#FED373"/><stop offset="25%" stop-color="#F15245"/><stop offset="50%" stop-color="#D92E7F"/><stop offset="75%" stop-color="#9B36B7"/><stop offset="100%" stop-color="#515ECF"/></linearGradient></defs><rect width="36" height="36" rx="8" fill="url(#igh)"/><rect x="7" y="7" width="22" height="22" rx="6" stroke="#fff" stroke-width="2" fill="none"/><circle cx="18" cy="18" r="5" stroke="#fff" stroke-width="2" fill="none"/><circle cx="25" cy="11" r="1.5" fill="#fff"/></svg>
        <h1>Which Instagram accounts do you want to add?</h1>
    </div>
    <p>Choose the accounts you'd like to connect to <span class="channel-name">${channel?.name || 'this channel'}</span></p>
</div>

<div class="search-wrap">
    <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="searchInput" placeholder="Search by username or page name">
    </div>
</div>

<div class="toolbar">
    <div class="toolbar-left">
        <button onclick="selectAll()">Select All</button>
        <button onclick="selectNone()">Deselect All</button>
    </div>
    <div class="counter" id="counter">${connectedIds.size} of ${igAccounts.length} selected</div>
</div>

<form id="selectForm">
    <div class="accounts-list" id="accountsList">${accountItems}</div>
    <input type="hidden" name="payload" value="${encryptedPayload.replace(/"/g, '&quot;')}">

    <div class="footer">
        <button type="button" class="btn btn-cancel" onclick="cancelOAuth()">Cancel</button>
        <button type="submit" class="btn btn-connect" id="connectBtn">Connect Selected</button>
    </div>

    <div class="loading" id="loading">
        <div class="spinner"></div>
        <span style="font-size:13px;color:#888">Connecting accounts...</span>
    </div>
</form>

<script>
    const form = document.getElementById('selectForm');
    const connectBtn = document.getElementById('connectBtn');
    const loading = document.getElementById('loading');
    const counterEl = document.getElementById('counter');
    const searchInput = document.getElementById('searchInput');

    function updateUI() {
        const checked = document.querySelectorAll('input[name="accounts"]:checked').length;
        const total = document.querySelectorAll('input[name="accounts"]').length;
        counterEl.textContent = checked + ' of ' + total + ' selected';
        connectBtn.disabled = checked === 0;
        document.querySelectorAll('.account-row').forEach(row => {
            const cb = row.querySelector('input[name="accounts"]');
            row.classList.toggle('selected', cb && cb.checked);
        });
    }

    document.querySelectorAll('.account-row').forEach(row => {
        row.addEventListener('click', () => {
            const cb = row.querySelector('input[name="accounts"]');
            if (cb) { cb.checked = !cb.checked; updateUI(); }
        });
    });

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
                const cb = row.querySelector('input[name="accounts"]');
                if (cb) cb.checked = true;
            }
        });
        updateUI();
    }

    function selectNone() {
        document.querySelectorAll('input[name="accounts"]').forEach(cb => cb.checked = false);
        updateUI();
    }

    function cancelOAuth() {
        if (window.opener) {
            window.opener.postMessage({ type: 'oauth-cancel', platform: 'instagram' }, '*');
            window.close();
        } else { window.location.href = '/dashboard'; }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedIds = Array.from(document.querySelectorAll('input[name="accounts"]:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        connectBtn.disabled = true;
        document.querySelector('.footer').style.display = 'none';
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
        console.error('[Instagram OAuth] Callback error:', err)
        return NextResponse.redirect(new URL(`/dashboard/channels/${state.channelId}?tab=platforms&error=oauth_failed`, req.nextUrl.origin))
    }
}
