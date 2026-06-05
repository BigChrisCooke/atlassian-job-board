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

---

## Running list: partners we can't scrape (directory sweep)

Vetted from the `discover-partners` crawl. Recording these so we don't re-vet the
same partners every sweep. Three buckets:

- **HARD** — has a job board, but no clean feed (custom/JS-rendered/enterprise ATS
  we don't support: iCIMS, SuccessFactors, OTYS, InHire, Kariyer.net, etc.).
  Revisitable only with a custom Playwright scraper.
- **NO-BOARD** — no public listings at all; hire via LinkedIn/email/contact form.
  Nothing to scrape until they adopt an ATS.
- **UNKNOWN** — couldn't confirm an ATS from public sources; worth a re-check.

Already on the board or handled elsewhere are excluded (Oxalis, Sngular, NSI,
Gruppo Euris, Togetha=own brand, and the 5 added in this sweep).

### Platinum tier — swept 2026-06-06

**HARD (job board, no clean feed):**
3digits (InfoJobs) · aety · Almarise · Almbase (Kariyer.net) · Amrut Software ·
Area9 · BiPlus · Catamania (OTYS) · Clovity · CRG Solutions · Deiser · Enreap ·
Epicon (SEEK/Jora) · Infosys (iCIMS) · Integrated Global Solutions · IXPERTA ·
iZeno · Klee Group · Minsait/Indra (SuccessFactors) · Nomura Research ·
operational services · Shiwaforce · SII Poland · Smartis · SVA · TestCrew ·
TMC · Trundl · TSOFT · Unicorn Systems · Vericode (InHire) · Wipro (SuccessFactors) ·
Würth IT · Xeridia · Hitachi Solutions (SmartRecruiters but 0 Atlassian-titled roles)

**NO-BOARD (no public listings):**
BleuLemon · Catch Software · Dmove · Elegance Group · EnevaSys · ExtremeData ·
generativ · Highway Three · Infosysta · Kostebek · matrix Devops · META-INF ·
Methoda · MoroSystems · onepoint · OSCI (Open Source Consulting) · Optimatis ·
Ouidou · Ovations · Padah · PLATEER · Ricksoft · Sentify · Sourcesense ·
Systemology · Trinidad Wiseman · UAB Teambit

**UNKNOWN (re-check later):**
ACA Group · Ambientia (HaileyHR — unsupported ATS) · Arvato Systems · avono ·
ByteSource · codecentric · Computas Opus · Datacom · E7 Solutions · Interamericana ·
Knowit Miracle · Life in Codes · Linktech · MicroGenesis · Mumo Systems ·
Nimble Evolution · Polaris Office · PractiProject · Senzo · SOFTLIST ·
Shanghai Dragonsoft · StrataCom

**Also rejected:** A-Players (recruitment agency — posts roles for *other* companies,
not its own Atlassian hiring) · Abano (SmartRecruiters `AbanoHealthcare` is a
healthcare-clinic chain — wrong-company match, not the Atlassian partner).
