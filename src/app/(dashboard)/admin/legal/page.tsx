'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Eye, EyeOff, FileText, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const DEFAULT_TERMS = `<h1>Terms of Service</h1>
<p><strong>Effective Date:</strong> [Date]</p>
<p><strong>Last Updated:</strong> [Date]</p>

<h2>1. Agreement to Terms</h2>
<p>These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and the operator of this platform ("Company," "we," "us," or "our").</p>
<p>By accessing or using the platform, including any related websites, applications, services, tools, APIs, and features (collectively, the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms and our <a href="/privacy">Privacy Policy</a>, which is incorporated herein by reference.</p>
<p><strong>IF YOU DO NOT AGREE TO ALL OF THESE TERMS, YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICE AND MUST DISCONTINUE USE IMMEDIATELY.</strong></p>

<h2>2. Eligibility</h2>
<p>You must meet the following requirements to use the Service:</p>
<ul>
<li>You must be at least sixteen (16) years of age.</li>
<li>You must have the legal capacity to enter into a binding contract in your jurisdiction.</li>
<li>If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.</li>
<li>You must not have been previously suspended or removed from the Service.</li>
<li>Your use of the Service must not violate any applicable law, regulation, or court order.</li>
</ul>

<h2>3. Description of Service</h2>
<p>The platform is an AI-powered social media management platform that provides the following services:</p>
<ul>
<li><strong>Multi-Platform Management:</strong> Connect and manage multiple social media accounts across platforms including Facebook, Instagram, YouTube, TikTok, X (Twitter), LinkedIn, Pinterest, and others.</li>
<li><strong>Content Creation:</strong> AI-assisted content generation, including captions, scripts, and creative suggestions powered by artificial intelligence.</li>
<li><strong>Content Publishing:</strong> Schedule, manage, and publish content to connected social media platforms.</li>
<li><strong>Analytics and Insights:</strong> Performance tracking, engagement metrics, and audience analytics across connected platforms.</li>
<li><strong>Team Collaboration:</strong> Multi-user access with role-based permissions for teams and organizations.</li>
<li><strong>Channel Management:</strong> Organize and manage multiple channels, brands, or clients from a single dashboard.</li>
</ul>
<p>We reserve the right to modify, update, or discontinue any feature or aspect of the Service at any time, with or without notice.</p>

<h2>4. User Accounts</h2>
<h3>4.1 Account Registration</h3>
<p>To access certain features of the Service, you must create an account and provide accurate, current, and complete information during the registration process. You agree to update your account information promptly to keep it accurate and complete.</p>
<h3>4.2 Account Security</h3>
<p>You are solely responsible for maintaining the confidentiality of your account credentials, including your password. You agree to:</p>
<ul>
<li>Create a strong, unique password for your account</li>
<li>Not share your account credentials with any third party</li>
<li>Notify us immediately of any unauthorized access to or use of your account</li>
<li>Not use another person's account without authorization</li>
</ul>
<h3>4.3 Account Responsibility</h3>
<p>You are responsible for all activities that occur under your account, whether or not you have authorized such activities.</p>

<h2>5. Third-Party Platform Integrations</h2>
<h3>5.1 OAuth Authorization</h3>
<p>The Service integrates with third-party social media platforms through their official APIs and OAuth 2.0 authentication protocols. By connecting your third-party accounts, you:</p>
<ul>
<li>Authorize the platform to access, manage, and publish content to your connected accounts within the scope of permissions you grant</li>
<li>Acknowledge that your use of each Third-Party Platform is subject to that platform's own terms of service and privacy policy</li>
<li>Understand that the availability and functionality of integrations may change based on Third-Party Platform API updates</li>
</ul>

<h2>6. User Content</h2>
<h3>6.1 Ownership</h3>
<p>You retain full ownership of all content you create, upload, submit, post, or transmit through the Service. We do not claim any ownership rights in your User Content.</p>
<h3>6.2 License Grant</h3>
<p>By submitting User Content through the Service, you grant us a limited, non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, adapt, process, and transmit your User Content solely for the purpose of providing, maintaining, and improving the Service.</p>

<h2>7. AI-Generated Content</h2>
<h3>7.1 Nature of AI Content</h3>
<p>The Service includes AI-powered features for content generation, suggestions, and optimization. AI-generated content is provided on an "as-is" basis.</p>
<h3>7.2 No Guarantee of Accuracy</h3>
<p><strong>We do not guarantee the accuracy, completeness, reliability, currentness, or suitability of any AI-generated content.</strong> AI models may produce content that is inaccurate, biased, inappropriate, or that infringes on third-party rights.</p>
<h3>7.3 User Responsibility</h3>
<p>You are solely responsible for reviewing, editing, verifying, and approving any AI-generated content before publishing or using it.</p>

<h2>8. Acceptable Use Policy</h2>
<p>You agree not to use the Service to:</p>
<ul>
<li>Violate any applicable law, regulation, or ordinance</li>
<li>Post, transmit, or distribute harmful, threatening, abusive, defamatory, or illegal content</li>
<li>Impersonate any person or entity</li>
<li>Engage in spamming, phishing, or unsolicited communications</li>
<li>Interfere with or disrupt the Service</li>
<li>Attempt unauthorized access to the Service</li>
<li>Use automated means to access the Service without permission</li>
<li>Reverse engineer, decompile, or disassemble the Service</li>
</ul>

<h2>9. Intellectual Property</h2>
<p>The Service, including its original content (excluding User Content), features, functionality, design, and source code, is and shall remain the exclusive property of the Company and its licensors.</p>

<h2>10. Payment and Subscription Terms</h2>
<h3>10.1 Pricing</h3>
<p>Certain features of the Service may require a paid subscription. Pricing, features included, and billing cycles are as described on our pricing page.</p>
<h3>10.2 Automatic Renewal</h3>
<p>Subscriptions automatically renew at the end of each billing cycle unless you cancel before the renewal date.</p>
<h3>10.3 Refund Policy</h3>
<p>Subscription fees are generally non-refundable. We may consider refund requests on a case-by-case basis.</p>

<h2>11. Data Security</h2>
<p>We implement commercially reasonable security measures to protect your data, including:</p>
<ul>
<li>AES-256 encryption for all OAuth tokens and sensitive credentials</li>
<li>TLS 1.2+ encryption for all data in transit</li>
<li>Bcrypt hashing for user passwords</li>
<li>Role-based access controls</li>
</ul>

<h2>12. Disclaimer of Warranties</h2>
<p><strong>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong></p>

<h2>13. Limitation of Liability</h2>
<p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</strong></p>

<h2>14. Termination</h2>
<p>We may suspend or terminate your access to the Service at any time for violation of these Terms. You may terminate your account at any time through account settings.</p>

<h2>15. Modifications to Terms</h2>
<p>We reserve the right to modify these Terms at any time. We will provide notice of material changes. Your continued use of the Service following the posting of revised Terms means that you accept the changes.</p>

<h2>16. Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of the applicable jurisdiction.</p>

<h2>17. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us through the platform's support channels.</p>`

const DEFAULT_PRIVACY = `<h1>Privacy Policy</h1>
<p><strong>Effective Date:</strong> [Date]</p>
<p><strong>Last Updated:</strong> [Date]</p>

<h2>1. Introduction</h2>
<p>This Privacy Policy describes how we collect, use, disclose, retain, and protect your personal information when you access or use this platform, including any related websites, applications, services, tools, and features (collectively, the "Service").</p>
<p>By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any part of this Privacy Policy, you must discontinue use of the Service immediately.</p>

<h2>2. Information We Collect</h2>
<h3>2.1 Information You Provide Directly</h3>
<ul>
<li><strong>Account Registration:</strong> Full name, email address, and password (hashed using bcrypt, never stored in plain text).</li>
<li><strong>Profile Information:</strong> Display name, profile picture, organization name, timezone, language preferences.</li>
<li><strong>Content:</strong> Text, captions, hashtags, images, video metadata, and any other content you create or upload.</li>
<li><strong>Communications:</strong> Information contained in emails, support tickets, or other communications.</li>
<li><strong>Payments:</strong> Billing information is processed by our third-party payment processor (Stripe, Inc.).</li>
</ul>

<h3>2.2 Information from Third-Party Platform Integrations</h3>
<p>When you connect your social media accounts via OAuth 2.0, we may collect:</p>
<ul>
<li>OAuth access tokens and refresh tokens (encrypted using AES-256)</li>
<li>Platform-specific user identifiers and account IDs</li>
<li>Public profile information (display name, username, profile picture)</li>
<li>Content metadata (post titles, descriptions, engagement metrics)</li>
</ul>

<h3>2.3 Information Collected Automatically</h3>
<ul>
<li><strong>Log Data:</strong> IP address, browser type, operating system, referring pages, timestamps.</li>
<li><strong>Device Information:</strong> Device type, screen resolution, unique device identifiers.</li>
<li><strong>Usage Data:</strong> Features accessed, actions taken, frequency and duration of use.</li>
</ul>

<h2>3. How We Use Your Information</h2>
<ul>
<li>Authenticate your identity and manage your account</li>
<li>Connect to and interact with social media platforms on your behalf</li>
<li>Schedule, manage, and publish content</li>
<li>Generate AI-powered content suggestions and analytics</li>
<li>Process payments and subscriptions</li>
<li>Provide customer support</li>
<li>Improve the Service and develop new features</li>
<li>Detect and prevent security threats and fraud</li>
<li>Comply with legal obligations</li>
</ul>

<h2>4. Data Sharing and Disclosure</h2>
<p><strong>We do not sell, rent, or trade your Personal Information.</strong> We may share your information only in the following limited circumstances:</p>
<ul>
<li><strong>With Your Consent:</strong> When you explicitly authorize sharing for a specific purpose.</li>
<li><strong>Third-Party Publishing:</strong> When you use the Service to publish content to social media platforms.</li>
<li><strong>AI Processing:</strong> Content submitted for AI processing is transmitted to our AI providers solely for generating responses.</li>
<li><strong>Service Providers:</strong> Hosting, payment processing, email, and analytics services.</li>
<li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
</ul>

<h2>5. Data Security</h2>
<p>We implement commercially reasonable security measures including:</p>
<ul>
<li><strong>Encryption at Rest:</strong> AES-256 encryption for OAuth tokens and sensitive data.</li>
<li><strong>Encryption in Transit:</strong> TLS 1.2+ (HTTPS) for all data transmission.</li>
<li><strong>Password Security:</strong> Bcrypt hashing with random salt.</li>
<li><strong>Access Controls:</strong> Role-based access with multi-factor authentication for production systems.</li>
</ul>

<h2>6. Data Retention</h2>
<ul>
<li><strong>Active Account Data:</strong> Retained while your account is active.</li>
<li><strong>Account Deletion:</strong> Data deleted/anonymized within 30 days of account deletion.</li>
<li><strong>OAuth Tokens:</strong> Immediately revoked and deleted upon platform disconnection.</li>
<li><strong>Log Data:</strong> Retained for up to 90 days.</li>
</ul>

<h2>7. Your Privacy Rights</h2>
<ul>
<li><strong>Right to Access:</strong> Request a copy of your Personal Information.</li>
<li><strong>Right to Rectification:</strong> Request correction of inaccurate information.</li>
<li><strong>Right to Deletion:</strong> Request deletion of your account and data.</li>
<li><strong>Right to Data Portability:</strong> Request an export of your data.</li>
<li><strong>Right to Disconnect:</strong> Remove connected social media accounts at any time.</li>
<li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time.</li>
</ul>

<h2>8. Cookies</h2>
<p>We use strictly necessary cookies for authentication and session management. We do <strong>not</strong> use third-party advertising or tracking cookies.</p>

<h2>9. Children's Privacy</h2>
<p>The Service is not intended for individuals under 16 years of age. We do not knowingly collect data from children under 16.</p>

<h2>10. International Data Transfers</h2>
<p>Your data may be transferred to and processed in various countries. We take appropriate safeguards to ensure adequate protection of your information.</p>

<h2>11. Changes to Privacy Policy</h2>
<p>We reserve the right to update this Privacy Policy at any time. We will notify you of material changes. Your continued use of the Service constitutes acceptance of the updated terms.</p>

<h2>12. Data Deletion Instructions</h2>
<p>To delete your data:</p>
<ul>
<li><strong>Self-service:</strong> Dashboard → Settings → Account → Delete Account</li>
<li><strong>Disconnect platforms:</strong> Dashboard → Channels → select platform → Disconnect</li>
<li><strong>Email request:</strong> Contact support with subject "Data Deletion Request"</li>
</ul>

<h2>13. Contact Information</h2>
<p>If you have any questions about this Privacy Policy, please contact us through the platform's support channels.</p>`

type Tab = 'terms' | 'privacy'

export default function AdminLegalPage() {
    const [tab, setTab] = useState<Tab>('terms')
    const [termsContent, setTermsContent] = useState('')
    const [privacyContent, setPrivacyContent] = useState('')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [preview, setPreview] = useState(false)
    const [appName, setAppName] = useState('')

    useEffect(() => {
        fetch('/api/admin/legal')
            .then(r => r.json())
            .then(data => {
                setTermsContent(data.termsContent || DEFAULT_TERMS)
                setPrivacyContent(data.privacyContent || DEFAULT_PRIVACY)
                setAppName(data.appName || 'NeeFlow')
            })
            .catch(() => {
                setTermsContent(DEFAULT_TERMS)
                setPrivacyContent(DEFAULT_PRIVACY)
            })
            .finally(() => setLoading(false))
    }, [])

    async function handleSave() {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/legal', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termsContent, privacyContent }),
            })
            if (!res.ok) throw new Error('Failed to save')
            toast.success('Legal pages saved successfully!')
        } catch {
            toast.error('Failed to save legal pages')
        } finally {
            setSaving(false)
        }
    }

    const currentContent = tab === 'terms' ? termsContent : privacyContent
    const setCurrentContent = tab === 'terms' ? setTermsContent : setPrivacyContent

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Legal Pages
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Edit your Terms of Service and Privacy Policy. Content is rendered as HTML.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreview(!preview)}
                    >
                        {preview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {preview ? 'Edit' : 'Preview'}
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save All
                    </Button>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setTab('terms')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tab === 'terms'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <FileText className="h-4 w-4" />
                    Terms of Service
                </button>
                <button
                    onClick={() => setTab('privacy')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tab === 'privacy'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Shield className="h-4 w-4" />
                    Privacy Policy
                </button>
            </div>

            {/* Info Banner */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
                <p className="text-blue-400 font-medium mb-1">💡 HTML Content Editor</p>
                <p className="text-muted-foreground">
                    Write your content using HTML tags. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;h2&gt;</code> for headings,{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;p&gt;</code> for paragraphs,{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;ul&gt;&lt;li&gt;</code> for lists, and{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;strong&gt;</code> for bold text. •{' '}
                    <a href={tab === 'terms' ? '/terms' : '/privacy'} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        View live page →
                    </a>
                </p>
            </div>

            {/* Editor / Preview */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                        {tab === 'terms' ? '📄 Terms of Service' : '🛡️ Privacy Policy'}
                        {appName && (
                            <span className="text-xs text-muted-foreground font-normal ml-2">
                                for {appName}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {preview ? (
                        <div className="prose prose-neutral dark:prose-invert max-w-none min-h-[500px] p-6 border rounded-lg bg-background overflow-auto max-h-[70vh]">
                            <div dangerouslySetInnerHTML={{ __html: currentContent }} />
                        </div>
                    ) : (
                        <textarea
                            value={currentContent}
                            onChange={e => setCurrentContent(e.target.value)}
                            className="w-full min-h-[500px] max-h-[70vh] p-4 font-mono text-sm bg-muted/50 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter HTML content..."
                            spellCheck={false}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <button
                    onClick={() => {
                        if (confirm(`Reset ${tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'} to default template?`)) {
                            setCurrentContent(tab === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY)
                            toast.info('Content reset to default template. Remember to click Save.')
                        }
                    }}
                    className="text-orange-400 hover:underline"
                >
                    ↺ Reset to default template
                </button>
                <span>•</span>
                <a href={tab === 'terms' ? '/terms' : '/privacy'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Open live page ↗
                </a>
            </div>
        </div>
    )
}
