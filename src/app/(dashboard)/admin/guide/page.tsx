'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Circle, ExternalLink, Copy, Check, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

// ─── Callback URL Card ────────────────────────────────────────────────────────
function CallbackUrlBox({ label, path, domain }: { label: string; path: string; domain: string }) {
    const [copied, setCopied] = useState(false)
    const url = `${domain}${path}`

    function copy() {
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2 bg-muted/60 border rounded-md px-3 py-2 text-xs font-mono group">
            <Link2 className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
            <span className="flex-1 truncate text-muted-foreground">
                <span className="text-primary/70">{label}:</span>{' '}
                <span className="text-foreground">{url}</span>
            </span>
            <button
                onClick={copy}
                className="ml-auto flex-shrink-0 p-1 rounded hover:bg-background/80 border opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy URL"
            >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </button>
        </div>
    )
}

// ─── Command Block ────────────────────────────────────────────────────────────
function CommandBlock({ cmd, copiedCommand, onCopy }: { cmd: string; copiedCommand: string | null; onCopy: (c: string) => void }) {
    return (
        <div className="group relative">
            <pre className="bg-muted/70 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{cmd}</pre>
            <button
                onClick={() => onCopy(cmd)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 border"
            >
                {copiedCommand === cmd ? (
                    <Check className="h-3 w-3 text-green-500" />
                ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                )}
            </button>
        </div>
    )
}

// ─── Guide Data ───────────────────────────────────────────────────────────────
function buildGuide(domain: string) {
    return [
        {
            title: '🗄️ Database Setup',
            icon: '🗄️',
            steps: [
                {
                    title: 'Install PostgreSQL',
                    description: 'Install and configure PostgreSQL 14+.',
                    details: [
                        'PostgreSQL 14+ is required.',
                        'After installation, create a database and user for the app.',
                        'The setup wizard handles this automatically when you provide valid credentials.',
                    ],
                    commands: [
                        'sudo apt install postgresql postgresql-contrib -y',
                        "sudo -u postgres psql -c \"CREATE USER neeflow WITH PASSWORD 'your_password';\"",
                        'sudo -u postgres psql -c "CREATE DATABASE neeflow OWNER neeflow;"',
                    ],
                },
                {
                    title: 'Install Redis',
                    description: 'Redis is used for caching and background job queues.',
                    details: ['Redis 6+ is required.', 'Default connection: redis://localhost:6379'],
                    commands: [
                        'sudo apt install redis-server -y',
                        'sudo systemctl enable redis-server && sudo systemctl start redis-server',
                    ],
                },
                {
                    title: 'Run Database Migrations & Seed',
                    description: 'Create all tables and populate initial data.',
                    details: ['Make sure DATABASE_URL is set in .env before running.'],
                    commands: [
                        'npx prisma db push',
                        'npx tsx prisma/seed.ts        # Admin user, settings, integrations',
                        'npx tsx prisma/seed-plans.ts  # Subscription plans',
                        'npx tsx prisma/seed-inbox.ts  # Email templates',
                    ],
                },
            ],
        },
        {
            title: '🔐 Security & Environment',
            icon: '🔐',
            steps: [
                {
                    title: 'Configure .env File',
                    description: 'Set up all required environment variables.',
                    details: [
                        'DATABASE_URL — PostgreSQL connection string',
                        'AUTH_SECRET — JWT signing secret (32+ random chars)',
                        `NEXTAUTH_URL — Your app public URL: ${domain}`,
                        'REDIS_URL — Redis connection string (default: redis://localhost:6379)',
                        'ENCRYPTION_KEY — AES-256 key for OAuth tokens (64-char hex)',
                        'CRON_SECRET — Secret for cron job auth',
                        'WORKER_SECRET — Secret for worker → API auth',
                    ],
                    commands: [
                        'openssl rand -base64 32  # → AUTH_SECRET',
                        'openssl rand -hex 32     # → ENCRYPTION_KEY',
                        'openssl rand -hex 32     # → CRON_SECRET / WORKER_SECRET',
                    ],
                },
                {
                    title: 'SSL Certificate',
                    description: 'HTTPS is required for all OAuth callbacks.',
                    details: [
                        'All OAuth providers (TikTok, Facebook, Google, etc.) require HTTPS redirect URIs.',
                        'Use Certbot for free Let\'s Encrypt certificates.',
                        'If using FlashPanel/HestiaCP, SSL is managed automatically.',
                    ],
                    commands: [
                        'sudo apt install certbot python3-certbot-nginx -y',
                        'sudo certbot --nginx -d yourdomain.com',
                    ],
                },
            ],
        },
        {
            title: '🚀 PM2 & Deployment',
            icon: '🚀',
            steps: [
                {
                    title: 'Build & Start with PM2',
                    description: 'Build the production app and start both web and worker processes.',
                    details: [
                        'neeflow-web — serves the Next.js web app on port 3000',
                        'neeflow-worker — runs background jobs and cron tasks',
                        'pm2 save + pm2 startup ensures processes restart after server reboot',
                    ],
                    commands: [
                        'npm run build',
                        'pm2 start npm --name "neeflow-web" -- start',
                        'pm2 start npm --name "neeflow-worker" -- run worker',
                        'pm2 save',
                        'pm2 startup',
                    ],
                },
                {
                    title: 'Nginx Reverse Proxy',
                    description: 'Proxy requests from port 80/443 to the Next.js app on port 3000.',
                    details: [
                        'Add the following to your Nginx server block.',
                        'WebSocket headers are required for real-time features.',
                        'client_max_body_size 100M allows large media uploads.',
                    ],
                    commands: [
                        `location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    client_max_body_size 100M;
}`,
                    ],
                },
            ],
        },
        {
            title: '📱 OAuth Callback URLs',
            icon: '📱',
            steps: [
                {
                    title: 'Your Callback URLs (copy & paste into each platform)',
                    description: `Auto-detected from your current domain: ${domain}`,
                    details: [
                        'Each platform requires you to whitelist the exact redirect/callback URL.',
                        'Copy the URL for the platform you are configuring and paste it into the developer portal.',
                        'All URLs must be HTTPS in production.',
                    ],
                    callbackUrls: [
                        { label: 'Facebook / Instagram OAuth', path: '/api/oauth/facebook/callback' },
                        { label: 'Instagram OAuth', path: '/api/oauth/instagram/callback' },
                        { label: 'YouTube / Google OAuth', path: '/api/oauth/youtube/callback' },
                        { label: 'Google Sign-In (Login)', path: '/api/auth/callback/google' },
                        { label: 'TikTok OAuth', path: '/api/oauth/tiktok/callback' },
                        { label: 'LinkedIn OAuth', path: '/api/oauth/linkedin/callback' },
                        { label: 'X (Twitter) OAuth', path: '/api/oauth/x/callback' },
                        { label: 'Pinterest OAuth', path: '/api/oauth/pinterest/callback' },
                        { label: 'Canva OAuth', path: '/api/oauth/canva/callback' },
                        { label: 'Google Drive OAuth', path: '/api/oauth/gdrive/callback' },
                        { label: 'Facebook Webhook', path: '/api/webhooks/facebook' },
                        { label: 'TikTok Webhook', path: '/api/webhooks/tiktok' },
                        { label: 'Stripe Webhook', path: '/api/billing/webhook' },
                    ],
                    links: [],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '🔵 Facebook + Instagram Setup',
            icon: '🔵',
            steps: [
                {
                    title: 'Facebook App Setup',
                    description: 'Create a Meta Business app for Pages and Instagram.',
                    details: [
                        '1. Go to developers.facebook.com → My Apps → Create App',
                        '2. Select use case: "Authenticate and request data from users with Facebook Login" → Business type',
                        '3. App Settings → Basic: fill App Name, Contact Email, Privacy Policy URL, Terms URL',
                        `4. Privacy Policy URL: ${domain}/privacy`,
                        `5. Terms of Service URL: ${domain}/terms`,
                        '6. Products → Add Product → Facebook Login for Business → Set Up',
                        '7. Facebook Login → Settings → Valid OAuth Redirect URIs → paste callback URL below',
                        '8. Products → Add Product → Webhooks → Subscribe to "Page" events: messages, messaging_postbacks, feed',
                        `9. Webhooks Callback URL: ${domain}/api/webhooks/facebook`,
                        '10. Required permissions: pages_show_list, pages_manage_metadata, pages_read_engagement, pages_messaging, pages_manage_posts, pages_read_user_content, public_profile',
                        '11. Submit app for Review to go Live',
                    ],
                    callbackUrls: [
                        { label: 'Facebook OAuth Redirect URI', path: '/api/oauth/facebook/callback' },
                        { label: 'Instagram OAuth Redirect URI', path: '/api/oauth/instagram/callback' },
                        { label: 'Facebook Webhook Callback URL', path: '/api/webhooks/facebook' },
                    ],
                    links: [{ label: 'Meta Developers Portal', href: 'https://developers.facebook.com' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '🔴 YouTube Setup',
            icon: '🔴',
            steps: [
                {
                    title: 'Google Cloud + YouTube API',
                    description: 'Enable YouTube Data API v3 for video uploads.',
                    details: [
                        '1. Go to console.cloud.google.com → Create or select a project',
                        '2. APIs & Services → Library → search "YouTube Data API v3" → Enable',
                        '3. APIs & Services → OAuth consent screen → External → fill in app name, email, scopes',
                        '4. Credentials → Create Credentials → OAuth 2.0 Client ID → Web application',
                        '5. Authorized redirect URIs → add callback URL below',
                        '6. Copy Client ID and Client Secret → Admin → Integrations → YouTube',
                        '7. Required scopes: youtube.readonly, youtube.upload, youtube.force-ssl',
                    ],
                    callbackUrls: [
                        { label: 'YouTube OAuth Redirect URI', path: '/api/oauth/youtube/callback' },
                        { label: 'Google Sign-In Redirect URI', path: '/api/auth/callback/google' },
                    ],
                    links: [{ label: 'Google Cloud Console', href: 'https://console.cloud.google.com' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '🎵 TikTok Setup',
            icon: '🎵',
            steps: [
                {
                    title: 'TikTok Developer App',
                    description: 'Register a TikTok app for content publishing.',
                    details: [
                        '1. Go to developers.tiktok.com → Manage Apps → Create App',
                        '2. App Name, Category: Social Networking, Description',
                        `3. Terms of Service URL: ${domain}/terms`,
                        `4. Privacy Policy URL: ${domain}/privacy`,
                        `5. Web/Desktop URL: ${domain}`,
                        '6. Products → Add products → Login Kit (includes user.info.basic)',
                        '7. Products → Add products → Content Posting API (video.upload + video.publish)',
                        '8. Optionally add user.info.stats scope',
                        '9. Login Kit → Redirect URI → add callback URL below',
                        '10. Copy Client Key and Client Secret → Admin → Integrations → TikTok',
                        '11. Submit for App Review with demo videos',
                        '12. Use Sandbox Mode toggle in Admin → Integrations → TikTok while recording demo videos',
                    ],
                    callbackUrls: [
                        { label: 'TikTok Login Kit Redirect URI', path: '/api/oauth/tiktok/callback' },
                        { label: 'TikTok Webhook Callback URL', path: '/api/webhooks/tiktok' },
                    ],
                    links: [{ label: 'TikTok Developer Portal', href: 'https://developers.tiktok.com' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '🔗 LinkedIn Setup',
            icon: '🔗',
            steps: [
                {
                    title: 'LinkedIn Developer App',
                    description: 'Create a LinkedIn app for profile and page posting.',
                    details: [
                        '1. Go to linkedin.com/developers → Create App',
                        '2. App Name, LinkedIn Page (required), Logo, Privacy Policy URL',
                        '3. Products tab → Request: "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect"',
                        '4. Auth tab → OAuth 2.0 Settings → Authorized Redirect URLs → add callback URL',
                        '5. Copy Client ID and Client Secret → Admin → Integrations → LinkedIn',
                        '6. Required scopes: openid, profile, w_member_social',
                    ],
                    callbackUrls: [
                        { label: 'LinkedIn OAuth Redirect URL', path: '/api/oauth/linkedin/callback' },
                    ],
                    links: [{ label: 'LinkedIn Developer Portal', href: 'https://www.linkedin.com/developers/apps' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '𝕏 X (Twitter) Setup',
            icon: '𝕏',
            steps: [
                {
                    title: 'X Developer App',
                    description: 'Set up X Developer account for posting tweets.',
                    details: [
                        '1. Go to developer.x.com → Developer Portal → Create Project + App',
                        '2. App Settings → User authentication settings → enable OAuth 2.0',
                        '3. App type: Web App. Callback URI → add callback URL below',
                        '4. Permissions: Read and Write',
                        '5. Keys and Tokens → OAuth 2.0 → copy Client ID and Client Secret',
                        '6. Paste into Admin → Integrations → X (Twitter)',
                        '7. Required scopes: tweet.read, tweet.write, users.read, offline.access',
                    ],
                    callbackUrls: [
                        { label: 'X (Twitter) OAuth Callback URI', path: '/api/oauth/x/callback' },
                    ],
                    links: [{ label: 'X Developer Portal', href: 'https://developer.x.com' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '📌 Pinterest Setup',
            icon: '📌',
            steps: [
                {
                    title: 'Pinterest Developer App',
                    description: 'Create a Pinterest app for pin and board management.',
                    details: [
                        '1. Go to developers.pinterest.com → My Apps → Create',
                        '2. Fill app name and description',
                        '3. Redirect URIs → add callback URL below',
                        '4. Copy App ID and App Secret → Admin → Integrations → Pinterest',
                        '5. Submit for review to get production access',
                        '6. Enable Sandbox Mode in Admin → Integrations while testing',
                        '7. Required scopes: boards:read, pins:read, pins:write, user_accounts:read',
                    ],
                    callbackUrls: [
                        { label: 'Pinterest OAuth Redirect URI', path: '/api/oauth/pinterest/callback' },
                    ],
                    links: [{ label: 'Pinterest Developer Portal', href: 'https://developers.pinterest.com/apps/' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '💳 Stripe Setup',
            icon: '💳',
            steps: [
                {
                    title: 'Stripe Billing Configuration',
                    description: 'Configure Stripe for subscription payments.',
                    details: [
                        '1. Go to dashboard.stripe.com → Developers → API Keys',
                        '2. Copy Secret Key (sk_live_...) and Publishable Key (pk_live_...)',
                        '3. Paste both into Admin → Integrations → Stripe',
                        '4. Developers → Webhooks → Add endpoint → paste webhook URL below',
                        '5. Events to listen: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed',
                        '6. After creating webhook: reveal Signing Secret (whsec_...) → paste into Stripe config',
                        '7. Run seed: npx tsx prisma/seed-plans.ts to create subscription plans',
                    ],
                    callbackUrls: [
                        { label: 'Stripe Webhook Endpoint', path: '/api/billing/webhook' },
                    ],
                    commands: [
                        'npx tsx prisma/seed-plans.ts   # Create Free/Pro/Business/Enterprise plans',
                    ],
                    links: [{ label: 'Stripe Dashboard', href: 'https://dashboard.stripe.com/apikeys' }],
                    adminPath: '/admin/integrations',
                },
            ],
        },
        {
            title: '🎨 Branding & Legal',
            icon: '🎨',
            steps: [
                {
                    title: 'Configure Branding',
                    description: 'Set your app name, logo, and colors.',
                    details: [
                        'App Name — displayed throughout the app and emails',
                        'Logo & Favicon — upload your brand assets',
                        'Primary Color — buttons, links, and accents',
                        'Support Email — shown in footer and contact pages',
                    ],
                    adminPath: '/admin/branding',
                },
                {
                    title: 'Legal Pages',
                    description: 'Review and customize Terms of Service, Privacy Policy, Cookie Policy, GDPR, and About pages.',
                    details: [
                        `Terms of Service: ${domain}/terms`,
                        `Privacy Policy: ${domain}/privacy`,
                        `Cookie Policy: ${domain}/cookies`,
                        `GDPR Compliance: ${domain}/gdpr`,
                        `About: ${domain}/about`,
                        'These URLs are required in all OAuth app registrations.',
                    ],
                    adminPath: '/admin/legal',
                },
            ],
        },
    ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminGuidePage() {
    const [domain, setDomain] = useState('https://yourdomain.com')
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

    useEffect(() => {
        setDomain(window.location.origin)
    }, [])

    const GUIDE_SECTIONS = buildGuide(domain)

    function toggleSection(index: number) {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    function copyCommand(cmd: string) {
        navigator.clipboard.writeText(cmd)
        setCopiedCommand(cmd)
        toast.success('Copied!')
        setTimeout(() => setCopiedCommand(null), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Setup Guide
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Step-by-step instructions. All callback URLs are auto-detected from your domain:{' '}
                    <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">{domain}</code>
                </p>
            </div>

            {/* Quick nav */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {GUIDE_SECTIONS.map((section, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setExpandedSections(prev => new Set(prev).add(i))
                            setTimeout(() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' }), 50)
                        }}
                        className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                        <span className="text-base">{section.icon}</span>
                        <p className="text-[10px] font-medium mt-1 line-clamp-2 leading-tight text-muted-foreground">
                            {section.title.replace(/^.\s/, '')}
                        </p>
                    </button>
                ))}
            </div>

            {/* Sections */}
            <div className="space-y-3">
                {GUIDE_SECTIONS.map((section, sectionIndex) => (
                    <Card key={sectionIndex} id={`section-${sectionIndex}`}>
                        <CardHeader
                            className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
                            onClick={() => toggleSection(sectionIndex)}
                        >
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    {section.title}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        ({section.steps.length} {section.steps.length === 1 ? 'step' : 'steps'})
                                    </span>
                                </span>
                                {expandedSections.has(sectionIndex) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </CardTitle>
                        </CardHeader>

                        {expandedSections.has(sectionIndex) && (
                            <CardContent className="space-y-6 pt-0">
                                {section.steps.map((step, stepIndex) => (
                                    <div key={stepIndex} className="border-l-2 border-primary/30 pl-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Circle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-sm">{step.title}</h3>
                                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <ul className="space-y-1 ml-6">
                                            {step.details.map((detail, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                                                    <span className="text-primary/50 mt-0.5 flex-shrink-0">•</span>
                                                    <span>{detail}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Callback URLs */}
                                        {(step as any).callbackUrls && (step as any).callbackUrls.length > 0 && (
                                            <div className="ml-6 space-y-1.5">
                                                <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wide mb-1">
                                                    📋 Callback URLs — click to copy
                                                </p>
                                                {(step as any).callbackUrls.map((cb: { label: string; path: string }, i: number) => (
                                                    <CallbackUrlBox key={i} label={cb.label} path={cb.path} domain={domain} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Commands */}
                                        {step.commands && step.commands.length > 0 && (
                                            <div className="ml-6 space-y-2">
                                                {step.commands.map((cmd, i) => (
                                                    <CommandBlock key={i} cmd={cmd} copiedCommand={copiedCommand} onCopy={copyCommand} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Links */}
                                        {step.links && step.links.length > 0 && (
                                            <div className="ml-6 flex flex-wrap gap-2">
                                                {step.links.map((link, i) => (
                                                    <a
                                                        key={i}
                                                        href={link.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        {link.label}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Admin shortcut */}
                                        {(step as any).adminPath && (
                                            <div className="ml-6">
                                                <a
                                                    href={(step as any).adminPath}
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                                                >
                                                    Go to settings →
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    )
}
