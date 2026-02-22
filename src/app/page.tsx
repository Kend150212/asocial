'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  Sparkles,
  Play,
  Layers,
  Send,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'
import { useBranding } from '@/lib/use-branding'

const features = [
  {
    icon: Bot,
    title: 'AI Content Generation',
    desc: 'Generate captions, hashtags, and entire posts with AI. Support for multiple languages including Vietnamese and English.',
    color: 'from-violet-500 to-indigo-500',
    bg: 'bg-violet-50',
  },
  {
    icon: CalendarClock,
    title: 'Smart Scheduling',
    desc: 'Schedule posts across all platforms with optimal timing. Bulk upload and auto-publish to save hours every week.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Track engagement, growth, and performance across all your social channels in one unified dashboard.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Palette,
    title: 'Visual Content Tools',
    desc: 'Create stunning graphics with AI-powered image generation and template-based design tools.',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Invite team members, assign roles, and manage content approvals with built-in workflow tools.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, OAuth 2.0 authentication, and full GDPR/CCPA compliance for your data.',
    color: 'from-slate-600 to-slate-800',
    bg: 'bg-slate-50',
  },
]

const platforms = [
  { name: 'Facebook', icon: '📘' },
  { name: 'Instagram', icon: '📸' },
  { name: 'YouTube', icon: '🎬' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'LinkedIn', icon: '💼' },
  { name: 'Pinterest', icon: '📌' },
  { name: 'X (Twitter)', icon: '✖️' },
]

const stats = [
  { value: '7+', label: 'Platforms', icon: Globe },
  { value: 'AI', label: 'Powered', icon: Sparkles },
  { value: '24/7', label: 'Scheduling', icon: CalendarClock },
  { value: '100%', label: 'Private', icon: ShieldCheck },
]

const steps = [
  {
    icon: Layers,
    title: 'Connect Your Channels',
    desc: 'Link all your social media accounts in seconds with secure OAuth authentication.',
  },
  {
    icon: Bot,
    title: 'Create with AI',
    desc: 'Let AI generate captions, hashtags, and images. Or write your own — your choice.',
  },
  {
    icon: CalendarClock,
    title: 'Schedule & Queue',
    desc: 'Plan your content calendar. Set dates, times, or let auto-scheduling pick the best slots.',
  },
  {
    icon: Send,
    title: 'Publish Everywhere',
    desc: 'One click publishes to all platforms simultaneously. Track performance in real-time.',
  },
]

export default function LandingPage() {
  const branding = useBranding()
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ───── Floating Navbar ───── */}
      <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image
              src={branding.logoUrl}
              alt={branding.appName}
              width={32}
              height={32}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              {branding.appName}
            </span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="#features"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200 hidden md:inline cursor-pointer"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200 hidden md:inline cursor-pointer"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200 hidden md:inline cursor-pointer"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200 hidden sm:inline cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden pt-28 md:pt-36 bg-gradient-to-b from-slate-50 via-white to-white">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-3xl" />
          <div className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-100/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-violet-50/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 md:pb-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-600 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Now live — Free plan available, no credit card required
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Manage All Your{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                Social Media
              </span>{' '}
              in One Place
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              {branding.appName} is an AI-powered platform that lets you create, schedule,
              and publish content across Facebook, Instagram, YouTube, TikTok, and more
              — all from a single beautiful dashboard.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Start for Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                See How It Works
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200/50">
              <Image
                src="/hero-dashboard.png"
                alt="NeeFlow Dashboard"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <Icon className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs md:text-sm text-slate-500">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── Platform Bar ───── */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Integrated Platforms
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {platforms.map((platform) => (
              <span
                key={platform.name}
                className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-400 hover:text-slate-700 transition-colors duration-200 cursor-default"
              >
                <span className="text-lg">{platform.icon}</span>
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-24 scroll-mt-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-600 mb-4">
              <Zap className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                grow
              </span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
              Powerful tools for content creation, scheduling, and analytics —
              all powered by AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-100 bg-white p-8 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-5 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-6 w-6 bg-gradient-to-r ${feature.color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── Showcase: AI + Scheduling ───── */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          {/* AI Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-600 mb-4">
                <Bot className="h-3 w-3" />
                AI-Powered
              </div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Let AI create your{' '}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  perfect content
                </span>
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Generate engaging captions, relevant hashtags, and stunning images
                with just one click. Our AI understands your brand voice and creates
                content that resonates with your audience.
              </p>
              <ul className="space-y-3">
                {['Multi-language support (EN, VI, and more)', 'Brand voice customization', 'AI image generation with multiple models', 'Smart hashtag suggestions'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-violet-100/50 border border-slate-100">
              <Image
                src="/feature-ai.png"
                alt="AI Content Generation"
                width={600}
                height={400}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50 border border-slate-100">
              <Image
                src="/feature-scheduling.png"
                alt="Smart Scheduling"
                width={600}
                height={400}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-600 mb-4">
                <CalendarClock className="h-3 w-3" />
                Smart Scheduling
              </div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Schedule once,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  publish everywhere
                </span>
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Plan your content calendar weeks in advance. Queue posts for optimal
                times, or let our AI find the best publishing windows for maximum
                engagement.
              </p>
              <ul className="space-y-3">
                {['Visual content calendar', 'Auto-scheduling for best times', 'Bulk upload & queue management', 'Cross-platform publishing'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-24 bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-600 mb-4">
              <Play className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Up and running in{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                minutes
              </span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
              Four simple steps to transform your social media workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-slate-100">
                    {i + 1}
                  </div>
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 mb-5">
                      <Icon className="h-6 w-6 text-indigo-600" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── Why Us ───── */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Why teams choose{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  {branding.appName}
                </span>
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                Built for creators and businesses who want to save time, produce
                better content, and grow their audience — without the
                complexity.
              </p>
            </div>
            <div className="space-y-3">
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
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <PricingSection />

      {/* ───── CTA ───── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Ready to simplify your social media?
          </h2>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-xl mx-auto">
            Join businesses and creators who trust {branding.appName} to manage their online
            presence. Start free — no credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Create Free Account
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            {/* Company */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={branding.logoUrl}
                  alt={branding.appName}
                  width={28}
                  height={28}
                  className="rounded-lg"
                  unoptimized
                />
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  {branding.appName}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI-powered social media management platform.
                Create, schedule, and publish — all in one place.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm text-slate-900">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li>
                  <Link href="#features" className="hover:text-slate-900 transition-colors duration-200">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-slate-900 transition-colors duration-200">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-slate-900 transition-colors duration-200">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-slate-900 transition-colors duration-200">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm text-slate-900">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li>
                  <Link href="/terms" className="hover:text-slate-900 transition-colors duration-200 cursor-pointer">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 transition-colors duration-200 cursor-pointer">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-sm text-slate-900">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <span>Richmond, VA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <a
                    href="mailto:hello@neeflow.com"
                    className="hover:text-slate-900 transition-colors duration-200"
                  >
                    hello@neeflow.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <a
                    href="mailto:support@neeflow.com"
                    className="hover:text-slate-900 transition-colors duration-200"
                  >
                    support@neeflow.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} <strong>NeeFlow</strong>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
