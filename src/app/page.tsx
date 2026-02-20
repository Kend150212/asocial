import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Bot,
  CalendarClock,
  BarChart3,
  Palette,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

export const metadata: Metadata = {
  title: 'ASocial - AI-Powered Social Media Management Platform',
  description:
    'Manage all your social media accounts in one place. Schedule posts, generate AI content, and grow your audience with ASocial by Kendy Marketing LLC.',
}

const features = [
  {
    icon: Bot,
    title: 'AI Content Generation',
    desc: 'Generate captions, hashtags, and entire posts with AI. Support for multiple languages including Vietnamese and English.',
  },
  {
    icon: CalendarClock,
    title: 'Smart Scheduling',
    desc: 'Schedule posts across all platforms with optimal timing. Bulk upload and auto-publish to save hours every week.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Track engagement, growth, and performance across all your social channels in one unified dashboard.',
  },
  {
    icon: Palette,
    title: 'Visual Content Tools',
    desc: 'Create stunning graphics with AI-powered image generation and template-based design tools.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Invite team members, assign roles, and manage content approvals with built-in workflow tools.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, OAuth 2.0 authentication, and full GDPR/CCPA compliance for your data.',
  },
]

const platforms = [
  'Facebook',
  'Instagram',
  'YouTube',
  'TikTok',
  'LinkedIn',
  'Pinterest',
  'X (Twitter)',
]

const stats = [
  { value: '7+', label: 'Platform Integrations' },
  { value: 'AI', label: 'Powered Content' },
  { value: '24/7', label: 'Auto Scheduling' },
  { value: '100%', label: 'Data Privacy' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ───── Floating Navbar ───── */}
      <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl rounded-2xl border bg-background/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image
              src="/logo.png"
              alt="ASocial"
              width={32}
              height={32}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-lg font-bold tracking-tight">ASocial</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hidden md:inline cursor-pointer"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hidden md:inline cursor-pointer"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hidden sm:inline cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden pt-28 md:pt-36">
        {/* Background blurs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 md:pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Now live — Free plan available, no credit card required
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Manage All Your Social Media{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              in One Place
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ASocial is an AI-powered social media management platform that lets you
            create, schedule, and publish content — including uploading videos to YouTube,
            posting to Facebook, Instagram, TikTok, and more — all from a single dashboard.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Start for Free
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-3.5 text-base font-semibold hover:bg-accent transition-all duration-200 cursor-pointer"
            >
              See Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Platform Bar ───── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Integrated Platforms
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="text-sm md:text-base font-semibold text-muted-foreground/60 hover:text-foreground transition-colors duration-200 cursor-default"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-24 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-4">
              <Zap className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to grow
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for content creation, scheduling, and analytics —
              powered by AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border bg-card p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary/15 transition-colors duration-200">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── Why ASocial ───── */}
      <section className="py-24 bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Why teams choose{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  ASocial
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Built for creators and businesses who want to save time, produce
                better content, and grow their audience — without the
                complexity.
              </p>
            </div>
            <div className="space-y-4">
              {[
                'Multi-platform publishing in one click',
                'AI-generated captions & hashtags in seconds',
                'Vietnamese & English language support',
                'No credit card required to start',
                'GDPR, CCPA & VCDPA compliant',
                'Dedicated support team',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Pricing (client component, fetches live plans) ───── */}
      <PricingSection />

      {/* ───── CTA ───── */}
      <section className="py-24 bg-muted/30 border-t">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to simplify your social media?
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Join businesses and creators who trust ASocial to manage their online
            presence. Start free — no credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-3.5 text-base font-semibold hover:bg-accent transition-all duration-200 cursor-pointer"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            {/* Company */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="ASocial"
                  width={28}
                  height={28}
                  className="rounded-lg"
                  unoptimized
                />
                <span className="text-lg font-bold">ASocial</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered social media management platform. Built by{' '}
                <strong>Cuong Dao</strong>, operated by{' '}
                <strong>Kendy Marketing LLC</strong>.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors duration-200">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground transition-colors duration-200">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors duration-200">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors duration-200">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors duration-200 cursor-pointer"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors duration-200 cursor-pointer"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>Cuong Dao</strong> — Kendy Marketing LLC
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Virginia, USA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <a
                    href="mailto:support@kendymarketing.com"
                    className="hover:text-foreground transition-colors duration-200"
                  >
                    support@kendymarketing.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
                  <a
                    href="https://kendymarketing.com"
                    className="hover:text-foreground transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    kendymarketing.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>
              © 2026 <strong>Cuong Dao</strong> —{' '}
              <strong>Kendy Marketing LLC</strong>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
