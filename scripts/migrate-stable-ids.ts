/**
 * One-shot migration: rewrite every job.id in src/data/jobs.json to use
 * the new stable-ID scheme (namespace + sourceId) introduced in issue #10.
 *
 * Without this, the next scrape would treat every existing job as new
 * (resetting firstSeen), since the old IDs were title-derived and don't
 * match the new IDs the scrapers now emit.
 *
 * Usage: npx tsx scripts/migrate-stable-ids.ts
 *
 * Safe to run multiple times — re-running on already-migrated data
 * produces no changes (the new ID is a function of source+sourceId,
 * both of which are stable).
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { Job, JobsDataFile } from './types.js';
import { buildStableJobId } from './utils/normalise.js';

const DATA_PATH = path.resolve('src/data/jobs.json');

// Maps a job's `source` (human-readable label written into jobs.json) to
// the namespace that scraper passes to buildStableJobId(). Scraper configs
// are the source of truth — keep this in sync if a name/slug changes.
const SOURCE_TO_NAMESPACE: Record<string, string> = {
  // Lever
  'Cprime':              'cprime',
  'ServiceRocket':       'servicerocket',
  'Valiantys':           'valiantys',
  'Easy Agile':          'easyagile',
  // Ashby
  'Tempo':               'tempo-io',
  'Rewind':              'rewind',
  // Greenhouse
  'Appfire':             'appfire',
  'SmartBear':           'smartbear',
  'Modus Create':        'moduscreate',
  'Lucid':               'lucidsoftware',
  'Samsara':             'samsara',
  'Kalles Group':        'kallesgroup',
  // SmartRecruiters (companyId is the namespace)
  'Adaptavist':          'TheAdaptavistGroup',
  'Devoteam':            'Devoteam',
  'Axians':              'AXIANS',
  // Teamtailor (URL hostname is the namespace)
  'Eficode':             'career.eficode.com',
  'Refined':             'career.refined.com',
  // Personio
  'K15t':                'k15t',
  // BambooHR
  'Isos Technology':     'isostech',
  // Workable
  'Nimaworks':           'nimaworks',
  'Praecipio':           'praecipio',
  'Cententia':           'cententia',
  'Mastek':              'mastek',
  // Custom scrapers
  'Communardo':          'communardo',
  'Seibert Group':       'seibert',
  'Deviniti':            'deviniti',
  'GLINtech':            'glintech',
  'iDalko (Exalate)':    'idalko',
  'catworkx':            'catworkx',
  'Contegix':            'contegix',
  'Spectrum Groupe':     'spectrumgroupe',
  'Oxalis Solutions':    'oxalis',
  'NSI':                 'nsi',
  'Softgile':            'softgile',
  'GetConnected / Euris':'euris',
  'e-core':              'ecore',
  'Remote OK':           'remoteok',
  'Salto':               'salto',
  'Xpand IT':            'xpandit',
  'Elements':            'elements',
  'Decadis':             'decadis',
  'MBition':             'mbition',
};

function migrateJobId(job: Job): string {
  const namespace = SOURCE_TO_NAMESPACE[job.source];
  if (!namespace) {
    throw new Error(
      `[migrate] Unknown source "${job.source}" — add it to SOURCE_TO_NAMESPACE in scripts/migrate-stable-ids.ts`
    );
  }
  return buildStableJobId(namespace, job.sourceId);
}

function main() {
  const file: JobsDataFile = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  console.log(`[migrate] Loaded ${file.jobs.length} jobs`);

  let changed = 0;
  let unchanged = 0;
  const collisions = new Map<string, Job[]>();

  const migrated = file.jobs.map((job) => {
    const newId = migrateJobId(job);
    if (newId !== job.id) changed++;
    else unchanged++;

    const bucket = collisions.get(newId) ?? [];
    bucket.push(job);
    collisions.set(newId, bucket);

    return { ...job, id: newId };
  });

  // Detect ID collisions (would indicate two jobs collapsed into one — bad)
  const colliding = [...collisions.entries()].filter(([, jobs]) => jobs.length > 1);
  if (colliding.length > 0) {
    console.warn(`\n[migrate] ⚠ ${colliding.length} ID collisions detected:`);
    for (const [newId, jobs] of colliding) {
      console.warn(`  ${newId}:`);
      for (const j of jobs) {
        console.warn(`    - ${j.source} | ${j.title} | sourceId=${j.sourceId}`);
      }
    }
    console.warn('  Each collision means two jobs now share an ID and one will be lost.');
    console.warn('  Investigate before committing the migrated jobs.json.\n');
  }

  // De-duplicate by new ID (keeping the first occurrence)
  const seen = new Set<string>();
  const deduped = migrated.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  const out: JobsDataFile = {
    ...file,
    totalActive: deduped.filter((j) => j.isActive).length,
    jobs: deduped,
  };

  writeFileSync(DATA_PATH, JSON.stringify(out, null, 2));

  console.log(`[migrate] ID changed:   ${changed}`);
  console.log(`[migrate] ID unchanged: ${unchanged}`);
  console.log(`[migrate] Collisions:   ${colliding.length}`);
  console.log(`[migrate] Final count:  ${deduped.length} (active: ${out.totalActive})`);
  console.log(`[migrate] Wrote ${DATA_PATH}`);
}

main();
