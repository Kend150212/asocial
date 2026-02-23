'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useBranding } from '@/lib/use-branding'
import {
  Moon, Sun, ArrowRight, Zap, Calendar, BarChart3, Users,
  MessageSquare, CheckCircle, Menu, X, Sparkles, Globe,
  Clock, TrendingUp, Shield, Bot, Bell, Layers, ChevronRight,
  Star, Check, Inbox, FileText, RefreshCw, Lock
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

// ── SVG Platform Logos ────────────────────────────────────────────────────────
const FacebookSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)
const InstagramSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)
const TikTokSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)
const YouTubeSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)
const LinkedInSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const XSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 5.892zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const PinterestSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
)

const platforms = [
  { name: 'Facebook', component: FacebookSVG, color: '#1877F2' },
  { name: 'Instagram', component: InstagramSVG, color: '#E4405F' },
  { name: 'TikTok', component: TikTokSVG, color: '#000000' },
  { name: 'YouTube', component: YouTubeSVG, color: '#FF0000' },
  { name: 'LinkedIn', component: LinkedInSVG, color: '#0A66C2' },
  { name: 'X', component: XSVG, color: '#000000' },
  { name: 'Pinterest', component: PinterestSVG, color: '#E60023' },
]

// ── Feature Data ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: Sparkles,
    title: 'AI Content Generation',
    desc: 'Generate captions, hashtags, and full content calendars in seconds. Powered by GPT-4 and Gemini.',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'Most Popular',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    desc: 'AI predicts your optimal posting times based on audience behavior. Set it and forget it.',
    gradient: 'from-blue-500 to-cyan-600',
    badge: null,
  },
  {
    icon: BarChart3,
    title: 'Unified Analytics',
    desc: 'Get cross-platform reports in one dashboard. Track followers, engagement, reach, and ROI.',
    gradient: 'from-teal-500 to-emerald-600',
    badge: null,
  },
  {
    icon: Inbox,
    title: 'Unified Inbox',
    desc: 'Manage all DMs, comments, and mentions from every platform in one smart inbox.',
    gradient: 'from-orange-500 to-amber-600',
    badge: null,
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Assign roles, set approval workflows, and collaborate seamlessly with your team.',
    gradient: 'from-pink-500 to-rose-600',
    badge: null,
  },
  {
    icon: Bot,
    title: 'AI Auto-Reply Bot',
    desc: 'Train your own AI chatbot to handle FAQs and comment replies automatically 24/7.',
    gradient: 'from-indigo-500 to-blue-600',
    badge: 'New',
  },
]

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Connect Your Platforms',
    desc: 'Connect all your social media accounts in under 2 minutes. Facebook, Instagram, TikTok, YouTube, LinkedIn, X and Pinterest.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Let AI Create Your Content',
    desc: 'Describe your brand or topic, and our AI generates captions, hashtags, and full content calendars tailored to each platform.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Publish & Grow',
    desc: 'Schedule posts at AI-optimized times, track performance with unified analytics, and grow your audience on autopilot.',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Social Media Manager, Luxe Agency',
    review: 'NeeFlow cut our content production time by 70%. The AI writes better captions than most of our junior staff. Absolute game changer for our 40+ client accounts.',
    rating: 5,
    initials: 'SC',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Marcus Rivera',
    role: 'E-commerce Brand Owner',
    review: 'I run 3 brands and 7 social accounts solo. NeeFlow is the only reason that\'s possible. The scheduler + AI together saves me 15 hours every single week.',
    rating: 5,
    initials: 'MR',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    name: 'Linh Tran',
    role: 'Digital Marketing Director',
    review: 'Our engagement rate went up 140% in the first month. The analytics dashboard finally gives me the full picture across all platforms without the chaos.',
    rating: 5,
    initials: 'LT',
    gradient: 'from-orange-500 to-amber-600',
  },
]

// ── Animated Counter ───────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const step = target / 60
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 25)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count}{suffix}</span>
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const branding = useBranding()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float { 0%,100% { transform:translateY(0px) } 50% { transform:translateY(-10px) } }
        @keyframes gradient { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:.4 } 100% { transform:scale(1.6); opacity:0 } }
        @keyframes spin-slow { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes beam { 0%,100% { opacity:0; transform:scaleX(0) } 50% { opacity:1; transform:scaleX(1) } }

        .animate-marquee { animation: marquee 28s linear infinite; }
        .animate-fade-up { animation: fadeUp 0.7s ease-out forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient 6s ease infinite; background-size: 300% 300%; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }

        .text-gradient {
          background: linear-gradient(135deg, #14b8a6 0%, #6366f1 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bg-grid {
          background-image: radial-gradient(circle, rgba(20,184,166,0.15) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .dark .bg-grid {
          background-image: radial-gradient(circle, rgba(20,184,166,0.08) 1px, transparent 1px);
        }

        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
        }

        .glass-nav {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass-nav {
          background: rgba(3,7,18,0.85);
        }

        .feature-card {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dark .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .btn-primary {
          background: linear-gradient(135deg, #14b8a6, #6366f1);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(20,184,166,0.35);
        }

        .step-connector {
          background: linear-gradient(90deg, #14b8a6, #6366f1);
        }

        .orb {
          filter: blur(80px);
          opacity: 0.35;
        }
        .dark .orb {
          opacity: 0.2;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 40 ? 'glass-nav border-b border-gray-200/60 dark:border-white/5 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={branding.logoUrl} alt={branding.appName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
            <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">{branding.appName}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['Privacy', '/privacy']].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-nav border-t border-gray-200/60 dark:border-white/5 px-6 py-4 space-y-3">
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['Privacy', '/privacy'], ['Sign In', '/login']].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 py-2 hover:text-teal-500 transition-colors">
                {label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid" />

        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-teal-400 rounded-full orb" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-violet-500 rounded-full orb" />
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-indigo-400 rounded-full orb" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Social Media Management
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl md:text-7xl font-800 leading-[1.08] tracking-tight mb-6 font-extrabold">
            Manage Every Platform
            <br />
            <span className="text-gradient">10× Faster with AI</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-200 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            One dashboard to create, schedule, and analyze content across Facebook, Instagram, TikTok, YouTube, LinkedIn, X and Pinterest. Powered by AI that actually understands your brand.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href="/login" className="btn-primary text-white font-semibold px-8 py-4 rounded-full text-base flex items-center gap-2 shadow-xl">
              Start Free — No Credit Card <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 transition-colors px-6 py-4">
              See How It Works <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up delay-400 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
            {[
              { icon: Shield, text: 'SOC 2 Ready' },
              { icon: Lock, text: 'AES-256 Encrypted' },
              { icon: RefreshCw, text: 'Cancel Anytime' },
              { icon: Globe, text: '7 Platforms' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-teal-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Hero Visual — CSS-based dashboard mockup */}
          <div className="animate-fade-up delay-500 mt-16 relative">
            {/* Main mockup card */}
            <div className="relative mx-auto max-w-4xl">
              {/* Floating metric cards */}
              <div className="absolute -top-6 -left-4 md:-left-16 animate-float bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-4 text-left z-10 w-44">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Engagement</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">+140%</div>
                <div className="text-xs text-green-500 font-medium mt-0.5">↑ vs last month</div>
              </div>

              <div className="absolute -top-6 -right-4 md:-right-16 animate-float delay-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-4 text-left z-10 w-44">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Time Saved</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">45 hrs</div>
                <div className="text-xs text-amber-500 font-medium mt-0.5">per month</div>
              </div>

              {/* Dashboard UI mockup */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4 h-6 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500" />
                </div>

                {/* Dashboard content */}
                <div className="grid grid-cols-12 h-72 md:h-96">
                  {/* Sidebar */}
                  <div className="col-span-2 border-r border-gray-100 dark:border-white/5 p-3 space-y-2">
                    {[BarChart3, Calendar, Inbox, Users, FileText].map((Icon, i) => (
                      <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto cursor-pointer ${i === 0 ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg' : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    ))}
                  </div>

                  {/* Main area */}
                  <div className="col-span-10 p-4 md:p-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Followers', value: '48.2K', trend: '+12%', color: 'text-teal-600 dark:text-teal-400' },
                        { label: 'Reach', value: '312K', trend: '+8%', color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Posts', value: '142', trend: '+24', color: 'text-violet-600 dark:text-violet-400' },
                        { label: 'Eng. Rate', value: '4.8%', trend: '+0.6%', color: 'text-orange-600 dark:text-orange-400' },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                          <div className="text-[10px] text-gray-500 dark:text-gray-500 mb-1">{s.label}</div>
                          <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[9px] text-green-500 font-medium">{s.trend}</div>
                        </div>
                      ))}
                    </div>

                    {/* Chart bars */}
                    <div className="flex items-end gap-1.5 h-24 md:h-36 mb-3">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 50, 72].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${h}%`,
                            background: `linear-gradient(to top, #14b8a6, #6366f1)`,
                            opacity: i === 10 ? 1 : 0.4 + (i * 0.04),
                          }}
                        />
                      ))}
                    </div>

                    {/* Platform icons row */}
                    <div className="flex items-center gap-2">
                      {platforms.map((p) => (
                        <div key={p.name} className="w-6 h-6 opacity-60" style={{ color: p.color }}>
                          <p.component />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom floating card */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-float delay-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-10 whitespace-nowrap">
                <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">AI just generated 12 posts</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Scheduled for next week · 2s ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM MARQUEE ────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-6">Publish to all your platforms in one click</p>
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex gap-12 items-center pr-12 shrink-0">
            {[...platforms, ...platforms, ...platforms].map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-default shrink-0">
                <div className="w-6 h-6 shrink-0" style={{ color: p.color }}>
                  <p.component />
                </div>
                <span className="text-sm font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 10, suffix: '+', label: 'Platforms Supported', sub: 'All major networks' },
            { value: 45, suffix: 'hrs', label: 'Saved Per Month', sub: 'Per user on average' },
            { value: 140, suffix: '%', label: 'Engagement Boost', sub: 'Avg. in 30 days' },
            { value: 24, suffix: '/7', label: 'AI Availability', sub: 'Always-on automation' },
          ].map((stat, i) => (
            <div key={i} className="group">
              <div className="text-4xl sm:text-5xl font-extrabold text-gradient mb-2">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{stat.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50/50 dark:bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <Layers className="w-3.5 h-3.5" /> Everything You Need
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              One platform.<br />
              <span className="text-gradient">Infinite possibilities.</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
              Everything a modern social media team needs — unified, AI-powered, and ridiculously easy to use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="feature-card card-hover rounded-2xl p-6 group cursor-default relative overflow-hidden">
                {f.badge && (
                  <div className="absolute top-4 right-4 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {f.badge}
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className="w-5.5 h-5.5 text-white w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MID CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #6366f1 50%, #7c3aed 100%)' }}>
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative">
              <div className="text-sm font-semibold text-teal-200 mb-3">🚀 Join 1,000+ teams</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to save 10+ hours every week?
              </h2>
              <p className="text-teal-100 mb-8 max-w-lg mx-auto">
                Start your free trial today. No credit card required. Cancel anytime.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                Start Free Trial <ArrowRight className="w-4.5 h-4.5 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <Clock className="w-3.5 h-3.5" /> Up & Running in Minutes
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              How NeeFlow works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg">
              From zero to fully automated in 3 simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/2 -translate-x-1/2 w-2/3 h-0.5 step-connector rounded-full" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative text-center group">
                  {/* Number circle */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200 relative z-10">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 -translate-y-1 translate-x-1 flex items-center justify-center z-20">
                      <span className="text-[9px] font-extrabold text-gray-500 dark:text-gray-400">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50/50 dark:bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <Star className="w-3.5 h-3.5 fill-current" /> Loved by Teams Worldwide
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Real results. Real people.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="feature-card card-hover rounded-2xl p-7">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.review}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-extrabold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <div id="pricing" className="bg-white dark:bg-gray-950">
        <PricingSection />
      </div>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 bg-gray-950 dark:bg-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900 rounded-full orb" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-900 rounded-full orb" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 border border-teal-800 text-teal-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Start Your Free Trial Today
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Your social media.<br />
            <span className="text-gradient">On autopilot.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join thousands of agencies and brands who trust NeeFlow to power their social media presence. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary text-white font-bold px-10 py-4 rounded-full text-base flex items-center gap-2 shadow-2xl">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
              Sign in to existing account <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['14-day free trial', 'No credit card', 'Cancel anytime', '24/7 AI support'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 dark:bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-10 mb-14">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Image src={branding.logoUrl} alt={branding.appName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
                <span className="text-lg font-extrabold text-white">{branding.appName}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-5">
                AI-powered social media management for modern agencies and brands. Post smarter, grow faster.
              </p>
              <div className="flex gap-3">
                {platforms.slice(0, 5).map((p) => (
                  <div key={p.name} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                    <p.component />
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                links: [['Features', '#features'], ['Pricing', '#pricing'], ['How It Works', '#how-it-works'], ['Changelog', '#']],
              },
              {
                title: 'Company',
                links: [['About', '#'], ['Blog', '#'], ['Careers', '#'], ['Contact', 'mailto:hello@neeflow.com']],
              },
              {
                title: 'Legal',
                links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '#'], ['GDPR', '#']],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} NeeFlow. All rights reserved. Built with ♥ in Richmond, VA.</span>
            <div className="flex gap-5">
              <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
