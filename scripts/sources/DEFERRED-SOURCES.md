# Deferred sources

Atlassian Solution Partners we've identified but **not** wired into the scrape yet,
with the honest reason. "Low job count" is never a reason to skip a source — we
already scrape partners that return one or zero jobs. The only thing that lands a
partner here is **scraping difficulty**.

| Partner | Atlassian partner? | Why deferred | Path to add |
|---------|-------------------|--------------|-------------|
| **NTT DATA** | Yes (global Solution Partner, in the directory) | **Hard to scrape.** No clean XML/JSON feed. Careers run on JS-rendered, bot-protected enterprise ATSes — Eightfold (`nttdata.eightfold.ai`) returns HTTP 403 to non-browser requests; the EMEAL Salesforce Experience Cloud portal (`careers.emeal.nttdata.com`) only renders under a full browser. | Custom Playwright scraper (like Xpand IT / Elements) driving the rendered careers search + `ATLASSIAN_TITLE_FILTER`. Medium effort; bot protection may also block headless. |
| **Herzum** | Yes (Platinum Solution Partner since 2005) | **Hard to scrape.** Site is a client-rendered React/Vite SPA (`herzum.com` serves a `<div id="root">` shell for every path). No XML/JSON feed, no Personio/greenhouse/lever tenant (the `herzum` Personio slug redirects to `personio.com`, i.e. doesn't exist). | Custom Playwright scraper, if/when they expose structured listings. Verify they actually have a job board first. |
| **Accxia** | Yes (Atlassian + Mattermost Partner, Munich) | **No public job board to scrape.** Every careers path 404s, no ATS tenant, German alt-domains don't resolve. Hiring appears to be "get in touch to discuss vacancies." Nothing structured exists yet. | Re-check periodically — nothing to wire up until they publish listings on an ATS. |

_Note: NTT surfaced during a Germany/DACH partner search, but it is a global org —
there is no special "German" entity to target. Roles are scattered across global portals._
