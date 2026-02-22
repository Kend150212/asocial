'use client'

import { useState, useEffect, useCallback } from 'react'

/* ──────────────── Types ──────────────── */

interface SystemStatus {
    isComplete: boolean
    domain: string
    nodeVersion: string
    ffmpegAvailable: boolean
    dbConnected: boolean
    redisConnected: boolean
    hasAdmin: boolean
}

interface GeneratedKeys {
    authSecret: string
    encryptionKey: string
    fbWebhookVerifyToken: string
    cronSecret: string
    workerSecret: string
}

interface SetupResult {
    success: boolean
    steps: { step: string; status: string; error?: string }[]
    message?: string
    error?: string
}

/* ──────────────── Platform Data ──────────────── */

const PLATFORMS = [
    {
        id: 'facebook',
        name: 'Facebook + Messenger',
        icon: '🔵',
        console: 'https://developers.facebook.com/apps',
        consoleName: 'developers.facebook.com',
        callbacks: (d: string) => [`${d}/api/oauth/facebook/callback`],
        webhook: (d: string) => ({
            url: `${d}/api/webhooks/facebook`,
            fields: 'messages, messaging_postbacks, feed',
            product: 'Page',
            note: '',
        }),
        permissions: 'pages_show_list, pages_manage_metadata, pages_read_engagement, pages_messaging, pages_manage_posts, pages_read_user_content, public_profile',
        steps: [
            'Go to developers.facebook.com → Create App → "Business" type',
            'Add products: Facebook Login, Webhooks, Messenger',
            'Facebook Login → Settings → paste OAuth callback URL',
            'Webhooks → Product: "Page" → paste Callback URL + Verify Token → "Verify and Save"',
            'Subscribe fields: messages ✅ messaging_postbacks ✅ feed ✅',
        ],
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        console: 'https://developers.facebook.com/apps',
        consoleName: 'Same Facebook App',
        callbacks: (d: string) => [`${d}/api/oauth/instagram/callback`],
        webhook: (d: string) => ({
            url: `${d}/api/webhooks/facebook`,
            fields: 'comments, messages',
            product: 'Instagram',
            note: 'Same webhook endpoint as Facebook!',
        }),
        permissions: 'instagram_basic, instagram_manage_comments, instagram_manage_messages, instagram_content_publish',
        steps: [
            'Same Facebook App → add product: Instagram',
            'Instagram → Webhooks → paste Callback URL + Verify Token',
            'Subscribe: comments ✅ messages ✅',
        ],
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: '🔴',
        console: 'https://console.cloud.google.com',
        consoleName: 'Google Cloud Console',
        callbacks: (d: string) => [`${d}/api/oauth/youtube/callback`],
        permissions: 'youtube.readonly, youtube.upload, youtube.force-ssl',
        steps: [
            'Google Cloud Console → Create project → Enable YouTube Data API v3',
            'Credentials → Create OAuth Client ID → Web Application',
            'Authorized redirect URI → paste callback URL',
            'Copy Client ID + Client Secret → NeeFlow API Hub',
        ],
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: '🎵',
        console: 'https://developers.tiktok.com',
        consoleName: 'TikTok Developer Portal',
        callbacks: (d: string) => [`${d}/api/oauth/tiktok/callback`],
        permissions: 'user.info.basic, video.upload, video.publish, user.info.stats',
        steps: [
            'TikTok Developer Portal → Create App',
            'Add Login Kit + Content Posting API',
            'Redirect URI → paste callback URL',
            'Copy Client Key + Client Secret → NeeFlow API Hub',
        ],
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '🔗',
        console: 'https://www.linkedin.com/developers/',
        consoleName: 'LinkedIn Developer Portal',
        callbacks: (d: string) => [`${d}/api/oauth/linkedin/callback`],
        steps: [
            'LinkedIn Developer Portal → Create App',
            'Auth tab → Authorized redirect URL → paste callback URL',
            'Request products: Share on LinkedIn, Sign In with LinkedIn v2',
        ],
    },
    {
        id: 'pinterest',
        name: 'Pinterest',
        icon: '📌',
        console: 'https://developers.pinterest.com',
        consoleName: 'Pinterest Developer Portal',
        callbacks: (d: string) => [`${d}/api/oauth/pinterest/callback`],
    },
    {
        id: 'x',
        name: 'X (Twitter)',
        icon: '𝕏',
        console: 'https://developer.x.com',
        consoleName: 'X Developer Portal',
        callbacks: (d: string) => [`${d}/api/oauth/x/callback`],
        steps: [
            'X Developer Portal → Create Project + App',
            'User authentication settings → OAuth 2.0 → paste callback URL',
            'Required permissions: Read + Write',
        ],
    },
    {
        id: 'gdrive',
        name: 'Google Drive',
        icon: '📁',
        console: 'https://console.cloud.google.com',
        consoleName: 'Same Google Cloud project',
        callbacks: (d: string) => [
            `${d}/api/admin/gdrive/callback`,
            `${d}/api/user/gdrive/callback`,
        ],
        steps: [
            'Same Google Cloud project → Enable Google Drive API',
            'Add both redirect URIs to OAuth client',
        ],
    },
]

/* ──────────────── Main Component ──────────────── */

export default function SetupWizardPage() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<SystemStatus | null>(null)
    const [keys, setKeys] = useState<GeneratedKeys | null>(null)
    const [result, setResult] = useState<SetupResult | null>(null)
    const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
    const [copied, setCopied] = useState('')

    // Step 1 fields
    const [dbHost, setDbHost] = useState('localhost')
    const [dbPort, setDbPort] = useState('5432')
    const [dbName, setDbName] = useState('asocial')
    const [dbUser, setDbUser] = useState('asocial')
    const [dbPassword, setDbPassword] = useState('')
    const [redisUrl, setRedisUrl] = useState('redis://localhost:6379')
    const [domain, setDomain] = useState('')
    const [dbTestResult, setDbTestResult] = useState<{ database?: { connected: boolean; error?: string }; redis?: { connected: boolean; error?: string } } | null>(null)

    // Step 2 fields
    const [adminName, setAdminName] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [adminPassword, setAdminPassword] = useState('')

    // Load initial status
    useEffect(() => {
        setDomain(window.location.origin)
        fetch('/api/setup/status')
            .then(r => r.json())
            .then(setStatus)
            .catch(console.error)
    }, [])

    // ── Test DB Connection ─────────────────────────────────
    const testConnection = async () => {
        setLoading(true)
        setDbTestResult(null)
        try {
            const res = await fetch('/api/setup/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dbHost, dbPort, dbName, dbUser, dbPassword, redisUrl }),
            })
            const data = await res.json()
            setDbTestResult(data.results)
        } catch (err) {
            console.error('Test connection failed:', err)
        }
        setLoading(false)
    }

    // ── Generate Keys ──────────────────────────────────────
    const generateKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/setup/initialize')
            const data = await res.json()
            setKeys(data)
        } catch (err) {
            console.error('Generate keys failed:', err)
        }
    }, [])

    useEffect(() => {
        if (step === 3 && !keys) generateKeys()
    }, [step, keys, generateKeys])

    // ── Copy to Clipboard ──────────────────────────────────
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopied(label)
        setTimeout(() => setCopied(''), 2000)
    }

    // ── Build .env block ───────────────────────────────────
    const buildEnvBlock = () => {
        if (!keys) return ''
        const dbUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=public`
        return [
            `DATABASE_URL="${dbUrl}"`,
            `AUTH_SECRET="${keys.authSecret}"`,
            `NEXTAUTH_URL="${domain}"`,
            `REDIS_URL="${redisUrl}"`,
            `ENCRYPTION_KEY="${keys.encryptionKey}"`,
            `CRON_SECRET="${keys.cronSecret}"`,
            `WORKER_SECRET="${keys.workerSecret}"`,
            `FB_WEBHOOK_VERIFY_TOKEN="${keys.fbWebhookVerifyToken}"`,
        ].join('\n')
    }

    // ── Finish Setup ───────────────────────────────────────
    const finishSetup = async () => {
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/setup/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dbHost, dbPort, dbName, dbUser, dbPassword, redisUrl, domain,
                    adminName, adminEmail, adminPassword,
                    ...(keys || {}),
                }),
            })
            const data: SetupResult = await res.json()
            setResult(data)
            if (data.success) {
                setTimeout(() => { window.location.href = '/login' }, 3000)
            }
        } catch (err) {
            setResult({ success: false, steps: [], error: String(err) })
        }
        setLoading(false)
    }

    // ── Step Validation ────────────────────────────────────
    const canProceed = () => {
        switch (step) {
            case 1: return dbTestResult?.database?.connected && dbTestResult?.redis?.connected
            case 2: return adminName && adminEmail && adminPassword && adminPassword.length >= 6
            case 3: return !!keys
            case 4: return true
            default: return true
        }
    }

    /* ──────────────── Render ──────────────── */

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    NeeFlow Setup Wizard
                </h1>
                <p className="text-slate-400 mt-2">Configure your instance in a few easy steps</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                            ${s === step ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30' : ''}
                            ${s < step ? 'bg-emerald-500 text-white' : ''}
                            ${s > step ? 'bg-slate-700 text-slate-400' : ''}
                        `}>
                            {s < step ? '✓' : s}
                        </div>
                        {s < 5 && <div className={`w-8 h-0.5 ${s < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="w-full max-w-2xl bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">

                {/* STEP 1: Database & Domain */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                🗄️ Database & Server
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Configure your PostgreSQL database and Redis connection</p>
                        </div>

                        {/* PostgreSQL */}
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                PostgreSQL Connection
                                {dbTestResult?.database?.connected && <span className="text-emerald-400">✅</span>}
                                {dbTestResult?.database?.connected === false && <span className="text-red-400">❌</span>}
                            </legend>
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Host" value={dbHost} onChange={setDbHost} placeholder="localhost" />
                                <InputField label="Port" value={dbPort} onChange={setDbPort} placeholder="5432" />
                                <InputField label="Database" value={dbName} onChange={setDbName} placeholder="asocial" />
                                <InputField label="Username" value={dbUser} onChange={setDbUser} placeholder="asocial" />
                            </div>
                            <InputField label="Password" value={dbPassword} onChange={setDbPassword} type="password" placeholder="Enter database password" />
                            {dbTestResult?.database?.error && (
                                <p className="text-red-400 text-xs mt-1">❌ {dbTestResult.database.error}</p>
                            )}
                        </fieldset>

                        {/* Redis */}
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                Redis
                                {dbTestResult?.redis?.connected && <span className="text-emerald-400">✅</span>}
                                {dbTestResult?.redis?.connected === false && <span className="text-red-400">❌</span>}
                            </legend>
                            <InputField label="Redis URL" value={redisUrl} onChange={setRedisUrl} placeholder="redis://localhost:6379" />
                            {dbTestResult?.redis?.error && (
                                <p className="text-red-400 text-xs mt-1">❌ {dbTestResult.redis.error}</p>
                            )}
                        </fieldset>

                        {/* Domain */}
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-slate-300">Domain (auto-detected)</legend>
                            <InputField label="App URL" value={domain} onChange={setDomain} placeholder="https://app.example.com" />
                            <p className="text-slate-500 text-xs">This is used for OAuth callback URLs and webhook configuration</p>
                        </fieldset>

                        {/* System Info */}
                        {status && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2">
                                    <span>{status.nodeVersion ? '✅' : '❌'}</span>
                                    <span>Node.js {status.nodeVersion}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2">
                                    <span>{status.ffmpegAvailable ? '✅' : '⚠️'}</span>
                                    <span>FFmpeg {status.ffmpegAvailable ? 'installed' : '(optional)'}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={testConnection}
                            disabled={loading || !dbPassword}
                            className="w-full py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Spinner /> : '🔌'} Test Connection
                        </button>
                    </div>
                )}

                {/* STEP 2: Admin Account */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                👤 Admin Account
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Create the first admin user</p>
                        </div>
                        <InputField label="Full Name" value={adminName} onChange={setAdminName} placeholder="Your name" />
                        <InputField label="Email" value={adminEmail} onChange={setAdminEmail} placeholder="admin@example.com" type="email" />
                        <InputField label="Password" value={adminPassword} onChange={setAdminPassword} placeholder="Minimum 6 characters" type="password" />
                        {adminPassword && adminPassword.length < 6 && (
                            <p className="text-amber-400 text-xs">Password must be at least 6 characters</p>
                        )}
                    </div>
                )}

                {/* STEP 3: Security Keys */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                🔐 Security Keys
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Auto-generated encryption keys for your instance</p>
                        </div>

                        {keys ? (
                            <>
                                <div className="space-y-3">
                                    <KeyDisplay label="AUTH_SECRET" value={keys.authSecret} desc="JWT signing key" copied={copied} onCopy={copyToClipboard} />
                                    <KeyDisplay label="ENCRYPTION_KEY" value={keys.encryptionKey} desc="API key encryption" copied={copied} onCopy={copyToClipboard} />
                                    <KeyDisplay label="FB_WEBHOOK_VERIFY_TOKEN" value={keys.fbWebhookVerifyToken} desc="Facebook/IG webhook" copied={copied} onCopy={copyToClipboard} />
                                    <KeyDisplay label="CRON_SECRET" value={keys.cronSecret} desc="Cron endpoint auth" copied={copied} onCopy={copyToClipboard} />
                                    <KeyDisplay label="WORKER_SECRET" value={keys.workerSecret} desc="Worker → API auth" copied={copied} onCopy={copyToClipboard} />
                                </div>

                                <div className="relative">
                                    <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto border border-slate-700">
                                        {buildEnvBlock()}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(buildEnvBlock(), 'env')}
                                        className="absolute top-2 right-2 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs transition-colors"
                                    >
                                        {copied === 'env' ? '✅ Copied!' : '📋 Copy .env'}
                                    </button>
                                </div>

                                <button onClick={generateKeys} className="text-indigo-400 hover:text-indigo-300 text-sm underline">
                                    🔄 Re-generate all keys
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <Spinner />
                                <span className="ml-2 text-slate-400">Generating keys...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: Platform Guides */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                🌐 Platform Setup
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Configure OAuth for each platform you want to use.
                                <span className="text-amber-400 ml-1">You can skip this and configure later.</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            {PLATFORMS.map(platform => (
                                <div key={platform.id} className="bg-slate-700/30 rounded-xl border border-slate-700/50 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedPlatform(expandedPlatform === platform.id ? null : platform.id)}
                                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            <span className="text-lg">{platform.icon}</span>
                                            {platform.name}
                                        </span>
                                        <span className="text-slate-400 text-sm">
                                            {expandedPlatform === platform.id ? '▲' : '▼'}
                                        </span>
                                    </button>

                                    {expandedPlatform === platform.id && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                                            {/* Console link */}
                                            <div className="text-sm">
                                                <span className="text-slate-400">Developer Console: </span>
                                                <a href={platform.console} target="_blank" rel="noopener noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-300 underline">
                                                    {platform.consoleName} ↗
                                                </a>
                                            </div>

                                            {/* Callback URLs */}
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-300">OAuth Callback URL{platform.callbacks(domain).length > 1 ? 's' : ''}:</p>
                                                {platform.callbacks(domain).map((url, i) => (
                                                    <CopyableUrl key={i} url={url} copied={copied} onCopy={copyToClipboard} />
                                                ))}
                                            </div>

                                            {/* Webhook */}
                                            {platform.webhook && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-slate-300">Webhook ({platform.webhook(domain).product}):</p>
                                                    <CopyableUrl url={platform.webhook(domain).url} label="Callback URL" copied={copied} onCopy={copyToClipboard} />
                                                    {keys && (
                                                        <CopyableUrl url={keys.fbWebhookVerifyToken} label="Verify Token" copied={copied} onCopy={copyToClipboard} />
                                                    )}
                                                    <p className="text-xs text-slate-500">Fields: {platform.webhook(domain).fields}</p>
                                                    {platform.webhook(domain).note && (
                                                        <p className="text-xs text-amber-400">⚠️ {platform.webhook(domain).note}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Permissions */}
                                            {platform.permissions && (
                                                <div>
                                                    <p className="text-sm font-medium text-slate-300">Required Permissions:</p>
                                                    <p className="text-xs text-slate-400 font-mono bg-slate-900/50 rounded px-2 py-1 mt-1">
                                                        {platform.permissions}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Steps */}
                                            {platform.steps && (
                                                <div>
                                                    <p className="text-sm font-medium text-slate-300">Setup Steps:</p>
                                                    <ol className="text-xs text-slate-400 list-decimal list-inside space-y-1 mt-1">
                                                        {platform.steps.map((s, i) => (
                                                            <li key={i}>{s}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 5: Finish */}
                {step === 5 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                🚀 Launch NeeFlow
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Click the button below to finalize your setup. This will:
                            </p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                                <span className="text-lg">📝</span>
                                <span>Write <code className="text-indigo-400">.env</code> configuration file</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                                <span className="text-lg">🗄️</span>
                                <span>Run database migrations &amp; seed default data</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                                <span className="text-lg">👤</span>
                                <span>Create admin account ({adminEmail})</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                                <span className="text-lg">⏰</span>
                                <span>Install cron jobs automatically</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                                <span className="text-lg">🔄</span>
                                <span>Restart PM2 processes</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-900/50 rounded-lg p-4 text-xs space-y-1 border border-slate-700">
                            <p><span className="text-slate-400">Domain:</span> <span className="text-emerald-400">{domain}</span></p>
                            <p><span className="text-slate-400">Database:</span> <span className="text-emerald-400">{dbUser}@{dbHost}:{dbPort}/{dbName}</span></p>
                            <p><span className="text-slate-400">Redis:</span> <span className="text-emerald-400">{redisUrl}</span></p>
                            <p><span className="text-slate-400">Admin:</span> <span className="text-emerald-400">{adminEmail}</span></p>
                        </div>

                        {!result && (
                            <button
                                onClick={finishSetup}
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Spinner /> Setting up...</> : '🚀 Launch NeeFlow'}
                            </button>
                        )}

                        {/* Progress */}
                        {result && (
                            <div className="space-y-2">
                                {result.steps.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm bg-slate-700/30 rounded-lg px-3 py-2">
                                        <span>{s.status === 'success' ? '✅' : s.status === 'warning' ? '⚠️' : '❌'}</span>
                                        <span className={s.status === 'error' ? 'text-red-400' : ''}>{s.step}</span>
                                        {s.error && s.status !== 'success' && (
                                            <span className="text-xs text-slate-500 ml-auto">{s.error}</span>
                                        )}
                                    </div>
                                ))}

                                {result.success ? (
                                    <div className="text-center py-4">
                                        <p className="text-emerald-400 font-semibold text-lg">✅ Setup Complete!</p>
                                        <p className="text-slate-400 text-sm mt-1">Redirecting to login...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-red-400 font-semibold">Setup encountered errors</p>
                                        {result.error && <p className="text-red-400/70 text-sm mt-1">{result.error}</p>}
                                        <button onClick={finishSetup} className="mt-3 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm">
                                            Retry
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Navigation Buttons ── */}
                {step < 5 && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Back
                        </button>

                        <button
                            onClick={() => setStep(s => Math.min(5, s + 1))}
                            disabled={!canProceed()}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {step === 4 ? 'Review & Finish' : 'Next'} →
                        </button>
                    </div>
                )}
            </div>

            {/* Step labels */}
            <div className="flex gap-8 mt-6 text-xs text-slate-500">
                {['Database', 'Admin', 'Keys', 'Platforms', 'Launch'].map((label, i) => (
                    <span key={i} className={i + 1 === step ? 'text-indigo-400 font-medium' : ''}>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ──────────────── Sub-Components ──────────────── */

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
    return (
        <div>
            <label className="block text-xs text-slate-400 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
        </div>
    )
}

function KeyDisplay({ label, value, desc, copied, onCopy }: {
    label: string; value: string; desc: string; copied: string; onCopy: (v: string, l: string) => void
}) {
    return (
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-indigo-400">{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
                <p className="text-xs text-slate-300 font-mono truncate mt-0.5">{value}</p>
            </div>
            <button
                onClick={() => onCopy(value, label)}
                className="ml-2 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs shrink-0 transition-colors"
            >
                {copied === label ? '✅' : '📋'}
            </button>
        </div>
    )
}

function CopyableUrl({ url, label, copied, onCopy }: {
    url: string; label?: string; copied: string; onCopy: (v: string, l: string) => void
}) {
    const key = label || url
    return (
        <div className="flex items-center gap-2 bg-slate-900/50 rounded px-2 py-1.5 border border-slate-700">
            {label && <span className="text-xs text-slate-500 shrink-0">{label}:</span>}
            <code className="text-xs text-emerald-400 truncate flex-1">{url}</code>
            <button
                onClick={() => onCopy(url, key)}
                className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-xs shrink-0 transition-colors"
            >
                {copied === key ? '✅' : '📋'}
            </button>
        </div>
    )
}

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}
