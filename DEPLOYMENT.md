# ASocial — Server Deployment Guide

Hướng dẫn triển khai ASocial lên VPS mới hoặc đổi domain.

---

## Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu |
|-----------|---------------------|
| **OS** | Ubuntu 22.04+ |
| **Node.js** | v20+ (khuyến nghị v22 LTS) |
| **PostgreSQL** | 15+ |
| **Redis** | 7+ |
| **Nginx** | 1.18+ |
| **PM2** | 6+ |
| **RAM** | 2GB+ |
| **Disk** | 20GB+ |

---

## Bước 1: Cài đặt hệ thống cơ bản

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Cài PM2
sudo npm install -g pm2

# Cài PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Cài Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Cài Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Xác nhận
node -v && npm -v && psql --version && redis-cli --version && nginx -v
```

---

## Bước 2: Tạo Database PostgreSQL

```bash
sudo -u postgres psql
```

```sql
-- Tạo user và database
CREATE USER asocial WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE asocial OWNER asocial;
GRANT ALL PRIVILEGES ON DATABASE asocial TO asocial;

-- Thoát
\q
```

---

## Bước 3: Clone và cấu hình project

```bash
# Chọn thư mục deploy (thay YOUR_DOMAIN bằng domain thực tế)
cd /home/$USER
git clone https://github.com/Kend150212/asocial.git YOUR_DOMAIN
cd YOUR_DOMAIN

# Cài dependencies
npm install
```

### Tạo file `.env`

```bash
nano .env
```

Nội dung (thay các giá trị `YOUR_...`):

```env
# Database
DATABASE_URL="postgresql://asocial:YOUR_DB_PASSWORD@localhost:5432/asocial?schema=public"

# Auth — TẠO SECRET MỚI cho mỗi server!
AUTH_SECRET="YOUR_RANDOM_SECRET_MIN_32_CHARS"
NEXTAUTH_URL="https://YOUR_DOMAIN"

# Redis
REDIS_URL="redis://localhost:6379"

# Vbout API
VBOUT_API_KEY="YOUR_VBOUT_API_KEY"

# Encryption key cho API keys trong DB
ENCRYPTION_KEY="YOUR_RANDOM_ENCRYPTION_KEY_32_CHARS"
```

> **Tạo secret ngẫu nhiên:**
> ```bash
> openssl rand -base64 32
> ```

---

## Bước 4: Khởi tạo Database

```bash
# Chạy migrations
npx prisma migrate deploy

# Seed dữ liệu ban đầu (admin user, default integrations)
npx prisma db seed

# Kiểm tra
npx prisma studio  # Mở browser xem data (Ctrl+C để thoát)
```

> **Admin mặc định:** `admin@asocial.app` / `admin123`
> ⚠️ Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

---

## Bước 5: Build và khởi chạy

```bash
# Build production
npm run build

# Chạy với PM2 (port 3001, thay đổi nếu cần)
pm2 start npm --name "asocial" -- start -- -p 3001

# Lưu PM2 config để tự khởi động khi reboot
pm2 save
pm2 startup
```

### Kiểm tra app chạy OK:

```bash
curl -s http://localhost:3001/api/auth/providers | head -100
# Kết quả đúng: {"credentials":{"id":"credentials",...}}
```

---

## Bước 6: Cấu hình Nginx + SSL

### Tạo Nginx config

```bash
sudo nano /etc/nginx/sites-available/YOUR_DOMAIN
```

Nội dung (thay `YOUR_DOMAIN`):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;

    # SSL (sẽ được Certbot cấu hình)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options nosniff always;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Tăng timeout cho server actions
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Upload limit
    client_max_body_size 50M;
}
```

### Kích hoạt config

```bash
sudo ln -s /etc/nginx/sites-available/YOUR_DOMAIN /etc/nginx/sites-enabled/YOUR_DOMAIN
sudo nginx -t
sudo systemctl reload nginx
```

### Cài SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

---

## Bước 7: Kiểm tra

```bash
# Test auth API
curl -s https://YOUR_DOMAIN/api/auth/providers

# Test login (lấy CSRF → POST credentials)
curl -s -c /tmp/cookies.txt https://YOUR_DOMAIN/api/auth/csrf > /tmp/csrf.json
CSRF=$(python3 -c "import json; print(json.load(open('/tmp/csrf.json'))['csrfToken'])")
curl -s -X POST https://YOUR_DOMAIN/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=admin@asocial.app&password=admin123" \
  -b /tmp/cookies.txt -w "\nHTTP: %{http_code}" 2>&1 | tail -5

# Xem PM2 logs
pm2 logs asocial --lines 20
```

---

## Cập nhật code

Khi có code mới:

```bash
cd /home/$USER/YOUR_DOMAIN
git pull origin main
npm install          # Nếu có dependency mới
npx prisma migrate deploy  # Nếu có migration mới
npm run build
pm2 restart asocial
```

---

## Đổi Domain

Khi cần đổi domain:

1. **Cập nhật `.env`:**
   ```bash
   nano .env
   # Đổi NEXTAUTH_URL thành domain mới
   ```

2. **Tạo Nginx config mới:**
   ```bash
   sudo cp /etc/nginx/sites-available/OLD_DOMAIN /etc/nginx/sites-available/NEW_DOMAIN
   sudo nano /etc/nginx/sites-available/NEW_DOMAIN
   # Thay tất cả OLD_DOMAIN → NEW_DOMAIN
   sudo ln -s /etc/nginx/sites-available/NEW_DOMAIN /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/OLD_DOMAIN
   ```

3. **Cài SSL mới:**
   ```bash
   sudo certbot --nginx -d NEW_DOMAIN
   ```

4. **Rebuild & Restart:**
   ```bash
   npm run build
   pm2 restart asocial
   ```

---

## Troubleshooting

### PM2 không có error logs
```bash
pm2 logs asocial --err --lines 50
```

### Database connection failed
```bash
# Kiểm tra PostgreSQL chạy chưa
sudo systemctl status postgresql

# Kiểm tra kết nối
psql -U asocial -h localhost -d asocial -c "SELECT 1"
```

### Auth "UntrustedHost" error
Đã được patch tự động bởi `scripts/patch-auth.js`. Nếu lỗi lại:
```bash
node scripts/patch-auth.js
npm run build
pm2 restart asocial
```

### Build failed
```bash
# Xóa cache và build lại
rm -rf .next
npm run build
```

### Xem trạng thái tổng quát
```bash
pm2 status
pm2 monit  # Monitoring real-time
```
