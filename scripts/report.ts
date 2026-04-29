import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { Anomaly, Job, ScrapeReport, SourceResult } from './types.js';

export const REPORT_PATH = path.resolve('src/data/scrape-report.json');
export const COOLDOWN_THRESHOLD = 3;

export function loadPreviousReport(): ScrapeReport | null {
  if (!existsSync(REPORT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as ScrapeReport;
  } catch {
    return null;
  }
}

interface BuildArgs {
  startedAt: number;
  sources: SourceResult[];
  freshJobs: Job[];
  totalActive: number;
  prevTotalActive?: number;
}

export function buildReport({
  startedAt,
  sources,
  freshJobs,
  totalActive,
  prevTotalActive,
}: BuildArgs): ScrapeReport {
  const duplicateIds = findDuplicateIds(freshJobs);
  const anomalies = detectAnomalies(sources, duplicateIds);
  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    totalFresh: sources.filter((s) => s.status === 'ok').reduce((n, s) => n + s.count, 0),
    totalActive,
    prevTotalActive,
    sources,
    anomalies,
    duplicateIds,
  };
}

function findDuplicateIds(jobs: Job[]): string[] {
  const seen = new Map<string, number>();
  for (const j of jobs) seen.set(j.id, (seen.get(j.id) ?? 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

// Heuristics for anomaly detection. Each rule produces at most one anomaly per
// source. Precedence: failed > cooldown > silent_zero > huge_drop > runaway.
function detectAnomalies(sources: SourceResult[], duplicateIds: string[]): Anomaly[] {
  const out: Anomaly[] = [];

  for (const s of sources) {
    if (s.status === 'failed') {
      out.push({
        source: s.name,
        kind: 'failed',
        message: `${s.name} threw an error during scraping (${s.consecutiveFailures} consecutive failure${s.consecutiveFailures === 1 ? '' : 's'}).`,
        count: 0,
        prevCount: s.prevCount,
        error: s.error,
      });
      continue;
    }

    if (s.status === 'skipped-cooldown') {
      out.push({
        source: s.name,
        kind: 'cooldown',
        message: `${s.name} was skipped this run after ${s.consecutiveFailures} consecutive failures. Investigate the source manually before re-enabling.`,
        count: 0,
        prevCount: s.prevCount,
      });
      continue;
    }

    // From here on, status === 'ok'
    const prev = s.prevCount;

    if (prev !== undefined && prev > 0 && s.count === 0) {
      out.push({
        source: s.name,
        kind: 'silent_zero',
        message: `${s.name} returned 0 jobs but had ${prev} last run — the scraper may have silently broken (HTML changed, selectors stale, soft block). Worth verifying.`,
        count: 0,
        prevCount: prev,
      });
      continue;
    }

    if (prev !== undefined && prev >= 4 && s.count <= prev * 0.5) {
      out.push({
        source: s.name,
        kind: 'huge_drop',
        message: `${s.name} dropped from ${prev} to ${s.count} jobs (>50% decline). Could be genuine churn or a partial scraper failure.`,
        count: s.count,
        prevCount: prev,
      });
      continue;
    }

    if (prev !== undefined && prev >= 3 && s.count > prev * 2 + 5) {
      out.push({
        source: s.name,
        kind: 'runaway',
        message: `${s.name} jumped from ${prev} to ${s.count} jobs (>2× growth). Could be genuine hiring spike or a scraper picking up duplicate listings.`,
        count: s.count,
        prevCount: prev,
      });
    }
  }

  if (duplicateIds.length > 0) {
    out.push({
      source: '(dedupe)',
      kind: 'duplicate_ids',
      message: `${duplicateIds.length} job id${duplicateIds.length === 1 ? '' : 's'} appeared more than once in this run's output. Dedupe collapsed them, but it suggests two scrapers may be producing colliding ids.`,
      count: duplicateIds.length,
    });
  }

  return out;
}
