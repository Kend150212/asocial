# ASocial — AI-Powered Social Media Management Platform

Self-hosted, open-source social media management platform with AI content generation, multi-platform publishing, team collaboration, and whitelabel support.

---

## ✨ Features

- **AI Content Generation** — GPT / Gemini / OpenRouter powered captions, hashtags, and posts
- **Multi-Platform Publishing** — Facebook, Instagram, YouTube, TikTok, Pinterest, LinkedIn, X (Twitter)
- **Smart Scheduling** — Calendar-based scheduling with auto-post queue
- **Media Management** — Google Drive integration for image/video storage
- **Team Collaboration** — Multi-user with roles (Admin, Owner, Manager, Staff, Customer)
- **Approval Workflows** — Customer portal for content review & approval
- **Email Notifications** — Invite, approval, and channel notification emails
- **Webhook Notifications** — Slack, Discord, Telegram integrations
- **Design Integration** — Canva & Robolly template support
- **Analytics Dashboard** — Post performance tracking
- **Whitelabel** — Full rebranding (app name, logo, colors, emails)
- **Stripe Billing** — Subscription plans with usage limits
- **i18n** — Multi-language support (English, Vietnamese)

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7 |
| **Cache / Queue** | Redis 7 + BullMQ |
| **Auth** | NextAuth v5 (credentials + OAuth) |
| **UI** | Tailwind CSS 4 + Radix UI + shadcn/ui |
| **Email** | Nodemailer (SMTP) |
| **Storage** | Google Drive API |
| **Payments** | Stripe |
| **Real-time** | Socket.io |
| **Process Manager** | PM2 (production) |

---

## 📋 Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7
- **npm** ≥ 9
- **PM2** (production) — `npm i -g pm2`

---

## 🚀 Quick Start (5 Steps)

```bash
# 1. Clone
git clone https://github.com/Kend150212/asocial.git
cd neeflow.com

# 2. Install (auto-installs Node, PostgreSQL, Redis, PM2, FFmpeg)
chmod +x install.sh && ./install.sh

# 3. Start the web app & background worker
cd ~/neeflow.com
pm2 start npm --name "neeflow-web" -- start
pm2 start npm --name "neeflow-worker" -- run worker
pm2 save
pm2 startup

# 4. Seed the database
npx tsx prisma/seed.ts          # Admin user, settings, integrations
npx tsx prisma/seed-plans.ts    # Subscription plans (Free/Pro/Business/Enterprise)
npx tsx prisma/seed-inbox.ts    # Inbox email templates
# npx tsx prisma/seed-stripe.ts # Only if Stripe is configured

# 5. Open browser → Setup Wizard guides you through the rest
#    http://YOUR_SERVER_IP:3000
```

The **Setup Wizard** handles everything:
- ✅ Database connection (PostgreSQL + Redis)
- ✅ Admin account creation
- ✅ Security key generation (auto)
- ✅ Platform OAuth guides (Facebook, YouTube, TikTok, etc.)
- ✅ Crontab auto-install
- ✅ PM2 restart

**No manual `.env` editing required!**

---

## 💻 Development Setup

For local development (without the installer):

```bash
git clone https://github.com/Kend150212/asocial.git
cd asocial
npm install

# Start PostgreSQL + Redis via Docker
npm run db:up

# Configure environment
cp .env.example .env
# Edit .env with your local values

# Initialize database
npx prisma db push
npm run db:seed

# Start dev server + workers
npm run dev          # Terminal 1: Next.js
npm run worker:dev   # Terminal 2: Background workers
```

Default dev login: `admin@asocial.app` / `admin123`

---

## 🌐 Production Deployment

### Server Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| **CPU** | 1 vCPU | 2+ vCPU |
| **RAM** | 1 GB | 2+ GB |
| **Storage** | 10 GB | 20+ GB |
| **OS** | Ubuntu 22.04+ | Ubuntu 24.04 |

### Step-by-Step Deployment

#### 1. Server Setup

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm i -g pm2

# Install PostgreSQL & Redis
sudo apt install -y postgresql postgresql-contrib redis-server

# Create database
sudo -u postgres psql -c "CREATE USER asocial WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "CREATE DATABASE asocial OWNER asocial;"
```

#### 2. Clone & Configure

```bash
cd /home/your-user
git clone https://github.com/your-org/asocial.git
cd asocial
npm install
cp .env.example .env
nano .env  # Edit with production values
```

**Production `.env`:**
```env
DATABASE_URL="postgresql://asocial:your_strong_password@localhost:5432/asocial?schema=public"
AUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="https://your-domain.com"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="<openssl rand -hex 32>"
```

#### 3. Build & Initialize

```bash
# Push database schema
npx prisma db push

# Seed database
npm run db:seed

# Build production bundle
npm run build
```

#### 4. Start with PM2

```bash
# Start Next.js app
pm2 start npm --name "asocial" -- start

# Start background workers
pm2 start npx --name "asocial-worker" -- tsx src/server.ts

# Save PM2 config & set to start on boot
pm2 save
pm2 startup
```

#### 5. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Increase max upload size (for media uploads)
    client_max_body_size 100M;

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
    }
}
```

```bash
# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## ⚙️ Post-Install Configuration

After the app is running, log in as admin and configure these integrations from the dashboard:

### Required Integrations

| Integration | Purpose | Where to Get Credentials |
|---|---|---|
| **SMTP** | Email notifications (invites, approvals) | Any SMTP provider (Gmail, SendGrid, Mailgun) |
| **Google Drive** | Media storage for images/videos | [Google Cloud Console](https://console.cloud.google.com) |

### Optional Integrations (configure as needed)

| Integration | Purpose | Developer Portal |
|---|---|---|
| **OpenAI** | AI content generation (GPT) | [platform.openai.com](https://platform.openai.com) |
| **Google Gemini** | AI content generation | [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter** | AI model aggregator | [openrouter.ai](https://openrouter.ai) |
| **Facebook/Instagram** | Social publishing | [developers.facebook.com](https://developers.facebook.com) |
| **YouTube** | Video publishing | [Google Cloud Console](https://console.cloud.google.com) |
| **TikTok** | Video publishing | [developers.tiktok.com](https://developers.tiktok.com) |
| **Pinterest** | Pin publishing | [developers.pinterest.com](https://developers.pinterest.com) |
| **LinkedIn** | Post publishing | [developer.linkedin.com](https://developer.linkedin.com) |
| **X (Twitter)** | Tweet publishing | [developer.x.com](https://developer.x.com) |
| **Stripe** | Billing & subscriptions | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **Canva** | Design integration | [canva.dev](https://www.canva.dev) |
| **Robolly** | Template-based design | [robolly.com](https://robolly.com) |

---

## 🔑 Setting Up OAuth Platforms

Each social platform requires OAuth credentials. The callback URL pattern is:

```
https://your-domain.com/api/auth/callback/{provider}
```

### Google (YouTube + Drive)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3** and **Google Drive API**
3. Credentials → Create OAuth 2.0 Client ID
4. Add Authorized Redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-domain.com/api/user/gdrive/callback`
5. Copy Client ID & Secret → paste in Admin → Integrations

### Facebook & Instagram

1. Go to [Meta Developer Portal](https://developers.facebook.com)
2. Create an app → Add **Facebook Login** product
3. Settings → Valid OAuth Redirect URIs: `https://your-domain.com/api/auth/callback/facebook`
4. Request permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_content_publish`
5. Copy App ID & Secret → paste in Admin → Integrations

### TikTok

1. Go to [TikTok Developer Portal](https://developers.tiktok.com)
2. Create an app → Add **Login Kit** and **Content Posting API**
3. Add Redirect URI: `https://your-domain.com/api/auth/callback/tiktok`
4. Copy Client Key & Secret → paste in Admin → Integrations

> **⚠️ Important:** When changing domains, you MUST manually update callback URLs in each platform's developer console. This cannot be automated.

---

## 🏷 Whitelabel / Rebranding

Go to **Admin → Branding** to customize:

- App name & tagline
- Logo & favicon (uploaded to Google Drive)
- Primary brand color
- Support email & copyright text

All changes apply across: sidebar, login pages, emails, webhooks, legal pages, and metadata.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema (23 models)
│   ├── seed.ts               # Default admin + integrations seeder
│   └── seed-plans.ts         # Subscription plan seeder
├── public/
│   ├── logo.png              # Default logo
│   └── favicon.ico           # Default favicon
├── scripts/
│   └── patch-auth.js         # NextAuth compatibility patch
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (dashboard)/      # Authenticated dashboard pages
│   │   ├── api/              # API routes
│   │   ├── login/            # Auth pages
│   │   └── portal/           # Customer approval portal
│   ├── components/           # React components
│   │   ├── layout/           # Sidebar, navigation
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config
│   │   ├── prisma.ts         # Prisma client
│   │   ├── email.ts          # Email templates & sending
│   │   ├── gdrive.ts         # Google Drive file operations
│   │   ├── encryption.ts     # API key encryption
│   │   ├── scheduler.ts      # Cron-based post scheduler
│   │   ├── use-branding.ts   # Whitelabel branding hook
│   │   └── workers/          # BullMQ background workers
│   │       ├── auto-post.worker.ts
│   │       ├── webhook.worker.ts
│   │       ├── gdrive.worker.ts
│   │       └── ai-content.worker.ts
│   └── server.ts             # Worker process entry point
├── docker-compose.yml        # Dev: PostgreSQL + Redis
├── .env.example              # Environment template
└── package.json
```

---

## 🔄 Updating

```bash
git pull
npm install
npx prisma db push
npm run build
pm2 restart all
```

---

## 🛠 Useful Commands

```bash
# Database
npm run db:up          # Start Docker PostgreSQL + Redis
npm run db:down        # Stop Docker containers
npm run db:seed        # Seed default data
npm run db:studio      # Open Prisma Studio (visual DB browser)

# Development
npm run dev            # Start dev server (Turbopack)
npm run worker:dev     # Start workers with file watching
npm run build          # Production build
npm run start          # Start production server

# PM2 (production)
pm2 logs asocial       # View app logs
pm2 logs asocial-worker # View worker logs
pm2 monit              # Real-time monitoring
pm2 restart all        # Restart everything
```

---

## 📄 License

MIT — free for personal and commercial use.