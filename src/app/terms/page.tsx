import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
    title: 'Terms of Service — NeeFlow',
    description: 'NeeFlow Terms of Service: Your rights and obligations when using our AI-powered social media management platform.',
}

const sections = [
    {
        id: 'agreement',
        title: '1. Agreement to Terms',
        content: `
        <p>These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and NeeFlow ("we," "us," "our," or "Company"), the operator of the NeeFlow platform accessible at <strong>neeflow.com</strong> and its associated APIs and mobile applications (collectively, the "Service").</p>
        <p>By creating an account, accessing, or using the Service in any way, you agree to be bound by these Terms and our <a href="/privacy">Privacy Policy</a>, which is incorporated herein by reference. If you are using NeeFlow on behalf of an organization, you represent and warrant that you are authorized to bind that organization to these Terms.</p>
        <p><strong>If you do not agree to these Terms, you must not access or use the Service.</strong></p>
        `
    },
    {
        id: 'eligibility',
        title: '2. Eligibility & Account Registration',
        content: `
        <h4>2.1 Eligibility</h4>
        <p>You must be at least <strong>16 years of age</strong> to use the Service. By using NeeFlow, you represent and warrant that you meet this requirement and have the legal capacity to enter into a binding agreement.</p>
        <h4>2.2 Account Registration</h4>
        <ul>
            <li>You must provide accurate, current, and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</li>
            <li>You must promptly notify us at <a href="mailto:support@neeflow.com">support@neeflow.com</a> of any unauthorized use of your account.</li>
            <li>You may not share your account credentials with others or allow others to access your account.</li>
        </ul>
        <h4>2.3 Account Types</h4>
        <p>NeeFlow supports multiple account roles within a Channel workspace: <strong>Admin, Manager, Editor, Viewer, and Analyst</strong>. Each role has specific permissions as defined within the platform. Workspace admins are responsible for managing team member access and permissions.</p>
        `
    },
    {
        id: 'service-description',
        title: '3. Description of the Service',
        content: `
        <p>NeeFlow is an AI-powered social media management platform that enables users to:</p>
        <ul>
            <li><strong>Multi-Platform Publishing:</strong> Create, schedule, and publish content to Facebook, Instagram, TikTok, YouTube, LinkedIn, X (Twitter), and Pinterest from a single dashboard.</li>
            <li><strong>AI Content Generation:</strong> Generate social media captions, hashtags, content ideas, and images using integrated AI providers including OpenAI, Google Gemini, Runware, and others.</li>
            <li><strong>Content Scheduling:</strong> Schedule posts manually or using AI-powered auto-scheduling that determines optimal posting times based on audience engagement data.</li>
            <li><strong>Analytics & Reporting:</strong> View aggregated analytics including follower growth, engagement rate, reach, and platform-level breakdowns.</li>
            <li><strong>Inbox Management:</strong> Manage comments and direct messages across connected platforms from a unified inbox.</li>
            <li><strong>AI Chat Bot:</strong> Configure automated AI-powered responses for incoming messages on connected social media accounts.</li>
            <li><strong>Approval Workflows:</strong> Manage content review and approval flows between team members and external stakeholders.</li>
            <li><strong>Client Portal:</strong> Allow clients to review, comment on, and approve content before publication.</li>
            <li><strong>White Label:</strong> Enterprise and qualifying plans may rebrand the Service with their own branding (subject to plan features).</li>
        </ul>
        <p>The specific features available to you depend on your subscription plan. We reserve the right to modify, add, or remove features at any time with reasonable notice.</p>
        `
    },
    {
        id: 'subscriptions',
        title: '4. Subscriptions, Billing & Payments',
        content: `
        <h4>4.1 Subscription Plans</h4>
        <p>NeeFlow offers multiple subscription tiers (Free, Pro, Business, Enterprise) with different feature limits and usage quotas as described on our <a href="/pricing">Pricing page</a>. The Free plan provides limited access to core features. Paid plans unlock additional channels, AI usage, team members, and features.</p>
        <h4>4.2 Billing</h4>
        <ul>
            <li>Paid subscriptions are billed on a monthly or annual basis depending on your chosen plan cycle.</li>
            <li>Payment processing is handled exclusively by <strong>Stripe</strong>. By subscribing, you agree to Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener">Terms of Service</a>.</li>
            <li>All prices are in USD unless otherwise stated. We are not responsible for currency conversion fees charged by your bank or card provider.</li>
        </ul>
        <h4>4.3 Renewals & Cancellation</h4>
        <ul>
            <li>Subscriptions auto-renew at the end of each billing period unless cancelled.</li>
            <li>You may cancel your subscription at any time from your account billing settings. Cancellation takes effect at the end of the current billing period — you retain access until then.</li>
            <li>We do not offer refunds for partial billing periods unless required by applicable law.</li>
        </ul>
        <h4>4.4 Free Trial</h4>
        <p>We may offer free trials at our discretion. Free trials automatically convert to a paid subscription at the end of the trial period unless you cancel beforehand.</p>
        <h4>4.5 Price Changes</h4>
        <p>We reserve the right to change pricing with 30 days' advance notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.</p>
        `
    },
    {
        id: 'user-content',
        title: '5. User Content & Ownership',
        content: `
        <h4>5.1 Your Content</h4>
        <p>You retain full ownership of all content you create, upload, or publish through NeeFlow ("User Content"), including posts, images, videos, and captions. NeeFlow does not claim ownership over your content.</p>
        <h4>5.2 License to NeeFlow</h4>
        <p>By using the Service, you grant NeeFlow a <strong>limited, non-exclusive, royalty-free, worldwide license</strong> to store, process, transmit, and display your User Content solely as necessary to provide and operate the Service on your behalf. This license terminates when you delete your content or close your account.</p>
        <h4>5.3 AI-Generated Content</h4>
        <ul>
            <li>Content generated by AI tools within NeeFlow is provided as a creative aid and starting point. <strong>You are solely responsible for reviewing, editing, and ensuring the accuracy and appropriateness of all AI-generated content before publication.</strong></li>
            <li>AI providers used by NeeFlow (OpenAI, Google Gemini, etc.) may have their own usage policies that apply to generated content.</li>
            <li>NeeFlow does not guarantee that AI-generated content is free from errors, biases, copyright issues, or policy violations.</li>
        </ul>
        <h4>5.4 Content Responsibility</h4>
        <p>You are solely responsible for all User Content and AI-generated content published through your NeeFlow account. You represent and warrant that your content does not violate any applicable laws or third-party rights.</p>
        `
    },
    {
        id: 'acceptable-use',
        title: '6. Acceptable Use Policy',
        content: `
        <p>You agree NOT to use the Service to:</p>
        <ul>
            <li>Publish, distribute, or promote content that is illegal, harmful, threatening, abusive, harassing, defamatory, or discriminatory.</li>
            <li>Violate the terms of service of any connected social media platform (Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Pinterest).</li>
            <li>Spam or send unsolicited bulk messages through connected social media accounts.</li>
            <li>Infringe intellectual property rights, including publishing copyrighted content without authorization.</li>
            <li>Publish or promote misinformation, disinformation, or deliberately false content.</li>
            <li>Attempt to gain unauthorized access to NeeFlow systems, other users' accounts, or connected platform APIs beyond your permitted scope.</li>
            <li>Use the Service to generate or distribute malicious code, malware, or phishing content.</li>
            <li>Reverse-engineer, decompile, or create derivative works based on any part of the NeeFlow platform.</li>
            <li>Resell, sublicense, or redistribute access to the Service without written authorization from NeeFlow.</li>
            <li>Use NeeFlow to circumvent or abuse social media platform rate limits or API policies.</li>
        </ul>
        <p>Violation of this Acceptable Use Policy may result in immediate account suspension or termination without refund.</p>
        `
    },
    {
        id: 'third-party',
        title: '7. Third-Party Integrations & Platform APIs',
        content: `
        <h4>7.1 Social Media Platforms</h4>
        <p>NeeFlow integrates with third-party social media platforms via their official APIs. By connecting your social media accounts to NeeFlow, you agree to comply with each platform's developer policies and terms of service:</p>
        <ul>
            <li>Facebook & Instagram: Meta Platform Terms</li>
            <li>TikTok: TikTok for Developers Terms</li>
            <li>YouTube: Google API Services Terms</li>
            <li>LinkedIn: LinkedIn API Terms of Use</li>
            <li>X (Twitter): X Developer Agreement</li>
            <li>Pinterest: Pinterest API Terms</li>
        </ul>
        <h4>7.2 API Limitations</h4>
        <p>Third-party platform APIs may impose rate limits, content restrictions, or publishing restrictions that are outside NeeFlow's control. NeeFlow is not responsible for publishing failures caused by third-party API limitations, policy changes, or platform outages.</p>
        <h4>7.3 AI Providers</h4>
        <p>AI features are powered by third-party AI providers. The quality, accuracy, and availability of AI-generated content depend on these providers. NeeFlow provides no warranty regarding AI output quality or availability.</p>
        `
    },
    {
        id: 'intellectual-property',
        title: '8. Intellectual Property',
        content: `
        <p>The NeeFlow platform — including its software, design, interface, branding, logos, and documentation — is protected by copyright, trademark, patent, and other intellectual property laws. All rights are reserved by NeeFlow and its licensors.</p>
        <p>You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, sublicense, sell, or commercially exploit any portion of the Service without our express prior written consent.</p>
        <p>NeeFlow respects intellectual property rights. If you believe any content on the Service infringes your copyright, please contact <a href="mailto:legal@neeflow.com">legal@neeflow.com</a> with a detailed notice.</p>
        `
    },
    {
        id: 'disclaimers',
        title: '9. Disclaimers & Limitation of Liability',
        content: `
        <h4>9.1 Service Disclaimer</h4>
        <p>THE SERVICE IS PROVIDED ON AN <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED SERVICE.</p>
        <h4>9.2 Social Media Platform Changes</h4>
        <p>Social media platforms frequently change their APIs, algorithms, and policies. NeeFlow is not liable for any loss of reach, engagement, or business impact resulting from changes to third-party platforms.</p>
        <h4>9.3 Limitation of Liability</h4>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEEFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL. IN NO EVENT SHALL NEEFLOW'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
        `
    },
    {
        id: 'security',
        title: '10. Security Responsibilities',
        content: `
        <h4>10.1 Our Commitment</h4>
        <p>NeeFlow implements industry-standard security measures including AES-256 encryption for stored credentials, TLS 1.2+ for data in transit, bcrypt password hashing, and role-based access controls. We conduct regular security reviews and promptly address identified vulnerabilities.</p>
        <h4>10.2 Your Responsibilities</h4>
        <ul>
            <li>Use a strong, unique password for your NeeFlow account.</li>
            <li>Do not share your login credentials with unauthorized individuals.</li>
            <li>Manage team member access and revoke permissions when members leave your organization.</li>
            <li>Report any suspected security vulnerabilities to <a href="mailto:security@neeflow.com">security@neeflow.com</a>.</li>
            <li>Ensure team members using NeeFlow are trained on basic security practices.</li>
        </ul>
        <h4>10.3 Incident Response</h4>
        <p>In the event of a confirmed security incident affecting your data, NeeFlow will notify you within 72 hours of becoming aware of the incident, as required by applicable law.</p>
        `
    },
    {
        id: 'termination',
        title: '11. Account Suspension & Termination',
        content: `
        <h4>11.1 Termination by You</h4>
        <p>You may close your account at any time from account settings. Upon closure, your data will be retained for 30 days in a deactivated state (allowing reactivation), after which it will be permanently deleted.</p>
        <h4>11.2 Termination by NeeFlow</h4>
        <p>We reserve the right to suspend or terminate your account with or without notice if:</p>
        <ul>
            <li>You violate these Terms or our Acceptable Use Policy.</li>
            <li>You engage in fraudulent, abusive, or illegal activity.</li>
            <li>Your use of the Service causes harm to other users or third parties.</li>
            <li>Required by law or applicable regulations.</li>
        </ul>
        <h4>11.3 Effect of Termination</h4>
        <p>Upon termination, your right to access the Service immediately ceases. Connected social media accounts will be automatically disconnected. We may retain certain data as required by law or for legitimate business purposes as described in our Privacy Policy.</p>
        `
    },
    {
        id: 'governing-law',
        title: '12. Governing Law & Dispute Resolution',
        content: `
        <p>These Terms are governed by the laws of the <strong>Commonwealth of Virginia, United States</strong>, without regard to conflict of law principles.</p>
        <p>Any dispute arising from or related to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in accordance with the American Arbitration Association (AAA) Commercial Arbitration Rules, except that either party may seek injunctive relief in a court of competent jurisdiction for intellectual property infringement or urgent matters.</p>
        <p><strong>Class Action Waiver:</strong> You agree to resolve disputes with NeeFlow on an individual basis only and waive any right to bring or participate in a class action lawsuit.</p>
        `
    },
    {
        id: 'general',
        title: '13. General Provisions',
        content: `
        <h4>13.1 Changes to Terms</h4>
        <p>We may update these Terms at any time. Material changes will be notified via email and/or in-app notification at least 14 days before taking effect. Continued use of the Service after changes constitute acceptance.</p>
        <h4>13.2 Entire Agreement</h4>
        <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and NeeFlow regarding the Service.</p>
        <h4>13.3 Severability</h4>
        <p>If any provision of these Terms is found invalid or unenforceable, the remaining provisions continue in full force and effect.</p>
        <h4>13.4 Waiver</h4>
        <p>Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision.</p>
        <h4>13.5 Contact</h4>
        <p>For questions about these Terms: <a href="mailto:legal@neeflow.com">legal@neeflow.com</a> | <a href="mailto:support@neeflow.com">support@neeflow.com</a> | Richmond, VA, United States</p>
        `
    },
]

export default function TermsOfServicePage() {
    const lastUpdated = 'February 22, 2025'

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                .prose-content h4 { font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
                .prose-content p { line-height: 1.75; margin-bottom: 0.9rem; }
                .prose-content ul { padding-left: 1.25rem; margin-bottom: 0.9rem; }
                .prose-content li { margin-bottom: 0.4rem; line-height: 1.7; }
                .prose-content a { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; }
                .toc-link { transition: all 0.2s; border-left: 2px solid transparent; }
                .toc-link:hover { border-left-color: #7c3aed; color: #7c3aed; padding-left: 0.5rem; }

                .prose-content h4 { color: #1e293b; }
                .prose-content p { color: #475569; }
                .prose-content ul { color: #475569; }
                .prose-content strong { color: #1e293b; }

                .dark .prose-content h4 { color: #e2e8f0; }
                .dark .prose-content p { color: #94a3b8; }
                .dark .prose-content ul { color: #94a3b8; }
                .dark .prose-content strong { color: #e2e8f0; }
                .dark .prose-content a { color: #a78bfa; }
                .dark .toc-link:hover { border-left-color: #a78bfa; color: #a78bfa; }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="NeeFlow" width={32} height={32} className="rounded-lg object-contain" />
                        <span className="font-bold text-gray-900 dark:text-white text-lg">NeeFlow</span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm">
                        <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Sign In</Link>
                    </nav>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-[280px_1fr] gap-12">

                    {/* Sidebar TOC */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Table of Contents</p>
                                <nav className="space-y-1">
                                    {sections.map((s) => (
                                        <a key={s.id} href={`#${s.id}`} className="toc-link block text-sm text-gray-500 dark:text-gray-400 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-white/5">
                                            {s.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                            <div className="mt-6 bg-violet-50 dark:bg-violet-950/50 rounded-2xl border border-violet-100 dark:border-violet-800/50 p-5">
                                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-1">Legal Questions?</p>
                                <p className="text-xs text-violet-600 dark:text-violet-400 mb-3">Contact our team for any Terms-related queries.</p>
                                <a href="mailto:legal@neeflow.com" className="text-xs font-medium text-violet-700 dark:text-violet-400 underline">legal@neeflow.com</a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main>
                        {/* Hero */}
                        <div className="mb-10 pb-8 border-b border-gray-100 dark:border-white/10">
                            <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-100 dark:border-violet-800/60 mb-4">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Legal Agreement
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                                Please read these Terms carefully before using NeeFlow. They define your rights, responsibilities, and our mutual obligations as you use our AI-powered social media management platform.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400 dark:text-gray-500">
                                <span><strong className="text-gray-600 dark:text-gray-300">Last Updated:</strong> {lastUpdated}</span>
                                <span><strong className="text-gray-600 dark:text-gray-300">Effective Date:</strong> {lastUpdated}</span>
                                <span><strong className="text-gray-600 dark:text-gray-300">Version:</strong> 1.0</span>
                            </div>
                        </div>

                        {/* Key Points */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-10">
                            {[
                                { icon: '📋', title: 'You own your content', desc: 'All posts and media you create remain your intellectual property.' },
                                { icon: '🤝', title: 'Fair & transparent billing', desc: 'Cancel anytime. No hidden fees. 30-day notice for price changes.' },
                                { icon: '⚡', title: 'You are responsible for AI content', desc: 'Review all AI-generated posts before publishing — we provide the tools, you approve the content.' },
                            ].map((c, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
                                    <div className="text-2xl mb-2">{c.icon}</div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{c.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</div>
                                </div>
                            ))}
                        </div>

                        {/* Policy Sections */}
                        <div className="space-y-10">
                            {sections.map((section) => (
                                <section key={section.id} id={section.id} className="scroll-mt-24">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-white/10">
                                        {section.title}
                                    </h2>
                                    <div
                                        className="prose-content"
                                        dangerouslySetInnerHTML={{ __html: section.content }}
                                    />
                                </section>
                            ))}
                        </div>

                        {/* Footer nav */}
                        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} NeeFlow. All rights reserved.</p>
                            <div className="flex gap-6 text-sm">
                                <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                                <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 font-medium">Terms of Service</Link>
                                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
