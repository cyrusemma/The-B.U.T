# The Bureau of Unfinished Things — Project Status

**Stack:** Next.js 14 · Supabase · OpenAI GPT-4o · Stripe · Resend  
**Build week:** 1 of 6  
**Last updated:** 2026-04-26

---

## What's Built

### Database & Backend Infrastructure

| Area | Status | Notes |
|------|--------|-------|
| Schema — 9 tables | ✅ Done | profiles, projects, project_files, autopsies, autopsy_comments, adoptions, adoption_chats, payments, daily_stats |
| Row Level Security | ✅ Done | 11 policies covering all tables |
| Triggers | ✅ Done | auto-create autopsy, mark adopted, resurrection score, updated_at |
| Indexes | ✅ Done | 9 indexes (GIN on causes_of_death array, DESC on created_at, etc.) |
| Helper SQL functions | ✅ Done | increment_daily_stat, increment_autopsy_comment_count |
| Storage buckets config | ⚠️ Partial | Policies written in 002_helpers.sql but commented out — need to uncomment and run |

### Authentication

| Area | Status | Notes |
|------|--------|-------|
| Magic link login page | ✅ Done | `/login` |
| Auth callback handler | ✅ Done | `/auth/callback` |
| Session middleware | ✅ Done | refreshes sessions on every request |
| Sign-out endpoint | ✅ Done | `POST /api/auth/signout` |

### API Routes

| Route | Method | Status |
|-------|--------|--------|
| `/api/projects` | GET | ✅ Done — pagination, cause/type filters |
| `/api/projects` | POST | ✅ Done — creates project + files |
| `/api/projects/[id]` | GET | ✅ Done |
| `/api/autopsies/[projectId]/diagnose` | POST | ✅ Done — calls GPT-4o |
| `/api/autopsies/[projectId]/comments` | POST | ✅ Done |
| `/api/adoptions` | GET | ✅ Done |
| `/api/adoptions` | POST | ✅ Done |
| `/api/adoptions/[id]/chat` | GET/POST | ✅ Done |
| `/api/adoptions/[id]/resurrect` | POST | ✅ Done |
| `/api/webhooks/stripe` | POST | ✅ Done — verifies sig, marks adoption active |
| `/api/stats/daily` | GET | ✅ Done |

### Supabase Edge Functions (Deno)

| Function | Status | Notes |
|----------|--------|-------|
| `pathologist-ai` | ✅ Done | GPT-4o diagnosis with confidence score, saves to autopsies table |
| `stripe-webhook` | ✅ Done | Stripe signature verification, updates adoption + payment + daily stats |

### Frontend Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Homepage | `/` | ✅ Done | Hero, live stats ticker, featured/recent projects, "how it works" |
| 404 | — | ✅ Done | |
| Login | `/login` | ✅ Done | Magic link form |
| Dashboard | `/dashboard` | ✅ Done | User's projects, adoptions, stats |
| Submit (6-step form) | `/submit` | ✅ Done | Title, dates, causes (max 3), file upload, ghost letter, adoption terms |
| Morgue (browse) | `/morgue` | ✅ Done | Grid/list toggle, filters by cause/type |
| Morgue Archive | `/morgue/archive` | ✅ NEW | Era/cause filtering, historical view with advanced search |
| Project detail + autopsy | `/morgue/[id]` | ✅ Done | AI diagnosis, confidence score, community comments |
| Adoption chat | `/adoption/[id]` | ✅ Done | Realtime chat between adopter & creator |
| Adoption Registry | `/adoption/registry` | ✅ NEW | Track all adoptions, resurrections, real-time stats |
| Curator Profile | `/curator/[username]` | ✅ NEW | Public curator dashboard with annotations & stats |
| Directory | `/directory` | ✅ NEW | Site navigation hub and sitemap |

### New Components

| Component | Status | Notes |
|-----------|--------|-------|
| `AutopsySection` | ✅ Done | Renders AI diagnosis + community comments |
| `AdoptButton` | ✅ Done | Initiation button for adoption flow |
| `CuratorNotes` | ✅ NEW | Public/private curator annotations on projects |
| `AdvancedFilters` | ✅ NEW | Reusable multi-select filter UI with groups |
| `Skeleton` | ✅ NEW | Loading placeholder with variants (text, card, image, etc.) |

### New Database Tables

| Table | Status | Notes |
|-------|--------|-------|
| `curator_notes` | ✅ NEW | Curator annotations with RLS policies, one per curator per project |

### New API Routes

| Route | Methods | Status |
|-------|---------|--------|
| `/api/curator-notes/[projectId]` | GET/POST/DELETE | ✅ NEW | Manage curator annotations |

### Utilities & Types

| File | Status |
|------|--------|
| `lib/types/database.ts` | ✅ Done — full DB types + form enums |
| `lib/supabase/client.ts` | ✅ Done |
| `lib/supabase/server.ts` | ✅ Done |
| `lib/supabase/middleware.ts` | ✅ Done |
| `lib/hooks/useUser.ts` | ✅ Done |
| `lib/utils/cn.ts` | ✅ Done |
| `lib/utils/format.ts` | ✅ Done |

---

## What Still Needs to Be Done

### Week 1 — Setup & Wiring (Current)

- [ ] **Uncomment storage bucket policies** in `supabase/migrations/002_helpers.sql` and apply them via Supabase dashboard
- [ ] **Create storage buckets** in Supabase: `project-files` (private) + `avatars` (public)
- [ ] **Enable magic link auth** in Supabase dashboard + set callback URL
- [ ] **Fill `.env.local`** with all 9 real keys (Supabase, OpenAI, Stripe, Resend)
- [ ] **Run the app locally** and test auth end-to-end (sign in → dashboard → sign out)
- [ ] **Test file upload** to Supabase storage from the submit form

### Week 2 — Core Flow Testing

- [ ] Test project submission end-to-end (all 6 steps → morgue redirect)
- [ ] Verify morgue grid loads + filter/pagination works
- [ ] Verify project detail page renders correctly
- [ ] Test the `?submitted=true` success state after submission
- [ ] Add a **nav/header component** — there is no shared navigation component yet, each page manages its own header or relies on layout
- [ ] Add **loading skeletons/states** on morgue and project detail pages

### Week 3 — AI Diagnosis

- [ ] Deploy `pathologist-ai` edge function: `supabase functions deploy pathologist-ai --remote`
- [ ] Set `OPENAI_API_KEY` secret in Supabase: `supabase secrets set OPENAI_API_KEY=sk-xxx`
- [ ] Test GPT-4o diagnosis trigger from project detail page
- [ ] Handle edge case: diagnosis already exists (currently no guard against re-diagnosing)
- [ ] Add **rate limiting** on `/api/autopsies/[projectId]/diagnose` — anyone can trigger expensive GPT-4o calls right now

### Week 4 — Adoption & Payments

- [ ] Test free adoption flow (open_casket)
- [ ] Test organ donor flow (organ_donor)
- [ ] Wire up **Stripe Checkout** for `resurrection_rights` adoptions — the `POST /api/adoptions` route creates the adoption record but the actual Stripe checkout session creation is not wired to a UI button yet
- [ ] Deploy `stripe-webhook` edge function (or confirm the Next.js webhook route handles it)
- [ ] Set up Stripe webhook in Stripe dashboard pointing to `/api/webhooks/stripe`
- [ ] Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Test realtime adoption chat between two users
- [ ] Add **IP transfer agreement signing** — the schema has `ip_transfer_agreement_signed` + `ip_transfer_signed_at` fields but there is no UI or logic to capture this yet

### Week 5 — Polish & Missing Features

- [ ] **Email notifications** — Resend is installed and the env var slot exists, but no emails are sent anywhere yet. Needed for: adoption request received, chat message received, project resurrected
- [ ] **Profile page** — no `/profile` or `/profile/[username]` page exists yet. `profiles` table is fully designed but there's no way to view or edit a profile
- [ ] **Avatar upload** — the `avatars` storage bucket and profile fields exist, but no upload UI
- [ ] **Resurrection URL** — the `resurrection_url` field in adoptions has no input in the chat UI
- [ ] **Upvotes on community comments** — `autopsy_comments.upvotes` column exists but no upvote button/endpoint
- [ ] **Featured project curation** — `projects.featured` column exists but no admin interface to mark projects as featured
- [ ] **Revenue share display** — `adoption_price` and `revenue_share_percent` are stored, but there's no visible breakdown in the adoption UI
- [ ] Mobile responsiveness audit (the 6-step form grid and morgue layout need checking on small screens)
- [ ] Add **empty states** for: morgue with no results, dashboard with no projects/adoptions

### Week 6 — Launch Prep

- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Set all env vars in Vercel dashboard
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Add production URL to Supabase auth redirect URLs
- [ ] Set up Stripe webhook for production URL
- [ ] Add **terms of service and privacy policy pages** — referenced in the submit form but no pages exist
- [ ] Add **SEO metadata** — layout.tsx has basic metadata but project/morgue pages need dynamic `generateMetadata`
- [ ] Add **Open Graph images** for social sharing
- [ ] Set up **error monitoring** (Sentry or similar)
- [ ] Recruit 10 early users

---

## Known Gaps & Tech Debt

| Issue | Severity | Detail |
|-------|----------|--------|
| No rate limiting on AI endpoint | High | `POST /api/autopsies/[projectId]/diagnose` is open to abuse |
| No Stripe checkout UI wiring | High | The adoption POST creates a DB record but no redirect to Stripe checkout happens in the current `AdoptButton` component |
| No IP transfer agreement UI | Medium | Column exists in DB, no frontend |
| No email notifications | Medium | Resend installed, zero emails sent |
| No profile pages | Medium | Schema ready, no routes or UI |
| No admin interface | Medium | No way to feature/unfeature projects |
| Inline styles still present | Low | `submit/page.tsx:156` uses `style={{ background: '#0f172a' }}` — should move to CSS |
| No upvote endpoint | Low | Column in DB, no API route or button |
| No `generateMetadata` on dynamic pages | Low | Morgue/project pages use default metadata |

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Week-by-Week Schedule

| Week | Focus |
|------|-------|
| **1** (now) | Get local env running, test auth + file upload |
| **2** | End-to-end submission → morgue flow, nav component |
| **3** | AI diagnosis, deploy pathologist-ai edge function |
| **4** | Adoption + Stripe payments, realtime chat |
| **5** | Email notifications, profile pages, polish, mobile |
| **6** | Deploy to Vercel, early users, launch |
