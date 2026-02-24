'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { OAUTH_PLATFORMS, CREDENTIAL_PLATFORMS } from '@/lib/platform-registry'

/* ─── Platform SVG Icons ── */
const ICONS: Record<string, React.ReactNode> = {
    facebook: <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
    instagram: <svg viewBox="0 0 24 24" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>,
    youtube: <svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
    tiktok: <svg viewBox="0 0 24 24" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>,
    linkedin: <svg viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
    pinterest: <svg viewBox="0 0 24 24" fill="#E60023"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>,
    threads: <svg viewBox="0 0 24 24" fill="#000000"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.56c-1.096-3.98-3.832-5.988-8.136-5.974h-.013c-2.806.02-4.929.926-6.31 2.694-1.296 1.66-1.974 4.074-2.013 7.169.039 3.094.717 5.508 2.014 7.168 1.382 1.77 3.505 2.674 6.31 2.694h.013c2.447-.017 4.33-.604 5.6-1.745 1.358-1.222 2.065-2.979 2.1-5.222l.008-.018c-.033-.632-.185-1.163-.452-1.578-.396-.615-.98-1.004-1.636-1.089-.508-.065-1.021.012-1.389.211-.182.098-.333.228-.424.396.182.32.321.676.414 1.065.14.587.147 1.266.02 1.916-.232 1.186-.899 2.183-1.881 2.81-.893.571-1.99.83-3.176.748-1.523-.105-2.862-.733-3.769-1.768-.823-.94-1.276-2.163-1.312-3.54-.036-1.392.353-2.647 1.126-3.636.87-1.113 2.193-1.82 3.829-2.046.776-.107 1.534-.113 2.249-.02-.022-1.123-.177-2.023-.489-2.755-.397-.932-1.05-1.461-1.941-1.574-.505-.064-1.037.02-1.449.23-.255.13-.471.312-.639.538l-1.596-1.297c.34-.417.77-.756 1.276-1.006.774-.384 1.655-.56 2.542-.51 1.48.084 2.652.72 3.482 1.89.764 1.076 1.162 2.522 1.182 4.298l.003.188c1.116.115 2.098.588 2.804 1.395.828.946 1.24 2.198 1.194 3.627-.037 2.656-.912 4.824-2.602 6.445-1.619 1.553-3.937 2.35-6.887 2.37zM9.206 14.633c.013.557.17 1.032.468 1.372.366.418.918.65 1.601.674.711.024 1.379-.135 1.876-.447.436-.273.74-.672.858-1.123.076-.294.087-.624.031-.954-.086-.51-.389-.91-.82-1.09-.314-.13-.72-.182-1.14-.145-1.235.108-2.469.65-2.874 1.713z" /></svg>,
    gbp: <svg viewBox="0 0 24 24" fill="#4285F4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>,
    x: <svg viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    bluesky: <svg viewBox="0 0 600 530" fill="#0085ff"><path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-17.88 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.19-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.098-34.605-132.23 82.697-152.19-67.108 11.421-142.55-7.45-163.25-81.433C20.15 217.613 10 86.535 10 68.825c0-86.703 77.742-60.816 125.72-24.795z" /></svg>,
}

const PLATFORM_LABELS: Record<string, string> = {
    facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok',
    linkedin: 'LinkedIn', pinterest: 'Pinterest', threads: 'Threads', gbp: 'Google Business',
    x: 'X (Twitter)', bluesky: 'Bluesky',
}

interface LinkInfo {
    channelId: string
    channelName: string
    channelDescription: string | null
    title: string
    hasPassword: boolean
}

interface ConnectedAccount {
    id: string
    platform: string
    accountName: string
    accountId: string
    isActive: boolean
}

type ConnectState = 'loading' | 'password' | 'ready' | 'error'

function ConnectPageInner() {
    const { token } = useParams<{ token: string }>()
    const searchParams = useSearchParams()

    const [state, setState] = useState<ConnectState>('loading')
    const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
    const [credForm, setCredForm] = useState<string | null>(null)
    const [credValues, setCredValues] = useState<Record<string, string>>({})
    const [credLoading, setCredLoading] = useState(false)
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
    const [branding, setBranding] = useState<{ logoUrl: string; appName: string }>({ logoUrl: '/logo.png', appName: 'NeeFlow' })

    // Fetch branding
    useEffect(() => {
        fetch('/api/admin/branding')
            .then(r => r.json())
            .then(d => setBranding({ logoUrl: d.logoUrl || '/logo.png', appName: d.appName || 'NeeFlow' }))
            .catch(() => { })
    }, [])

    // Check query string for ?connected=platform
    useEffect(() => {
        const connected = searchParams.get('connected')
        if (connected) refreshPlatforms()
    }, [searchParams])

    // Load link info
    useEffect(() => {
        if (!token) return
        fetch(`/api/connect/${token}`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
            .then(data => {
                if (data.error) { setErrorMsg(data.error); setState('error'); return }
                setLinkInfo(data)
                setState(data.hasPassword ? 'password' : 'ready')
            })
            .catch(err => { setErrorMsg(err.message || 'Could not load link.'); setState('error') })
    }, [token])

    // Load connected platforms when ready
    useEffect(() => {
        if (state === 'ready') refreshPlatforms()
    }, [state])

    function refreshPlatforms() {
        fetch(`/api/connect/${token}/platforms`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setConnectedAccounts(data) })
            .catch(() => { })
    }

    async function verifyPassword() {
        setVerifying(true); setErrorMsg('')
        try {
            const res = await fetch(`/api/connect/${token}/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (data.ok) setState('ready')
            else setErrorMsg(data.error || 'Incorrect password')
        } catch { setErrorMsg('Network error') }
        setVerifying(false)
    }

    /* ─── Popup OAuth ── */
    const openOAuthPopup = useCallback((platform: string) => {
        if (!linkInfo) return
        setConnectingPlatform(platform)
        const url = `/api/oauth/${platform}?channelId=${linkInfo.channelId}&easyToken=${token}`
        const w = 500, h = 700
        const left = window.screenX + (window.outerWidth - w) / 2
        const top = window.screenY + (window.outerHeight - h) / 2
        const popup = window.open(url, `${platform}-oauth`, `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`)

        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'oauth-success' || e.data?.type === 'oauth-error') {
                window.removeEventListener('message', handler)
                setConnectingPlatform(null)
                if (e.data.type === 'oauth-success') refreshPlatforms()
            }
        }
        window.addEventListener('message', handler)

        const check = setInterval(() => {
            if (popup?.closed) {
                clearInterval(check)
                window.removeEventListener('message', handler)
                setConnectingPlatform(null)
                refreshPlatforms()
            }
        }, 1000)
    }, [linkInfo, token])

    async function connectCredential(platform: string) {
        const cp = CREDENTIAL_PLATFORMS.find(p => p.key === platform)
        if (!cp || !linkInfo) return
        setCredLoading(true)
        const body: Record<string, string> = { channelId: linkInfo.channelId, easyToken: token }
        for (const f of cp.fields) body[f.id] = credValues[f.id] || ''
        try {
            const res = await fetch(cp.guide.connectUrl, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (data.ok || res.ok) {
                setCredForm(null); setCredValues({})
                refreshPlatforms()
            } else alert(data.error || 'Connection failed.')
        } catch { alert('Network error') }
        setCredLoading(false)
    }

    // Group connected accounts by platform
    const grouped = connectedAccounts.reduce<Record<string, ConnectedAccount[]>>((acc, a) => {
        if (!acc[a.platform]) acc[a.platform] = []
        acc[a.platform].push(a)
        return acc
    }, {})
    const connectedPlatformKeys = new Set(connectedAccounts.map(a => a.platform))

    // ─── LOADING ──
    if (state === 'loading') return (
        <div className="ec-page">
            <div className="ec-center-card">
                <div className="ec-spinner" />
                <p className="ec-muted" style={{ marginTop: 16 }}>Loading…</p>
            </div>
            <style>{`
                .ec-page { min-height:100vh; background:linear-gradient(160deg,#f8fafc 0%,#eef2ff 40%,#f0f9ff 100%); display:flex; align-items:center; justify-content:center; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif; color:#1e293b; }
                .ec-center-card { background:#fff; border-radius:20px; padding:48px 32px; box-shadow:0 4px 24px rgba(0,0,0,0.06); border:1px solid #e2e8f0; text-align:center; max-width:420px; width:100%; }
                .ec-muted { color:#64748b; font-size:14px; line-height:1.5; }
                .ec-spinner { width:32px; height:32px; border:3px solid #e2e8f0; border-top-color:#3b82f6; border-radius:50%; animation:spin .7s linear infinite; margin:0 auto; }
                @keyframes spin { to { transform:rotate(360deg) } }
            `}</style>
        </div>
    )

    // ─── ERROR ──
    if (state === 'error') return (
        <div className="ec-page">
            <div className="ec-center-card">
                <div className="ec-logo-wrap"><Image src={branding.logoUrl} alt={branding.appName} width={48} height={48} /></div>
                <h2 className="ec-title">Link Unavailable</h2>
                <p className="ec-muted">{errorMsg}</p>
            </div>
            <style>{`
                .ec-page { min-height:100vh; background:linear-gradient(160deg,#f8fafc 0%,#eef2ff 40%,#f0f9ff 100%); display:flex; align-items:center; justify-content:center; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif; color:#1e293b; }
                .ec-center-card { background:#fff; border-radius:20px; padding:48px 32px; box-shadow:0 4px 24px rgba(0,0,0,0.06); border:1px solid #e2e8f0; text-align:center; max-width:420px; width:100%; display:flex; flex-direction:column; align-items:center; }
                .ec-logo-wrap { width:56px; height:56px; border-radius:14px; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,0.08); border:1px solid #e2e8f0; display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px; overflow:hidden; }
                .ec-title { font-size:20px; font-weight:700; color:#0f172a; margin-bottom:6px; }
                .ec-muted { color:#64748b; font-size:14px; line-height:1.5; }
            `}</style>
        </div>
    )

    // ─── PASSWORD ──
    if (state === 'password') return (
        <div className="ec-page">
            <div className="ec-pw-card">
                {/* Logo */}
                <div className="ec-pw-logo">
                    <Image src={branding.logoUrl} alt={branding.appName} width={44} height={44} />
                </div>

                {/* Lock icon */}
                <div className="ec-pw-lock">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: '#3b82f6' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>

                <h2 className="ec-pw-title">{linkInfo?.title || branding.appName}</h2>
                <p className="ec-pw-subtitle">This link is password protected.<br />Enter the password to continue.</p>

                <div className="ec-pw-form">
                    <div className="ec-pw-input-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: '#94a3b8', flexShrink: 0 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                            className="ec-pw-input"
                            autoFocus
                        />
                        <button type="button" className="ec-pw-eye" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="ec-pw-error">
                            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errorMsg}
                        </div>
                    )}

                    <button onClick={verifyPassword} disabled={verifying || !password} className="ec-pw-btn">
                        {verifying ? (
                            <><span className="ec-pw-btn-spinner" /> Verifying…</>
                        ) : (
                            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg> Continue</>
                        )}
                    </button>
                </div>

                <p className="ec-pw-footer">Powered by <strong>{branding.appName}</strong> · Secure connection</p>
            </div>

            <style>{`
                .ec-page {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 40%, #f0f9ff 100%);
                    display: flex; align-items: center; justify-content: center;
                    padding: 32px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
                    color: #1e293b;
                }
                .ec-pw-card {
                    background: #fff; border-radius: 24px; padding: 40px 36px 32px;
                    box-shadow: 0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03);
                    border: 1px solid #e2e8f0;
                    max-width: 400px; width: 100%;
                    display: flex; flex-direction: column; align-items: center;
                    text-align: center;
                }
                .ec-pw-logo {
                    width: 56px; height: 56px; border-radius: 16px; background: #fff;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 20px; overflow: hidden;
                }
                .ec-pw-lock {
                    width: 52px; height: 52px; border-radius: 50%;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 18px;
                }
                .ec-pw-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px; letter-spacing: -0.3px; }
                .ec-pw-subtitle { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
                .ec-pw-form { width: 100%; }
                .ec-pw-input-wrap {
                    display: flex; align-items: center; gap: 10px;
                    padding: 0 14px; border-radius: 12px;
                    border: 1.5px solid #e2e8f0; background: #f8fafc;
                    transition: all 0.2s;
                }
                .ec-pw-input-wrap:focus-within { border-color: #60a5fa; background: #fff; box-shadow: 0 0 0 3px rgba(96,165,250,0.15); }
                .ec-pw-input {
                    flex: 1; padding: 13px 0; border: none; background: transparent;
                    font-size: 14px; outline: none; color: #1e293b;
                }
                .ec-pw-input::placeholder { color: #94a3b8; }
                .ec-pw-eye {
                    background: none; border: none; cursor: pointer; padding: 4px;
                    color: #94a3b8; display: flex; transition: color 0.2s;
                }
                .ec-pw-eye:hover { color: #64748b; }
                .ec-pw-error {
                    display: flex; align-items: center; gap: 6px;
                    color: #dc2626; font-size: 13px; font-weight: 500;
                    margin-top: 10px; text-align: left;
                }
                .ec-pw-btn {
                    width: 100%; padding: 13px 20px; border-radius: 12px; border: none;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s; margin-top: 16px;
                    box-shadow: 0 2px 12px rgba(37,99,235,0.3);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .ec-pw-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
                .ec-pw-btn:active:not(:disabled) { transform: translateY(0); }
                .ec-pw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .ec-pw-btn-spinner {
                    width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3);
                    border-top-color: #fff; border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                .ec-pw-footer { color: #cbd5e1; font-size: 12px; margin-top: 24px; }
                .ec-pw-footer strong { color: #94a3b8; }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    )

    // ─── READY ──
    const activePlatform = credForm ? CREDENTIAL_PLATFORMS.find(p => p.key === credForm) : null
    const allPlatforms = [
        ...OAUTH_PLATFORMS.map(p => ({ ...p, type: 'oauth' as const })),
        ...CREDENTIAL_PLATFORMS.map(p => ({ ...p, type: 'credential' as const })),
    ]

    return (
        <div className="ec-page">
            <div className="ec-container">
                {/* Header */}
                <div className="ec-header">
                    <div className="ec-logo-wrap"><Image src={branding.logoUrl} alt={branding.appName} width={44} height={44} /></div>
                    <div className="ec-secure-badge"><span className="ec-dot" /> Secure Connection</div>
                    <h1 className="ec-channel-name">{linkInfo?.channelName}</h1>
                    <p className="ec-muted">{linkInfo?.title} — Connect your social media accounts</p>
                </div>

                {/* ─── Connected Accounts (like Dashboard) ── */}
                {connectedAccounts.length > 0 && (
                    <div className="ec-card" style={{ marginBottom: 16 }}>
                        <div style={{ padding: '18px 24px 0' }}>
                            <h2 className="ec-card-title">
                                <svg viewBox="0 0 20 20" fill="#22c55e" style={{ width: 18, height: 18, verticalAlign: -3, marginRight: 8 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Connected Accounts
                            </h2>
                            <p className="ec-muted" style={{ fontSize: 12 }}>{connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} connected</p>
                        </div>
                        <div style={{ padding: '12px 24px 20px' }}>
                            {Object.entries(grouped).map(([platform, accounts]) => (
                                <div key={platform} className="ec-connected-group">
                                    <div className="ec-connected-header">
                                        <span className="ec-connected-icon">{ICONS[platform]}</span>
                                        <span className="ec-connected-platform">{PLATFORM_LABELS[platform] || platform}</span>
                                        <span className="ec-connected-count">{accounts.length}</span>
                                    </div>
                                    {accounts.map(a => (
                                        <div key={a.id} className="ec-connected-item">
                                            <div>
                                                <div className="ec-connected-name">{a.accountName}</div>
                                                <div className="ec-connected-id">{a.accountId}</div>
                                            </div>
                                            <span className={`ec-status ${a.isActive ? 'ec-active-status' : ''}`}>
                                                {a.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Platform Grid ── */}
                <div className="ec-card">
                    <div className="ec-card-header">
                        <h2 className="ec-card-title">Connect a Platform</h2>
                        <p className="ec-muted" style={{ fontSize: 12 }}>Click to open a secure popup and connect your account.</p>
                    </div>
                    <div className="ec-grid">
                        {allPlatforms.map(p => {
                            const hasAccounts = connectedPlatformKeys.has(p.key)
                            const connecting = connectingPlatform === p.key
                            const isCredOpen = credForm === p.key
                            return (
                                <button key={p.key}
                                    onClick={() => {
                                        if (connecting) return
                                        if (p.type === 'oauth') openOAuthPopup(p.key)
                                        else setCredForm(isCredOpen ? null : p.key)
                                    }}
                                    className={`ec-platform ${hasAccounts ? 'ec-has-accounts' : ''} ${isCredOpen ? 'ec-active' : ''} ${connecting ? 'ec-connecting' : ''}`}
                                >
                                    <span className="ec-platform-icon">{ICONS[p.key]}</span>
                                    <span className="ec-platform-info">
                                        <span className="ec-platform-name">{p.label}</span>
                                        <span className="ec-platform-desc">
                                            {connecting ? 'Connecting…' : hasAccounts ? `${grouped[p.key]?.length || 0} connected` : p.description}
                                        </span>
                                    </span>
                                    {hasAccounts && <span className="ec-check">
                                        <svg viewBox="0 0 20 20" fill="#22c55e" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    </span>}
                                </button>
                            )
                        })}
                    </div>

                    {/* Credential Form */}
                    {activePlatform && (
                        <div className="ec-cred-form">
                            <h3 className="ec-cred-title">{activePlatform.guide.title}</h3>
                            <ol className="ec-cred-steps">
                                {activePlatform.guide.steps.map((s, i) => (
                                    <li key={i}><span className="ec-step-num">{i + 1}.</span> {s}</li>
                                ))}
                            </ol>
                            {activePlatform.guide.warning && <div className="ec-warning">⚠️ {activePlatform.guide.warning}</div>}
                            <div className="ec-cred-fields">
                                {activePlatform.fields.map(f => (
                                    <input key={f.id} type={f.type} placeholder={f.placeholder}
                                        value={credValues[f.id] || ''} onChange={e => setCredValues(v => ({ ...v, [f.id]: e.target.value }))}
                                        className="ec-input" />
                                ))}
                                <button onClick={() => connectCredential(activePlatform.key)} disabled={credLoading} className="ec-btn">
                                    {credLoading ? 'Connecting…' : `Connect ${activePlatform.label}`}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="ec-card-footer">
                        <svg viewBox="0 0 20 20" fill="#94a3b8" style={{ width: 14, height: 14, flexShrink: 0 }}><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        <span>Your credentials are encrypted and never shared.</span>
                    </div>
                </div>

                {/* How-to */}
                <div className="ec-card ec-howto">
                    <h3 className="ec-card-title" style={{ marginBottom: 12 }}>How to connect</h3>
                    <ol className="ec-howto-list">
                        <li>Click a platform above — a secure popup will open</li>
                        <li>Log in to your account on the platform</li>
                        <li>Authorize the requested permissions</li>
                        <li>The popup closes & your account appears above ✅</li>
                        <li>Repeat for each platform you want to connect</li>
                    </ol>
                </div>

                <p className="ec-footer-text">Powered by <strong>{branding.appName}</strong> · Secure social media management</p>
            </div>

            {/* ─── STYLES ── */}
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .ec-page {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 40%, #f0f9ff 100%);
                    display: flex; align-items: center; justify-content: center;
                    padding: 32px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
                    color: #1e293b;
                }
                .ec-container { width: 100%; max-width: 560px; }
                .ec-center-card {
                    background: #fff; border-radius: 20px; padding: 48px 32px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
                    text-align: center; max-width: 420px; width: 100%;
                }
                .ec-header { text-align: center; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; }
                .ec-logo-wrap {
                    width: 56px; height: 56px; border-radius: 14px; background: #fff;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
                    display: inline-flex; align-items: center; justify-content: center;
                    margin-bottom: 12px; overflow: hidden;
                }
                .ec-secure-badge {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px;
                    padding: 5px 14px; font-size: 12px; font-weight: 600; color: #15803d;
                    margin-bottom: 12px;
                }
                .ec-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
                @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.3 } }
                .ec-channel-name { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
                .ec-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
                .ec-muted { color: #64748b; font-size: 14px; line-height: 1.5; }
                .ec-error { color: #dc2626; font-size: 12px; margin-top: 6px; }

                .ec-card {
                    background: #fff; border-radius: 16px; overflow: hidden;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
                    border: 1px solid #e2e8f0; margin-bottom: 16px;
                }
                .ec-card-header { padding: 18px 24px 0; }
                .ec-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
                .ec-card-footer {
                    display: flex; align-items: center; gap: 8px;
                    padding: 14px 24px; border-top: 1px solid #f1f5f9;
                    font-size: 12px; color: #94a3b8;
                }

                /* ─── Connected Accounts ── */
                .ec-connected-group { margin-bottom: 8px; }
                .ec-connected-group:last-child { margin-bottom: 0; }
                .ec-connected-header {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px 12px; border-radius: 10px;
                    background: #f8fafc; margin-bottom: 4px;
                }
                .ec-connected-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; }
                .ec-connected-icon svg { width: 100%; height: 100%; }
                .ec-connected-platform { font-size: 13px; font-weight: 700; color: #0f172a; flex: 1; }
                .ec-connected-count {
                    background: #3b82f6; color: #fff; border-radius: 10px;
                    font-size: 11px; font-weight: 700; padding: 2px 8px; min-width: 20px; text-align: center;
                }
                .ec-connected-item {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 12px 8px 42px; border-bottom: 1px solid #f1f5f9;
                }
                .ec-connected-item:last-child { border-bottom: none; }
                .ec-connected-name { font-size: 13px; font-weight: 600; color: #1e293b; }
                .ec-connected-id { font-size: 11px; color: #94a3b8; font-family: monospace; }
                .ec-status {
                    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
                    background: #fef2f2; color: #dc2626;
                }
                .ec-active-status { background: #f0fdf4; color: #16a34a; }

                /* ─── Platform Grid ── */
                .ec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 24px; }
                @media (max-width: 480px) { .ec-grid { grid-template-columns: 1fr; } }

                .ec-platform {
                    display: flex; align-items: center; gap: 12px;
                    padding: 14px 14px; border-radius: 12px;
                    border: 1.5px solid #e2e8f0; background: #fff;
                    cursor: pointer; text-align: left; transition: all 0.2s ease;
                }
                .ec-platform:hover { border-color: #93c5fd; background: #f8faff; box-shadow: 0 2px 12px rgba(59,130,246,0.1); transform: translateY(-1px); }
                .ec-platform.ec-has-accounts { border-color: #86efac; background: #fafff9; }
                .ec-platform.ec-has-accounts:hover { border-color: #4ade80; background: #f0fdf4; }
                .ec-platform.ec-active { border-color: #60a5fa; background: #eff6ff; }
                .ec-platform.ec-connecting { border-color: #fbbf24; background: #fffbeb; pointer-events: none; }
                .ec-platform-icon { width: 28px; height: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
                .ec-platform-icon svg { width: 100%; height: 100%; }
                .ec-platform-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
                .ec-platform-name { font-size: 13px; font-weight: 600; color: #1e293b; }
                .ec-platform-desc { font-size: 11px; color: #94a3b8; margin-top: 1px; }
                .ec-check { flex-shrink: 0; margin-left: auto; }

                /* ─── Credential Form ── */
                .ec-cred-form { border-top: 1px solid #f1f5f9; padding: 20px 24px; background: #fafbfc; }
                .ec-cred-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
                .ec-cred-steps { list-style: none; padding: 0; margin: 0 0 16px; }
                .ec-cred-steps li { font-size: 12px; color: #64748b; margin-bottom: 4px; display: flex; gap: 6px; }
                .ec-step-num { color: #3b82f6; font-weight: 700; flex-shrink: 0; }
                .ec-warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 8px 12px; color: #92400e; font-size: 12px; margin-bottom: 16px; }
                .ec-cred-fields { display: flex; flex-direction: column; gap: 10px; }

                .ec-input {
                    width: 100%; padding: 10px 14px; border-radius: 10px;
                    border: 1.5px solid #e2e8f0; font-size: 14px; outline: none;
                    background: #fff; transition: border-color 0.15s; color: #1e293b;
                }
                .ec-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,0.15); }
                .ec-input::placeholder { color: #94a3b8; }

                .ec-btn {
                    width: 100%; padding: 11px 20px; border-radius: 10px; border: none;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s; margin-top: 8px;
                    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
                }
                .ec-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,0.35); }
                .ec-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .ec-howto { padding: 20px 24px; }
                .ec-howto-list { list-style: none; padding: 0; margin: 0; counter-reset: step; }
                .ec-howto-list li { counter-increment: step; font-size: 13px; color: #475569; margin-bottom: 8px; padding-left: 28px; position: relative; }
                .ec-howto-list li::before {
                    content: counter(step); position: absolute; left: 0; top: 0;
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #eff6ff; color: #3b82f6; font-weight: 700; font-size: 11px;
                    display: flex; align-items: center; justify-content: center;
                }
                .ec-footer-text { text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 20px; }
                .ec-footer-text strong { color: #94a3b8; }
                .ec-spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto; }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    )
}

export default function ConnectPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            </div>
        }>
            <ConnectPageInner />
        </Suspense>
    )
}
