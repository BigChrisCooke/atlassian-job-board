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
  pages/index.astro        — Main page: job board with filters + JSON-LD schema
  pages/scrape-report.astro — Weekly health report (noindex, public URL)
  pages/sitemap.xml.ts     — Dynamic sitemap
  layouts/Layout.astro     — HTML shell (head, analytics, favicon)
  components/              — Header, SEO, etc.
  styles/global.css        — All styles (brand purple: #6900c4)
  data/jobs.json           — Scraped job data (committed by CI, do not hand-edit)
  data/scrape-report.json  — Per-source counts + flagged anomalies (committed by CI)

scripts/
  scrape.ts                — Main scraper entry point: runs all sources, merges, writes jobs.json + scrape-report.json
  dedupe.ts                — Deduplication + merge logic (21-day grace period for dropped jobs)
  report.ts                — Health rules + scrape-report.json builder
  summarize.ts             — Optional GitHub Models pass: 1-paragraph synthesis per anomaly
  types.ts                 — Job interface, ATS source types, report types
  sources/
    braveSearch.ts         — Optional Brave Search pass: top-3 snippets per anomaly
    engines/               — Generic ATS scrapers (reusable per-company):
      lever.ts, ashby.ts, greenhouse.ts, smartrecruiters.ts,
      teamtailor.ts, workable.ts, personio.ts, bamboohr.ts
    custom/                — Company-specific scrapers:
      communardo, seibert, deviniti, glintech, idalko, catworkx,
      contegix, spectrumgroupe, oxalis, nsi, softgile, euris, ecore,
      remoteok, salto, xpandit, elements, decadis, mbition
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

## Scrape health report (`/scrape-report`)

A second page on the live site that renders `src/data/scrape-report.json` —
written by every scrape run alongside `jobs.json`. Public URL, `noindex` so
it doesn't appear in search results. Share the link with anyone who needs
visibility without GitHub access.

What it shows:
- Active job count + week-over-week delta
- Per-source table grouped by ATS engine (count, prev count, Δ, duration, status)
- **Anomalies** flagged automatically:
  - `failed` — scraper threw an error
  - `silent_zero` — returned 0 jobs but had >0 last run (likely scraper bug, not real)
  - `huge_drop` — halved or worse vs last run
  - `runaway` — >2× growth (possible duplicate scrape)
  - `cooldown` — auto-skipped after 3 consecutive failures (avoids hammering blocked sites)
  - `duplicate_ids` — same id emitted twice in one run

Optional anomaly enrichment (both free, both no-op when secret is missing):
- **Brave Search** snippets — top 3 web results per anomaly to sanity-check
  whether the company is still hiring. Set `BRAVE_SEARCH_API_KEY` as a GitHub
  Actions secret (free tier from api.search.brave.com, 2k queries/month).
- **GitHub Models** synthesis — uses GitHub's free LLM access to turn the
  Brave snippets into a 1-paragraph plain-English retrospective per anomaly.
  Requires `permissions: models: read` in the workflow (already set).

## Playbook: "How did the latest scrape go?"

When the user asks for a recap of the most recent scrape (any phrasing —
"how'd the scrape go", "any updates", "recap this week", etc.), don't dig
through GitHub Actions logs. Read these two files and synthesise:

1. `src/data/scrape-report.json` — the canonical health report:
   - `generatedAt` — when it ran
   - `totalActive` and `prevTotalActive` — week-over-week delta
   - `sources[]` — per-source `count`, `prevCount`, `status`,
     `consecutiveFailures`, `error`
   - `anomalies[]` — already-flagged issues with plain-English `message`,
     optional `synthesis` (LLM paragraph) and `context` (Brave snippets)
   - `duplicateIds[]` — id collisions inside the run

2. `src/data/jobs.json` — only if you need company-level breakdowns
   (e.g. "who hired the most this week") that aren't in the report.

What a good summary contains, in this order:

- Headline: when it ran, total active jobs + delta, count of anomalies
- Anomalies (if any): one bullet each, lead with the source name. If
  `synthesis` is present, quote/paraphrase it. If `context` results
  exist, mention them as "external evidence suggests..."
- Quick per-source roll-up: top 3 companies adding roles, top 3 closing
- Mention the live URL: `https://jobs.apwide.com/scrape-report`

Style: plain English, no jargon, table for tabular data, ⚠ emoji only
for genuine anomalies. If the user is on a fresh device with no prior
session context, do not assume they remember what `silent_zero` means —
explain inline.

If `scrape-report.json` has `generatedAt: "1970-01-01..."`, it's the
placeholder — say so and tell them to wait for the next Monday cron.

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
