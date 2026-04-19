# The Bureau of Unfinished Things — Setup Guide

## Week 1 Checklist

### 1. Create Supabase Project
1. Go to supabase.com → New project
2. Save your Project URL, anon key, and service role key

### 2. Apply Database Schema
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

Or paste `supabase/migrations/001_init.sql` and `002_helpers.sql` directly into
the Supabase SQL Editor.

### 3. Create Storage Buckets
In Supabase Dashboard → Storage → New bucket:
- `project-files` (private)
- `avatars` (public)

Then run the storage policies from `002_helpers.sql` (uncomment them).

### 4. Enable Auth
In Supabase Dashboard → Authentication → Email:
- Enable magic links
- Set redirect URL to: `http://localhost:3000/auth/callback`

### 5. Install Dependencies
```bash
cd bureau
npm install
```

### 6. Configure Environment
```bash
cp .env.local.example .env.local
```

Fill in all values:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret!)
- `OPENAI_API_KEY` — from platform.openai.com
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook settings
- `RESEND_API_KEY` — from resend.com
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local

### 7. Run Development Server
```bash
npm run dev
```

### 8. Deploy to Vercel (Day 7)
```bash
# Push to GitHub first, then:
vercel --prod

# Set all env vars in Vercel dashboard
# Update NEXT_PUBLIC_APP_URL to your Vercel URL
# Add Vercel URL to Supabase auth redirect URLs
```

### 9. Set Up Stripe Webhook (Production)
1. In Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook secret → set as `STRIPE_WEBHOOK_SECRET`

### 10. Deploy Edge Functions (Optional)
```bash
supabase functions deploy pathologist-ai --remote
supabase functions deploy stripe-webhook --remote

# Set secrets for edge functions
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Project Structure

```
src/app/
  page.tsx                    Homepage with stats
  layout.tsx                  Root layout
  not-found.tsx               404 page
  (auth)/
    login/page.tsx            Magic link sign in
    callback/route.ts         Auth callback handler
  (app)/
    dashboard/page.tsx        User dashboard
    morgue/
      page.tsx                Browse all projects
      [id]/page.tsx           Project detail + autopsy
    submit/page.tsx           6-step submission form
    adoption/
      [adoptionId]/page.tsx   Realtime chat page
  api/
    projects/route.ts         GET list, POST create
    projects/[id]/route.ts    GET single
    autopsies/[projectId]/
      diagnose/route.ts       POST → GPT-4o diagnosis
      comments/route.ts       POST add comment
    adoptions/route.ts        GET list, POST create
    adoptions/[adoptionId]/
      chat/route.ts           GET/POST messages
      resurrect/route.ts      POST mark resurrected
    webhooks/stripe/route.ts  Stripe webhook
    stats/daily/route.ts      GET stats
    auth/signout/route.ts     POST sign out
```

---

## Week-by-Week Focus

**Week 1:** Run setup above, get auth working, test file upload
**Week 2:** Test project submission end-to-end, morgue grid
**Week 3:** Test AI diagnosis — needs OpenAI key with GPT-4o access
**Week 4:** Test adoption + Stripe (use test mode keys)
**Week 5:** Polish homepage, mobile responsiveness, dashboard
**Week 6:** Recruit 10 early users, production launch
