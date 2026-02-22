'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  Bot,
  CalendarClock,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  Send,
  MessageSquare,
  Clock,
  Globe,
  Star,
  ChevronDown,
  PlayCircle,
  TrendingUp,
  Image as ImageIcon,
  Settings,
  Bell,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

// ── Platform SVG logos ─────────────────────────────────────────────────────
const FacebookSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)
const InstagramSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F58529" />
        <stop offset="50%" stopColor="#DD2A7B" />
        <stop offset="100%" stopColor="#8134AF" />
      </linearGradient>
    </defs>
    <path fill="url(#igGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)
const TikTokSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)
const YoutubeSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)
const LinkedInSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const XSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const PinterestSVG = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="#E60023">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
)

const platforms = [
  { name: 'Facebook', component: FacebookSVG, bg: 'bg-blue-50' },
  { name: 'Instagram', component: InstagramSVG, bg: 'bg-pink-50' },
  { name: 'TikTok', component: TikTokSVG, bg: 'bg-gray-100' },
  { name: 'YouTube', component: YoutubeSVG, bg: 'bg-red-50' },
  { name: 'LinkedIn', component: LinkedInSVG, bg: 'bg-sky-50' },
  { name: 'X', component: XSVG, bg: 'bg-gray-100' },
  { name: 'Pinterest', component: PinterestSVG, bg: 'bg-red-50' },
]

const features = [
  {
    icon: Bot,
    title: 'AI Content Generation',
    desc: 'Generate captions, hashtags, and full posts in seconds. Supports Vietnamese, English and more.',
    color: 'from-violet-500 to-indigo-600',
    lightBg: 'bg-violet-50',
    image: '/feature-ai-writing.png',
    stats: '10x faster content creation',
  },
  {
    icon: CalendarClock,
    title: 'Smart Scheduling',
    desc: 'Post at peak times automatically. Auto-schedule across all platforms from one calendar.',
    color: 'from-indigo-500 to-cyan-500',
    lightBg: 'bg-indigo-50',
    image: '/feature-calendar.png',
    stats: 'Best-time posting AI',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    desc: 'Track followers, engagement, reach across all platforms. Beautiful reports, real insights.',
    color: 'from-cyan-500 to-teal-500',
    lightBg: 'bg-cyan-50',
    image: '/feature-analytics.png',
    stats: 'All platforms, one view',
  },
  {
    icon: Users,
    title: 'Multi-Channel Teams',
    desc: 'Manage multiple clients and channels. Assign roles, review and approve content before publishing.',
    color: 'from-pink-500 to-rose-500',
    lightBg: 'bg-pink-50',
    image: null,
    stats: 'Up to 50 members/channel',
  },
  {
    icon: MessageSquare,
    title: 'Inbox & Chat Bot',
    desc: 'Unified inbox for all platform messages. AI-powered auto-replies to engage your audience 24/7.',
    color: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    image: null,
    stats: '24/7 auto-engagement',
  },
  {
    icon: ShieldCheck,
    title: 'Approval Workflows',
    desc: 'Client approval flow built-in. Review, comment, and approve posts before they go live.',
    color: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50',
    image: null,
    stats: 'Zero unauthorized posts',
  },
]

const steps = [
  {
    num: '01',
    icon: Layers,
    title: 'Connect Your Channels',
    desc: 'Link all your social media accounts in minutes. Facebook, Instagram, TikTok, YouTube, LinkedIn — one dashboard.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Create with AI',
    desc: 'Type a topic, choose a tone, and let AI generate engaging captions and hashtags instantly.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    num: '03',
    icon: Send,
    title: 'Schedule & Publish',
    desc: 'Pick the best times or let auto-schedule decide. Review, approve, and publish across all platforms.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
]

const testimonials = [
  {
    name: 'Linh Nguyen',
    role: 'Marketing Director, TechViet',
    avatar: 'LN',
    avatarColor: 'from-violet-500 to-indigo-500',
    text: 'NeeFlow cut our content production time by 70%. The AI captions in Vietnamese are surprisingly natural and on-brand. We manage 12 client channels without breaking a sweat.',
    stars: 5,
  },
  {
    name: 'James Park',
    role: 'Founder, GrowthStack Agency',
    avatar: 'JP',
    avatarColor: 'from-cyan-500 to-blue-500',
    text: 'Switching from Buffer to NeeFlow was a game-changer. The approval workflow alone saved us from 3 client crises. Analytics across all platforms in one view is pure gold.',
    stars: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Social Media Manager, Brand Co.',
    avatar: 'SC',
    avatarColor: 'from-pink-500 to-rose-500',
    text: 'The auto-scheduling and AI chatbot mean my accounts are always active even when I\'m offline. Engagement went up 140% in the first month. Absolutely worth every penny.',
    stars: 5,
  },
]

const stats = [
  { value: '10+', label: 'Platforms Supported', icon: Globe },
  { value: '10x', label: 'Faster Content Creation', icon: Zap },
  { value: '24/7', label: 'AI Auto-Engagement', icon: Bot },
  { value: '100%', label: 'White-Label Ready', icon: Settings },
]

// ── Animated number counter ────────────────────────────────────────────────
function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true)
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null!)
  const statsInView = useInView(statsRef)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        @keyframes pulse-slow { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
        @keyframes slide-x { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        @keyframes gradient-x { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
        .animate-fade-up { animation: fadeUp 0.7s ease both }
        .animate-fade-in { animation: fadeIn 0.8s ease both }
        .animate-float { animation: float 4s ease-in-out infinite }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite }
        .animate-slide-x { animation: slide-x 30s linear infinite }
        .animate-gradient { background-size: 200% 200%; animation: gradient-x 4s ease infinite }
        .delay-100 { animation-delay: 0.1s }
        .delay-200 { animation-delay: 0.2s }
        .delay-300 { animation-delay: 0.3s }
        .delay-400 { animation-delay: 0.4s }
        .delay-500 { animation-delay: 0.5s }
        .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px) }
        .glow { box-shadow: 0 0 40px rgba(79,70,229,0.15) }
        .glow-cyan { box-shadow: 0 0 40px rgba(6,182,212,0.15) }
        .text-gradient { background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text }
        .text-gradient-violet { background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text }
        .btn-primary { background: linear-gradient(135deg, #4F46E5, #06B6D4); transition: all 0.3s ease; transform: translateY(0) }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(79,70,229,0.35) }
        .card-hover { transition: all 0.3s ease }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(0,0,0,0.12) }
        .feature-tab { transition: all 0.25s ease; cursor: pointer }
        .feature-tab.active { background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.1) }
        .marquee-wrap { overflow: hidden; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-fade-in, .animate-float, .animate-pulse-slow, .animate-slide-x { animation: none }
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 60 ? 'glass border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="NeeFlow" width={130} height={36} className="object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer">
                {item}
              </a>
            ))}
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors">
              Privacy
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-100/60 via-violet-50/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-100/50 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-60 left-10 w-48 h-48 bg-violet-100/50 rounded-full blur-3xl animate-pulse-slow delay-300" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%234F46E5\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Social Media Management
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Manage All Your<br />
              <span className="text-gradient">Social Channels</span><br />
              From One Place
            </h1>

            <p className="animate-fade-up delay-200 text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create AI-powered content, schedule posts, track analytics, and engage with your audience — all in one beautiful dashboard. Built for agencies and brands that move fast.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/login" className="btn-primary text-white font-bold px-8 py-4 rounded-2xl text-lg flex items-center gap-2 shadow-2xl w-full sm:w-auto justify-center">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#features" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-semibold text-lg transition-colors px-6 py-4 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 w-full sm:w-auto justify-center">
                <PlayCircle className="w-5 h-5" />
                See How It Works
              </Link>
            </div>

            {/* Trust signal */}
            <div className="animate-fade-up delay-400 flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free plan forever
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Setup in 2 minutes
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="animate-fade-up delay-500 relative mt-16 max-w-5xl mx-auto">
            <div className="relative animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-200/20 to-white rounded-3xl" />
              <Image
                src="/hero-premium.png"
                alt="NeeFlow Dashboard"
                width={1200}
                height={750}
                className="w-full rounded-3xl shadow-2xl glow"
                priority
              />
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 top-1/3 bg-white rounded-2xl shadow-xl p-3 animate-float border border-gray-100" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Engagement</div>
                  <div className="text-sm font-bold text-gray-900">+140%</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 top-1/4 bg-white rounded-2xl shadow-xl p-3 animate-float border border-gray-100" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">AI Posts Today</div>
                  <div className="text-sm font-bold text-gray-900">24 Generated</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 bottom-1/3 bg-white rounded-2xl shadow-xl p-3 animate-float border border-gray-100" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time Saved</div>
                  <div className="text-sm font-bold text-gray-900">45 hrs/week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORMS MARQUEE ─────────────────────────────────────────── */}
      <section className="py-14 border-y border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Publish to all major platforms</p>
        </div>
        <div className="marquee-wrap">
          <div className="flex gap-8 animate-slide-x" style={{ width: 'max-content' }}>
            {[...platforms, ...platforms].map((p, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 px-6 flex-shrink-0`}>
                <div className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center shadow-sm border border-white p-3.5`}>
                  <p.component />
                </div>
                <span className="text-xs text-gray-500 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center transition-all duration-700 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-4xl font-extrabold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">One platform,<br /><span className="text-gradient-violet">every feature</span></h2>
            <p className="text-lg text-gray-500">From creating to scheduling to analyzing — NeeFlow handles the entire social media workflow for you.</p>
          </div>

          {/* Feature tabs + image (big features) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-2 mb-16">
            <div className="grid md:grid-cols-3 gap-2 mb-2">
              {features.slice(0, 3).map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`feature-tab rounded-2xl p-5 text-left ${activeFeature === i ? 'active' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  <div className="mt-3 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {f.stats}
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              {features[activeFeature < 3 ? activeFeature : 0].image && (
                <Image
                  src={features[activeFeature < 3 ? activeFeature : 0].image!}
                  alt={features[activeFeature < 3 ? activeFeature : 0].title}
                  width={1200}
                  height={600}
                  className="w-full object-cover"
                  style={{ maxHeight: '420px', objectFit: 'contain', background: '#f8fafc' }}
                />
              )}
            </div>
          </div>

          {/* Bottom 3 feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {features.slice(3).map((f, i) => (
              <div key={i} className="card-hover bg-white rounded-3xl border border-gray-100 p-7 shadow-sm cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  <TrendingUp className="w-3 h-3" />
                  {f.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECOND CTA BANNER ─────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 animate-gradient">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to save 10+ hours a week?</h2>
          <p className="text-indigo-100 text-lg mb-8">Join thousands of marketers and agencies using NeeFlow to grow faster.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-105">
            Start Free Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-sm font-semibold mb-4">
              <Clock className="w-4 h-4" />
              Get started in minutes
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">How <span className="text-gradient">NeeFlow</span> works</h2>
            <p className="text-lg text-gray-500">Three simple steps to transform your social media workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200" />
            {steps.map((step, i) => (
              <div key={i} className="card-hover relative bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center cursor-pointer">
                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mx-auto mb-5 relative`}>
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-300 tracking-widest mb-2">{step.num}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              Loved by marketers
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">What our <span className="text-gradient">users say</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card-hover bg-white rounded-3xl border border-gray-100 shadow-sm p-8 cursor-pointer">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ───────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Simple pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Plans that <span className="text-gradient">scale with you</span></h2>
            <p className="text-lg text-gray-500">Start free, upgrade anytime. No hidden fees. Cancel anytime.</p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-pulse-slow delay-300" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Start your free account today
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Grow your brand<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">10x faster</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            Join thousands of agencies and brands that trust NeeFlow to manage, create, and grow their social media presence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary text-white font-bold px-10 py-5 rounded-2xl text-xl flex items-center gap-2 shadow-2xl w-full sm:w-auto justify-center">
              Get Started — It&apos;s Free
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free forever plan</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <Image src="/logo.png" alt="NeeFlow" width={130} height={36} className="object-contain brightness-0 invert" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The AI-powered social media management platform for modern agencies and brands.
              </p>
              <div className="flex gap-3">
                {platforms.slice(0, 4).map((p, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <p.component />
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5">
                {['AI Content', 'Scheduling', 'Analytics', 'Inbox', 'Approvals', 'White Label'].map((item) => (
                  <li key={item}>
                    <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Pricing', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="/login" className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <div className="space-y-3">
                <a href="mailto:hello@neeflow.com" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  hello@neeflow.com
                </a>
                <a href="mailto:support@neeflow.com" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  support@neeflow.com
                </a>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Richmond, VA
                </div>
              </div>
              <div className="mt-6">
                <Link href="/login" className="w-full btn-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 justify-center">
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>© {new Date().getFullYear()} NeeFlow — All rights reserved</div>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
