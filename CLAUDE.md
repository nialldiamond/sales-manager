# Sales Order Hub — Claude Instructions

## Why
Account manager portal for the Spruce EvoX store. Sales reps log in to see
their assigned customers, orders, and contacts. This is a production app with
real users and real data — treat it accordingly.

## What
**Stack:** Next.js 15 App Router · TypeScript (strict) · Supabase Auth + DB ·
EvoX REST API · Tailwind CSS · Vercel

**Key paths:**
```
app/(app)/          — authenticated pages (dashboard, customer detail, settings)
app/api/            — server-side API routes (proxy EvoX calls, profile CRUD)
lib/evox.ts         — all direct EvoX API calls (server-side only)
types/index.ts      — shared TypeScript interfaces
components/         — client components (search, tabs, order builder)
supabase/schema.sql — DB schema (apply manually in Supabase SQL editor)
.claude/launch.json — local dev server config (npm run dev, port 3000)
```

---

## How — Rules (MUST follow every session)

### 1. Plan before touching any file
Before writing any code you MUST:
1. State the problem in one sentence
2. List every file that will change and why
3. Identify any assumptions about external APIs or data — verify them first
4. Write acceptance criteria as checkboxes
5. **Wait for explicit approval** before touching any file

### 2. Feature branches only — NEVER commit to `main`
- MUST create a `fix/` or `feature/` branch for every change
- MUST open a PR — do not deploy from a feature branch
- One concern per branch — do not bundle unrelated changes

### 3. Local before deploy
- MUST start the dev server with the Preview tool (`Sales Order Hub` config)
- MUST verify behaviour in the browser locally before deploying to Vercel
- Only run `vercel --prod` after local is confirmed working

### 4. Run sub-agents at the right checkpoints
- Before writing any new EvoX API call or type → invoke **`evox-api-reviewer`**
- Before every `git commit` → invoke **`pre-commit-reviewer`**
- Both agents must return **APPROVED / CLEAR TO COMMIT** before proceeding

### 5. Build must pass
- `npm run build` MUST complete with zero TypeScript errors before committing
- The pre-commit-reviewer agent runs this as part of its checklist

### 6. Minimum viable change
- Do the least that satisfies the acceptance criteria
- Do not add unrequested features
- If you spot something out of scope, use `spawn_task` — do not fix it inline

---

## EvoX — MCP First, API Second

Always try the EvoX MCP before going to the direct REST API.

### Use the MCP for:
| Task | Tool |
|---|---|
| Find / look up a customer by name or ID | `store-operations` |
| Search orders by account, user, status, or date | `order-search` |
| Revenue totals and order metrics for a customer | `order-total-revenue` |
| Store analytics (traffic, keywords, top products) | `traffic-analytics` |
| Search products by SKU, name, or attribute | `engine-api-spec` → `engine-api-execute` |
| Browse a category and see sample products | `category-details` |
| Discover which API operations exist | `engine-api-spec` → `engine-api-execute` |

**Do NOT use:** `search` or `fetch` MCP tools — both are placeholders with no implementation.

### Fall back to direct API (`lib/evox.ts` / curl) only when:
- The operation does not exist in the MCP (e.g. bulk customer pagination, account manager list)
- MCP credentials are expired or unavailable
- You need to paginate beyond 20 records (`order-search` caps at 20)
- You need fields the MCP does not return

### Known EvoX API quirks (do not re-learn these):
- `GET /customers` does NOT support `account_manager` as a query filter — ignored silently
- `account_manager` in the customer list response is a **full object** `{ id, name, email }`, not an integer
- Individual `GET /customers/{id}` uses different auth than the list endpoint — use MCP `store-operations` for single-record lookups instead
- NEVER assume a field type matches the docs — verify with a real API call or MCP lookup first

### All EvoX calls MUST stay server-side
- API calls belong in server components or `app/api/` routes only
- NEVER call the EvoX API from a client component

---

## Supabase Rules
- Schema changes MUST be written to `supabase/schema.sql` and described in the PR
- NEVER use the service role key in client-side code
- NEVER expose `EVOX_API_TOKEN` to the browser

---

## Code Conventions
- Server components fetch data; client components handle interactivity only
- Keep `app/api/` routes thin — logic belongs in `lib/`
- Match existing patterns — do not introduce new libraries without discussion
- TypeScript strict mode is on — no `any`, no type assertions without a comment explaining why
