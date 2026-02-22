import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy Policy - AI-powered Social Media Management Platform',
}

const DEFAULT_PRIVACY = `
<h2>1. Introduction</h2>
<p>This Privacy Policy describes how we collect, use, disclose, retain, and protect your personal information when you use this platform.</p>

<h2>2. Information We Collect</h2>
<ul>
<li><strong>Account Data:</strong> Name, email, and password (hashed).</li>
<li><strong>Third-Party Tokens:</strong> OAuth tokens from connected platforms (encrypted with AES-256).</li>
<li><strong>Usage Data:</strong> Log data, device information, and feature usage.</li>
<li><strong>Content:</strong> Text, images, and other content you create or upload.</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use your information to provide the Service, manage your account, interact with connected platforms, process payments, and improve the Service.</p>

<h2>4. Data Sharing</h2>
<p><strong>We do not sell your personal information.</strong> We share data only with your consent, for third-party publishing, AI processing, service providers, and legal requirements.</p>

<h2>5. Data Security</h2>
<p>We implement AES-256 encryption, TLS 1.2+, bcrypt password hashing, and role-based access controls.</p>

<h2>6. Your Rights</h2>
<p>You have the right to access, correct, delete, export, and disconnect your data at any time.</p>

<h2>7. Cookies</h2>
<p>We use only essential cookies for authentication. We do not use tracking or advertising cookies.</p>

<h2>8. Contact</h2>
<p>For privacy questions, please contact support through the platform.</p>
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

export default async function PrivacyPolicyPage() {
    const data = await getLegalContent()
    const privacyHtml = data?.privacyContent || DEFAULT_PRIVACY
    const appName = data?.appName || 'Platform'

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Privacy Policy
                    </a>
                    <nav className="flex gap-4 text-sm text-muted-foreground">
                        <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
                        <a href="/login" className="hover:text-foreground transition-colors">Login</a>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

                <div
                    className="prose prose-neutral dark:prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-blue-500 [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{ __html: privacyHtml }}
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
