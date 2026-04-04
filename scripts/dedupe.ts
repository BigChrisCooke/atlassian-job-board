import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { Job, JobsDataFile } from './types.js';

const DATA_PATH = path.resolve('src/data/jobs.json');
const INACTIVE_PRUNE_DAYS = 14;

export function deduplicateAndMerge(freshJobs: Job[]): Job[] {
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

  // Mark jobs not seen this run as inactive
  for (const [id, job] of existingMap) {
    if (!freshIds.has(id) && job.isActive) {
      existingMap.set(id, { ...job, isActive: false });
    }
  }

  // Prune jobs inactive for more than INACTIVE_PRUNE_DAYS
  const cutoff = new Date(Date.now() - INACTIVE_PRUNE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return Array.from(existingMap.values()).filter(
    (j) => j.isActive || j.lastSeen > cutoff
  );
}
