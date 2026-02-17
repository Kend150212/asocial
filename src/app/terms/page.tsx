import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | ASocial',
    description: 'Terms of Service for ASocial - AI-powered Social Media Management Platform by Cuong Dao, Kendy Marketing LLC',
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
                <p className="text-muted-foreground mb-2">Effective Date: February 16, 2026</p>
                <p className="text-muted-foreground mb-8">Last Updated: February 16, 2026</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

                    {/* 1. Agreement to Terms */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms of Service (&quot;Terms,&quot; &quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and <strong>Cuong Dao</strong>, doing business as <strong>Kendy Marketing LLC</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a limited liability company organized under the laws of the Commonwealth of Virginia, United States, with its principal place of business at 4706 Kelly Cv, Glen Allen, Virginia 23060, USA.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            By accessing or using the ASocial platform, including any related websites, applications, services, tools, APIs, and features (collectively, the &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
                            <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>, which is incorporated herein by reference.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong>IF YOU DO NOT AGREE TO ALL OF THESE TERMS, YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICE AND MUST DISCONTINUE USE IMMEDIATELY.</strong>
                        </p>
                    </section>

                    {/* 2. Eligibility */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You must meet the following requirements to use the Service:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>You must be at least sixteen (16) years of age.</li>
                            <li>You must have the legal capacity to enter into a binding contract in your jurisdiction.</li>
                            <li>If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.</li>
                            <li>You must not have been previously suspended or removed from the Service.</li>
                            <li>Your use of the Service must not violate any applicable law, regulation, or court order.</li>
                        </ul>
                    </section>

                    {/* 3. Description of Service */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ASocial is an AI-powered social media management platform that provides the following services:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Multi-Platform Management:</strong> Connect and manage multiple social media accounts across platforms including Facebook, Instagram, YouTube, TikTok, X (Twitter), LinkedIn, Pinterest, and others.</li>
                            <li><strong>Content Creation:</strong> AI-assisted content generation, including captions, scripts, and creative suggestions powered by artificial intelligence.</li>
                            <li><strong>Content Publishing:</strong> Schedule, manage, and publish content to connected social media platforms.</li>
                            <li><strong>Analytics and Insights:</strong> Performance tracking, engagement metrics, and audience analytics across connected platforms.</li>
                            <li><strong>Team Collaboration:</strong> Multi-user access with role-based permissions for teams and organizations.</li>
                            <li><strong>Channel Management:</strong> Organize and manage multiple channels, brands, or clients from a single dashboard.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            We reserve the right to modify, update, or discontinue any feature or aspect of the Service at any time, with or without notice, subject to the provisions of Section 17 (Modifications to Terms).
                        </p>
                    </section>

                    {/* 4. User Accounts */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.1 Account Registration</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            To access certain features of the Service, you must create an account and provide accurate, current, and complete information during the registration process. You agree to update your account information promptly to keep it accurate and complete.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.2 Account Security</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You are solely responsible for maintaining the confidentiality of your account credentials, including your password. You agree to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Create a strong, unique password for your account</li>
                            <li>Not share your account credentials with any third party</li>
                            <li>Notify us immediately of any unauthorized access to or use of your account</li>
                            <li>Not use another person&apos;s account without authorization</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.3 Account Responsibility</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You are responsible for all activities that occur under your account, whether or not you have authorized such activities. We will not be liable for any loss or damage arising from your failure to protect your account credentials.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.4 Account Types and Roles</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service supports multiple user roles, including but not limited to Owner, Admin, Manager, and Member. The Owner of an account or organization is responsible for managing user roles and permissions. Each role has specific permissions as defined within the Service.
                        </p>
                    </section>

                    {/* 5. Third-Party Platform Integrations */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Third-Party Platform Integrations</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.1 OAuth Authorization</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service integrates with third-party social media platforms (&quot;Third-Party Platforms&quot;) through their official APIs and OAuth 2.0 authentication protocols. By connecting your Third-Party Platform accounts, you:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Authorize ASocial to access, manage, and publish content to your connected accounts within the scope of permissions you grant</li>
                            <li>Acknowledge that your use of each Third-Party Platform is subject to that platform&apos;s own terms of service and privacy policy</li>
                            <li>Understand that the availability and functionality of integrations may change based on Third-Party Platform API updates</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.2 Platform-Specific Terms</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Your use of integrated platforms is additionally governed by:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Facebook/Instagram:</strong>{' '}
                                <a href="https://www.facebook.com/terms" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Meta Terms of Service</a> and{' '}
                                <a href="https://developers.facebook.com/terms/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Meta Platform Terms</a>
                            </li>
                            <li><strong>YouTube:</strong>{' '}
                                <a href="https://www.youtube.com/t/terms" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a> and{' '}
                                <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">YouTube API Terms</a>
                            </li>
                            <li><strong>TikTok:</strong>{' '}
                                <a href="https://www.tiktok.com/legal/page/us/terms-of-service" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">TikTok Terms of Service</a>
                            </li>
                            <li><strong>X (Twitter):</strong>{' '}
                                <a href="https://twitter.com/en/tos" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">X Terms of Service</a>
                            </li>
                            <li><strong>LinkedIn:</strong>{' '}
                                <a href="https://www.linkedin.com/legal/user-agreement" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn User Agreement</a>
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.3 No Warranty of Third-Party Services</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not control, endorse, or assume responsibility for any Third-Party Platform. We are not liable for changes to Third-Party Platform APIs, policies, or availability that may affect the Service&apos;s functionality. Third-Party Platforms may change their APIs, rate limits, or terms of service at any time, which may temporarily or permanently affect certain features of the Service.
                        </p>
                    </section>

                    {/* 6. User Content */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. User Content</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.1 Ownership</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You retain full ownership of all content you create, upload, submit, post, or transmit through the Service (&quot;User Content&quot;). We do not claim any ownership rights in your User Content.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.2 License Grant</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            By submitting User Content through the Service, you grant us a limited, non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, adapt, process, and transmit your User Content solely for the purpose of providing, maintaining, and improving the Service. This license terminates when you delete your User Content or your account, except to the extent your User Content has been shared with or published to Third-Party Platforms.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.3 Content Responsibility</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You are solely responsible for your User Content and the consequences of posting or publishing it. You represent and warrant that:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>You own or have all necessary rights, licenses, consents, and permissions to use and authorize us to use your User Content</li>
                            <li>Your User Content does not infringe, misappropriate, or violate any third party&apos;s intellectual property rights, privacy rights, publicity rights, or other personal or proprietary rights</li>
                            <li>Your User Content does not contain defamatory, libelous, fraudulent, or otherwise unlawful material</li>
                            <li>Your User Content complies with all applicable laws, regulations, and the terms of service of any Third-Party Platform to which it is published</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.4 Content Moderation</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right, but are not obligated, to review, monitor, edit, or remove any User Content that we, in our sole discretion, determine violates these Terms or is otherwise objectionable. We are not responsible for reviewing or monitoring all User Content.
                        </p>
                    </section>

                    {/* 7. AI-Generated Content */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">7.1 Nature of AI Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service includes AI-powered features for content generation, suggestions, and optimization. AI-generated content is produced by third-party AI models (including but not limited to OpenAI GPT and Google Gemini) and is provided on an &quot;as-is&quot; basis.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">7.2 No Guarantee of Accuracy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>We do not guarantee the accuracy, completeness, reliability, currentness, or suitability of any AI-generated content.</strong> AI models may produce content that is inaccurate, biased, inappropriate, or that infringes on third-party rights. You acknowledge that AI-generated content may contain errors, hallucinations, or unintended outputs.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">7.3 User Responsibility for AI Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You are solely responsible for reviewing, editing, verifying, and approving any AI-generated content before publishing or using it. By publishing AI-generated content, you assume full responsibility for that content as if you had created it yourself. We disclaim all liability for any damages, claims, or losses arising from your use of AI-generated content.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">7.4 Intellectual Property of AI Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The intellectual property status of AI-generated content may vary by jurisdiction. We make no representations regarding the copyrightability or intellectual property protection of AI-generated content. You should consult with a qualified attorney for legal advice regarding the intellectual property status of AI-generated content in your jurisdiction.
                        </p>
                    </section>

                    {/* 8. Acceptable Use Policy */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Acceptable Use Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree not to use the Service to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Violate any applicable federal, state, local, or international law, regulation, or ordinance</li>
                            <li>Post, transmit, or distribute content that is illegal, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another&apos;s privacy, hateful, or discriminatory</li>
                            <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
                            <li>Engage in spamming, phishing, or unsolicited mass communications</li>
                            <li>Interfere with, disrupt, or create an undue burden on the Service or the networks or servers connected to the Service</li>
                            <li>Attempt to gain unauthorized access to any portion of the Service, other accounts, computer systems, or networks connected to the Service through hacking, password mining, or any other means</li>
                            <li>Use any automated means, including bots, scrapers, or crawlers, to access or collect data from the Service, except through our official APIs</li>
                            <li>Modify, adapt, translate, reverse engineer, decompile, disassemble, or create derivative works based on the Service or its underlying technology</li>
                            <li>Sublicense, lease, rent, loan, or otherwise transfer the Service or access thereto to any third party without our prior written consent</li>
                            <li>Circumvent, disable, or otherwise interfere with security-related features of the Service</li>
                            <li>Use the Service to develop a competing product or service</li>
                            <li>Upload or transmit any viruses, worms, Trojan horses, or other malicious code</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account without prior notice, at our sole discretion.
                        </p>
                    </section>

                    {/* 9. Intellectual Property */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.1 Our Intellectual Property</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service, including its original content (excluding User Content), features, functionality, design, source code, branding, logos, trademarks, and documentation, is and shall remain the exclusive property of Cuong Dao / Kendy Marketing LLC and its licensors. The Service is protected by copyright, trademark, trade secret, and other intellectual property or proprietary rights laws of the United States and international jurisdictions.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.2 Limited License to Use the Service</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal or internal business purposes. This license does not include the right to: (a) copy, modify, or distribute the Service; (b) make any commercial use of the Service beyond its intended purpose; or (c) access the Service in order to build a competitive product.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.3 Feedback</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If you provide us with any feedback, suggestions, ideas, or recommendations regarding the Service (&quot;Feedback&quot;), you hereby assign to us all rights in such Feedback and agree that we shall have the right to use and fully exploit such Feedback without restriction, attribution, or compensation to you.
                        </p>
                    </section>

                    {/* 10. Payment and Subscription Terms */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">10. Payment and Subscription Terms</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.1 Pricing</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Certain features of the Service may require a paid subscription. Pricing, features included, and billing cycles are as described on our pricing page or as communicated to you at the time of purchase. All prices are stated in US dollars unless otherwise specified. We reserve the right to change our pricing at any time, with at least thirty (30) days&apos; prior notice to existing subscribers.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.2 Billing and Payment</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Payments are processed through Stripe, Inc. (&quot;Payment Processor&quot;). By providing payment information, you represent that you are authorized to use the payment method and authorize us (and our Payment Processor) to charge your payment method for all fees incurred. You agree to keep your payment information up to date.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.3 Automatic Renewal</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Subscriptions automatically renew at the end of each billing cycle unless you cancel before the renewal date. You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period — you will continue to have access to paid features until then.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.4 Refund Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Subscription fees are generally non-refundable. However, we may consider refund requests on a case-by-case basis, particularly for: (a) billing errors; (b) service outages exceeding 72 consecutive hours; or (c) requests made within seven (7) days of the initial subscription purchase. To request a refund, contact us at <strong>support@kendymarketing.com</strong>.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.5 Taxes</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You are responsible for all applicable taxes, including sales tax, value-added tax (VAT), goods and services tax (GST), or other taxes imposed by your jurisdiction. If we are required to collect or pay such taxes, they will be charged in addition to the subscription fee.
                        </p>
                    </section>

                    {/* 11. Data Security */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">11. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement and maintain commercially reasonable administrative, technical, and physical security measures designed to protect your data from unauthorized access, disclosure, alteration, and destruction. These measures include, but are not limited to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>AES-256 encryption for all OAuth tokens, API keys, and sensitive credentials stored at rest</li>
                            <li>TLS 1.2+ encryption for all data in transit (HTTPS enforced)</li>
                            <li>Bcrypt hashing with random salt for user passwords</li>
                            <li>Role-based access controls for user permissions</li>
                            <li>Regular security audits and vulnerability assessments</li>
                            <li>Automated backup and disaster recovery procedures</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Notwithstanding the foregoing, no method of electronic transmission or storage is completely secure, and we cannot guarantee the absolute security of your data. For more details, please review our{' '}
                            <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>.
                        </p>
                    </section>

                    {/* 12. Service Availability */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">12. Service Availability and Uptime</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We strive to maintain continuous availability of the Service but do not guarantee uninterrupted, error-free, or secure access. The Service may be temporarily unavailable due to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Scheduled maintenance (we will provide reasonable advance notice when feasible)</li>
                            <li>Emergency maintenance or security patches</li>
                            <li>Force majeure events (natural disasters, pandemics, government actions)</li>
                            <li>Third-Party Platform API outages or rate limiting</li>
                            <li>Internet service provider or hosting infrastructure issues</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            We will use commercially reasonable efforts to minimize downtime and restore the Service promptly. We are not liable for any loss, damage, or inconvenience caused by periods of unavailability.
                        </p>
                    </section>

                    {/* 13. Disclaimer of Warranties */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">13. Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed uppercase font-medium">
                            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc pl-6 mt-3 space-y-1 text-muted-foreground">
                            <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                            <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</li>
                            <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT, INFORMATION, OR RESULTS OBTAINED THROUGH THE SERVICE</li>
                            <li>WARRANTIES THAT THE SERVICE WILL MEET YOUR SPECIFIC REQUIREMENTS OR EXPECTATIONS</li>
                            <li>WARRANTIES REGARDING THE QUALITY, ACCURACY, OR APPROPRIATENESS OF AI-GENERATED CONTENT</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Your use of the Service is at your sole risk. Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you.
                        </p>
                    </section>

                    {/* 14. Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">14. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CUONG DAO, KENDY MARKETING LLC, OR ANY OF ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR:</strong>
                        </p>
                        <ul className="list-disc pl-6 mt-3 space-y-1 text-muted-foreground">
                            <li>Any indirect, incidental, special, consequential, punitive, or exemplary damages</li>
                            <li>Loss of profits, revenue, data, goodwill, or business opportunities</li>
                            <li>Cost of procurement of substitute goods or services</li>
                            <li>Any damages arising from: (a) your use of or inability to use the Service; (b) unauthorized access to or alteration of your transmissions or data; (c) statements or conduct of any third party on the Service; (d) Third-Party Platform API changes, outages, or policy changes; (e) AI-generated content</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            In no event shall our total aggregate liability to you for all claims arising out of or relating to the Service exceed the greater of: (a) the amounts you have paid to us in the twelve (12) months immediately preceding the event giving rise to the claim; or (b) one hundred US dollars ($100.00). This limitation applies regardless of the theory of liability (contract, tort, strict liability, or otherwise), even if we have been advised of the possibility of such damages.
                        </p>
                    </section>

                    {/* 15. Indemnification */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">15. Indemnification</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to defend, indemnify, and hold harmless Cuong Dao, Kendy Marketing LLC, and its officers, directors, employees, agents, successors, and assigns from and against any and all claims, damages, obligations, losses, liabilities, costs, debts, and expenses (including but not limited to attorney&apos;s fees) arising from:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Your use of and access to the Service</li>
                            <li>Your violation of any provision of these Terms</li>
                            <li>Your violation of any third-party right, including any intellectual property right, privacy right, or publicity right</li>
                            <li>Your User Content or any content you publish through the Service</li>
                            <li>Any claim that your User Content caused damage to a third party</li>
                            <li>Your use of AI-generated content</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            This indemnification obligation will survive the termination of these Terms and your use of the Service.
                        </p>
                    </section>

                    {/* 16. Termination */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">16. Termination</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">16.1 Termination by You</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You may terminate your account at any time by contacting us at <strong>support@kendymarketing.com</strong> or through the account settings in the Service. Upon termination, your right to use the Service will immediately cease.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">16.2 Termination by Us</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Breach of these Terms or our Acceptable Use Policy</li>
                            <li>Fraudulent, abusive, or illegal activity</li>
                            <li>Non-payment of applicable fees</li>
                            <li>Extended periods of inactivity</li>
                            <li>Upon request by law enforcement or government agency</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">16.3 Effect of Termination</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Upon termination: (a) all licenses and rights granted to you under these Terms will immediately cease; (b) you must cease all use of the Service; (c) we will delete your account data in accordance with our Privacy Policy; (d) any outstanding fees become immediately due and payable. Sections 6.2, 7, 9, 13, 14, 15, 18, 19, and 20 shall survive termination.
                        </p>
                    </section>

                    {/* 17. Modifications to Terms */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">17. Modifications to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify, amend, or replace these Terms at any time at our sole discretion. We will provide notice of material changes by: (a) posting a notice on the Service at least thirty (30) days before the changes take effect; (b) sending an email to the address associated with your account; or (c) updating the &quot;Last Updated&quot; date at the top of these Terms.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes. If you do not agree to the new Terms, you must stop using the Service and terminate your account.
                        </p>
                    </section>

                    {/* 18. Governing Law and Jurisdiction */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">18. Governing Law and Jurisdiction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of the <strong>Commonwealth of Virginia, United States</strong>, without regard to its conflict of law principles. You irrevocably consent to the exclusive jurisdiction and venue of the state and federal courts located in Henrico County, Virginia, for the resolution of any disputes arising out of or relating to these Terms or the Service.
                        </p>
                    </section>

                    {/* 19. Dispute Resolution */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">19. Dispute Resolution</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">19.1 Informal Resolution</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Before filing any formal dispute, you agree to first attempt to resolve any dispute, claim, or controversy arising out of or relating to these Terms informally by contacting us at <strong>support@kendymarketing.com</strong>. We will attempt to resolve the dispute informally within sixty (60) days.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">19.2 Binding Arbitration</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If informal resolution fails, any dispute shall be resolved exclusively through final and binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under its Commercial Arbitration Rules. The arbitration shall take place in Richmond, Virginia, USA, and shall be conducted in English. The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">19.3 Class Action Waiver</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>YOU AND WE AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.</strong> You waive any right to participate in a class action lawsuit or class-wide arbitration against us.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">19.4 Exceptions</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Notwithstanding the above, either party may bring an individual action in small claims court for claims within its jurisdiction, or seek injunctive or equitable relief in any court of competent jurisdiction to prevent actual or threatened infringement of intellectual property rights.
                        </p>
                    </section>

                    {/* 20. General Provisions */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">20. General Provisions</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.1 Entire Agreement</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms, together with the Privacy Policy and any other legal notices or policies published by us on the Service, constitute the entire agreement between you and us regarding the Service and supersede all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.2 Severability</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall continue in full force and effect.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.3 Waiver</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            No waiver of any term or condition of these Terms shall be deemed a further or continuing waiver of such term or condition or any other term or condition. Our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.4 Assignment</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You may not assign or transfer these Terms, or any rights or obligations hereunder, without our prior written consent. We may assign these Terms without restriction. Any attempted assignment in violation of this section shall be null and void.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.5 Force Majeure</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We shall not be liable for any failure or delay in performing our obligations under these Terms resulting from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, epidemics or pandemics, government orders or restrictions, power failures, telecommunications failures, Internet outages, or Third-Party Platform outages.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.6 Notices</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            All notices required or permitted under these Terms shall be delivered by email. Notices to you will be sent to the email address associated with your account. Notices to us shall be sent to <strong>support@kendymarketing.com</strong>. Notices shall be deemed received upon successful delivery.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">20.7 Headings</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The section headings used in these Terms are for convenience only and have no legal or contractual effect.
                        </p>
                    </section>

                    {/* 21. Contact Information */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">21. Contact Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions, concerns, or feedback about these Terms of Service, please contact us at:
                        </p>
                        <div className="mt-3 p-5 rounded-lg bg-muted/50 text-sm space-y-1">
                            <p className="font-semibold text-base">Cuong Dao — Kendy Marketing LLC</p>
                            <p className="text-muted-foreground">Legal & Terms Inquiries</p>
                            <p className="text-muted-foreground mt-2">📍 4706 Kelly Cv, Glen Allen, Virginia 23060, USA</p>
                            <p className="text-muted-foreground">📧 Email: support@kendymarketing.com</p>
                            <p className="text-muted-foreground">🌐 Website: https://kendymarketing.com</p>
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
