import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ASocial - AI-Powered Social Media Management Platform',
  description: 'Manage all your social media accounts in one place. Schedule posts, generate AI content, and grow your audience with ASocial by Kendy Marketing LLC.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="ASocial" width={36} height={36} className="rounded-lg" unoptimized />
            <span className="text-xl font-bold tracking-tight">ASocial</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Terms
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Now live — Start managing for free
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            Manage All Your Social Media
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> in One Place</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Schedule posts, generate AI-powered content, and grow your audience across Facebook, Instagram, YouTube, TikTok, and more — all from a single dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all"
            >
              Get Started Free →
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border px-8 py-3.5 text-base font-semibold hover:bg-accent transition-all"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">Integrated with platforms you love</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-muted-foreground">
            {['Facebook', 'Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Pinterest', 'X (Twitter)'].map((platform) => (
              <span key={platform} className="text-sm md:text-base font-semibold opacity-60 hover:opacity-100 transition-opacity">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to grow</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for content creation, scheduling, and analytics — powered by AI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'AI Content Generation',
                desc: 'Generate captions, hashtags, and entire posts with AI. Support for multiple languages including Vietnamese and English.',
              },
              {
                icon: '📅',
                title: 'Smart Scheduling',
                desc: 'Schedule posts across all platforms with optimal timing. Bulk upload and auto-publish to save hours every week.',
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                desc: 'Track engagement, growth, and performance across all your social channels in one unified dashboard.',
              },
              {
                icon: '🎨',
                title: 'Visual Content Tools',
                desc: 'Create stunning graphics with AI-powered image generation and template-based design tools.',
              },
              {
                icon: '👥',
                title: 'Team Collaboration',
                desc: 'Invite team members, assign roles, and manage content approvals with built-in workflow tools.',
              },
              {
                icon: '🔒',
                title: 'Enterprise Security',
                desc: 'Bank-grade encryption, OAuth 2.0 authentication, and full GDPR/CCPA compliance for your data.',
              },
            ].map((feature) => (
              <div key={feature.title} className="group rounded-2xl border p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to simplify your social media?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join businesses and creators who trust ASocial to manage their online presence.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all"
          >
            Start Free Today →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="ASocial" width={28} height={28} className="rounded-lg" unoptimized />
                <span className="text-lg font-bold">ASocial</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered social media management platform. Built by <strong>Cuong Dao</strong>, operated by <strong>Kendy Marketing LLC</strong>.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Cuong Dao</strong> — Kendy Marketing LLC</li>
                <li>4706 Kelly Cv, Glen Allen, Virginia 23060, USA</li>
                <li>
                  <a href="mailto:support@kendymarketing.com" className="hover:text-foreground transition-colors">
                    support@kendymarketing.com
                  </a>
                </li>
                <li>
                  <a href="https://kendymarketing.com" className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                    kendymarketing.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>© 2026 <strong>Cuong Dao</strong> — <strong>Kendy Marketing LLC</strong>. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
