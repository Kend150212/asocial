'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { OAUTH_PLATFORMS, CREDENTIAL_PLATFORMS } from '@/lib/platform-registry'

interface LinkInfo {
    channelId: string
    channelName: string
    channelDescription: string | null
    title: string
    hasPassword: boolean
}

type ConnectState = 'loading' | 'password' | 'ready' | 'error'

function ConnectPageInner() {
    const { token } = useParams<{ token: string }>()
    const searchParams = useSearchParams()

    const [state, setState] = useState<ConnectState>('loading')
    const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [password, setPassword] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
    const [credForm, setCredForm] = useState<string | null>(null)
    const [credValues, setCredValues] = useState<Record<string, string>>({})
    const [credLoading, setCredLoading] = useState(false)

    useEffect(() => {
        const connected = searchParams.get('connected')
        if (connected) {
            setConnectedPlatforms(prev => prev.includes(connected) ? prev : [...prev, connected])
        }
    }, [searchParams])

    useEffect(() => {
        if (!token) return
        fetch(`/api/connect/${token}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then(data => {
                if (data.error) { setErrorMsg(data.error); setState('error'); return }
                setLinkInfo(data)
                setState(data.hasPassword ? 'password' : 'ready')
            })
            .catch((err) => { setErrorMsg(err.message || 'Could not load link.'); setState('error') })
    }, [token])

    async function verifyPassword() {
        setVerifying(true)
        setErrorMsg('')
        try {
            const res = await fetch(`/api/connect/${token}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (data.ok) setState('ready')
            else setErrorMsg(data.error || 'Incorrect password')
        } catch {
            setErrorMsg('Network error')
        }
        setVerifying(false)
    }

    function openOAuth(platform: string) {
        window.location.href = `/api/oauth/${platform}?channelId=${linkInfo!.channelId}&easyToken=${token}`
    }

    async function connectCredential(platform: string) {
        const credPlatform = CREDENTIAL_PLATFORMS.find(p => p.key === platform)
        if (!credPlatform) return
        setCredLoading(true)
        const body: Record<string, string> = { channelId: linkInfo!.channelId, easyToken: token }
        for (const field of credPlatform.fields) body[field.id] = credValues[field.id] || ''
        try {
            const res = await fetch(credPlatform.guide.connectUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (data.ok || res.ok) {
                setConnectedPlatforms(prev => [...prev, platform])
                setCredForm(null)
                setCredValues({})
            } else {
                alert(data.error || 'Connection failed.')
            }
        } catch { alert('Network error') }
        setCredLoading(false)
    }

    /* ─── Platform icons (inline SVGs, no external dependency) ── */
    const pIcon = (key: string) => {
        const icons: Record<string, string> = {
            facebook: '📘', instagram: '📸', youtube: '▶️', tiktok: '🎵',
            linkedin: '💼', pinterest: '📌', threads: '🧵', gbp: '📍',
            x: '𝕏', bluesky: '🦋',
        }
        return icons[key] || '🔗'
    }

    // ─── LOADING ──────────────────────────────────
    if (state === 'loading') {
        return (
            <div className="ec-page">
                <div className="ec-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="ec-spinner" />
                    <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Loading secure link…</p>
                </div>
            </div>
        )
    }

    // ─── ERROR ──────────────────────────────────
    if (state === 'error') {
        return (
            <div className="ec-page">
                <div className="ec-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Link Unavailable</h2>
                    <p style={{ color: '#64748b', fontSize: 14 }}>{errorMsg}</p>
                </div>
            </div>
        )
    }

    // ─── PASSWORD ──────────────────────────────────
    if (state === 'password') {
        return (
            <div className="ec-page">
                <div className="ec-card" style={{ maxWidth: 400, padding: '40px 32px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{linkInfo?.title}</h2>
                        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>This link is password protected</p>
                    </div>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                            fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                        }}
                    />
                    {errorMsg && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errorMsg}</p>}
                    <button onClick={verifyPassword} disabled={verifying || !password} className="ec-btn-primary" style={{ width: '100%', marginTop: 16 }}>
                        {verifying ? 'Verifying…' : 'Continue'}
                    </button>
                </div>
            </div>
        )
    }

    // ─── READY ──────────────────────────────────
    const activePlatform = credForm ? CREDENTIAL_PLATFORMS.find(p => p.key === credForm) : null
    const allPlatforms = [...OAUTH_PLATFORMS.map(p => ({ ...p, type: 'oauth' as const })), ...CREDENTIAL_PLATFORMS.map(p => ({ ...p, type: 'credential' as const }))]

    return (
        <div className="ec-page">
            <div style={{ width: '100%', maxWidth: 580 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="ec-badge">
                        <span className="ec-dot" />
                        Secure Connection
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                        {linkInfo?.channelName}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 14 }}>
                        {linkInfo?.title} — Connect your social media accounts
                    </p>
                </div>

                {/* Main Card */}
                <div className="ec-card" style={{ padding: 0 }}>
                    <div style={{ padding: '24px 24px 20px' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Choose a platform</h2>
                        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>Click a platform below to connect your account securely.</p>

                        <div className="ec-grid">
                            {allPlatforms.map(platform => {
                                const isConnected = connectedPlatforms.includes(platform.key)
                                const isOpen = credForm === platform.key
                                return (
                                    <button
                                        key={platform.key}
                                        onClick={() => {
                                            if (isConnected) return
                                            if (platform.type === 'oauth') openOAuth(platform.key)
                                            else setCredForm(isOpen ? null : platform.key)
                                        }}
                                        disabled={isConnected}
                                        className={`ec-platform-btn ${isConnected ? 'ec-connected' : ''} ${isOpen ? 'ec-active' : ''}`}
                                    >
                                        <span className="ec-platform-icon" style={{ backgroundColor: `${platform.color}15`, color: platform.color }}>
                                            {pIcon(platform.key)}
                                        </span>
                                        <span className="ec-platform-info">
                                            <span className="ec-platform-name">{platform.label}</span>
                                            <span className="ec-platform-desc">{platform.description}</span>
                                        </span>
                                        {isConnected && <span className="ec-check">✓</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Credential Form */}
                    {activePlatform && !connectedPlatforms.includes(activePlatform.key) && (
                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 24px', background: '#fafbfc' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{activePlatform.guide.title}</h3>
                            <ol style={{ padding: 0, margin: '0 0 16px', listStyle: 'none' }}>
                                {activePlatform.guide.steps.map((step, i) => (
                                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                                        <span style={{ color: '#3b82f6', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                            {activePlatform.guide.warning && (
                                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', color: '#92400e', fontSize: 12, marginBottom: 16 }}>
                                    ⚠️ {activePlatform.guide.warning}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {activePlatform.fields.map(field => (
                                    <input
                                        key={field.id} type={field.type} placeholder={field.placeholder}
                                        value={credValues[field.id] || ''}
                                        onChange={e => setCredValues(v => ({ ...v, [field.id]: e.target.value }))}
                                        style={{
                                            width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                                            fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box',
                                        }}
                                    />
                                ))}
                                <button onClick={() => connectCredential(activePlatform.key)} disabled={credLoading} className="ec-btn-primary">
                                    {credLoading ? 'Connecting…' : `Connect ${activePlatform.label}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>🔒 Your credentials are encrypted and never shared.</span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="ec-card" style={{ marginTop: 20, padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>📖 How to connect</h3>
                    <ol style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {[
                            'Click the platform button above (e.g. Facebook, YouTube)',
                            "You'll be redirected to log in with your account",
                            'Authorize the permissions requested',
                            "You'll be brought back here with your account connected ✅",
                            "Repeat for each platform you'd like to connect",
                        ].map((step, i) => (
                            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                                <span style={{ color: '#3b82f6', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 24 }}>
                    Powered by NeeFlow · Secure social media management
                </p>
            </div>

            {/* ─── Inline Styles ── */}
            <style>{`
                .ec-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f0f4ff 0%, #e8f4f8 50%, #f5f0ff 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }
                .ec-card {
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04);
                    border: 1px solid #f1f5f9;
                    overflow: hidden;
                }
                .ec-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 100px;
                    padding: 6px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 16px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
                }
                .ec-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #22c55e; animation: ec-pulse 2s infinite;
                }
                @keyframes ec-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
                .ec-spinner {
                    width: 32px; height: 32px; border: 3px solid #e2e8f0;
                    border-top-color: #3b82f6; border-radius: 50%;
                    animation: ec-spin 0.8s linear infinite; margin: 0 auto;
                }
                @keyframes ec-spin { to { transform: rotate(360deg); } }
                .ec-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }
                @media (max-width: 480px) { .ec-grid { grid-template-columns: 1fr; } }
                .ec-platform-btn {
                    display: flex; align-items: center; gap: 12px;
                    padding: 12px 14px; border-radius: 12px;
                    border: 1.5px solid #e2e8f0; background: #fff;
                    text-align: left; cursor: pointer;
                    transition: all 0.15s ease;
                }
                .ec-platform-btn:hover:not(:disabled) {
                    border-color: #3b82f6; background: #f8faff;
                    box-shadow: 0 2px 8px rgba(59,130,246,0.08);
                    transform: translateY(-1px);
                }
                .ec-platform-btn.ec-connected {
                    border-color: #86efac; background: #f0fdf4; cursor: default;
                }
                .ec-platform-btn.ec-active {
                    border-color: #3b82f6; background: #eff6ff;
                }
                .ec-platform-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; flex-shrink: 0;
                }
                .ec-platform-info { display: flex; flex-direction: column; min-width: 0; }
                .ec-platform-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .ec-platform-desc { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .ec-check { margin-left: auto; color: #22c55e; font-weight: 700; font-size: 16px; flex-shrink: 0; }
                .ec-btn-primary {
                    padding: 10px 20px; border-radius: 10px; border: none;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: all 0.15s ease; box-shadow: 0 2px 8px rgba(37,99,235,0.25);
                }
                .ec-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
                .ec-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    )
}

export default function ConnectPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f4f8 50%, #f5f0ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        }>
            <ConnectPageInner />
        </Suspense>
    )
}
