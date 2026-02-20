# ASocial — Task Master (Progress Tracker)

## Phase 1: Foundation ✅ COMPLETED
- [x] Init Next.js 14 + Tailwind + shadcn/ui
- [x] Setup Prisma + PostgreSQL + Redis
- [x] Auth system (login/register, roles: ADMIN/MANAGER/CUSTOMER)
- [x] Dashboard layout & sidebar navigation
- [x] Dark theme design system
- [x] i18n (Vietnamese + English)
- [x] Docker Compose configuration

## Phase 2: Design System ✅ COMPLETED
- [x] Dark/Light theme toggle
- [x] Color palette & typography
- [x] Component library polish
- [x] Animation & micro-interactions

## Phase 3: API Integrations Hub ✅ COMPLETED
- [x] `ApiIntegration` Prisma model (category, provider, encrypted key, baseUrl, config, status)
- [x] Admin Integrations page (`/admin/integrations`) — full CRUD UI
- [x] Test Connection button per provider
- [x] AI Providers: OpenAI, Gemini, Runware, OpenRouter, Synthetic
- [x] Design Tools: Robolly (DESIGN category — new!)
- [x] Social: Vbout
- [x] Storage: Google Drive (OAuth connected)
- [x] Email: SMTP (Nodemailer — configured)
- [x] Model fetcher for all AI providers
- [x] Search functionality in model dropdown (>10 models)
- [x] Seed API endpoint for inserting missing providers
- [x] Translations for all categories (SOCIAL, AI, STORAGE, EMAIL, WEBHOOK, DESIGN)

## Phase 4: User Management ✅ COMPLETED
- [x] Basic user model with roles
- [x] CRUD users page (`/admin/users`)
- [x] Assign channels to users
- [x] Per-channel permissions (12 permission types)
- [x] Granular permission matrix (checkbox UI)

## Phase 5: Channel Management ✅ COMPLETED
- [x] Channel CRUD
- [x] AI channel analysis (names, descriptions, tags, branding)
- [x] Multi-step creation wizard
- [x] Knowledge base per channel
- [x] Vibe/Tone settings
- [x] Channel settings auto-save
- [x] Content templates

## Phase 6: Platform Integration ✅ COMPLETED
- [x] Vbout API client (`src/lib/vbout.ts`)
- [x] Platform account linking: Facebook, Instagram, LinkedIn, Pinterest, YouTube, TikTok, GBP, Google Drive
- [x] Platform-specific OAuth flows (callback handlers per platform)
- [x] Platform settings per channel
- [x] TikTok — pending app audit (retrying with SELF_ONLY privacy in the meantime)
- [x] X (Twitter) — skipped (paid API tier required)

## Phase 7: Media Library  ✅ COMPLETED
- [ ] Per-channel media grid
- [ ] Upload (drag & drop, chunked)
- [ ] AI image generation integration
- [ ] Search & filter
- [ ] Reuse media in posts

## Phase 8: Post Composer  ✅ COMPLETED
- [ ] 3-column layout (platforms, editor, preview)
- [ ] AI content generation
- [ ] AI image generation (multi-provider)
- [ ] Bulk posting (1 image = 1 post OR N images = 1 post)
- [ ] Schedule system
- [ ] Live preview per platform

## Phase 9: Calendar  ✅ COMPLETED
- [ ] Month view
- [ ] Week view
- [ ] Click to view post detail
- [ ] Drag to reschedule

## Phase 10: Post Approval Workflow  ✅ COMPLETED
- [ ] Channel approval setting (on/off)
- [ ] Pending → Approve/Reject flow
- [ ] Customer approval portal
- [ ] Email + real-time notifications
- [ ] Edit & resubmit on reject

## Phase 11: Notifications ✅ COMPLETED
- [x] WebSocket/SSE real-time
- [x] Bell icon + notification panel
- [x] Per-channel notification email

## Phase 12: Reports & Analytics ✅ COMPLETED
- [x] Per-channel reports
- [x] Charts (Recharts) — Area, Bar, Pie
- [x] Platform engagement metrics (Facebook/Instagram/YouTube native APIs)
- [x] Export CSV
- [x] Platform breakdown table (Likes, Comments, Reach, Impressions per platform)

## Phase 13: Automation ✅
- [x] BullMQ scheduler — `src/lib/queue.ts` + `src/lib/scheduler.ts`
- [x] Auto-post worker — `src/lib/workers/auto-post.worker.ts` (gọi nội bộ publish route)
- [x] Google Drive sync worker — `src/lib/workers/gdrive.worker.ts`
- [x] AI auto-content pipeline — `src/lib/workers/ai-content.worker.ts`
- [x] Webhook dispatch worker — `src/lib/workers/webhook.worker.ts`
- [x] Worker process entry point — `src/server.ts` + `npm run worker`
- [x] Cron trigger endpoint — `GET /api/cron` (bảo vệ bằng `CRON_SECRET`)
- [x] pm2 config — `ecosystem.config.js` (worker chạy nền, tự restart)
- [x] **Deploy & hoạt động** ✅ — worker + scheduler chạy ổn trên pm2, auto-publish đã xác nhận hoạt động
  - Env cần thêm: `WORKER_SECRET`, `CRON_SECRET`, `PORT=3000`
  - nginx `proxy_pass` → port 3000
  - Deploy command: `git stash && git pull && npm run build && pm2 restart asocial && pm2 restart asocial-worker`

## Phase 14: Activity Log & Monitoring ✅ COMPLETED
- [x] Audit trail — `logActivity()` utility + admin Activity Log page (`/admin/activity`)
- [x] Activity logging wired into: post create, channel create, trial grant/revoke, plan override
- [x] Admin Activity page — Audit Trail tab (filterable table, 7-day chart, pagination, CSV export)
- [x] Duplicate post detection — API (`/api/admin/posts/duplicates`) + Duplicate Posts tab
- [x] Sidebar link added for admin: "Activity Log" / "Nhật ký hoạt động"

## Phase 15: Deploy & Backup
- [ ] Auto-setup script (detect domain, setup DB)
- [ ] SSL (Caddy auto)
- [ ] First-run wizard
- [ ] Backup system

## Phase 16: Plans & Billing ✅ COMPLETED
- [x] Plan schema (FREE, PRO, BUSINESS, ENTERPRISE) + limits config
- [x] Stripe integration (Checkout, Webhooks, Customer Portal)
- [x] Usage tracking (posts/month, AI generations/month, channels count)
- [x] Limit enforcement middleware (channel creation, post creation, AI generation)
- [x] Upgrade prompts UI (`UpgradeModal` component)
- [x] Admin billing dashboard (MRR chart, plan distribution pie, trial stats, CSV export)
- [x] User billing page (plan info, usage bars, i18n VN/EN)
- [x] Trial banner (i18n, auto-dismiss, urgency variant)
- [x] Grant/Revoke trial per user (admin)
- [ ] Public pricing page *(deferred to Phase 17)*
- [ ] Annual discount option (20% off) *(deferred)*
- [ ] AI Credits system *(deferred)*

## Phase 17: Production Launch 🚀
- [ ] Final security audit
- [ ] Performance optimization
- [ ] Marketing landing page
- [ ] Documentation / Help center
- [ ] Beta testing program

---

**Tổng tiến độ: Phase 1–14 ✅ | Phase 16 ✅ | Còn lại: Phase 15, 17**
