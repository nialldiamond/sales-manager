# Sales Manager Hub

Account manager portal for the Spruce EvoX store. Login to see your assigned customers, their order history, revenue totals, and user contacts.

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — authentication + account manager profile storage
- **EvoX REST API** — live customer, order, and user data
- **Tailwind CSS** — styling
- **Vercel** — deployment

---

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste the contents of `supabase/schema.sql`, and click **Run**
3. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon` public key

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EVOX_API_BASE_URL=https://us.evoapi.io
EVOX_API_TOKEN=iugfmlLiXhGUFMN4tNwD6rbKe4MwPdgC
```

### 3. Create your login

In Supabase: **Authentication → Users → Invite user** (or **Add user**) — enter your email and set a password.

### 4. Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

### 5. First login

1. Sign in with your email/password
2. You'll be redirected to **Settings** — select your name from the EvoX account manager list
3. Click **Save** — you'll land on your customer dashboard

---

## Deploy to Vercel

```bash
npx vercel
```

Add the four environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**. Vercel will auto-deploy on every `git push`.

---

## What it shows

| Screen | Data |
|---|---|
| Dashboard | All customers assigned to your account manager ID — total count, active/inactive split, searchable table |
| Customer detail | Company info, order stats (total revenue, avg order, last order), full order history, all users/contacts |

All EvoX API calls are made server-side — the API token is never exposed to the browser.
