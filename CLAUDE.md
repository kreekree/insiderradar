# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is
InsiderRadar — a free SEC insider trading and institutional fund flow tracker at insiderradar.com. Monetized via Ezoic ads. Built to rank for "free SEC insider trading tracker" and related queries.

## Commands

```bash
npm run dev      # local dev on port 3000
npm run build    # production build (always run before pushing to verify no errors)
npm start        # serve production build locally
```

No test suite. Verify changes by running `npm run build` — a clean build with all 17 routes is the pass condition.

## Architecture

**Framework**: Next.js 14 App Router. All config files use CommonJS (`module.exports`), not ESM — this is required by Next.js/PostCSS tooling.

**Path alias**: `@/` maps to repo root via `jsconfig.json`. Use `@/lib/sec`, `@/components/...` everywhere.

**Config files that must stay CJS**: `next.config.js`, `postcss.config.js`, `tailwind.config.js`.

## Data Flow

All data comes from SEC EDGAR public APIs. No auth required — only a `User-Agent` header (defined as `UA` in `lib/sec.js`).

**Home page flow** (`/`):
1. Client calls `/api/ticker?ticker=NVDA` → resolves ticker → CIK number
2. Client calls `/api/insider?cik=1045810` → fetches last 90 days of Form 4 filings, parses XML, returns trades array

**EFTS `_id` field gotcha** (critical): The SEC full-text search `_id` field is `"{accNo}:{xmlFilename}"` — split on the first colon to get the accession number and XML filename separately. `_source.ciks[0]` is the filer's CIK (not the subject company). See `app/api/insider/route.js` for the canonical parsing logic.

**Rate limiting**: SEC enforces 10 req/s. All multi-filing fetches use `processBatched()` from `lib/sec.js` — 4 parallel requests, 300ms between batches. Never fire more than 4 SEC requests in parallel.

## Key Files

| File | Purpose |
|---|---|
| `lib/sec.js` | Shared: `UA` header, `TX_CODE` map, `xmlVal`, `xmlBlocks`, `sleep`, `processBatched` |
| `app/api/ticker/route.js` | Ticker → CIK lookup via `company_tickers.json` (cached 24h in memory) |
| `app/api/insider/route.js` | Form 4 fetcher + XML parser. Returns `{ company, trades[] }` |
| `app/api/unusual/route.js` | Scans last 30 days of Form 4s, filters to open-market buys ≥ $500K |
| `app/api/fund/route.js` | 13F-HR search by fund name, parses InfoTable XML, returns top 50 holdings |
| `app/page.jsx` | Home — client component, owns all search/filter/sort state |
| `app/unusual-activity/page.jsx` | Server component, ISR revalidate 3600s, renders `<UnusualTable>` client component |
| `components/magicui/` | Copy-pasted Magic UI components (DotPattern, BorderBeam, ShimmerButton, NumberTicker, BlurFade) |

## Motion / Animation Conventions

All animation uses **framer-motion**. Patterns used throughout:
- `type: 'spring', damping: 22, stiffness: 200` — standard spring
- `layoutId` for physically sliding elements (nav active indicator, filter pills)
- `AnimatePresence` with `mode="wait"` for page-level transitions (loading → results, errors)
- `motion.tbody` with a `key` that changes on filter/sort to re-trigger row stagger
- `useInView` + `motion.div variants` for scroll-triggered sections
- Never use CSS `transition` for things that framer-motion already controls

## API Route Pattern

All routes follow this signature — no Express, no `req/res`:
```js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // ...
  return Response.json(data, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } });
}
```

## Client vs Server Components

- Pages with user interaction (`/`, `/fund-tracker`) → `'use client'` — **cannot** export `metadata`
- Pages that fetch at render time (`/unusual-activity`, all static pages) → server components — **can** export `metadata`
- When a server page needs animated rendering, extract a `'use client'` child component (see `components/UnusualTable.jsx`)

## Environment Variables

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX     # GA4 — set in Vercel dashboard
NEXT_PUBLIC_BASE_URL=              # Used by unusual-activity server fetch (defaults to insiderradar.vercel.app)
```

## Deployment

- GitHub repo: `kreekree/insiderradar`, branch `master`
- Vercel auto-deploys on push. Framework forced via `vercel.json` (`"framework": "nextjs"`)
- `.next/` is gitignored — never commit build artifacts
