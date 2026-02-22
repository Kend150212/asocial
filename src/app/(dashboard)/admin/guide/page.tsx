'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, CheckCircle2, Circle, ExternalLink, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface GuideStep {
    title: string
    description: string
    details: string[]
    links?: { label: string; href: string }[]
    commands?: string[]
    adminPath?: string
}

const GUIDE_SECTIONS: { title: string; icon: string; steps: GuideStep[] }[] = [
    {
        title: '🗄️ Database Setup',
        icon: '🗄️',
        steps: [
            {
                title: 'Install PostgreSQL',
                description: 'Install and configure PostgreSQL database server.',
                details: [
                    'PostgreSQL 14+ is required for the application.',
                    'After installation, create a database and user for the app.',
                    'The setup wizard handles this automatically if you provide valid credentials.',
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
                details: [
                    'Redis 6+ is required.',
                    'Default connection: redis://localhost:6379',
                ],
                commands: [
                    'sudo apt install redis-server -y',
                    'sudo systemctl enable redis-server',
                    'sudo systemctl start redis-server',
                ],
            },
            {
                title: 'Run Database Migrations',
                description: 'Apply the database schema to create all required tables.',
                details: [
                    'Make sure DATABASE_URL is set in your .env file before running migrations.',
                    'This creates all tables, indexes, and seed data.',
                ],
                commands: [
                    'npx prisma db push',
                    'npx prisma db seed',
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
                    'AUTH_SECRET — JWT signing secret (generate a random 32-char string)',
                    'NEXTAUTH_URL — Your app\'s public URL (e.g. https://yourdomain.com)',
                    'REDIS_URL — Redis connection string (default: redis://localhost:6379)',
                    'ENCRYPTION_KEY — AES encryption key for OAuth tokens (64-char hex string)',
                    'CRON_SECRET — Secret for cron job authentication',
                    'WORKER_SECRET — Secret for worker → API authentication',
                ],
                commands: [
                    'openssl rand -base64 32  # Generate AUTH_SECRET',
                    'openssl rand -hex 32     # Generate ENCRYPTION_KEY',
                ],
            },
            {
                title: 'SSL Certificate',
                description: 'Set up HTTPS with Let\'s Encrypt or your preferred SSL provider.',
                details: [
                    'HTTPS is required for OAuth callbacks from all social platforms.',
                    'Use Certbot for free Let\'s Encrypt certificates.',
                    'If using FlashPanel or similar, SSL may be managed automatically.',
                ],
                commands: [
                    'sudo apt install certbot python3-certbot-nginx -y',
                    'sudo certbot --nginx -d yourdomain.com',
                ],
            },
        ],
    },
    {
        title: '🌐 Web Server (Nginx)',
        icon: '🌐',
        steps: [
            {
                title: 'Configure Nginx as Reverse Proxy',
                description: 'Nginx proxies requests to the Next.js application running on port 3000.',
                details: [
                    'The application runs on port 3000 by default.',
                    'Nginx should proxy all requests to http://localhost:3000.',
                    'WebSocket support is needed for real-time features.',
                ],
                commands: [
                    `# Add this to your Nginx server block:
location / {
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
        title: '📱 Platform OAuth Setup',
        icon: '📱',
        steps: [
            {
                title: 'Facebook + Instagram',
                description: 'Set up Facebook App for Page and Instagram management.',
                details: [
                    '1. Go to developers.facebook.com → Create App → "Business" type',
                    '2. Add products: Facebook Login, Webhooks, Messenger',
                    '3. Facebook Login → Settings → paste OAuth Callback URL',
                    '4. Webhooks → Product: "Page" → paste Callback URL + Verify Token → "Verify and Save"',
                    '5. Subscribe fields: messages ✅ messaging_postbacks ✅ feed ✅',
                    '6. Required permissions: pages_show_list, pages_manage_metadata, pages_read_engagement, pages_messaging, pages_manage_posts, pages_read_user_content, public_profile',
                    '7. App Settings → Basic → add Privacy Policy URL',
                    '8. Submit for App Review to go Live',
                ],
                links: [
                    { label: 'Facebook Developer Console', href: 'https://developers.facebook.com' },
                ],
                adminPath: '/admin/integrations',
            },
            {
                title: 'YouTube',
                description: 'Set up Google Cloud project for YouTube API access.',
                details: [
                    '1. Go to Google Cloud Console → Create Project',
                    '2. Enable YouTube Data API v3',
                    '3. OAuth consent screen → External → fill in app info',
                    '4. Credentials → Create OAuth Client ID → Web Application',
                    '5. Add authorized redirect URI (your callback URL)',
                    '6. Copy Client ID and Client Secret to Admin → API Hub',
                ],
                links: [
                    { label: 'Google Cloud Console', href: 'https://console.cloud.google.com' },
                ],
                adminPath: '/admin/integrations',
            },
            {
                title: 'TikTok',
                description: 'Register TikTok developer app for content publishing.',
                details: [
                    '1. Go to TikTok Developer Portal → Create App',
                    '2. Add Login Kit and Content Posting API',
                    '3. Configure redirect URI with your callback URL',
                    '4. Copy Client Key and Client Secret to Admin → API Hub',
                ],
                links: [
                    { label: 'TikTok Developer Portal', href: 'https://developers.tiktok.com' },
                ],
                adminPath: '/admin/integrations',
            },
            {
                title: 'LinkedIn',
                description: 'Create LinkedIn app for page/profile management.',
                details: [
                    '1. Go to LinkedIn Developer Portal → Create App',
                    '2. Request products: Share on LinkedIn, Sign In with LinkedIn',
                    '3. Auth tab → add redirect URL',
                    '4. Copy Client ID and Client Secret to Admin → API Hub',
                ],
                links: [
                    { label: 'LinkedIn Developer Portal', href: 'https://developer.linkedin.com' },
                ],
                adminPath: '/admin/integrations',
            },
            {
                title: 'X (Twitter)',
                description: 'Set up X Developer account for posting.',
                details: [
                    '1. Go to developer.x.com → Create Project + App',
                    '2. Set up OAuth 2.0 with PKCE',
                    '3. Add redirect URI with your callback URL',
                    '4. Copy Client ID and Client Secret to Admin → API Hub',
                ],
                links: [
                    { label: 'X Developer Portal', href: 'https://developer.x.com' },
                ],
                adminPath: '/admin/integrations',
            },
            {
                title: 'Pinterest',
                description: 'Create Pinterest app for pin management.',
                details: [
                    '1. Go to Pinterest Developer Portal → Create App',
                    '2. Request access to Pins API',
                    '3. Add redirect URI with your callback URL',
                    '4. Copy App ID and App Secret to Admin → API Hub',
                ],
                links: [
                    { label: 'Pinterest Developer Portal', href: 'https://developers.pinterest.com' },
                ],
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
                description: 'Set your app name, logo, colors, and other branding elements.',
                details: [
                    'Go to Admin → Branding to customize:',
                    '• App Name — displayed throughout the app',
                    '• Logo & Favicon — upload your brand assets',
                    '• Primary Color — used for buttons, links, and accents',
                    '• Support Email — shown in footer and contact pages',
                    '• Copyright Text — displayed in footer',
                ],
                adminPath: '/admin/branding',
            },
            {
                title: 'Edit Legal Pages',
                description: 'Customize Terms of Service and Privacy Policy content.',
                details: [
                    'Go to Admin → Legal Pages to edit:',
                    '• Terms of Service — displayed at /terms',
                    '• Privacy Policy — displayed at /privacy',
                    'These pages are linked from login, register, and landing pages.',
                    'Content is written in HTML format.',
                ],
                adminPath: '/admin/legal',
            },
        ],
    },
    {
        title: '🚀 Deployment & Process Management',
        icon: '🚀',
        steps: [
            {
                title: 'Build the Application',
                description: 'Create the production build.',
                details: [
                    'Run the build command to create an optimized production bundle.',
                    'Fix any build errors before proceeding.',
                ],
                commands: [
                    'npm run build',
                ],
            },
            {
                title: 'Start with PM2',
                description: 'Use PM2 for process management and auto-restart.',
                details: [
                    'PM2 keeps the app running and restarts it if it crashes.',
                    'The ecosystem config defines two processes: web server and background worker.',
                    'Use pm2 save to persist the process list across server reboots.',
                ],
                commands: [
                    'pm2 delete all 2>/dev/null || true',
                    'pm2 start ecosystem.config.js',
                    'pm2 save',
                    'pm2 startup  # Auto-start on server reboot',
                ],
            },
            {
                title: 'Set Up Cron Jobs',
                description: 'Configure scheduled tasks for background processing.',
                details: [
                    'Cron jobs handle scheduled post publishing, token refresh, and cleanup.',
                    'Add crontab entries for the worker process.',
                ],
                commands: [
                    '# Add to crontab (crontab -e):',
                    '*/5 * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/publish',
                    '0 */6 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/refresh-tokens',
                ],
            },
        ],
    },
    {
        title: '👥 User Management',
        icon: '👥',
        steps: [
            {
                title: 'Create Admin Account',
                description: 'The first account created during setup is the admin.',
                details: [
                    'The setup wizard creates the initial admin account.',
                    'Additional users can register and be promoted to admin from Admin → Users.',
                    'Change the default admin password after setup.',
                ],
                adminPath: '/admin/users',
            },
            {
                title: 'Configure Subscription Plans',
                description: 'Set up pricing plans for your users.',
                details: [
                    'Go to Admin → Plans to create and manage subscription plans.',
                    'Each plan can have different limits for channels, posts, team members, etc.',
                    'Connect Stripe for payment processing in Admin → Billing.',
                ],
                adminPath: '/admin/plans',
            },
        ],
    },
]

export default function AdminGuidePage() {
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

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
        toast.success('Copied to clipboard!')
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
                    Step-by-step instructions for configuring your instance.
                </p>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GUIDE_SECTIONS.map((section, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setExpandedSections(prev => new Set(prev).add(i))
                            document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                        <span className="text-lg">{section.icon}</span>
                        <p className="text-xs font-medium mt-1 line-clamp-1">{section.title.replace(/^.{2}\s/, '')}</p>
                    </button>
                ))}
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {GUIDE_SECTIONS.map((section, sectionIndex) => (
                    <Card key={sectionIndex} id={`section-${sectionIndex}`}>
                        <CardHeader
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleSection(sectionIndex)}
                        >
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    {section.title}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        ({section.steps.length} steps)
                                    </span>
                                </span>
                                {expandedSections.has(sectionIndex) ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                                                    <span className="text-primary/50 mt-1">•</span>
                                                    <span>{detail}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Commands */}
                                        {step.commands && step.commands.length > 0 && (
                                            <div className="ml-6 space-y-2">
                                                {step.commands.map((cmd, i) => (
                                                    <div key={i} className="group relative">
                                                        <pre className="bg-muted/70 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                                            {cmd}
                                                        </pre>
                                                        <button
                                                            onClick={() => copyCommand(cmd)}
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 border"
                                                        >
                                                            {copiedCommand === cmd ? (
                                                                <Check className="h-3 w-3 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                                            )}
                                                        </button>
                                                    </div>
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

                                        {/* Admin Path Link */}
                                        {step.adminPath && (
                                            <div className="ml-6">
                                                <a
                                                    href={step.adminPath}
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
