import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { Job, JobsDataFile } from './types.js';

const DATA_PATH = path.resolve('src/data/jobs.json');
const INACTIVE_PRUNE_DAYS = 21;

export function deduplicateAndMerge(freshJobs: Job[], onlyFilters?: string[]): Job[] {
  let existing: Job[] = [];

  if (existsSync(DATA_PATH)) {
    try {
      const file: JobsDataFile = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
      existing = file.jobs;
    } catch {
      console.warn('[dedupe] Could not parse existing jobs.json — starting fresh');
    }
  }

  const existingMap = new Map<string, Job>(existing.map((j) => [j.id, j]));
  const freshIds = new Set(freshJobs.map((j) => j.id));

  // Upsert fresh jobs — preserve firstSeen from any previous run
  for (const job of freshJobs) {
    const prev = existingMap.get(job.id);
    existingMap.set(job.id, {
      ...job,
      firstSeen: prev?.firstSeen ?? job.firstSeen,
      isActive: true,
    });
  }

  // Mark jobs not seen this run as inactive — but in --only mode,
  // only do this for the sources we actually scraped
  for (const [id, job] of existingMap) {
    if (freshIds.has(id)) continue;
    if (!job.isActive) continue;
    if (onlyFilters) {
      const src = job.source.toLowerCase();
      const inScope = onlyFilters.some((f) => src.includes(f) || f.includes(src));
      if (!inScope) continue; // leave other companies untouched
    }
    existingMap.set(id, { ...job, isActive: false });
  }

  // Prune jobs inactive for more than INACTIVE_PRUNE_DAYS
  const cutoff = new Date(Date.now() - INACTIVE_PRUNE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return Array.from(existingMap.values()).filter(
    (j) => j.isActive || j.lastSeen > cutoff
  );
}
