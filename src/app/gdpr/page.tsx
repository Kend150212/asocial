import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getBrandingServer } from '@/lib/use-branding-server'

export const metadata: Metadata = {
    title: 'GDPR Compliance — NeeFlow',
    description: 'NeeFlow GDPR Compliance: Your rights under the General Data Protection Regulation and how we protect EU/EEA user data.',
}

const sections = [
    {
        id: 'overview',
        title: '1. GDPR Overview',
        content: `
        <p>The General Data Protection Regulation (GDPR) is a European Union law (Regulation (EU) 2016/679) that governs how organizations collect, store, use, and protect personal data of individuals in the European Economic Area (EEA) and United Kingdom.</p>
        <p>NeeFlow is committed to full compliance with GDPR requirements. This page explains our data processing practices, your rights as an EU/EEA/UK data subject, and how to exercise those rights.</p>
        <p>If you have any GDPR-related concerns, contact our privacy team at <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a>.</p>
        `
    },
    {
        id: 'data-controller',
        title: '2. Data Controller & Processor',
        content: `
        <h4>2.1 Data Controller</h4>
        <p>NeeFlow acts as the <strong>Data Controller</strong> for personal data collected from users of our platform. As the Data Controller, we determine the purposes and means of processing your personal data.</p>
        <ul>
            <li><strong>Entity:</strong> NeeFlow</li>
            <li><strong>Address:</strong> Richmond, VA, United States</li>
            <li><strong>Privacy Contact:</strong> <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a></li>
        </ul>
        <h4>2.2 Data Processors</h4>
        <p>NeeFlow engages the following third-party processors who process data on our behalf under data processing agreements:</p>
        <ul>
            <li><strong>Stripe:</strong> Payment processing — <a href="https://stripe.com/legal/dpa" target="_blank" rel="noopener">Stripe DPA</a></li>
            <li><strong>OpenAI:</strong> AI content generation — subject to OpenAI's data processing terms</li>
            <li><strong>Google (Gemini):</strong> AI content generation — subject to Google's data processing terms</li>
            <li><strong>Social Media Platforms:</strong> Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Pinterest — content published on your behalf via their APIs</li>
        </ul>
        `
    },
    {
        id: 'legal-basis',
        title: '3. Legal Basis for Processing',
        content: `
        <p>Under GDPR Article 6, NeeFlow processes your personal data on the following lawful bases:</p>
        <ul>
            <li><strong>Contract Performance (Art. 6(1)(b)):</strong> Processing necessary to provide the NeeFlow service you have subscribed to — including publishing posts, managing your calendar, processing payments, and account management.</li>
            <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> Security monitoring, fraud prevention, service improvement through aggregated analytics, and ensuring platform integrity.</li>
            <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> Retaining billing records and responding to lawful government requests as required by applicable law.</li>
            <li><strong>Consent (Art. 6(1)(a)):</strong> Optional features such as AI content improvement feedback (where applicable). You may withdraw consent at any time.</li>
        </ul>
        `
    },
    {
        id: 'your-rights',
        title: '4. Your Rights Under GDPR',
        content: `
        <p>As an EU/EEA/UK data subject, you have the following rights under GDPR:</p>
        <ul>
            <li><strong>Right of Access (Art. 15):</strong> Request a copy of all personal data we hold about you, including the categories, purposes, and recipients of processing.</li>
            <li><strong>Right to Rectification (Art. 16):</strong> Request correction of inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure / Right to be Forgotten (Art. 17):</strong> Request deletion of your personal data where there is no overriding legal reason to retain it.</li>
            <li><strong>Right to Restriction (Art. 18):</strong> Request that we limit processing of your data in certain circumstances.</li>
            <li><strong>Right to Data Portability (Art. 20):</strong> Receive your personal data in a structured, commonly used, machine-readable format (JSON/CSV) and transmit it to another controller.</li>
            <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests, including profiling.</li>
            <li><strong>Rights related to Automated Decision-Making (Art. 22):</strong> NeeFlow does not engage in automated decision-making or profiling that produces legal or similarly significant effects.</li>
            <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.</li>
        </ul>
        <p>To exercise any of these rights, submit a written request to <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a>. We will respond within <strong>30 days</strong> (or 90 days for complex requests, with notification). We may need to verify your identity before processing the request.</p>
        `
    },
    {
        id: 'data-transfers',
        title: '5. International Data Transfers',
        content: `
        <p>NeeFlow is based in the United States. As the US is not considered an "adequate" country under GDPR, transfers of personal data from the EEA/UK to the US are governed by appropriate safeguards:</p>
        <ul>
            <li><strong>Standard Contractual Clauses (SCCs):</strong> We rely on EU Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914) for transfers to NeeFlow's servers in the US.</li>
            <li><strong>Processor SCCs:</strong> Our third-party processors (Stripe, OpenAI, Google, etc.) also implement SCCs or other approved transfer mechanisms.</li>
        </ul>
        <p>You may request a copy of the applicable SCCs by contacting <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a>.</p>
        `
    },
    {
        id: 'data-retention',
        title: '6. Data Retention',
        content: `
        <p>We retain personal data only as long as necessary for the purposes it was collected:</p>
        <ul>
            <li><strong>Account data:</strong> Retained while your account is active. Deleted within 30 days of account closure (except as required by law).</li>
            <li><strong>Content & posts:</strong> Retained until you delete them or close your account.</li>
            <li><strong>OAuth tokens:</strong> Deleted immediately upon disconnecting the relevant social platform.</li>
            <li><strong>Billing records:</strong> Retained for 7 years to comply with tax and financial regulations.</li>
            <li><strong>Security logs:</strong> Retained for up to 90 days.</li>
        </ul>
        `
    },
    {
        id: 'dpo',
        title: '7. Data Protection Officer',
        content: `
        <p>NeeFlow does not currently meet the GDPR threshold requirements that mandate a formal Data Protection Officer (DPO) under Article 37. However, we treat privacy as a core responsibility and have designated a privacy contact who handles all data protection queries:</p>
        <ul>
            <li><strong>Privacy Contact:</strong> <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a></li>
        </ul>
        `
    },
    {
        id: 'supervisory-authority',
        title: '8. Right to Lodge a Complaint',
        content: `
        <p>If you believe NeeFlow has violated your GDPR rights and are not satisfied with our response, you have the right to lodge a complaint with your local supervisory authority:</p>
        <ul>
            <li><strong>EU Users:</strong> Contact the data protection authority in your EU member state. A full list is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener">edpb.europa.eu</a>.</li>
            <li><strong>UK Users:</strong> Contact the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener">ico.org.uk</a>.</li>
        </ul>
        <p>We encourage you to contact us first at <a href="mailto:privacy@neeflow.com">privacy@neeflow.com</a> so we can attempt to resolve your concern directly.</p>
        `
    },
    {
        id: 'security',
        title: '9. Security Measures (Art. 32)',
        content: `
        <p>NeeFlow implements appropriate technical and organizational measures under GDPR Article 32 to ensure a level of security appropriate to the risk:</p>
        <ul>
            <li><strong>Encryption at Rest:</strong> OAuth tokens and sensitive credentials encrypted with AES-256.</li>
            <li><strong>Encryption in Transit:</strong> All data transmitted over TLS 1.2+.</li>
            <li><strong>Access Control:</strong> Role-based access control (RBAC) limiting data access to authorized personnel.</li>
            <li><strong>Password Security:</strong> bcrypt hashing with work factor 12 — no plain-text passwords.</li>
            <li><strong>Breach Notification:</strong> In the event of a personal data breach, we will notify the relevant supervisory authority within 72 hours (Art. 33) and affected users without undue delay (Art. 34) where required.</li>
        </ul>
        `
    },
]

export default async function GDPRPage() {
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
                .toc-link { transition: all 0.2s; border-left: 2px solid transparent; }
                .toc-link:hover { border-left-color: #16a34a; color: #16a34a; padding-left: 0.5rem; }

                .prose-content h4 { color: #1e293b; }
                .prose-content p { color: #475569; }
                .prose-content ul { color: #475569; }
                .prose-content strong { color: #1e293b; }

                .dark .prose-content h4 { color: #e2e8f0; }
                .dark .prose-content p { color: #94a3b8; }
                .dark .prose-content ul { color: #94a3b8; }
                .dark .prose-content strong { color: #e2e8f0; }
                .dark .prose-content a { color: #86efac; }
                .dark .toc-link:hover { border-left-color: #86efac; color: #86efac; }
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
                            <div className="mt-6 bg-green-50 dark:bg-green-950/50 rounded-2xl border border-green-100 dark:border-green-800/50 p-5">
                                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">GDPR Rights Request</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mb-3">Submit an access, erasure, or portability request.</p>
                                <a href="mailto:privacy@neeflow.com" className="text-xs font-medium text-green-700 dark:text-green-400 underline">privacy@neeflow.com</a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main>
                        {/* Hero */}
                        <div className="mb-10 pb-8 border-b border-gray-100 dark:border-white/10">
                            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800/60 mb-4">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                GDPR Compliant
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">GDPR Compliance</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                                NeeFlow is committed to protecting the personal data of EU, EEA, and UK users in compliance with the General Data Protection Regulation (GDPR). This page outlines our compliance measures and your rights.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400 dark:text-gray-500">
                                <span><strong className="text-gray-600 dark:text-gray-300">Regulation:</strong> EU 2016/679 (GDPR)</span>
                                <span><strong className="text-gray-600 dark:text-gray-300">Last Updated:</strong> {lastUpdated}</span>
                                <span><strong className="text-gray-600 dark:text-gray-300">Applies to:</strong> EU, EEA & UK users</span>
                            </div>
                        </div>

                        {/* Rights Highlights */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-10">
                            {[
                                { icon: '📋', title: 'Right of Access', desc: 'Request a full copy of your personal data we hold.' },
                                { icon: '🗑️', title: 'Right to Erasure', desc: 'Request deletion of your data at any time.' },
                                { icon: '📦', title: 'Data Portability', desc: 'Export your data in machine-readable format.' },
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
                            <div className="flex flex-wrap gap-6 text-sm justify-center">
                                <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                                <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
                                <Link href="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookie Policy</Link>
                                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
