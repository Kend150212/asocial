import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service - AI-powered Social Media Management Platform',
}

const DEFAULT_TERMS = `
<h2>1. Agreement to Terms</h2>
<p>These Terms of Service ("Terms") constitute a legally binding agreement between you and the operator of this platform. By accessing or using the platform, you agree to be bound by these Terms and our <a href="/privacy">Privacy Policy</a>.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 16 years old and have the legal capacity to enter into a binding contract to use this Service.</p>

<h2>3. Description of Service</h2>
<p>This is an AI-powered social media management platform for multi-platform content management, publishing, and analytics.</p>

<h2>4. User Content</h2>
<p>You retain ownership of all content you create or upload. You grant us a limited license to use your content solely for providing the Service.</p>

<h2>5. AI-Generated Content</h2>
<p>AI-generated content is provided "as-is." You are responsible for reviewing and approving all AI-generated content before publishing.</p>

<h2>6. Acceptable Use</h2>
<p>You agree not to use the Service for any illegal, harmful, or unauthorized purposes.</p>

<h2>7. Disclaimer</h2>
<p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>

<h2>8. Contact</h2>
<p>For questions about these Terms, please contact support through the platform.</p>
`

async function getLegalContent() {
    try {
        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const proto = headersList.get('x-forwarded-proto') || 'http'
        const res = await fetch(`${proto}://${host}/api/admin/legal`, {
            cache: 'no-store',
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export default async function TermsOfServicePage() {
    const data = await getLegalContent()
    const termsHtml = data?.termsContent || DEFAULT_TERMS
    const appName = data?.appName || 'Platform'

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Terms of Service
                    </a>
                    <nav className="flex gap-4 text-sm text-muted-foreground">
                        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="/login" className="hover:text-foreground transition-colors">Login</a>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

                <div
                    className="prose prose-neutral dark:prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-blue-500 [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{ __html: termsHtml }}
                />
            </main>

            {/* Footer */}
            <footer className="border-t mt-16">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
