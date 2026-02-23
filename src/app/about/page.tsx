import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getBrandingServer } from '@/lib/use-branding-server'

export const metadata: Metadata = {
    title: 'About NeeFlow — AI-Powered Social Media Management',
    description: 'Learn about NeeFlow — the AI-powered social media and email marketing management platform built for agencies, brands, and creators.',
}

export default async function AboutPage() {
    const branding = await getBrandingServer()

    const stats = [
        { value: '7+', label: 'Platforms Supported' },
        { value: '10+', label: 'AI Models Integrated' },
        { value: '99.9%', label: 'Uptime SLA' },
        { value: 'AES-256', label: 'Data Encryption' },
    ]

    const values = [
        {
            icon: '⚡',
            title: 'AI-First Efficiency',
            desc: 'We build every feature with AI at the center — so you spend less time on repetitive tasks and more time on strategy and creativity.',
        },
        {
            icon: '🔒',
            title: 'Privacy by Design',
            desc: 'Your data is yours. We encrypt credentials, never sell data, and give you full control over what you share and store.',
        },
        {
            icon: '🌍',
            title: 'Multi-Platform by Default',
            desc: 'One dashboard for all your social accounts. We believe managing multiple platforms should be a feature, not a headache.',
        },
        {
            icon: '🤝',
            title: 'Built for Teams & Agencies',
            desc: 'From solo creators to large agencies managing dozens of client accounts — NeeFlow scales with your workflow.',
        },
        {
            icon: '🎯',
            title: 'Transparent Pricing',
            desc: 'No hidden fees, no surprise charges. Clear plans with honest pricing and 30-day notice before any price changes.',
        },
        {
            icon: '🛡️',
            title: 'Enterprise-Grade Security',
            desc: 'RBAC, AES-256 encryption, bcrypt passwords, TLS 1.2+, and security headers — security is non-negotiable.',
        },
    ]

    const platforms = [
        { name: 'Facebook', color: '#1877F2' },
        { name: 'Instagram', color: '#E1306C' },
        { name: 'TikTok', color: '#000000' },
        { name: 'YouTube', color: '#FF0000' },
        { name: 'LinkedIn', color: '#0A66C2' },
        { name: 'X (Twitter)', color: '#000000' },
        { name: 'Pinterest', color: '#E60023' },
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src={branding.logoUrl} alt={branding.appName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{branding.appName}</span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm">
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
                        <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Sign In</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-6 py-20 text-center">
                <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800/60 mb-6">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    About {branding.appName}
                </div>
                <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                    Smarter social media,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">powered by AI</span>
                </h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    {branding.appName} is an AI-powered social media and email marketing platform built to help agencies, brands, and creators manage all their platforms from one place — faster, smarter, and with less effort.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                    <Link href="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
                        Get Started Free
                    </Link>
                    <Link href="/privacy" className="px-6 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-gray-50 dark:bg-white/[0.03] border-y border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-14">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                        {stats.map((s, i) => (
                            <div key={i}>
                                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">{s.value}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="max-w-4xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                    We believe that powerful social media management shouldn&apos;t require a team of specialists or expensive agency retainers. {branding.appName} puts enterprise-grade AI tools, multi-platform publishing, and analytics in the hands of every creator, marketer, and business — regardless of their size.
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                    We are focused on removing the friction between content ideas and published posts, between raw analytics and actionable insights, between scattered inboxes and unified communication.
                </p>
            </section>

            {/* Values */}
            <section className="bg-gray-50 dark:bg-white/[0.03] border-y border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">What We Stand For</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">Our product decisions are guided by a clear set of principles.</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((v, i) => (
                            <div key={i} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
                                <div className="text-3xl mb-3">{v.icon}</div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platforms */}
            <section className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Supported Platforms</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10">{branding.appName} connects with all major social media platforms via their official APIs.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                    {platforms.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact */}
            <section className="bg-indigo-600 dark:bg-indigo-900">
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Get in Touch</h2>
                    <p className="text-indigo-200 mb-8 text-lg">Questions, partnerships, or press inquiries — we&apos;d love to hear from you.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="mailto:support@neeflow.com" className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
                            support@neeflow.com
                        </a>
                        <Link href="/privacy" className="px-6 py-3 bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
                            Privacy Policy
                        </Link>
                    </div>
                    <p className="text-indigo-300 text-sm mt-8">Richmond, VA, United States</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                    <div className="flex flex-wrap gap-6 text-sm justify-center">
                        <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</Link>
                        <Link href="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookies</Link>
                        <Link href="/gdpr" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">GDPR</Link>
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
