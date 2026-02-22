# NeeFlow — Server Deployment Guide

Complete step-by-step guide for deploying NeeFlow on a fresh Ubuntu/Debian VPS.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Ubuntu/Debian | 20.04+ |
| Node.js | v20+ |
| PostgreSQL | 14+ |
| Redis | 6+ |
| Nginx | any |
| PM2 | latest |
| FFmpeg | latest |
| Git | any |

---

## Step 1: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL, Redis, Nginx, FFmpeg, Git
sudo apt install -y postgresql postgresql-contrib redis-server nginx ffmpeg git

# Install PM2 globally
sudo npm install -g pm2

# Verify
node -v && npm -v && psql --version && redis-cli ping && nginx -v && ffmpeg -version | head -1
```

---

## Step 2: Setup PostgreSQL Database

```bash
# Create database user + database
sudo -u postgres psql << 'EOF'
CREATE USER neeflow WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE neeflow OWNER neeflow;
GRANT ALL PRIVILEGES ON DATABASE neeflow TO neeflow;
EOF
```

> **⚠️ IMPORTANT:** Replace `YOUR_STRONG_PASSWORD` with a strong password. Remember it — you'll enter it in the Setup Wizard.

---

## Step 3: Clone & Install NeeFlow

```bash
# Clone repo (replace with your repo URL)
cd ~
git clone https://github.com/Kend150212/neeflow.git neeflow.com
cd neeflow.com

# Install dependencies
npm install
```

---

## Step 4: Build the Application

```bash
# Build Next.js (first build without .env is OK — setup wizard will configure it)
npm run build
```

---

## Step 5: Configure Nginx

Nếu dùng **FlashPanel**, tạo site qua panel rồi chỉnh nginx. Nếu cài thủ công:

```bash
sudo nano /etc/nginx/sites-available/neeflow.com
```

Paste cấu hình đầy đủ (thay `neeflow.com` bằng domain của bạn):

```nginx
server {
    listen 443 ssl http2;
    server_name neeflow.com;

    server_tokens off;
    root /home/flashpanel/neeflow.com;

    # ── SSL (Certbot sẽ thêm tự động, hoặc FlashPanel cấu hình) ──
    # ssl_certificate     /etc/letsencrypt/live/neeflow.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/neeflow.com/privkey.pem;

    # ── Security Headers ──
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    index index.html index.php;
    charset utf-8;

    # ── Next.js Reverse Proxy ──
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100m;
    }

    # ── Next.js Static Assets (cache lâu dài) ──
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # ── Favicon & Robots ──
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # ── Logging ──
    access_log off;
    # access_log /var/log/nginx/neeflow.com-access.log;
    error_log /var/log/nginx/neeflow.com-error.log error;

    error_page 404 /index.php;

    # ── PHP (nếu FlashPanel cần) ──
    location ~ \.php$ {
        try_files $uri $uri/ =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }

    # ── Block dotfiles (trừ .well-known cho SSL) ──
    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# ── HTTP → HTTPS redirect ──
server {
    listen 80;
    server_name neeflow.com;
    return 301 https://$server_name$request_uri;
}
```

Enable và test:

```bash
sudo ln -s /etc/nginx/sites-available/neeflow.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> **💡 TIP:** Nếu dùng **FlashPanel**, chỉ cần tạo site xong vào Edit nginx, copy phần `location /`, `location /_next/static`, và security headers vào. FlashPanel tự quản lý SSL + PHP.

---

## Step 6: Setup SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d neeflow.com -d www.neeflow.com
```

After SSL, your nginx config will automatically be updated with HTTPS.

---

## Step 7: Start PM2 (Temporary — for Setup Wizard)

```bash
cd ~/neeflow.com

# Start Next.js temporarily for the setup wizard
pm2 start npm --name "neeflow-web" -- start
pm2 save
```

---

## Step 8: Run the Setup Wizard

1. Open `https://neeflow.com/setup` in your browser
2. Complete all 5 steps:

| Step | What to Enter |
|------|---------------|
| **1. Database** | Host: `localhost`, Port: `5432`, DB: `neeflow`, User: `neeflow`, Password: your password, Redis: `redis://localhost:6379` |
| **2. Admin** | Your name, email, and password for the admin account |
| **3. Keys** | Auto-generated — just click Next |
| **4. Platforms** | Configure OAuth for social platforms (can skip, do later in Admin) |
| **5. Launch** | Click "🚀 Launch NeeFlow" |

The wizard will automatically:
- Write `.env` configuration file
- Create database tables (`prisma db push`)
- Seed default data (plans, templates, etc.)
- Create your admin account
- Install cron jobs
- Generate `ecosystem.config.js` and restart PM2
- Write the setup lock file

3. After "Setup Complete!", it redirects to `/login`
4. Login with your admin credentials

> **⚠️ NOTE:** If PM2 restart shows warning (yellow), run manually on server:
> ```bash
> pm2 kill
> pm2 start ecosystem.config.js
> pm2 save
> ```

---

## Step 9: Verify Everything Works

```bash
# Check PM2 processes
pm2 status

# Should show:
# neeflow-web     online
# neeflow-worker  online

# Check logs for errors
pm2 logs --lines 20

# Test the site
curl -I https://neeflow.com
```

---

## Troubleshooting

### 502 Bad Gateway
```bash
# PM2 process not running
pm2 status
pm2 start ecosystem.config.js
pm2 save
```

### Setup wizard redirects to itself after setup
```bash
# PM2 didn't pick up new .env → kill and restart
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### Re-run setup wizard
```bash
# Delete lock file + reset DB
rm -f data/setup-lock.json
sudo -u postgres psql -c "DROP DATABASE IF EXISTS neeflow;"
sudo -u postgres psql -c "CREATE DATABASE neeflow OWNER neeflow;"
npm run build
pm2 restart all --update-env
# Then visit /setup again
```

### Git pull overwrites ecosystem.config.js
```bash
# ecosystem.config.js and data/ are in .gitignore, safe from git reset
# If somehow deleted, setup wizard will regenerate it
```

---

## Post-Setup: Admin Panel

After login, go to the Admin panel to configure:

| Page | URL | Purpose |
|------|-----|---------|
| **API Hub** | `/admin/integrations` | Add API keys for AI, social platforms |
| **Branding** | `/admin/branding` | Logo, colors, app name |
| **Legal Pages** | `/admin/legal` | Edit Terms & Privacy Policy |
| **Plans** | `/admin/plans` | Subscription plans & pricing |
| **Users** | `/admin/users` | Manage user accounts |
| **Setup Guide** | `/admin/guide` | Reference guide for all settings |
