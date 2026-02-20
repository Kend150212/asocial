'use client'

import { useBranding } from '@/lib/use-branding'

import { useState, Suspense, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

// Google SVG icon
function GoogleIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [showGoogleBtn, setShowGoogleBtn] = useState(false)
    const t = useTranslation()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/choose'
    const justRegistered = searchParams.get('registered') === '1'

    useEffect(() => {
        fetch('/api/auth/providers')
            .then(r => r.json())
            .then(providers => { if (providers?.google) setShowGoogleBtn(true) })
            .catch(() => { })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsPending(true)
        try {
            const result = await signIn('credentials', { email, password, redirect: false })
            if (result?.error) {
                setError(t('auth.invalidCredentials'))
            } else {
                window.location.href = callbackUrl
            }
        } catch {
            setError(t('auth.genericError'))
        } finally {
            setIsPending(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        await signIn('google', { callbackUrl })
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left panel — branding + register CTA */}
            <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-primary/90 to-blue-700 text-white p-10 relative overflow-hidden">
                {/* Decorative blurs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-10 -left-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
                </div>

                {/* Logo + name */}
                <div className="relative">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src={branding.logoUrl} alt={branding.appName} width={40} height={40} className="rounded-xl" unoptimized />
                        <span className="text-xl font-bold tracking-tight">{branding.appName}</span>
                    </Link>
                </div>

                {/* Middle content */}
                <div className="relative space-y-6">
                    <h2 className="text-3xl font-bold leading-snug">
                        Manage all your social media{' '}
                        <span className="text-cyan-200">in one place</span>
                    </h2>
                    <p className="text-white/70 leading-relaxed text-sm">
                        AI-powered scheduling, content generation, and analytics across Facebook, Instagram, YouTube, TikTok, and more.
                    </p>

                    <ul className="space-y-3">
                        {[
                            'Free plan — no credit card required',
                            'AI content generation in EN & VI',
                            'Schedule posts 24/7 automatically',
                            'Google Drive media storage included',
                        ].map(item => (
                            <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                                <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div className="pt-2">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-xl bg-white text-primary px-6 py-3 text-sm font-semibold shadow-lg hover:bg-white/90 transition-all duration-200"
                        >
                            <Sparkles className="h-4 w-4" />
                            Create Free Account
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative text-xs text-white/40">
                    © 2026 Kendy Marketing LLC, Virginia USA
                </div>
            </div>

            {/* Right panel — sign in form */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 relative">
                <div className="fixed top-4 right-4 z-10">
                    <LanguageSwitcher />
                </div>

                <div className="mx-auto w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <Image src={branding.logoUrl} alt={branding.appName} width={36} height={36} className="rounded-xl" unoptimized />
                        <span className="text-lg font-bold">{branding.appName}</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
                    </div>

                    {/* Success banner after registration */}
                    {justRegistered && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg px-3 py-2.5 mb-5 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {t('register.success')}
                        </div>
                    )}

                    {/* Google */}
                    {showGoogleBtn && (
                        <div className="mb-5">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                            >
                                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                {t('auth.signInGoogle')}
                            </Button>

                            <div className="relative mt-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder={t('auth.emailPlaceholder')}
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('auth.password')}</Label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {t('auth.forgotPassword')}
                                </a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                        )}

                        <Button type="submit" className="w-full mt-1" disabled={isPending} size="lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('auth.signIn')}
                        </Button>
                    </form>

                    {/* Register link */}
                    <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            {t('auth.noAccount')}
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors px-5 py-2.5 text-sm font-semibold w-full justify-center"
                        >
                            <Sparkles className="h-4 w-4" />
                            {t('auth.createAccount')}
                        </Link>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        {t('auth.terms.prefix')}{' '}
                        <a href="/terms" className="underline hover:text-primary transition-colors">{t('auth.terms.service')}</a>
                        {' '}{t('auth.terms.and')}{' '}
                        <a href="/privacy" className="underline hover:text-primary transition-colors">{t('auth.terms.privacy')}</a>
                    </p>
                </div>

                {/* Mobile footer */}
                <div className="mt-auto pt-8 text-center text-xs text-muted-foreground lg:hidden">
                    © 2026 Kendy Marketing LLC, Virginia USA
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const branding = useBranding()
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
