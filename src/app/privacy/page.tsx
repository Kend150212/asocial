import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | ASocial',
    description: 'Privacy Policy for ASocial - AI-powered Social Media Management Platform',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        ASocial
                    </a>
                    <nav className="flex gap-4 text-sm text-muted-foreground">
                        <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
                        <a href="/login" className="hover:text-foreground transition-colors">Login</a>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Last updated: February 16, 2025</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ASocial (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;), operated by Kendy Marketing LLC, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use our social media management platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

                        <h3 className="text-lg font-medium mt-4 mb-2">2.1 Account Information</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you create an account, we collect your name, email address, and password (stored securely as a cryptographic hash). We do not store your password in plain text.
                        </p>

                        <h3 className="text-lg font-medium mt-4 mb-2">2.2 Social Media Account Data</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you connect social media accounts (e.g., YouTube, TikTok, Facebook, Instagram), we collect and store:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>OAuth access tokens and refresh tokens (encrypted at rest)</li>
                            <li>Your public profile information (display name, profile picture URL)</li>
                            <li>Account/channel identifiers</li>
                            <li>Content metadata (post titles, descriptions, publish dates)</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-4 mb-2">2.3 Usage Data</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We collect information about how you interact with the Service, including pages visited, features used, and actions taken. This data helps us improve the Service.
                        </p>

                        <h3 className="text-lg font-medium mt-4 mb-2">2.4 Content You Create</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We store content you create, schedule, or publish through the Service, including text, images, and video metadata. This content is processed solely to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">We use your information to:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Provide, maintain, and improve the Service</li>
                            <li>Authenticate your identity and manage your account</li>
                            <li>Connect to and interact with third-party social media platforms on your behalf</li>
                            <li>Schedule and publish content to your connected social media accounts</li>
                            <li>Generate AI-powered content suggestions and analytics</li>
                            <li>Send service-related notifications and updates</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Third-Party Platform Integrations</h2>

                        <h3 className="text-lg font-medium mt-4 mb-2">4.1 YouTube (Google)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the YouTube Data API v3 to access your YouTube channel information. By connecting your YouTube account, you also agree to {' '}
                            <a href="https://policies.google.com/privacy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                Google&apos;s Privacy Policy
                            </a>. You can revoke access at any time through your {' '}
                            <a href="https://myaccount.google.com/permissions" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                Google Account settings
                            </a>.
                        </p>

                        <h3 className="text-lg font-medium mt-4 mb-2">4.2 TikTok</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the TikTok API to access your basic profile information and video list. By connecting your TikTok account, you also agree to {' '}
                            <a href="https://www.tiktok.com/legal/page/us/privacy-policy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                TikTok&apos;s Privacy Policy
                            </a>. We access only the data necessary to provide our service (user profile and video listing). You can disconnect your TikTok account at any time from within ASocial.
                        </p>

                        <h3 className="text-lg font-medium mt-4 mb-2">4.3 Other Platforms</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We integrate with additional platforms including Facebook, Instagram, X (Twitter), LinkedIn, and Pinterest through official APIs. Each integration accesses only the data necessary to provide our content management services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Data Storage and Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>All OAuth tokens and API keys are encrypted at rest using AES-256 encryption</li>
                            <li>Passwords are hashed using bcrypt with salt rounds</li>
                            <li>All data transmission is encrypted using TLS/HTTPS</li>
                            <li>Access to production systems is restricted and monitored</li>
                            <li>Database access is secured with authentication and network restrictions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Data Sharing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not sell, rent, or trade your personal information. We may share your data only in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>With your consent:</strong> When you explicitly authorize us to share data</li>
                            <li><strong>Third-party platforms:</strong> When you publish content through our Service to connected social media platforms</li>
                            <li><strong>AI service providers:</strong> Content you submit for AI processing is sent to our AI providers (e.g., OpenAI, Google Gemini) solely for generating responses</li>
                            <li><strong>Legal requirements:</strong> When required by law, regulation, or valid legal process</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We retain your data for as long as your account is active or as needed to provide the Service. When you delete your account, we will delete your personal data within 30 days, except where retention is required by law. OAuth tokens are immediately revoked upon disconnection of a social media account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
                            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                            <li><strong>Disconnection:</strong> Remove connected social media accounts at any time</li>
                            <li><strong>Export:</strong> Request an export of your data in a portable format</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising cookies. Session cookies are automatically deleted when you close your browser or log out.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">10. Children&apos;s Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete that information promptly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service or by sending you an email. Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <div className="mt-3 p-4 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">Cuong Dao — Kendy Marketing LLC</p>
                            <p className="text-muted-foreground">4706 Kelly Cv, Glen Allen, Virginia 23060, USA</p>
                            <p className="text-muted-foreground">Email: support@kendymarketing.com</p>
                            <p className="text-muted-foreground">Website: https://kendymarketing.com</p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t mt-16">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Cuong Dao — Kendy Marketing LLC. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
