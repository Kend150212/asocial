import { useBranding } from '@/lib/use-branding'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const branding = useBranding()
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto">
                        <Image src={branding.logoUrl} alt={branding.appName} width={56} height={56} className="rounded-xl" unoptimized />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Password reset is not yet configured. Please contact your administrator to reset your password.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            disabled
                        />
                    </div>

                    <Button className="w-full" size="lg" disabled>
                        Send Reset Link
                    </Button>

                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
