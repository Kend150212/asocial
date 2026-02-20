'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ArrowRight, ArrowLeft, ShieldCheck, UserPlus } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from '@/lib/i18n'

type Step = 'details' | 'otp'

export default function RegisterPage() {
    const t = useTranslation()
    const router = useRouter()
    const [step, setStep] = useState<Step>('details')

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [otpError, setOtpError] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
            return () => clearTimeout(t)
        }
    }, [resendCooldown])

    const getLocale = () => (typeof window !== 'undefined' ? localStorage.getItem('locale') || 'en' : 'en')

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password, confirmPassword, termsAccepted, locale: getLocale() }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Something went wrong')
                return
            }
            setStep('otp')
            setResendCooldown(60)
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpInput = (idx: number, value: string) => {
        // Handle paste
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6).split('')
            const newOtp = [...otp]
            digits.forEach((d, i) => { if (idx + i < 6) newOtp[idx + i] = d })
            setOtp(newOtp)
            otpRefs.current[Math.min(idx + digits.length, 5)]?.focus()
            return
        }
        const digit = value.replace(/\D/g, '')
        const newOtp = [...otp]
        newOtp[idx] = digit
        setOtp(newOtp)
        if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
    }

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus()
        }
    }

    const handleVerify = async () => {
        setOtpError('')
        const code = otp.join('')
        if (code.length < 6) {
            setOtpError(t('register.enterAllDigits'))
            return
        }
        setVerifying(true)
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, locale: getLocale() }),
            })
            const data = await res.json()
            if (!res.ok) {
                setOtpError(data.error || 'Verification failed')
                return
            }
            router.push('/login?registered=1')
        } catch {
            setOtpError('Network error. Please try again.')
        } finally {
            setVerifying(false)
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return
        setOtpError('')
        setLoading(true)
        try {
            await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password, confirmPassword, termsAccepted, locale: getLocale() }),
            })
            setOtp(['', '', '', '', '', ''])
            setResendCooldown(60)
            otpRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
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
                        <Image src="/logo.png" alt="ASocial" width={48} height={48} className="rounded-xl" unoptimized />
                    </div>
                    <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                        {step === 'details' ? (
                            <><UserPlus className="h-5 w-5" /> {t('register.title')}</>
                        ) : (
                            <><ShieldCheck className="h-5 w-5 text-primary" /> {t('register.verifyTitle')}</>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {step === 'details'
                            ? t('register.subtitle')
                            : `${t('register.enterCodePrefix')} ${email}`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 'details' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="firstName">{t('register.firstName')} *</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="John"
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lastName">{t('register.lastName')} *</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        required
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">{t('auth.email')} *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">{t('register.password')} *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">{t('register.confirmPassword')} *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            {/* Terms checkbox */}
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="terms"
                                    checked={termsAccepted}
                                    onCheckedChange={v => setTermsAccepted(!!v)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                                    {t('register.termsPrefix')}{' '}
                                    <Link href="/terms" className="text-primary hover:underline" target="_blank">
                                        {t('register.termsLink')}
                                    </Link>{' '}
                                    {t('register.termsAnd')}{' '}
                                    <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                                        {t('register.privacyLink')}
                                    </Link>
                                </Label>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                            )}

                            <Button type="submit" className="w-full gap-2" disabled={loading || !termsAccepted}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                {t('register.sendCode')}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                {t('register.haveAccount')}{' '}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    {t('auth.signIn')}
                                </Link>
                            </p>
                        </form>
                    ) : (
                        /* OTP Step */
                        <div className="space-y-5">
                            {/* 6-digit input */}
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={el => { otpRefs.current[idx] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleOtpInput(idx, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                                        onFocus={e => e.target.select()}
                                        className="w-11 h-14 text-center text-2xl font-bold border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 text-center">{otpError}</p>
                            )}

                            <Button onClick={handleVerify} className="w-full gap-2" disabled={verifying || otp.join('').length < 6}>
                                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                {t('register.verify')}
                            </Button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep('details')}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="h-3 w-3" /> {t('common.back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || loading}
                                    className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                                >
                                    {resendCooldown > 0
                                        ? `${t('register.resend')} (${resendCooldown}s)`
                                        : t('register.resend')}
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
