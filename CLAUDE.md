# Atlassian Ecosystem Job Board

Astro static site that aggregates job listings from Atlassian ecosystem companies.
Live at **https://jobs.apwide.com** (deployed on Vercel, auto-deploys on push to `master`).

## Quick commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build the static site |
| `npm run scrape` | Run all scrapers, update `src/data/jobs.json` |
| `npx playwright install chromium --with-deps` | Install browser for Playwright scrapers (needed before `npm run scrape` on a fresh machine) |

## Project structure

```
src/
  pages/index.astro        — Main (and only) page: job board with filters + JSON-LD schema
  pages/sitemap.xml.ts     — Dynamic sitemap
  layouts/Layout.astro     — HTML shell (head, analytics, favicon)
  components/              — Header, SEO, etc.
  styles/global.css        — All styles (brand purple: #6900c4)
  data/jobs.json           — Scraped job data (committed by CI, do not hand-edit)

scripts/
  scrape.ts                — Main scraper entry point: runs all sources, merges, writes jobs.json
  dedupe.ts                — Deduplication + merge logic (21-day grace period for dropped jobs)
  types.ts                 — Job interface and ATS source types
  sources/
    engines/               — Generic ATS scrapers (reusable per-company):
      lever.ts, ashby.ts, greenhouse.ts, smartrecruiters.ts,
      teamtailor.ts, workable.ts, personio.ts, bamboohr.ts
    custom/                — Company-specific scrapers:
      communardo, seibert, deviniti, glintech, idalko, catworkx,
      contegix, spectrumgroupe, oxalis, nsi, softgile, euris, ecore,
      remoteok, salto, xpandit, elements
    config/                — Source lists (company slugs/URLs) for each engine
    index.ts               — Re-exports all source config arrays

.github/workflows/
  scrape-and-deploy.yml    — Weekly scrape (Monday 02:00 UTC) + commit jobs.json
                             Also supports manual trigger via GitHub Actions UI

vercel.json                — Redirects /jobs → /
```

## How the scraper works

1. `scripts/scrape.ts` iterates through all ATS engine sources and custom scrapers
2. Each scraper returns `Job[]` — see `scripts/types.ts` for the interface
3. A 1.5s sleep between each company prevents rate-limiting
4. `deduplicateAndMerge()` merges fresh results with existing `jobs.json`:
   - Matches by `id` field
   - Preserves `firstSeen`, updates `lastSeen`
   - Jobs not seen for 21 days (`INACTIVE_PRUNE_DAYS`) get pruned
5. Output written to `src/data/jobs.json`

### Adding a new scraper

**For a supported ATS** (Lever, Greenhouse, Ashby, etc.):
Add the company to the relevant config file in `scripts/sources/config/`.

**For a custom careers page:**
1. Create `scripts/sources/custom/companyname.ts` exporting `scrapeCompanyName(): Promise<Job[]>`
2. Import and call it in `scripts/scrape.ts` (in the "Custom scrapers" section)
3. Use Playwright for JS-heavy pages, `fetch` + regex/cheerio for simple HTML

### Playwright scrapers

Some scrapers use Playwright (headless Chromium) for JS-rendered pages:
- Ashby engine, Xpand IT, Elements
- These need `npx playwright install chromium` before first run
- Timeouts are generous (60s page load, 30s wait) with retry on failure
- Some sites (Xpand IT) have Cloudflare protection — detected via body text check

## Frontend (index.astro)

- Filters: text search, location dropdown, job type dropdown
- `locationNormalised` is `string[]` in the type but some older data may have plain strings — the page coerces to array on load
- JSON-LD `JobPosting` schema is generated for all active jobs
- Remote jobs get `jobLocationType: 'TELECOMMUTE'` + `applicantLocationRequirements` (required by Google)
- 7-day grace period: recently-seen inactive jobs still display

## Deployment

- **Hosting**: Vercel (auto-deploy on push to `master`)
- **Domain**: jobs.apwide.com
- **Analytics**: Vercel Analytics + Google Analytics (G-NQ4BSEGLYS)
- **CI scrape**: GitHub Actions, weekly Monday 02:00 UTC (or manual trigger)

## Brand

- **Apwide purple**: `#6900c4` (primary), `#f0e6ff` (light), `#5200a0` (dark)
- Favicon: Apwide symbol (APWD_symbol_flat_solid.png)
- This is the Apwide community job board, not the Togetha brand

## Key decisions

- `locationNormalised` was changed from `string` to `string[]` — always handle both for backward compat
- Jobs are kept for 7 days after last seen (grace period) to handle scraper flakiness
- Scraper has 1.5s rate limiting between companies
- Remote OK scraper uses their JSON API with tag filtering
- Salto scraper uses fetch + regex (no Playwright needed)
