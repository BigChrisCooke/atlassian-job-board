import { writeFileSync } from 'fs';
import path from 'path';
import type { Job, JobsDataFile } from './types.js';
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
  if (filterMode) console.log(`\n[scrape] --only mode: ${onlyFilters.join(', ')}`);
  const allFresh: Job[] = [];

  // --- Lever sources ---
  console.log('\n[scrape] Group 1 — Lever');
  for (const source of filterSources(LEVER_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeLeaver(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Ashby sources ---
  console.log('\n[scrape] Group 2 — Ashby');
  for (const source of filterSources(ASHBY_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeAshby(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Greenhouse sources ---
  console.log('\n[scrape] Group 3 — Greenhouse');
  for (const source of filterSources(GREENHOUSE_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeGreenhouse(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- SmartRecruiters sources ---
  console.log('\n[scrape] Group 4 — SmartRecruiters');
  for (const source of filterSources(SMARTRECRUITERS_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeSmartRecruiters(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Teamtailor sources ---
  console.log('\n[scrape] Group 5 — Teamtailor');
  for (const source of filterSources(TEAMTAILOR_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeTeamtailor(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Personio sources ---
  console.log('\n[scrape] Group 6 — Personio');
  for (const source of filterSources(PERSONIO_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapePersonio(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- BambooHR sources ---
  console.log('\n[scrape] Group 7 — BambooHR');
  for (const source of filterSources(BAMBOOHR_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeBambooHR(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Workable sources ---
  console.log('\n[scrape] Group 8 — Workable');
  for (const source of filterSources(WORKABLE_SOURCES)) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeWorkable(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
    await sleep(1500);
  }

  // --- Custom scrapers ---
  console.log('\n[scrape] Group 9 — Custom');
  const custom: Array<[string, () => Promise<Job[]>]> = [
    ['Communardo',          scrapeCommunardo],
    ['Seibert Group',       scrapeSeibert],
    ['Deviniti',            scrapeDeviniti],
    ['GLINtech',            scrapeGlintech],
    ['iDalko',              scrapeIdalko],
    ['catworkx',            scrapeCatworkx],
    ['Contegix',            scrapeContegix],
    ['Spectrum Groupe',     scrapeSpectrumGroupe],
    ['Oxalis Solutions',    scrapeOxalis],
    ['NSI',                 scrapeNsi],
    ['Softgile',            scrapeSoftgile],
    ['Euris',               scrapeEuris],
    ['e-core',              scrapeEcore],
    ['Remote OK',           scrapeRemoteOK],
    ['Salto',               scrapeSalto],
    ['Xpand IT',            scrapeXpandIt],
    ['Elements',            scrapeElements],
    ['Decadis',             scrapeDecadis],
  ];

  for (const [name, fn] of custom) {
    if (!matches(name)) continue;
    try {
      process.stdout.write(`  ${name}... `);
      const jobs = await fn();
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
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

  console.log(`\n[done] ${active.length} active jobs written to src/data/jobs.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
