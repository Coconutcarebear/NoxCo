# ✨ Nox & Co — Creator Operations

*"No more star-crossed campaigns."* 

A public marketing site **plus** a full influencer CRM + campaign manager, built as one
**Next.js + Supabase** app you can deploy to a live URL. The root of the site (`/`, `/about`,
`/services`, `/contact`) is the public-facing Nox & Co brand site; the **Client Portal**
(`/app` and everything under it) is the password-protected CRM.

- **Nightfall** (dashboard) · **Star Chart** (pipeline) · **Constellation** (creators) ·
  **Eclipses** (campaigns) · **The Vault** (contracts) · **Stardust** (invoices) ·
  **Star Gallery** (content) · **Stargazing** (discovery) · **Observatory** (analytics) ·
  **Star Forecast** (forecasting)

---

## Two things in one app

1. **Public marketing site** — `/`, `/about`, `/services`, `/contact`. Dark cosmic theme,
   no login required, built to represent the Nox & Co brand. The header's **Client Portal**
   button and the footer link both point to `/app`.
2. **Client Portal (the CRM)** — everything under `/app`, `/pipeline`, `/creators`, etc.
   Requires Supabase Auth sign-in. Light, pastel night-sky theme so page content stays readable.

Both live in the same Next.js static export, so one deploy covers the whole thing.

---

## What the CRM gives you

- Full **create / edit / delete** on creators with **auto-save** (a slide-over opens from any view).
- A drag-and-drop **Star Chart** across 12 stages (Sighted → Complete / Star-Crossed).
- Live **budget pacing** with smooth/approaching/over alerts (default budget is a placeholder —
  edit `FY26_BUDGET` in `src/lib/constants.ts` or set a budget per campaign).
- A clean slate to start: no demo creators or campaigns — just your Nox & Co org and your
  user, seeded so the app renders on first login.
- **Stargazing** discovery list with one-click convert-to-creator.
- **Star Forecast** simulator (sliders for H2 plan, extra creators, boost).
- CSV export, global search, and an activity log that records every change.
- Draft helper buttons for outreach / follow-up / note summaries.

---

## Deploying (Cloudflare Pages)

### 1. You already have the code
This folder *is* the complete project — every file, not snippets. File map is at the bottom.

### 2. Create three free accounts
- **Supabase** — https://supabase.com (database)
- **Cloudflare** — https://dash.cloudflare.com (hosting, via **Pages**)
- **GitHub** — https://github.com (code repository)

### 3. Put the code on GitHub
1. On GitHub, click **New repository** → name it `nox-and-co` → **Create**.
2. Easiest no-terminal path: on the empty repo page click **uploading an existing file**, then
   drag in everything from this folder **except** `node_modules` and `.next` (you won't have
   those yet anyway). Commit.
   - *Terminal path instead:* `git init && git add . && git commit -m "Nox & Co" &&
     git branch -M main && git remote add origin <your-repo-url> && git push -u origin main`
   - Drag files in one level at a time so nothing lands nested inside an extra subfolder —
     the repo root should contain `src/`, `public/`, `package.json`, etc. directly.

### 4. Connect GitHub → Cloudflare Pages
1. In Cloudflare, **Workers & Pages → Create → Pages → Connect to Git** → pick your `nox-and-co` repo.
2. **Framework preset:** Next.js (Static HTML Export) — or set it manually:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
3. Click **Save and Deploy**. (It'll deploy once now; add the database keys next, then redeploy.)

### 5. Connect Supabase
1. In Supabase, open your project → **SQL Editor → New query**.
2. Paste the contents of **`supabase/schema.sql`** and **Run**. (Creates the tables.)
3. New query again → paste **`supabase/seed.sql`** → **Run**. (Loads the Nox & Co org + your user.)
4. Go to **Project Settings → API** and copy the **Project URL** (bare, no trailing path) and
   the **anon public** key (not `service_role`).
5. In Cloudflare Pages → your project → **Settings → Environment variables**, add for both
   **Production** and **Preview**:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |

6. Cloudflare Pages → **Deployments → ⋯ → Retry deployment** so it picks up the keys (env vars
   for a static export are baked in at build time, so a fresh build is required after any change).

### 6. Use it
Open your live Cloudflare URL — that's the public marketing site. Click **Client Portal** (or go
to `/app`) to sign in to the CRM, add creators, drag them across the Star Chart, update statuses,
export CSVs, and watch the budget shift. ✨

---

## Run it locally (optional)

```bash
npm install
cp .env.local.example .env.local   # then paste your Supabase URL + anon key
npm run dev                         # http://localhost:3000
```

---

## Branding

- Logo assets live in `public/` (`logo.svg`, `favicon.svg`, `wordmark.svg`), built from the
  Nox & Co style guide (dark starfield mark + holographic wordmark).
- Brand colors (`#5c003f` wine, `#141243` / `#262268` indigo, `#023459` deep blue, `#425180`
  slate, `#3765d8` blue, `#a99ce7` lavender) are wired into `tailwind.config.ts` under the
  existing color tokens (`navy` = indigo, `dusty` = blue, `seafoam` = deep blue, `lavender` /
  `bubblegum` / `peach` = accents, `ink` = body text) — so the whole app already uses the
  Nox & Co palette. Marketing pages use the deep/dark end of the palette directly; the CRM
  keeps a light pastel background so card content stays readable.
- Fonts: **Cormorant Garamond** (display/headings — closest free match to "Le Jour Serif") and
  **Jost** (body — closest free match to "Glacial Indifference"), loaded from Google Fonts in
  `layout.tsx`. Swap in the licensed fonts later by updating the `@font-face`/link and the
  `--font-display` / `--font-body` variables in `globals.css`.

---

## A few honest notes

- **Security / RLS.** The CRM is set up as an *internal* tool: the database policies let the
  anon key read and write once a user is signed in, so you can go live with minimal setup.
  Review `schema.sql`'s policies before handing out broad access.
- **The public marketing pages ship with placeholder copy** — hero text, service descriptions,
  the About story, and stats are drafted in the Nox & Co voice but should be reviewed and
  personalized (real numbers, real story, real contact details) before this goes live to
  customers.
- **The contact form** has no backend — submitting it opens the visitor's email client with the
  message pre-filled (`mailto:`). Wire it to a real form service (Formspree, Resend, etc.) later
  if you want submissions captured without depending on the visitor's mail client.
- **The "AI" draft buttons** in the CRM generate smart local templates — no API key needed, so
  nothing can break your deploy. To make them call Claude live later, add an `/api/ai` route with
  your `ANTHROPIC_API_KEY`; the swap-in point is commented in `CreatorSlideOver.tsx`.
- **Build guards.** `next.config.mjs` uses `output: "export"` (fully static) — no server runtime,
  so hosting is cheap and simple, but there's no API routes or middleware at request time.
- The data model uses **one row per creator-per-campaign** (like a spreadsheet). A creator
  can appear on multiple campaigns. Relational `contracts` / `posts` / `payments` tables are in
  the schema for when you want to normalize later.

---

## File map

```
nox-and-co/
├─ package.json, next.config.mjs, tsconfig.json, postcss.config.mjs, tailwind.config.ts
├─ .env.local.example              # copy to .env.local with your keys
├─ public/
│  ├─ logo.svg · favicon.svg · wordmark.svg
├─ supabase/
│  ├─ schema.sql                   # run FIRST in Supabase SQL editor
│  └─ seed.sql                     # run SECOND — loads the Nox & Co org + your user
└─ src/
   ├─ app/
   │  ├─ layout.tsx · globals.css
   │  ├─ page.tsx (marketing Home)  about/ · services/ · contact/   ← public site
   │  ├─ app/       (Nightfall, CRM dashboard)
   │  ├─ pipeline/  (Star Chart)     creators/ (Constellation)
   │  ├─ campaigns/ (Eclipses)       dockyard/ (The Vault)
   │  ├─ treasury/  (Stardust)       gallery/  (Star Gallery)
   │  ├─ prospects/ (Stargazing)     observatory/ (Analytics)
   │  └─ forecast/  (Star Forecast)
   ├─ components/
   │  ├─ marketing/                 # MarketingShell, MarketingHeader, MarketingFooter
   │  ├─ AppShell.tsx                # CRM sidebar nav + logo + search + decor
   │  ├─ AuthGate.tsx                # login screen + public-route allowlist
   │  ├─ CreatorSlideOver.tsx        # the editable creator panel (auto-save)
   │  ├─ decor.tsx                   # starburst mascot, stars, moon
   │  ├─ RouteScene.tsx              # per-page animated night-sky background (CRM)
   │  ├─ widgets.tsx                 # page header, KPI cards, alert banner, bars
   │  └─ ui/index.tsx                # buttons, cards, inputs, slide-over, modal…
   └─ lib/
      ├─ types.ts · constants.ts · format.ts · budget.ts
      ├─ supabase.ts                 # browser client
      └─ store.ts                    # data + every CRUD action (the engine)
```

Built for Kade · Nox & Co.
