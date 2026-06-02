import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Parseq (Atlassian Gold Solution Partner, UK) runs WP Job Manager and exposes
// listings through the standard WordPress REST endpoint. The site itself is a
// broad business with many non-Atlassian roles, so we filter to
// Atlassian-relevant titles. At time of scraper creation Parseq's vacancy list
// is empty (X-WP-Total: 0) — this scraper will silently produce zero jobs
// until they publish something, which is fine and won't trigger silent_zero
// since prevCount also stays at 0.
const API_URL = 'https://www.parseq.com/wp-json/wp/v2/job-listings?per_page=50';
const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

interface WPJobListing {
  id: number;
  link: string;
  slug?: string;
  title?: { rendered?: string };
  acf?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

function pickLocation(item: WPJobListing): string {
  // WP Job Manager stores location in `_job_location` meta or via ACF — we
  // can't know which Parseq exposes without a live record, so try both.
  const acf = item.acf ?? {};
  const meta = item.meta ?? {};
  const candidates = [
    acf.job_location,
    acf.location,
    meta._job_location,
    meta.job_location,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);
  return candidates[0] ?? '';
}

export async function scrapeParseq(): Promise<Job[]> {
  const res = await fetch(API_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`Parseq: HTTP ${res.status} — returning empty`);
    return [];
  }

  const items = (await res.json()) as WPJobListing[];
  const now = new Date().toISOString();

  return items
    .map((item) => {
      const title = decodeEntities((item.title?.rendered ?? '').trim());
      const location = pickLocation(item);
      return {
        item,
        title,
        location,
      };
    })
    .filter((x) => x.title && ATLASSIAN_TITLE_FILTER.test(x.title))
    .map(({ item, title, location }) => ({
      id: buildStableJobId('parseq', String(item.id)),
      sourceId: String(item.id),
      source: 'Parseq',
      title,
      company: 'Parseq',
      location,
      locationNormalised: normaliseLocation(location),
      url: item.link,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    }));
}
