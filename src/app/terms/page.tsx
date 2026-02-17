import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | ASocial',
    description: 'Terms of Service for ASocial - AI-powered Social Media Management Platform',
}

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        ASocial
                    </a>
                    <nav className="flex gap-4 text-sm text-muted-foreground">
                        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="/login" className="hover:text-foreground transition-colors">Login</a>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-muted-foreground mb-8">Last updated: February 16, 2025</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using ASocial (&quot;the Service&quot;), a product of Kendy Marketing LLC, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ASocial is an AI-powered social media management platform that enables users to manage, schedule, and publish content across multiple social media platforms including but not limited to Facebook, Instagram, YouTube, TikTok, X (Twitter), LinkedIn, and Pinterest. The Service includes features for content creation, audience analytics, and multi-channel publishing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To use the Service, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Third-Party Platform Integrations</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service integrates with third-party social media platforms through their official APIs and OAuth protocols. By connecting your social media accounts, you authorize ASocial to access and manage your content on those platforms in accordance with the permissions you grant. You acknowledge that your use of third-party platforms is also subject to their respective terms of service and policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. User Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You retain all rights to the content you create, upload, or publish through the Service. By using ASocial, you grant us a limited, non-exclusive license to process and transmit your content solely for the purpose of providing the Service. We do not claim ownership of your content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) post or transmit content that is illegal, harmful, threatening, abusive, or otherwise objectionable; (c) impersonate any person or entity; (d) interfere with or disrupt the Service or its infrastructure; (e) attempt to gain unauthorized access to any part of the Service; or (f) use the Service for spam or unsolicited communications.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service may include AI-powered features for content generation and suggestions. AI-generated content is provided as-is and you are solely responsible for reviewing, editing, and approving any content before publishing. ASocial does not guarantee the accuracy, appropriateness, or legality of AI-generated content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement industry-standard security measures to protect your data, including encryption of sensitive information such as API keys and OAuth tokens. However, no method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">9. Service Availability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We strive to maintain continuous availability of the Service but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any loss or damage resulting from service interruptions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To the maximum extent permitted by law, ASocial and Kendy Marketing LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of data, revenue, or business opportunities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">11. Modifications to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify these Terms of Service at any time. Changes will be effective upon posting to this page. Your continued use of the Service after changes are posted constitutes acceptance of the modified terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">12. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may suspend or terminate your access to the Service at any time for violation of these terms or for any other reason at our discretion. Upon termination, your right to use the Service will immediately cease. You may also delete your account at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms of Service shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia, United States, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about these Terms of Service, please contact us at:
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
