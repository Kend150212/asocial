'use client'

import { useEffect, useState } from 'react'

export default function MaintenancePage() {
    const [appName, setAppName] = useState('NeeFlow')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetch('/api/admin/branding')
            .then(r => r.json())
            .then(d => {
                if (d.appName) setAppName(d.appName)
            })
            .catch(() => { })
    }, [])

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-amber-600/15 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Main content */}
            <div className={`relative z-10 text-center max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Icon */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/25 mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
                    <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                        Under
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                        Maintenance
                    </span>
                </h1>

                {/* Subtext */}
                <p className="text-lg sm:text-xl text-white/50 mb-8 max-w-md mx-auto leading-relaxed">
                    We&apos;re performing scheduled maintenance to improve your experience. We&apos;ll be back shortly.
                </p>

                {/* Status indicator */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-12">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    <span className="text-sm text-white/60">Maintenance in progress</span>
                </div>

                {/* Divider */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8" />

                {/* Footer */}
                <p className="text-sm text-white/25">
                    &copy; {new Date().getFullYear()} {appName}. All rights reserved.
                </p>
            </div>
        </div>
    )
}
