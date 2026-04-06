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

async function main() {
  const allFresh: Job[] = [];

  // --- Lever sources ---
  console.log('\n[scrape] Group 1 — Lever');
  for (const source of LEVER_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeLeaver(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Ashby sources ---
  console.log('\n[scrape] Group 2 — Ashby');
  for (const source of ASHBY_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeAshby(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Greenhouse sources ---
  console.log('\n[scrape] Group 3 — Greenhouse');
  for (const source of GREENHOUSE_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeGreenhouse(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- SmartRecruiters sources ---
  console.log('\n[scrape] Group 4 — SmartRecruiters');
  for (const source of SMARTRECRUITERS_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeSmartRecruiters(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Teamtailor sources ---
  console.log('\n[scrape] Group 5 — Teamtailor');
  for (const source of TEAMTAILOR_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeTeamtailor(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Personio sources ---
  console.log('\n[scrape] Group 6 — Personio');
  for (const source of PERSONIO_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapePersonio(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- BambooHR sources ---
  console.log('\n[scrape] Group 7 — BambooHR');
  for (const source of BAMBOOHR_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeBambooHR(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Workable sources ---
  console.log('\n[scrape] Group 8 — Workable');
  for (const source of WORKABLE_SOURCES) {
    try {
      process.stdout.write(`  ${source.name}... `);
      const jobs = await scrapeWorkable(source);
      allFresh.push(...jobs);
      console.log(`${jobs.length} jobs`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
    }
  }

  // --- Custom scrapers ---
  console.log('\n[scrape] Group 9 — Custom');
  try {
    process.stdout.write('  Communardo... ');
    const jobs = await scrapeCommunardo();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Seibert Group... ');
    const jobs = await scrapeSeibert();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Deviniti... ');
    const jobs = await scrapeDeviniti();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  GLINtech... ');
    const jobs = await scrapeGlintech();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  iDalko (Exalate)... ');
    const jobs = await scrapeIdalko();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  catworkx... ');
    const jobs = await scrapeCatworkx();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Contegix... ');
    const jobs = await scrapeContegix();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Spectrum Groupe... ');
    const jobs = await scrapeSpectrumGroupe();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Oxalis Solutions... ');
    const jobs = await scrapeOxalis();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  NSI... ');
    const jobs = await scrapeNsi();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  Softgile... ');
    const jobs = await scrapeSoftgile();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  GetConnected / Euris... ');
    const jobs = await scrapeEuris();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }
  try {
    process.stdout.write('  e-core... ');
    const jobs = await scrapeEcore();
    allFresh.push(...jobs);
    console.log(`${jobs.length} jobs`);
  } catch (err) {
    console.error(`FAILED — ${(err as Error).message}`);
  }

  // --- Merge with previous run & deduplicate ---
  const merged = deduplicateAndMerge(allFresh);
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
