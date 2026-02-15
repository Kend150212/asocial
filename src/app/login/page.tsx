'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { authenticate } from './actions'

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
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
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="redirectTo" value="/dashboard" />
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@asocial.app"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-destructive text-center">{errorMessage}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending} size="lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>

                        <div className="text-center">
                            <a
                                href="/forgot-password"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Forgot password?
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
