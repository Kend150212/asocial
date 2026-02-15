# ASocial — Task Master (Progress Tracker)

## Phase 1: Foundation ✅ COMPLETED
- [x] Init Next.js 14 + Tailwind + shadcn/ui
- [x] Setup Prisma + PostgreSQL + Redis
- [x] Auth system (login/register, roles: ADMIN/MANAGER/CUSTOMER)
- [x] Dashboard layout & sidebar navigation
- [x] Dark theme design system
- [x] i18n (Vietnamese + English)
- [x] Docker Compose configuration

## Phase 2: Design System — IN PROGRESS
- [x] Dark/Light theme toggle
- [x] Color palette & typography
- [ ] Component library polish
- [ ] Animation & micro-interactions

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

## Phase 5: Channel Management
- [ ] Channel CRUD
- [ ] AI channel analysis (names, descriptions, tags, branding)
- [ ] Multi-step creation wizard
- [ ] Knowledge base per channel
- [ ] Vibe/Tone settings
- [ ] Channel settings auto-save
- [ ] Content templates

## Phase 6: Platform Integration
- [x] Vbout API client (`src/lib/vbout.ts`)
- [ ] Platform account linking (10 platforms)
- [ ] Platform-specific settings
- [ ] Cached platform selector

## Phase 7: Media Library
- [ ] Per-channel media grid
- [ ] Upload (drag & drop, chunked)
- [ ] AI image generation integration
- [ ] Search & filter
- [ ] Reuse media in posts

## Phase 8: Post Composer
- [ ] 3-column layout (platforms, editor, preview)
- [ ] AI content generation
- [ ] AI image generation (multi-provider)
- [ ] Bulk posting (1 image = 1 post OR N images = 1 post)
- [ ] Schedule system
- [ ] Live preview per platform

## Phase 9: Calendar
- [ ] Month view
- [ ] Week view
- [ ] Click to view post detail
- [ ] Drag to reschedule

## Phase 10: Post Approval Workflow
- [ ] Channel approval setting (on/off)
- [ ] Pending → Approve/Reject flow
- [ ] Customer approval portal
- [ ] Email + real-time notifications
- [ ] Edit & resubmit on reject

## Phase 11: Notifications
- [ ] WebSocket/SSE real-time
- [ ] Bell icon + notification panel
- [ ] Per-channel notification email

## Phase 12: Reports & Analytics
- [ ] Per-channel reports
- [ ] Charts (Recharts)
- [ ] Engagement metrics
- [ ] Export CSV
- [ ] Platform breakdown

## Phase 13: Automation
- [ ] BullMQ scheduler
- [ ] Auto-post workers
- [ ] Google Drive upload worker
- [ ] AI auto-content pipeline
- [ ] Email notification worker
- [ ] Webhook dispatch worker

## Phase 14: Activity Log & Monitoring
- [ ] Audit trail
- [ ] Rate limit dashboard
- [ ] Duplicate post detection

## Phase 15: Deploy & Backup
- [ ] Auto-setup script (detect domain, setup DB)
- [ ] SSL (Caddy auto)
- [ ] First-run wizard
- [ ] Backup system

---

**Tổng tiến độ: Phase 1 ✅ | Phase 3 ✅ | Phase 6 (partial) | Còn lại: Phases 2,4,5,7-15**
