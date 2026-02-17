import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | ASocial',
    description: 'Privacy Policy for ASocial - AI-powered Social Media Management Platform by Cuong Dao, Kendy Marketing LLC',
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
                <p className="text-muted-foreground mb-2">Effective Date: February 16, 2026</p>
                <p className="text-muted-foreground mb-8">Last Updated: February 16, 2026</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

                    {/* 1. Introduction */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ASocial (&quot;Service,&quot; &quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by <strong>Cuong Dao</strong>, doing business as <strong>Kendy Marketing LLC</strong>, a limited liability company registered in the Commonwealth of Virginia, United States. Our principal place of business is located at 4706 Kelly Cv, Glen Allen, Virginia 23060, USA.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            This Privacy Policy describes how we collect, use, disclose, retain, and protect your personal information when you access or use the ASocial platform, including any related websites, applications, services, tools, and features (collectively, the &quot;Service&quot;). This Policy applies to all users of the Service, including visitors, registered users, and any third parties who interact with the Service.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any part of this Privacy Policy, you must discontinue use of the Service immediately.
                        </p>
                    </section>

                    {/* 2. Definitions */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
                        <p className="text-muted-foreground leading-relaxed">For the purposes of this Privacy Policy:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li><strong>&quot;Personal Information&quot;</strong> means any information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular individual or household.</li>
                            <li><strong>&quot;Processing&quot;</strong> means any operation or set of operations performed on Personal Information, whether by automated means or not, including collection, recording, organization, structuring, storage, adaptation, alteration, retrieval, consultation, use, disclosure, dissemination, restriction, erasure, or destruction.</li>
                            <li><strong>&quot;Third-Party Platforms&quot;</strong> means external social media services integrated with the Service, including but not limited to Facebook, Instagram, YouTube, TikTok, X (Twitter), LinkedIn, Pinterest, and any additional platforms we may integrate in the future.</li>
                            <li><strong>&quot;User Content&quot;</strong> means any text, images, videos, audio, graphics, or other materials that you upload, submit, post, publish, or transmit through the Service.</li>
                            <li><strong>&quot;OAuth Tokens&quot;</strong> means the authentication credentials issued by Third-Party Platforms that authorize the Service to access and manage your accounts on those platforms.</li>
                            <li><strong>&quot;AI Services&quot;</strong> means artificial intelligence and machine learning services used by the Platform for content generation, analysis, and recommendations, including services provided by OpenAI, Google, and other AI providers.</li>
                        </ul>
                    </section>

                    {/* 3. Information We Collect */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Information We Collect</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">3.1 Information You Provide Directly</h3>
                        <p className="text-muted-foreground leading-relaxed">We collect information that you voluntarily provide when you:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Create an Account:</strong> Full name, email address, and password. Passwords are cryptographically hashed using bcrypt with salt rounds and are never stored in plain text.</li>
                            <li><strong>Complete Your Profile:</strong> Display name, profile picture, organization name, timezone, language preferences, and contact information.</li>
                            <li><strong>Create Content:</strong> Text, captions, hashtags, images, video metadata, scheduling preferences, and any other content you create or upload through the Service.</li>
                            <li><strong>Communicate with Us:</strong> Information contained in emails, support tickets, feedback forms, or other communications you send to us.</li>
                            <li><strong>Make Payments:</strong> Billing information is processed by our third-party payment processor (Stripe, Inc.) and we do not directly store your full credit card number or financial account information on our servers.</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">3.2 Information from Third-Party Platform Integrations</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you connect your Third-Party Platform accounts to the Service via OAuth 2.0 or similar authentication mechanisms, we may collect and store:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>OAuth access tokens and refresh tokens (encrypted at rest using AES-256 encryption)</li>
                            <li>Platform-specific user identifiers and account IDs</li>
                            <li>Public profile information (display name, username, profile picture URL, bio)</li>
                            <li>Page/channel names, identifiers, and follower/subscriber counts</li>
                            <li>Content metadata (post titles, descriptions, publish dates, engagement metrics)</li>
                            <li>Platform-specific permissions and scopes granted by you</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">3.3 Information Collected Automatically</h3>
                        <p className="text-muted-foreground leading-relaxed">When you access or use the Service, we automatically collect:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Log Data:</strong> IP address, browser type and version, operating system, referring/exit pages, date/time stamps, clickstream data, and pages viewed.</li>
                            <li><strong>Device Information:</strong> Device type, screen resolution, unique device identifiers, and hardware model.</li>
                            <li><strong>Usage Data:</strong> Features accessed, actions taken, frequency and duration of use, search queries, and interaction patterns within the Service.</li>
                            <li><strong>Session Data:</strong> Session identifiers, authentication tokens, and session duration for security and functionality purposes.</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">3.4 Information from AI Processing</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you use AI-powered features of the Service (content generation, caption writing, analytics insights), the prompts and content you submit are processed by our AI service providers. We may retain the inputs and outputs of AI interactions to improve the Service and for troubleshooting purposes, subject to the retention periods described in Section 8.
                        </p>
                    </section>

                    {/* 4. How We Use Your Information */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. How We Use Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">We process your Personal Information for the following purposes and under the following legal bases:</p>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.1 To Provide and Maintain the Service</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Authenticate your identity and manage your user account</li>
                            <li>Connect to and interact with Third-Party Platforms on your behalf using authorized OAuth credentials</li>
                            <li>Schedule, manage, and publish content to your connected social media accounts</li>
                            <li>Generate AI-powered content suggestions, captions, and analytics insights</li>
                            <li>Process and fulfill your subscription and payment transactions</li>
                            <li>Provide customer support and respond to your inquiries</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.2 To Improve and Develop the Service</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Analyze usage patterns and trends to improve functionality and user experience</li>
                            <li>Conduct internal research and development</li>
                            <li>Test new features and functionalities before release</li>
                            <li>Monitor and analyze the effectiveness of our Service</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.3 To Ensure Security and Prevent Fraud</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Detect, prevent, and address technical issues, security threats, and fraudulent activity</li>
                            <li>Monitor for unauthorized access attempts and suspicious behavior</li>
                            <li>Enforce our Terms of Service and other applicable policies</li>
                            <li>Protect the rights, property, and safety of our users and third parties</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.4 To Communicate with You</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Send service-related notifications, updates, and alerts</li>
                            <li>Respond to your comments, questions, and requests</li>
                            <li>Provide information about changes to our policies or features</li>
                            <li>Send promotional communications (only with your explicit consent, and you may opt out at any time)</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">4.5 To Comply with Legal Obligations</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>Comply with applicable laws, regulations, and legal processes</li>
                            <li>Respond to lawful government requests, subpoenas, and court orders</li>
                            <li>Establish, exercise, or defend legal claims</li>
                        </ul>
                    </section>

                    {/* 5. Third-Party Platform Integrations */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Third-Party Platform Integrations</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service integrates with multiple Third-Party Platforms through their official APIs and OAuth 2.0 authentication protocols. Each integration is subject to the respective platform&apos;s terms and privacy policies.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.1 Facebook and Instagram (Meta Platforms, Inc.)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the Facebook Graph API and Instagram Graph API to access and manage your Facebook Pages and Instagram Business/Creator accounts. Data accessed includes page information, post content, engagement metrics, and audience insights. By connecting these accounts, you also agree to{' '}
                            <a href="https://www.facebook.com/privacy/policy/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Meta&apos;s Privacy Policy</a>.
                            We access only the permissions you explicitly grant during the OAuth authorization process, including but not limited to: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_business_basic, and instagram_business_content_publish.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.2 YouTube (Google LLC)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the YouTube Data API v3 to access your YouTube channel information, including channel metadata, video listings, and upload capabilities. By connecting your YouTube account, you also agree to{' '}
                            <a href="https://policies.google.com/privacy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
                            You can revoke ASocial&apos;s access at any time through your{' '}
                            <a href="https://myaccount.google.com/permissions" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google Account permissions settings</a>.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.3 TikTok (ByteDance Ltd.)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the TikTok API to access your basic profile information and video content. By connecting your TikTok account, you also agree to{' '}
                            <a href="https://www.tiktok.com/legal/page/us/privacy-policy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">TikTok&apos;s Privacy Policy</a>.
                            We access only the data necessary to provide content management and publishing services.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.4 X (Twitter), LinkedIn, Pinterest, and Other Platforms</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We integrate with additional social media platforms through their official APIs. Each integration follows the same principle of minimal data access — we only request and access the data strictly necessary to provide our content management and publishing services. Your use of each Third-Party Platform is governed by that platform&apos;s own terms of service and privacy policy.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">5.5 Revoking Third-Party Access</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You may disconnect any Third-Party Platform account from the Service at any time through your ASocial dashboard settings. Upon disconnection, we will immediately invalidate and delete the associated OAuth tokens. You may also revoke access directly through the Third-Party Platform&apos;s own settings. We recommend doing both for complete access revocation.
                        </p>
                    </section>

                    {/* 6. Data Sharing and Disclosure */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>We do not sell, rent, lease, or trade your Personal Information to any third party for their marketing purposes.</strong> We may share your information only in the following limited circumstances:
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.1 With Your Consent</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We may share your information when you have provided explicit, informed consent for a specific purpose.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.2 Third-Party Platform Publishing</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you use the Service to publish content to Third-Party Platforms, the content and associated metadata are transmitted to those platforms in accordance with your instructions and their respective APIs.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.3 AI Service Providers</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Content you submit for AI processing (e.g., caption generation, content suggestions) is transmitted to our AI service providers (currently OpenAI and Google) solely for the purpose of generating responses. We have data processing agreements in place with these providers. We do not send your account credentials, passwords, or OAuth tokens to AI providers.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.4 Service Providers and Processors</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We engage trusted third-party companies and individuals to facilitate the Service, including:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Hosting providers</strong> (for infrastructure and data storage)</li>
                            <li><strong>Payment processors</strong> (Stripe, Inc. — for billing and subscription management)</li>
                            <li><strong>Email service providers</strong> (for transactional and notification emails)</li>
                            <li><strong>Analytics services</strong> (for usage analysis and service improvement)</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-2">
                            These service providers are contractually bound to process your data only on our instructions and in accordance with this Privacy Policy.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.5 Legal Requirements</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We may disclose your information if required to do so by law, regulation, legal process, or governmental request, including to meet national security or law enforcement requirements. We will attempt to notify you prior to disclosure when legally permitted.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.6 Business Transfers</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your Personal Information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on the Service before your Personal Information is transferred and becomes subject to a different privacy policy.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">6.7 Protection of Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We may disclose your information when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.
                        </p>
                    </section>

                    {/* 7. Data Security */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement and maintain commercially reasonable administrative, technical, and physical security measures designed to protect your Personal Information from unauthorized access, disclosure, alteration, and destruction. These measures include:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li><strong>Encryption at Rest:</strong> All OAuth tokens, API keys, and sensitive credentials are encrypted using AES-256 encryption before storage in our database.</li>
                            <li><strong>Encryption in Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (HTTPS). We enforce HSTS (HTTP Strict Transport Security).</li>
                            <li><strong>Password Security:</strong> User passwords are hashed using bcrypt with randomly generated salt rounds. We never store, log, or transmit passwords in plain text.</li>
                            <li><strong>Access Controls:</strong> Access to production systems and databases is restricted to authorized personnel only, with role-based access controls and multi-factor authentication.</li>
                            <li><strong>Database Security:</strong> Databases are secured with authentication, encrypted connections, network isolation, and regular automated backups.</li>
                            <li><strong>Monitoring:</strong> We monitor our systems for unauthorized access attempts, anomalous activity, and security vulnerabilities.</li>
                            <li><strong>Incident Response:</strong> We maintain an incident response plan to promptly address and mitigate any data security incidents.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            While we strive to use commercially acceptable means to protect your Personal Information, no method of electronic transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to promptly notifying affected users in the event of a data breach as required by applicable law.
                        </p>
                    </section>

                    {/* 8. Data Retention */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We retain your Personal Information only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements.
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li><strong>Active Account Data:</strong> Retained for the duration of your active account.</li>
                            <li><strong>Account Deletion:</strong> Upon account deletion, we will delete or anonymize your Personal Information within thirty (30) days, except where retention is required by law or legitimate business interests (e.g., fraud prevention, legal disputes).</li>
                            <li><strong>OAuth Tokens:</strong> Immediately revoked and deleted upon disconnection of a Third-Party Platform account.</li>
                            <li><strong>User Content:</strong> Deleted upon account deletion. Content already published to Third-Party Platforms remains on those platforms and is subject to their respective policies.</li>
                            <li><strong>Log Data:</strong> Retained for up to ninety (90) days for security and troubleshooting purposes, then automatically purged.</li>
                            <li><strong>Backup Data:</strong> May persist in encrypted backups for up to thirty (30) days after deletion from primary systems.</li>
                        </ul>
                    </section>

                    {/* 9. Your Privacy Rights */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">9. Your Privacy Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Depending on your jurisdiction, you may have the following rights regarding your Personal Information:
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.1 General Rights (All Users)</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Right to Access:</strong> Request a copy of the Personal Information we hold about you.</li>
                            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete Personal Information.</li>
                            <li><strong>Right to Deletion:</strong> Request deletion of your account and associated Personal Information.</li>
                            <li><strong>Right to Data Portability:</strong> Request an export of your data in a commonly used, machine-readable format.</li>
                            <li><strong>Right to Disconnect:</strong> Remove any connected Third-Party Platform account at any time.</li>
                            <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of processing prior to withdrawal.</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.2 California Residents (CCPA/CPRA)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Right to Know:</strong> You have the right to know what Personal Information we collect, use, disclose, and sell.</li>
                            <li><strong>Right to Delete:</strong> You have the right to request deletion of your Personal Information.</li>
                            <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of your Personal Information. <strong>We do not sell your Personal Information.</strong></li>
                            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA/CPRA rights.</li>
                            <li><strong>Right to Correct:</strong> You have the right to request correction of inaccurate Personal Information.</li>
                            <li><strong>Right to Limit:</strong> You have the right to limit the use of sensitive Personal Information.</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.3 Virginia Residents (VCDPA)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If you are a Virginia resident, you have rights under the Virginia Consumer Data Protection Act (VCDPA), including the right to access, correct, delete, and obtain a copy of your Personal Information, as well as the right to opt out of targeted advertising and profiling.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.4 European Economic Area Residents (GDPR)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR), including the right to access, rectify, erase, restrict processing, data portability, and the right to object to processing. You also have the right to lodge a complaint with your local supervisory authority.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">9.5 Exercising Your Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            To exercise any of your privacy rights, please contact us at <strong>support@kendymarketing.com</strong>. We will respond to your request within thirty (30) days (or such shorter period as required by applicable law). We may need to verify your identity before processing your request. There is no fee for exercising your rights, except in cases of manifestly unfounded or excessive requests.
                        </p>
                    </section>

                    {/* 10. Cookies and Tracking Technologies */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">10. Cookies and Tracking Technologies</h2>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.1 Essential Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We use strictly necessary cookies for authentication, session management, and security purposes. These cookies are essential for the operation of the Service and cannot be disabled without affecting Service functionality.
                        </p>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.2 What We Do NOT Use</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li>We do <strong>not</strong> use third-party advertising or tracking cookies.</li>
                            <li>We do <strong>not</strong> use cross-site tracking technologies.</li>
                            <li>We do <strong>not</strong> participate in ad networks or retargeting programs.</li>
                            <li>We do <strong>not</strong> use web beacons, pixel tags, or similar tracking technologies for advertising purposes.</li>
                        </ul>

                        <h3 className="text-lg font-medium mt-5 mb-2">10.3 Do Not Track</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We honor Do Not Track (&quot;DNT&quot;) signals sent by your browser. As we do not engage in cross-site tracking, the Service responds to DNT browser signals by default.
                        </p>
                    </section>

                    {/* 11. Children's Privacy */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">11. Children&apos;s Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service is not intended for, designed for, or directed at individuals under the age of sixteen (16). We do not knowingly collect, maintain, or use Personal Information from children under 16 years of age. If we become aware that we have collected Personal Information from a child under 16, we will take prompt steps to delete that information from our records. If you believe we have inadvertently collected information from a child under 16, please contact us immediately at <strong>support@kendymarketing.com</strong>.
                        </p>
                    </section>

                    {/* 12. International Data Transfers */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">12. International Data Transfers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your Personal Information may be transferred to and processed in countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country. Specifically, our servers and service providers may be located in the United States and other countries.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            When we transfer your Personal Information internationally, we take appropriate safeguards to ensure that your information receives an adequate level of protection, including through the use of Standard Contractual Clauses, adequacy decisions, or other lawful transfer mechanisms.
                        </p>
                    </section>

                    {/* 13. Changes to This Privacy Policy */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">13. Changes to This Privacy Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to update or modify this Privacy Policy at any time. We will notify you of material changes by: (a) posting a prominent notice on the Service; (b) sending you an email notification at the address associated with your account; or (c) updating the &quot;Last Updated&quot; date at the top of this page. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the Service after any modifications to this Privacy Policy constitutes acceptance of the updated terms.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            For material changes that reduce your privacy rights, we will provide at least thirty (30) days&apos; advance notice before the changes take effect.
                        </p>
                    </section>

                    {/* 14. Data Deletion Instructions */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">14. Data Deletion Instructions</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you wish to delete your data from ASocial, you may:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Self-service:</strong> Navigate to Dashboard → Settings → Account → Delete Account. This will permanently delete your account and all associated data within 30 days.</li>
                            <li><strong>Disconnect platforms:</strong> Navigate to Dashboard → Channels → select a platform → Disconnect. This immediately revokes and deletes OAuth tokens for that platform.</li>
                            <li><strong>Email request:</strong> Send a deletion request to <strong>support@kendymarketing.com</strong> with the subject &quot;Data Deletion Request&quot; and your registered email address. We will process your request within 30 days.</li>
                        </ul>
                    </section>

                    {/* 15. Contact Information */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions, concerns, or complaints about this Privacy Policy, our data practices, or your privacy rights, please contact us at:
                        </p>
                        <div className="mt-3 p-5 rounded-lg bg-muted/50 text-sm space-y-1">
                            <p className="font-semibold text-base">Cuong Dao — Kendy Marketing LLC</p>
                            <p className="text-muted-foreground">Data Controller / Privacy Inquiries</p>
                            <p className="text-muted-foreground mt-2">📍 4706 Kelly Cv, Glen Allen, Virginia 23060, USA</p>
                            <p className="text-muted-foreground">📧 Email: support@kendymarketing.com</p>
                            <p className="text-muted-foreground">🌐 Website: https://kendymarketing.com</p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            We will acknowledge receipt of your inquiry within two (2) business days and provide a substantive response within thirty (30) days. If you are not satisfied with our response, you have the right to lodge a complaint with the applicable data protection supervisory authority in your jurisdiction.
                        </p>
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
