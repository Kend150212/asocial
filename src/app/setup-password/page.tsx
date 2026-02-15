'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, EyeOff, Check, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

function SetupPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const t = useTranslation()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    // Validate token on load
    useEffect(() => {
        if (!token) {
            setError(t('setupPassword.invalidToken'))
            setLoading(false)
            return
        }

        fetch(`/api/auth/setup-password?token=${token}`)
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json()
                    if (res.status === 410) {
                        setError(t('setupPassword.tokenExpired'))
                    } else {
                        setError(t('setupPassword.invalidToken'))
                    }
                    return
                }
                const data = await res.json()
                setUserInfo(data)
            })
            .catch(() => setError(t('setupPassword.invalidToken')))
            .finally(() => setLoading(false))
    }, [token, t])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) return
        if (password.length < 6) return

        setSaving(true)
        try {
            const res = await fetch('/api/auth/setup-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || t('setupPassword.error'))
                return
            }

            setSuccess(true)
            // Redirect to login after 3 seconds
            setTimeout(() => router.push('/login'), 3000)
        } catch {
            setError(t('setupPassword.error'))
        } finally {
            setSaving(false)
        }
    }

    const passwordsMatch = password.length > 0 && password === confirmPassword
    const passwordLongEnough = password.length >= 6

    // ─── Loading ─────────────────────────────────
    if (loading) {
        return (
            <Card className="w-full max-w-md relative">
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    // ─── Error ───────────────────────────────────
    if (error && !userInfo) {
        return (
            <Card className="w-full max-w-md relative">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto">
                        <Image src="/logo.png" alt="ASocial" width={56} height={56} className="rounded-xl" unoptimized />
                    </div>
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">{t('setupPassword.invalidTitle')}</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Link href="/login">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {t('setupPassword.backToLogin')}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    // ─── Success ─────────────────────────────────
    if (success) {
        return (
            <Card className="w-full max-w-md relative">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto">
                        <Image src="/logo.png" alt="ASocial" width={56} height={56} className="rounded-xl" unoptimized />
                    </div>
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="h-7 w-7 text-emerald-500" />
                    </div>
                    <CardTitle className="text-xl text-emerald-500">{t('setupPassword.successTitle')}</CardTitle>
                    <CardDescription>{t('setupPassword.successDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Link href="/login">
                        <Button className="gap-2">
                            {t('setupPassword.goToLogin')}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    // ─── Form ────────────────────────────────────
    return (
        <Card className="w-full max-w-md relative">
            <CardHeader className="space-y-3 text-center">
                <div className="mx-auto">
                    <Image src="/logo.png" alt="ASocial" width={56} height={56} className="rounded-xl" unoptimized />
                </div>
                <CardTitle className="text-2xl font-bold">{t('setupPassword.title')}</CardTitle>
                <CardDescription>{t('setupPassword.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* User info */}
                {userInfo && (
                    <div className="rounded-lg border bg-muted/30 p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{userInfo.name}</p>
                                <p className="text-sm text-muted-foreground">{userInfo.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {t(`users.roles.${userInfo.role}`)}
                            </Badge>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('setupPassword.newPassword')}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('setupPassword.passwordPlaceholder')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {password.length > 0 && !passwordLongEnough && (
                            <p className="text-xs text-destructive">{t('setupPassword.minLength')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('setupPassword.confirmPassword')}</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('setupPassword.confirmPlaceholder')}
                        />
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <p className="text-xs text-destructive">{t('setupPassword.passwordMismatch')}</p>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={saving || !passwordsMatch || !passwordLongEnough}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('common.loading')}
                            </>
                        ) : (
                            t('setupPassword.setPassword')
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function SetupPasswordPage() {
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

            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            }>
                <SetupPasswordForm />
            </Suspense>
        </div>
    )
}
