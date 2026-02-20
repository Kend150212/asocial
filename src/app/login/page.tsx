'use client'

import { useState, Suspense, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2 } from 'lucide-react'
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

    // Check if Google provider is enabled (env vars loaded)
    useEffect(() => {
        fetch('/api/auth/providers')
            .then(r => r.json())
            .then(providers => {
                if (providers?.google) setShowGoogleBtn(true)
            })
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
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="fixed top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>

            <Card className="w-full max-w-md relative">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto">
                        <Image src="/logo.png" alt="ASocial" width={56} height={56} className="rounded-xl" unoptimized />
                    </div>
                    <CardTitle className="text-2xl font-bold">ASocial</CardTitle>
                    <CardDescription>Social Media Management Platform</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Success message after registration */}
                    {justRegistered && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-md px-3 py-2.5 mb-4 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {t('register.success')}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.password')}</Label>
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

                        <Button type="submit" className="w-full" disabled={isPending} size="lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('auth.signIn')}
                        </Button>

                        <div className="text-center">
                            <a
                                href="/forgot-password"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                {t('auth.forgotPassword')}
                            </a>
                        </div>

                        {/* Google Sign-In */}
                        {showGoogleBtn && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                                    </div>
                                </div>
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
                            </>
                        )}

                        {/* Register link */}
                        <p className="text-center text-sm text-muted-foreground pt-2 border-t">
                            {t('auth.noAccount')}{' '}
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                {t('auth.createAccount')}
                            </Link>
                        </p>

                        <div className="text-center text-xs text-muted-foreground">
                            <span>{t('auth.terms.prefix')} </span>
                            <a href="/terms" className="underline hover:text-primary transition-colors">{t('auth.terms.service')}</a>
                            <span> {t('auth.terms.and')} </span>
                            <a href="/privacy" className="underline hover:text-primary transition-colors">{t('auth.terms.privacy')}</a>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Business footer */}
            <div className="fixed bottom-0 left-0 right-0 text-center py-3 text-xs text-muted-foreground border-t bg-background/80 backdrop-blur-sm">
                <p>© 2026 <strong>Cuong Dao</strong> — <strong>Kendy Marketing LLC</strong></p>
                <p className="mt-1">Virginia, USA</p>
                <p className="mt-1">
                    <a href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</a>
                    {' · '}
                    <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>
                    {' · '}
                    <a href="mailto:support@kendymarketing.com" className="underline hover:text-primary transition-colors">support@kendymarketing.com</a>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
