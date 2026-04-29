import { writeFileSync } from 'fs';
import path from 'path';
import type { Job, JobsDataFile, SourceResult, ScrapeReport } from './types.js';
import { deduplicateAndMerge } from './dedupe.js';
import { scrapeLeaver } from './sources/engines/lever.js';
import { scrapeAshby } from './sources/engines/ashby.js';
import { scrapeGreenhouse } from './sources/engines/greenhouse.js';
import { scrapeSmartRecruiters } from './sources/engines/smartrecruiters.js';
import { scrapeTeamtailor } from './sources/engines/teamtailor.js';
import { scrapeWorkable } from './sources/engines/workable.js';
import { scrapePersonio } from './sources/engines/personio.js';
import { scrapeBambooHR } from './sources/engines/bamboohr.js';
import { scrapeCommunardo } from './sources/custom/communardo.js';
import { scrapeSeibert } from './sources/custom/seibert.js';
import { scrapeDeviniti } from './sources/custom/deviniti.js';
import { scrapeGlintech } from './sources/custom/glintech.js';
import { scrapeIdalko } from './sources/custom/idalko.js';
import { scrapeCatworkx } from './sources/custom/catworkx.js';
import { scrapeContegix } from './sources/custom/contegix.js';
import { scrapeSpectrumGroupe } from './sources/custom/spectrumgroupe.js';
import { scrapeOxalis } from './sources/custom/oxalis.js';
import { scrapeNsi } from './sources/custom/nsi.js';
import { scrapeSoftgile } from './sources/custom/softgile.js';
import { scrapeEuris } from './sources/custom/euris.js';
import { scrapeEcore } from './sources/custom/ecore.js';
import { scrapeRemoteOK } from './sources/custom/remoteok.js';
import { scrapeSalto } from './sources/custom/salto.js';
import { scrapeXpandIt } from './sources/custom/xpandit.js';
import { scrapeElements } from './sources/custom/elements.js';
import { scrapeDecadis } from './sources/custom/decadis.js';
import { scrapeMBition } from './sources/custom/mbition.js';
import {
  LEVER_SOURCES,
  ASHBY_SOURCES,
  GREENHOUSE_SOURCES,
  SMARTRECRUITERS_SOURCES,
  TEAMTAILOR_SOURCES,
  PERSONIO_SOURCES,
  BAMBOOHR_SOURCES,
  WORKABLE_SOURCES,
} from './sources/index.js';
import {
  COOLDOWN_THRESHOLD,
  REPORT_PATH,
  buildReport,
  loadPreviousReport,
} from './report.js';
import { annotateAnomalies } from './sources/braveSearch.js';
import { synthesizeAnomalies } from './summarize.js';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// --only decadis,salto  →  only scrape those sources, leave everything else untouched
const onlyArg = process.argv.find((a) => a.startsWith('--only=') || a === '--only');
const onlyNext = onlyArg === '--only' ? process.argv[process.argv.indexOf('--only') + 1] : undefined;
const onlyRaw = onlyArg?.startsWith('--only=') ? onlyArg.slice(7) : onlyNext;
const onlyFilters: string[] = onlyRaw ? onlyRaw.split(',').map((s) => s.trim().toLowerCase()) : [];
const filterMode = onlyFilters.length > 0;

function matches(name: string): boolean {
  if (!filterMode) return true;
  const n = name.toLowerCase();
  return onlyFilters.some((f) => n.includes(f) || f.includes(n));
}

function filterSources<T extends { name: string }>(sources: T[]): T[] {
  return filterMode ? sources.filter((s) => matches(s.name)) : sources;
}

async function main() {
  const startedAt = Date.now();
  if (filterMode) console.log(`\n[scrape] --only mode: ${onlyFilters.join(', ')}`);
  const allFresh: Job[] = [];
  const sourceResults: SourceResult[] = [];
  const prevReport = loadPreviousReport();
  const prevByName = new Map(prevReport?.sources.map((s) => [s.name, s]) ?? []);

  // Wraps each source: looks up previous state, applies cooldown, captures
  // count/duration/error into sourceResults so we can render a health report
  // without scraping the GitHub Actions log.
  async function runSource<T extends { name: string }>(
    group: string,
    source: T,
    scrapeFn: (s: T) => Promise<Job[]>,
  ): Promise<void> {
    const prev = prevByName.get(source.name);
    const prevCount = prev?.count;
    const consecutiveFailures = prev?.consecutiveFailures ?? 0;

    if (consecutiveFailures >= COOLDOWN_THRESHOLD) {
      console.log(`  ${source.name}... skipped (cooldown after ${consecutiveFailures} failures)`);
      sourceResults.push({
        name: source.name,
        group,
        count: 0,
        prevCount,
        durationMs: 0,
        status: 'skipped-cooldown',
        consecutiveFailures,
      });
      return;
    }

    const start = Date.now();
    process.stdout.write(`  ${source.name}... `);
    try {
      const jobs = await scrapeFn(source);
      console.log(`${jobs.length} jobs`);
      allFresh.push(...jobs);
      sourceResults.push({
        name: source.name,
        group,
        count: jobs.length,
        prevCount,
        durationMs: Date.now() - start,
        status: 'ok',
        consecutiveFailures: 0,
      });
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`FAILED — ${msg}`);
      sourceResults.push({
        name: source.name,
        group,
        count: 0,
        prevCount,
        durationMs: Date.now() - start,
        status: 'failed',
        error: msg,
        consecutiveFailures: consecutiveFailures + 1,
      });
    }
  }

  console.log('\n[scrape] Group 1 — Lever');
  for (const source of filterSources(LEVER_SOURCES)) {
    await runSource('Lever', source, scrapeLeaver);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 2 — Ashby');
  for (const source of filterSources(ASHBY_SOURCES)) {
    await runSource('Ashby', source, scrapeAshby);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 3 — Greenhouse');
  for (const source of filterSources(GREENHOUSE_SOURCES)) {
    await runSource('Greenhouse', source, scrapeGreenhouse);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 4 — SmartRecruiters');
  for (const source of filterSources(SMARTRECRUITERS_SOURCES)) {
    await runSource('SmartRecruiters', source, scrapeSmartRecruiters);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 5 — Teamtailor');
  for (const source of filterSources(TEAMTAILOR_SOURCES)) {
    await runSource('Teamtailor', source, scrapeTeamtailor);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 6 — Personio');
  for (const source of filterSources(PERSONIO_SOURCES)) {
    await runSource('Personio', source, scrapePersonio);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 7 — BambooHR');
  for (const source of filterSources(BAMBOOHR_SOURCES)) {
    await runSource('BambooHR', source, scrapeBambooHR);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 8 — Workable');
  for (const source of filterSources(WORKABLE_SOURCES)) {
    await runSource('Workable', source, scrapeWorkable);
    await sleep(1500);
  }

  console.log('\n[scrape] Group 9 — Custom');
  const custom: Array<{ name: string; fn: () => Promise<Job[]> }> = [
    { name: 'Communardo',      fn: scrapeCommunardo },
    { name: 'Seibert Group',   fn: scrapeSeibert },
    { name: 'Deviniti',        fn: scrapeDeviniti },
    { name: 'GLINtech',        fn: scrapeGlintech },
    { name: 'iDalko',          fn: scrapeIdalko },
    { name: 'catworkx',        fn: scrapeCatworkx },
    { name: 'Contegix',        fn: scrapeContegix },
    { name: 'Spectrum Groupe', fn: scrapeSpectrumGroupe },
    { name: 'Oxalis Solutions',fn: scrapeOxalis },
    { name: 'NSI',             fn: scrapeNsi },
    { name: 'Softgile',        fn: scrapeSoftgile },
    { name: 'Euris',           fn: scrapeEuris },
    { name: 'e-core',          fn: scrapeEcore },
    { name: 'Remote OK',       fn: scrapeRemoteOK },
    { name: 'Salto',           fn: scrapeSalto },
    { name: 'Xpand IT',        fn: scrapeXpandIt },
    { name: 'Elements',        fn: scrapeElements },
    { name: 'Decadis',         fn: scrapeDecadis },
    { name: 'MBition',         fn: scrapeMBition },
  ];

  for (const { name, fn } of custom) {
    if (!matches(name)) continue;
    // Wrap in a fake "source" object so runSource's type signature is happy.
    await runSource('Custom', { name }, async () => fn());
    await sleep(1500);
  }

  // --- Merge with previous run & deduplicate ---
  const merged = deduplicateAndMerge(allFresh, filterMode ? onlyFilters : undefined);
  const active = merged.filter((j) => j.isActive);

  const output: JobsDataFile = {
    generatedAt: new Date().toISOString(),
    totalActive: active.length,
    jobs: merged,
  };

  const outPath = path.resolve('src/data/jobs.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  // --- Build & persist scrape report ---
  const report: ScrapeReport = buildReport({
    startedAt,
    sources: sourceResults,
    freshJobs: allFresh,
    totalActive: active.length,
    prevTotalActive: prevReport?.totalActive,
  });

  // Optional Brave Search context for flagged anomalies. No-op if BRAVE_SEARCH_API_KEY
  // is unset — keeps local runs and CI without the secret working unchanged.
  await annotateAnomalies(report);

  // Optional GitHub Models synthesis: 1-paragraph plain-English retrospective
  // per anomaly, using the Brave snippets as grounding. No-op without GITHUB_TOKEN.
  await synthesizeAnomalies(report);

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`\n[done] ${active.length} active jobs · ${report.anomalies.length} anomalies · report: src/data/scrape-report.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
