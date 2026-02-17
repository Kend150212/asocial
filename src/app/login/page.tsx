'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isPending, setIsPending] = useState(false)
    const t = useTranslation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsPending(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                // Full page redirect to ensure SessionProvider re-initializes
                window.location.href = '/dashboard'
            }
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Language switcher */}
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
                            <p className="text-sm text-destructive text-center">{error}</p>
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

                        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                            <span>By signing in, you agree to our </span>
                            <a href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</a>
                            <span> and </span>
                            <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Business footer for Facebook verification */}
            <div className="fixed bottom-0 left-0 right-0 text-center py-3 text-xs text-muted-foreground border-t bg-background/80 backdrop-blur-sm">
                <p>© 2026 <strong>Cuong Dao</strong> — <strong>Kendy Marketing LLC</strong></p>
                <p className="mt-1">4706 Kelly Cv, Glen Allen, Virginia 23060, USA</p>
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
