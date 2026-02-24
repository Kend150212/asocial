'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { platformIcons } from '@/components/platform-icons'
import { OAUTH_PLATFORMS, CREDENTIAL_PLATFORMS } from '@/lib/platform-registry'

interface LinkInfo {
    channelId: string
    channelName: string
    channelDescription: string | null
    title: string
    hasPassword: boolean
}

type ConnectState = 'loading' | 'password' | 'ready' | 'error'

export default function ConnectPage() {
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

    // Handle ?connected=facebook from OAuth callback
    useEffect(() => {
        const connected = searchParams.get('connected')
        if (connected) {
            setConnectedPlatforms(prev => prev.includes(connected) ? prev : [...prev, connected])
        }
    }, [searchParams])

    // Load link info
    useEffect(() => {
        fetch(`/api/connect/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setErrorMsg(data.error); setState('error'); return }
                setLinkInfo(data)
                setState(data.hasPassword ? 'password' : 'ready')
            })
            .catch(() => { setErrorMsg('Could not load link. Please try again.'); setState('error') })
    }, [token])

    async function verifyPassword() {
        setVerifying(true)
        const res = await fetch(`/api/connect/${token}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })
        const data = await res.json()
        setVerifying(false)
        if (data.ok) setState('ready')
        else setErrorMsg(data.error || 'Incorrect password')
    }

    function openOAuth(platform: string) {
        const url = `/api/oauth/${platform}?channelId=${linkInfo!.channelId}&easyToken=${token}`
        window.location.href = url
    }

    async function connectCredential(platform: string) {
        const credPlatform = CREDENTIAL_PLATFORMS.find(p => p.key === platform)
        if (!credPlatform) return

        setCredLoading(true)
        const body: Record<string, string> = { channelId: linkInfo!.channelId, easyToken: token }
        for (const field of credPlatform.fields) {
            body[field.id] = credValues[field.id] || ''
        }

        const res = await fetch(credPlatform.guide.connectUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json()
        setCredLoading(false)
        if (data.ok || res.ok) {
            setConnectedPlatforms(prev => [...prev, platform])
            setCredForm(null)
            setCredValues({})
        } else {
            alert(data.error || 'Connection failed. Please check your credentials.')
        }
    }

    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (state === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
                    <div className="text-4xl mb-4">🔗</div>
                    <h2 className="text-white text-xl font-semibold mb-2">Link Unavailable</h2>
                    <p className="text-slate-400 text-sm">{errorMsg}</p>
                </div>
            </div>
        )
    }

    if (state === 'password') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full">
                    <div className="text-center mb-6">
                        <div className="text-3xl mb-3">🔒</div>
                        <h2 className="text-white text-xl font-semibold">{linkInfo?.title}</h2>
                        <p className="text-slate-400 text-sm mt-1">This link is password protected</p>
                    </div>
                    <input
                        type="password"
                        placeholder="Enter password"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                    />
                    {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
                    <button
                        onClick={verifyPassword}
                        disabled={verifying || !password}
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                    >
                        {verifying ? 'Verifying...' : 'Continue'}
                    </button>
                </div>
            </div>
        )
    }

    const activePlatform = credForm ? CREDENTIAL_PLATFORMS.find(p => p.key === credForm) : null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-slate-300 font-medium mb-4">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Secure Connection Link
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">{linkInfo?.channelName}</h1>
                    <p className="text-slate-400 text-sm">
                        {linkInfo?.title} — Connect your social media accounts
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                    {/* Platform Grid */}
                    <div className="p-6">
                        <h2 className="text-white font-semibold mb-1">Choose a platform to connect</h2>
                        <p className="text-slate-400 text-xs mb-5">Click a platform below and follow the steps to connect your account.</p>

                        {/* OAuth platforms */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {OAUTH_PLATFORMS.map(platform => {
                                const isConnected = connectedPlatforms.includes(platform.key)
                                return (
                                    <button
                                        key={platform.key}
                                        onClick={() => !isConnected && openOAuth(platform.key)}
                                        disabled={isConnected}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all group ${isConnected
                                            ? 'border-green-500/40 bg-green-500/10 cursor-default'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                            {platformIcons[platform.key] || <span className="text-xs text-slate-400">{platform.key[0].toUpperCase()}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{platform.label}</p>
                                            <p className="text-slate-500 text-xs truncate">{platform.description}</p>
                                        </div>
                                        {isConnected && (
                                            <span className="ml-auto text-green-400 flex-shrink-0">✓</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Credential platforms */}
                        <div className="grid grid-cols-2 gap-3">
                            {CREDENTIAL_PLATFORMS.map(platform => {
                                const isConnected = connectedPlatforms.includes(platform.key)
                                const isOpen = credForm === platform.key
                                return (
                                    <div key={platform.key}>
                                        <button
                                            onClick={() => !isConnected && setCredForm(isOpen ? null : platform.key)}
                                            disabled={isConnected}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isConnected
                                                ? 'border-green-500/40 bg-green-500/10 cursor-default'
                                                : isOpen
                                                    ? 'border-purple-500/50 bg-purple-500/10'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                                {platformIcons[platform.key] || <span className="text-xs text-slate-400">{platform.key[0].toUpperCase()}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{platform.label}</p>
                                                <p className="text-slate-500 text-xs truncate">{platform.description}</p>
                                            </div>
                                            {isConnected && <span className="ml-auto text-green-400 flex-shrink-0">✓</span>}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Credential Form Panel */}
                    {activePlatform && !connectedPlatforms.includes(activePlatform.key) && (
                        <div className="border-t border-white/10 p-6 bg-black/20">
                            <h3 className="text-white font-semibold mb-1">{activePlatform.guide.title}</h3>
                            <ol className="space-y-1 mb-4">
                                {activePlatform.guide.steps.map((step, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-slate-400">
                                        <span className="text-purple-400 font-bold flex-shrink-0">{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                            {activePlatform.guide.warning && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-yellow-300 text-xs mb-4">
                                    ⚠️ {activePlatform.guide.warning}
                                </div>
                            )}
                            <div className="space-y-3">
                                {activePlatform.fields.map(field => (
                                    <input
                                        key={field.id}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400"
                                        value={credValues[field.id] || ''}
                                        onChange={e => setCredValues(v => ({ ...v, [field.id]: e.target.value }))}
                                    />
                                ))}
                                <button
                                    onClick={() => connectCredential(activePlatform.key)}
                                    disabled={credLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                                >
                                    {credLoading ? 'Connecting...' : `Connect ${activePlatform.label}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-white/10 px-6 py-4 flex items-center gap-2">
                        <span className="text-xs text-slate-500">🔒 Your credentials are encrypted and never shared.</span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white text-sm font-semibold mb-3">📖 How to connect</h3>
                    <ol className="space-y-2">
                        {[
                            'Click the platform button above (e.g. Facebook, Instagram, YouTube)',
                            'You\'ll be redirected to the platform\'s login page — log in with your account',
                            'Authorize the permissions requested (post, read, publish)',
                            'You\'ll be brought back here with your account connected ✅',
                            'Repeat for each platform you\'d like to connect',
                        ].map((step, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-slate-400">
                                <span className="text-purple-400 font-bold flex-shrink-0">{i + 1}.</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Powered by Neeflow · Secure social media management
                </p>
            </div>
        </div>
    )
}
