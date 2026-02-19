'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

interface InviteInfo {
    email: string
    name: string | null
    channelName: string
}

export default function InvitePage() {
    const { token } = useParams<{ token: string }>()
    const router = useRouter()

    const [info, setInfo] = useState<InviteInfo | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    useEffect(() => {
        fetch(`/api/invite/${token}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) { setError(data.error); return }
                setInfo(data)
                setName(data.name || '')
            })
            .catch(() => setError('Failed to load invite'))
            .finally(() => setLoading(false))
    }, [token])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) { setError('Passwords do not match'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return }

        setSubmitting(true)
        setError('')

        const res = await fetch(`/api/invite/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed to accept invite'); setSubmitting(false); return }

        // Auto sign in and redirect to portal
        const signInResult = await signIn('credentials', {
            email: data.email,
            password,
            redirect: false,
        })
        if (signInResult?.ok) {
            router.push('/portal')
        } else {
            router.push('/login')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error && !info) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f12] p-4">
                <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-4xl mb-4">😔</div>
                    <h1 className="text-xl font-semibold text-white mb-2">Invite Invalid</h1>
                    <p className="text-white/50">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f12] p-4">
            <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 max-w-md w-full">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">A</div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-1">You're invited!</h1>
                <p className="text-white/50 text-center text-sm mb-6">
                    Review &amp; approve content for <span className="text-indigo-400 font-medium">{info?.channelName}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Email</label>
                        <input
                            type="email"
                            value={info?.email || ''}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white/40 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Set Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                        {submitting ? 'Setting up account...' : 'Accept Invitation →'}
                    </button>
                </form>
            </div>
        </div>
    )
}
