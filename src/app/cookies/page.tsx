import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getBrandingServer } from '@/lib/use-branding-server'

export const metadata: Metadata = {
    title: 'Cookie Policy — NeeFlow',
    description: 'NeeFlow Cookie Policy: How we use cookies and similar technologies on our platform.',
}

const sections = [
    {
        id: 'what-are-cookies',
        title: '1. What Are Cookies?',
        content: `
        <p>Cookies are small text files that are placed on your device (computer, tablet, or smartphone) when you visit a website. They are widely used to make websites work efficiently, provide information to the website owner, and enhance the user experience.</p>
        <p>Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device for a set period or until you delete them). Cookies can also be "first-party cookies" (set by the website you're visiting) or "third-party cookies" (set by a different domain).</p>
        `
    },
    {
        id: 'how-we-use',
        title: '2. How NeeFlow Uses Cookies',
        content: `
        <p>NeeFlow uses <strong>only strictly necessary cookies</strong> required to operate the Service. We do not use advertising, marketing, or behavioral tracking cookies of any kind.</p>
        <h4>2.1 Strictly Necessary Cookies</h4>
        <p>These cookies are essential for the Service to function and cannot be disabled:</p>
        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
            <thead>
                <tr style="text-align:left;border-bottom:1px solid currentColor;opacity:0.3">
                    <th style="padding:0.5rem 0.75rem;font-weight:600">Cookie Name</th>
                    <th style="padding:0.5rem 0.75rem;font-weight:600">Purpose</th>
                    <th style="padding:0.5rem 0.75rem;font-weight:600">Duration</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid currentColor;opacity:0.15">
                    <td style="padding:0.5rem 0.75rem"><code>next-auth.session-token</code></td>
                    <td style="padding:0.5rem 0.75rem">Authenticates your session and keeps you logged in securely</td>
                    <td style="padding:0.5rem 0.75rem">30 days</td>
                </tr>
                <tr style="border-bottom:1px solid currentColor;opacity:0.15">
                    <td style="padding:0.5rem 0.75rem"><code>next-auth.csrf-token</code></td>
                    <td style="padding:0.5rem 0.75rem">Cross-site request forgery (CSRF) protection</td>
                    <td style="padding:0.5rem 0.75rem">Session</td>
                </tr>
                <tr style="border-bottom:1px solid currentColor;opacity:0.15">
                    <td style="padding:0.5rem 0.75rem"><code>next-auth.callback-url</code></td>
                    <td style="padding:0.5rem 0.75rem">Stores your intended destination after login</td>
                    <td style="padding:0.5rem 0.75rem">Session</td>
                </tr>
                <tr>
                    <td style="padding:0.5rem 0.75rem"><code>theme</code></td>
                    <td style="padding:0.5rem 0.75rem">Stores your dark/light mode preference</td>
                    <td style="padding:0.5rem 0.75rem">1 year</td>
                </tr>
            </tbody>
        </table>
        `
    },
    {
        id: 'what-we-dont-use',
        title: '3. What We Do NOT Use',
        content: `
        <p>NeeFlow explicitly does <strong>not</strong> use the following types of cookies or trackers:</p>
        <ul>
            <li><strong>Advertising cookies:</strong> We do not serve ads and do not use ad network cookies (Google AdSense, DoubleClick, etc.)</li>
            <li><strong>Analytics cookies:</strong> We do not use Google Analytics, Mixpanel, Hotjar, or any behavioral analytics tool on our platform pages.</li>
            <li><strong>Social media tracking pixels:</strong> We do not use Facebook Pixel, TikTok Pixel, LinkedIn Insight Tag, or similar cross-site tracking scripts.</li>
            <li><strong>Third-party marketing cookies:</strong> We do not deploy cookies from ad networks, data brokers, or marketing technology providers.</li>
        </ul>
        <p>Note: Third-party services you integrate with (Facebook, Google, TikTok, etc.) may set their own cookies when you use OAuth to connect those accounts. These are governed by each platform's own cookie and privacy policies.</p>
        `
    },
    {
        id: 'managing-cookies',
        title: '4. Managing Cookies',
        content: `
        <h4>4.1 Browser Settings</h4>
        <p>You can control and delete cookies through your browser settings. Here are links to cookie management instructions for major browsers:</p>
        <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406" target="_blank" rel="noopener">Microsoft Edge</a></li>
        </ul>
        <h4>4.2 Impact of Disabling Cookies</h4>
        <p>Because NeeFlow only uses strictly necessary cookies, disabling cookies will prevent you from logging in and using the Service. The session authentication cookie is required for the platform to function securely.</p>
        `
    },
    {
        id: 'local-storage',
        title: '5. Local Storage & Similar Technologies',
        content: `
        <p>In addition to cookies, NeeFlow may use the following browser storage technologies:</p>
        <ul>
            <li><strong>localStorage:</strong> Used to store user interface preferences (theme, sidebar state, language) locally in your browser. This data never leaves your device and is not accessible to our servers.</li>
            <li><strong>sessionStorage:</strong> Temporary data stored for the duration of your browser session. Cleared when you close your browser tab.</li>
        </ul>
        <p>These technologies are used exclusively to improve your experience — we do not use them for tracking or advertising purposes.</p>
        `
    },
    {
        id: 'updates',
        title: '6. Updates to This Policy',
        content: `
        <p>We may update this Cookie Policy from time to time to reflect changes in our practices or for legal and regulatory reasons. We will notify you of material changes via email or a prominent notice within the NeeFlow dashboard.</p>
        <p>The "Last Updated" date at the top of this page reflects the most recent revision.</p>
        `
    },
    {
        id: 'contact',
        title: '7. Contact Us',
        content: `
        <p>If you have any questions about our use of cookies, please contact us:</p>
        <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a></li>
            <li><strong>Address:</strong> Richmond, VA, United States</li>
        </ul>
        `
    },
]

export default async function CookiePolicyPage() {
    const lastUpdated = 'February 22, 2025'
    const branding = await getBrandingServer()

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                .prose-content h4 { font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
                .prose-content p { line-height: 1.75; margin-bottom: 0.9rem; }
                .prose-content ul { padding-left: 1.25rem; margin-bottom: 0.9rem; }
                .prose-content li { margin-bottom: 0.4rem; line-height: 1.7; }
                .prose-content a { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; }
                .prose-content code { font-size: 0.8rem; padding: 0.1rem 0.35rem; border-radius: 4px; background: #f1f5f9; font-family: monospace; }
                .toc-link { transition: all 0.2s; border-left: 2px solid transparent; }
                .toc-link:hover { border-left-color: #0891b2; color: #0891b2; padding-left: 0.5rem; }

                .prose-content h4 { color: #1e293b; }
                .prose-content p { color: #475569; }
                .prose-content ul { color: #475569; }
                .prose-content strong { color: #1e293b; }

                .dark .prose-content h4 { color: #e2e8f0; }
                .dark .prose-content p { color: #94a3b8; }
                .dark .prose-content ul { color: #94a3b8; }
                .dark .prose-content strong { color: #e2e8f0; }
                .dark .prose-content a { color: #67e8f9; }
                .dark .prose-content code { background: #1e293b; color: #e2e8f0; }
                .dark .toc-link:hover { border-left-color: #67e8f9; color: #67e8f9; }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src={branding.logoUrl} alt={branding.appName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{branding.appName}</span>
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
                            <div className="mt-6 bg-cyan-50 dark:bg-cyan-950/50 rounded-2xl border border-cyan-100 dark:border-cyan-800/50 p-5">
                                <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-300 mb-1">Cookie Questions?</p>
                                <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-3">We keep it minimal — only what the Service needs.</p>
                                <a href="mailto:privacy@neeflow.com" className="text-xs font-medium text-cyan-700 dark:text-cyan-400 underline">privacy@neeflow.com</a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main>
                        {/* Hero */}
                        <div className="mb-10 pb-8 border-b border-gray-100 dark:border-white/10">
                            <div className="inline-flex items-center gap-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-100 dark:border-cyan-800/60 mb-4">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                Cookie Transparency
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Cookie Policy</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                                NeeFlow uses only essential cookies required to operate the service. No advertising cookies, no tracking, no third-party behavioral analytics.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400 dark:text-gray-500">
                                <span><strong className="text-gray-600 dark:text-gray-300">Last Updated:</strong> {lastUpdated}</span>
                                <span><strong className="text-gray-600 dark:text-gray-300">Version:</strong> 1.0</span>
                            </div>
                        </div>

                        {/* Quick Highlights */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-10">
                            {[
                                { icon: '🍪', title: 'Only essential cookies', desc: 'Session auth and CSRF protection only. Nothing else.' },
                                { icon: '🚫', title: 'No ad cookies', desc: 'Zero advertising, analytics, or behavioral tracking cookies.' },
                                { icon: '🔧', title: 'You are in control', desc: 'Manage cookies through your browser settings anytime.' },
                            ].map((c, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
                                    <div className="text-2xl mb-2">{c.icon}</div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{c.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</div>
                                </div>
                            ))}
                        </div>

                        {/* Sections */}
                        <div className="space-y-10">
                            {sections.map((section) => (
                                <section key={section.id} id={section.id} className="scroll-mt-24">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-white/10">
                                        {section.title}
                                    </h2>
                                    <div className="prose-content" dangerouslySetInnerHTML={{ __html: section.content }} />
                                </section>
                            ))}
                        </div>

                        {/* Footer nav */}
                        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                            <div className="flex gap-6 text-sm">
                                <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                                <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
                                <Link href="/gdpr" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">GDPR</Link>
                                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
