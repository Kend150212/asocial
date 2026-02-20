'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface Profile {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    image: string | null
    role: string
    createdAt: string
}

function Avatar({ name, image }: { name: string | null; image: string | null }) {
    if (image) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={image} alt={name || 'Avatar'} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
    }
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '??'
    return (
        <div className="h-20 w-20 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {initials}
        </div>
    )
}

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession()
    const t = useTranslation()

    const [profile, setProfile] = useState<Profile | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(true)

    // Personal info state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [savingInfo, setSavingInfo] = useState(false)
    const [infoSuccess, setInfoSuccess] = useState(false)
    const [infoError, setInfoError] = useState('')

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [savingPw, setSavingPw] = useState(false)
    const [pwSuccess, setPwSuccess] = useState(false)
    const [pwError, setPwError] = useState('')

    useEffect(() => {
        fetch('/api/user/profile')
            .then(r => r.json())
            .then(data => {
                setProfile(data)
                setFirstName(data.firstName || data.name?.split(' ')[0] || '')
                setLastName(data.lastName || data.name?.split(' ').slice(1).join(' ') || '')
            })
            .finally(() => setLoadingProfile(false))
    }, [])

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault()
        setInfoError('')
        setInfoSuccess(false)
        setSavingInfo(true)
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName }),
            })
            const data = await res.json()
            if (!res.ok) { setInfoError(data.error); return }
            setProfile(p => p ? { ...p, firstName, lastName, name: data.name } : p)
            setInfoSuccess(true)
            await updateSession()
            setTimeout(() => setInfoSuccess(false), 3000)
        } catch {
            setInfoError('Network error')
        } finally {
            setSavingInfo(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwError('')
        setPwSuccess(false)
        setSavingPw(true)
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
            })
            const data = await res.json()
            if (!res.ok) { setPwError(data.error); return }
            setPwSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
            setTimeout(() => setPwSuccess(false), 3000)
        } catch {
            setPwError('Network error')
        } finally {
            setSavingPw(false)
        }
    }

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const isGoogleUser = !profile?.image?.includes('googleusercontent.com') ? false : true
    const roleBadge = session?.user?.role || ''

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('profile.subtitle')}</p>
            </div>

            {/* Avatar + basic info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-5">
                        <Avatar name={profile?.name || null} image={profile?.image || null} />
                        <div>
                            <p className="text-lg font-semibold">{profile?.name || '—'}</p>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                            <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {roleBadge}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        {t('profile.personalInfo')}
                    </CardTitle>
                    <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveInfo} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">{t('register.firstName')}</Label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">{t('register.lastName')}</Label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email — read only */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" /> {t('auth.email')}
                            </Label>
                            <Input
                                id="email"
                                value={profile?.email || ''}
                                disabled
                                className="opacity-60 cursor-not-allowed"
                            />
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {t('profile.emailNote')}
                            </p>
                        </div>

                        {infoError && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{infoError}</p>
                        )}
                        {infoSuccess && (
                            <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />{t('profile.saveSuccess')}
                            </p>
                        )}

                        <Button type="submit" disabled={savingInfo}>
                            {savingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('profile.saveChanges')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password */}
            {!isGoogleUser && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-4 w-4" />
                            {t('profile.changePassword')}
                        </CardTitle>
                        <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="currentPw">{t('profile.currentPassword')}</Label>
                                <Input
                                    id="currentPw"
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="newPw">{t('profile.newPassword')}</Label>
                                <Input
                                    id="newPw"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmNewPw">{t('profile.confirmNewPassword')}</Label>
                                <Input
                                    id="confirmNewPw"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={e => setConfirmNewPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            {pwError && (
                                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{pwError}</p>
                            )}
                            {pwSuccess && (
                                <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />{t('profile.passwordChanged')}
                                </p>
                            )}

                            <Button type="submit" disabled={savingPw}>
                                {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('profile.changePassword')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
