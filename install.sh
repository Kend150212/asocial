#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════
# ASocial — One-Command Installer
# ═══════════════════════════════════════════════════════

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}   🚀 ASocial Installer                       ${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════${NC}"
echo ""

# ── Detect OS ─────────────────────────────────────────
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
fi

echo -e "${BOLD}Detected OS:${NC} $OS ($OSTYPE)"
echo ""

# ── Check & Install Node.js ───────────────────────────
echo -e "${BOLD}[1/6] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION installed"
else
    echo -e "  ${YELLOW}→${NC} Installing Node.js 20..."
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
        sudo apt install -y nodejs
    elif [[ "$OS" == "mac" ]]; then
        brew install node@20
    fi
    echo -e "  ${GREEN}✓${NC} Node.js installed"
fi

# ── Check & Install PostgreSQL ────────────────────────
echo -e "${BOLD}[2/6] Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | head -1)
    echo -e "  ${GREEN}✓${NC} $PG_VERSION installed"
else
    echo -e "  ${YELLOW}→${NC} Installing PostgreSQL..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl enable --now postgresql
    elif [[ "$OS" == "mac" ]]; then
        brew install postgresql@16
        brew services start postgresql@16
    fi
    echo -e "  ${GREEN}✓${NC} PostgreSQL installed"
fi

# ── Check & Install Redis ─────────────────────────────
echo -e "${BOLD}[3/6] Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Redis installed"
else
    echo -e "  ${YELLOW}→${NC} Installing Redis..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt install -y redis-server
        sudo systemctl enable --now redis-server
    elif [[ "$OS" == "mac" ]]; then
        brew install redis
        brew services start redis
    fi
    echo -e "  ${GREEN}✓${NC} Redis installed"
fi

# ── Check & Install FFmpeg (optional) ─────────────────
echo -e "${BOLD}[4/6] Checking FFmpeg (optional)...${NC}"
if command -v ffmpeg &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} FFmpeg installed"
else
    echo -e "  ${YELLOW}→${NC} Installing FFmpeg..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt install -y ffmpeg 2>/dev/null || echo -e "  ${YELLOW}⚠${NC} FFmpeg install skipped (optional)"
    elif [[ "$OS" == "mac" ]]; then
        brew install ffmpeg 2>/dev/null || echo -e "  ${YELLOW}⚠${NC} FFmpeg install skipped (optional)"
    fi
fi

# ── Check & Install PM2 ──────────────────────────────
echo -e "${BOLD}[5/6] Checking PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} PM2 installed"
else
    echo -e "  ${YELLOW}→${NC} Installing PM2..."
    npm install -g pm2
    echo -e "  ${GREEN}✓${NC} PM2 installed"
fi

# ── Install npm dependencies & build ──────────────────
echo ""
echo -e "${BOLD}[6/6] Installing dependencies & building...${NC}"
npm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Build (requires at least a minimal .env to not crash)
if [ ! -f .env ]; then
    echo 'DATABASE_URL="postgresql://asocial:asocial@localhost:5432/asocial?schema=public"' > .env
    echo 'AUTH_SECRET="temporary-build-secret"' >> .env
    echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
    echo 'REDIS_URL="redis://localhost:6379"' >> .env
    echo 'ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000"' >> .env
fi

npm run build
echo -e "  ${GREEN}✓${NC} Build complete"

# ── Start with PM2 ────────────────────────────────────
echo ""
echo -e "${BOLD}Starting ASocial...${NC}"

# Update ecosystem.config.js with current directory
CURRENT_DIR=$(pwd)
cat > ecosystem.config.js << EOF
module.exports = {
    apps: [
        {
            name: 'asocial-web',
            script: 'npm',
            args: 'start',
            cwd: '${CURRENT_DIR}',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            restart_delay: 5000,
            max_restarts: 10,
        },
        {
            name: 'asocial-worker',
            script: 'npx',
            args: 'tsx src/server.ts',
            cwd: '${CURRENT_DIR}',
            interpreter: 'none',
            env: {
                NODE_ENV: 'production',
            },
            restart_delay: 5000,
            max_restarts: 10,
        },
    ],
}
EOF

pm2 start ecosystem.config.js
pm2 save

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}   ✅ Installation Complete!                   ${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo ""

# Detect IP address
if [[ "$OS" == "linux" ]]; then
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
elif [[ "$OS" == "mac" ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
fi
IP=${IP:-localhost}

echo -e "  ${BOLD}Open your browser:${NC}"
echo ""
echo -e "  ${BLUE}${BOLD}  → http://${IP}:3000${NC}"
echo ""
echo -e "  The Setup Wizard will guide you through the rest."
echo -e "  No more terminal commands needed! 🎉"
echo ""
