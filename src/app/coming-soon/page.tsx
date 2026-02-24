'use client'

import { useEffect, useState } from 'react'

export default function ComingSoonPage() {
    const [appName, setAppName] = useState('NeeFlow')
    const [tagline, setTagline] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetch('/api/admin/branding')
            .then(r => r.json())
            .then(d => {
                if (d.appName) setAppName(d.appName)
                if (d.tagline) setTagline(d.tagline)
            })
            .catch(() => { })
    }, [])

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[200px]" />
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
                {/* Logo / App Name */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/25 mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-medium text-violet-400 tracking-widest uppercase mb-2">
                        {appName}
                    </h2>
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                        Coming
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Soon
                    </span>
                </h1>

                {/* Subtext */}
                <p className="text-lg sm:text-xl text-white/50 mb-12 max-w-md mx-auto leading-relaxed">
                    {tagline || "We're building something extraordinary. Stay tuned for the launch."}
                </p>

                {/* Animated dots */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
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
