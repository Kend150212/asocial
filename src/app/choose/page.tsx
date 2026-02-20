'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ChooseAccessPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        if (status === 'loading') return
        if (!session) { router.push('/login'); return }

        // Check if user truly has dual access
        fetch('/api/auth/check-access')
            .then(r => r.json())
            .then(data => {
                if (!data.hasDualAccess) {
                    // Not dual — redirect directly based on access type
                    if (data.isStaff) router.replace('/dashboard')
                    else if (data.isCustomer) router.replace('/portal')
                    else router.replace('/dashboard')
                } else {
                    setChecking(false)
                }
            })
            .catch(() => router.replace('/dashboard'))
    }, [session, status, router])

    if (status === 'loading' || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center gap-4">
                    <Image src="/logo.png" alt="ASocial" width={48} height={48} className="rounded-xl" unoptimized />
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <Image src="/logo.png" alt="ASocial" width={56} height={56} className="rounded-xl mx-auto mb-4" unoptimized />
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back!</h1>
                    <p className="text-white/40 text-sm mt-1.5">Choose where you&apos;d like to go</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dashboard / App */}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="group relative bg-[#12121a] border border-white/[0.06] hover:border-indigo-500/30 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-1">Dashboard</h2>
                            <p className="text-white/35 text-sm leading-relaxed">
                                Manage channels, create posts, view analytics, and control everything.
                            </p>
                            <div className="flex items-center gap-1.5 mt-4 text-indigo-400 text-xs font-medium">
                                <span>Open App</span>
                                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </button>

                    {/* Portal */}
                    <button
                        onClick={() => router.push('/portal')}
                        className="group relative bg-[#12121a] border border-white/[0.06] hover:border-emerald-500/30 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-1">Client Portal</h2>
                            <p className="text-white/35 text-sm leading-relaxed">
                                Review pending posts, approve or reject content, and view your calendar.
                            </p>
                            <div className="flex items-center gap-1.5 mt-4 text-emerald-400 text-xs font-medium">
                                <span>Open Portal</span>
                                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Signed in as */}
                <p className="text-center text-white/20 text-xs mt-6">
                    Signed in as <span className="text-white/40">{session?.user?.email}</span>
                </p>
            </div>
        </div>
    )
}
