import type { Anomaly, BraveContext, ScrapeReport } from '../types.js';

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const RESULTS_PER_QUERY = 3;
const SLEEP_MS = 1100; // Brave free tier: 1 query/sec — stay safely below

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface BraveApiResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;
  };
}

// Build a search query for an anomaly. We're trying to confirm whether the
// company still has Atlassian-related roles — if Brave returns recent careers
// pages and listings, it's likely a scraper bug; if it returns nothing, the
// company may genuinely have no openings.
function queryFor(anomaly: Anomaly): string {
  return `"${anomaly.source}" atlassian jira careers`;
}

async function searchBrave(apiKey: string, query: string): Promise<BraveContext | null> {
  const url = `${BRAVE_ENDPOINT}?q=${encodeURIComponent(query)}&count=${RESULTS_PER_QUERY}`;
  const res = await fetch(url, {
    headers: {
      'X-Subscription-Token': apiKey,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`[brave] HTTP ${res.status} for query "${query}"`);
    return null;
  }

  const data = (await res.json()) as BraveApiResponse;
  const results = (data.web?.results ?? []).slice(0, RESULTS_PER_QUERY).map((r) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    description: r.description ?? '',
  }));

  return { query, results };
}

// Mutates the report in place: attaches a BraveContext to each anomaly worth
// investigating. No-op if BRAVE_SEARCH_API_KEY is unset, so local runs and CI
// without the secret keep working unchanged.
export async function annotateAnomalies(report: ScrapeReport): Promise<void> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    if (report.anomalies.length > 0) {
      console.log('[brave] BRAVE_SEARCH_API_KEY not set — skipping anomaly context');
    }
    return;
  }

  // Only annotate anomalies tied to a real source — duplicate_ids is internal.
  const targets = report.anomalies.filter((a) => a.kind !== 'duplicate_ids');
  if (targets.length === 0) return;

  console.log(`\n[brave] Annotating ${targets.length} anomal${targets.length === 1 ? 'y' : 'ies'}...`);

  for (const anomaly of targets) {
    try {
      const ctx = await searchBrave(apiKey, queryFor(anomaly));
      if (ctx) anomaly.context = ctx;
    } catch (err) {
      console.warn(`[brave] failed for "${anomaly.source}": ${(err as Error).message}`);
    }
    await sleep(SLEEP_MS);
  }
}
