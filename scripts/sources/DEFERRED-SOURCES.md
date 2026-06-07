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

**Feeds verified but 0 Atlassian-titled roles (re-check periodically):**
Advania Sverige (teamtailor `advaniaab`, 29 generic Swedish IT roles) ·
Avenga (teamtailor `career.avenga.com`, 100 generic dev roles) ·
HiQ Finland (teamtailor `careers.hiq.fi`, 16 generic dev roles) ·
greenique (personio `greenique`, 3 positions — ITSM + open applications) ·
INVENTI Development (workable `inventi`, 3 Lithuania dev roles) ·
Beijing XData (teamtailor `careers.xdatagroup.io`, 2 FinTech dev roles — no Atlassian content).

**Wrong company / not Atlassian:** Cross ALM (personio `cross-alm-gmbh`) — SAP ALM
consultancy, not Atlassian. "ALM" in the name is SAP Application Lifecycle Management.
AtlasOptima (ashby slug `atlas` is unconfirmed — page title returns generic "Atlas Jobs").
Dione Technology (SmartRecruiters `Diono`) — 0 Atlassian results, possible wrong company ID.
Globant (SmartRecruiters `Globant2`) — 0 Atlassian-titled results despite being a listed partner.

**Added from Gold sweep:** Pinja Digital (teamtailor `career.pinja.com`) ·
Reti S.p.A. (teamtailor `jobs.reti.it`) · Softronic AB (teamtailor `jobb.softronic.se`) ·
TECHNIA AB (teamtailor `careers.technia.com`) · TNG Technology (personio `tngtech`) ·
Stefanini (smartrecruiters `Stefanini1`) · Publicis Sapient (smartrecruiters `PublicisGroupe`) ·
Visionet (smartrecruiters `VisionetSystemsInc`)

---

### Gold tier — swept 2026-06-07

**HARD (job board, no clean feed):**
JDS Australia (custom careers page) · Kunz Leigh & Associates (Paylocity — confirmed Atlassian Admin role) ·
Lupus Consulting (ApplyToJob/JazzHR) · Medialine AG (JOIN.com) ·
MESKRU GmbH (JOIN.com — dedicated Atlassian shop, confirmed Atlassian Consultant roles — high-value if JOIN scraper ever built) ·
mgm technology partners (Trakstar) · Movate Technologies (proprietary TAMS — 11,700-person BPO) ·
Nortal AG (iCIMS at `careers-en-nortal.icims.com`) · OBSS Teknoloji (Kariyer.net, Turkey's leading Atlassian partner) ·
Mykad Consulting (LinkedIn/jobs.ca — Montreal Atlassian boutique) · Nanga Systems (JOIN.com) ·
NEMETSCHEK (custom portal — primarily AEC software group, not Atlassian-focused) ·
Protiviti (Workday) · PT Mitra Integrasi Informatika (custom portal) ·
PrimeUp (ApplyToJob — Brazilian partner) · SelectStar Solutions (Breezy HR — confirmed Atlassian Consultant roles) ·
Service Dynamics (SEEK NZ — pure JSM shop) · SoftServe (Workday — 9,500-person Ukrainian-origin firm, Atlassian Partner of the Year 2019) ·
Softtek (iCIMS — `jobs.softtek.com`) · Software Craftsmen (static HTML — pure Atlassian Marketplace developer) ·
Sonata Software (custom careers portal) · STAND 8 (custom) ·
STRATEGENICS (custom — Australian Partner of the Year 2024–25, confirmed Atlassian roles — high value if scraper written) ·
SYPAQ Systems (custom portal — confirmed Atlassian Jira Consultant roles) ·
Team Neusta (custom German karriere portal — neusta inspire is Atlassian sub-entity) ·
Techanics (static HTML, DACH Atlassian partner) · Teolia (custom inline forms — French Atlassian firm) ·
Test Triangle (custom CMS — Irish Atlassian Platinum partner) · Titansoft (custom portal — Singapore) ·
Transition Technologies PSC (custom `kariera.ttpsc.com` — large Polish IT, very Atlassian-relevant) ·
Triangu Ukraine (Work.ua/DOU Ukrainian boards) · Twinit (custom page — only Atlassian partner in Georgia) ·
Uniteam Sp. z o.o. (custom — website URL ambiguous, possible conflict with marine engineering company of same name) ·
UST Global (custom portal — 9,500+ employees) · VATES/EPAM (custom preview — acquired by EPAM 2024) ·
VI2VA/SOLVVision (custom WordPress, Frankfurt ITSM + Atlassian specialist)

**NO-BOARD (no public listings):**
Jer-nee Consulting (Utah Atlassian shop — email inquiry only) · M20 Technology (contact form only) ·
Panasonic System Design (Japanese corporate HR, no English feed) ·
Preflex Solutions (LinkedIn-only, India) · Progrez Consulting (no public feed, Indonesia) ·
ReleaseTEAM (contact form — DevOps staffing, places consultants rather than posting jobs) ·
Software.com.br (no careers page found) · SPK and Associates (LinkedIn-only) ·
TechTime (jobs on own Confluence wiki) · tecuri (jobs page under construction — email only) ·
TecVeris (LinkedIn-only — US Atlassian Gold partner since 2011) ·
TICBLUE (static brochure site — Chilean Atlassian shop) · Unlimit Brasil (no visible careers page — unrelated global fintech "Unlimit" appears on Glassdoor)

**UNKNOWN (re-check later):**
JAP CONNECT (no website domain confirmed — check partnerdirectory.atlassian.com/jap-connect) ·
Kapsu Partners (kapsupartners.com.au — no careers page confirmed) ·
KIC Consulting (Korean site kicco.com, no English careers page) ·
linkyard ag (linkyard.ch/about/karriere — pure Atlassian Gold partner, ATS backend unknown) ·
mecodia GmbH (mecodia.de/jobs — Stuttgart Atlassian partner, ATS unknown) ·
Mind-Mercatis (mindmercatis.com/en/carriere/ — confirmed Atlassian Expert role, custom page — worth a custom scraper) ·
Moresimp Kft (moresimp.com/careers/ — Budapest all-senior Atlassian team, new page, ATS unknown) ·
Movonte (no careers page found — US/Mexico consulting) ·
Nimbax (no careers page — first French-Canadian Atlassian partner, Quebec) ·
Now Consultians (nowconsultians.at — Austria's largest Atlassian partner, no careers page found) ·
ONE DOT Technologies (onedot.com.au/jobs — email CV submission only) ·
Onlio/Onlio APS (onlio.com/en/career/ — Czech/Slovak Atlassian partner since 2004, ATS unknown) ·
Ovyka (ovyka.com/recrutement — French Atlassian partner, ATS unknown) ·
QUABU SOLUTIONS (quabusolutions.com — Spanish Atlassian Marketplace developer, no careers page indexed) ·
Snapbytes (snapbytes.com — Turkish Atlassian partner, no careers page found) ·
Tietoevry (reported SmartRecruiters but `Tietoevry1` returns 0 total postings — company ID unconfirmed) ·
Translucent ApS (translucent.dk — first Atlassian partner in Denmark, likely LinkedIn-only) ·
VIDSCOLA (vidscola.com — UAE, Middle East's only Agile at Scale specialization partner) ·
VMotion (vmotion.ie — Limerick Ireland, likely LinkedIn-only) ·
汇科天下 / Huike Tianxia (hktx.cn — Chinese Atlassian Marketplace vendor, only on Chinese job platforms)
