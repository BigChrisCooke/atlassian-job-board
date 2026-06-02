import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// XALT Business Consulting (Atlassian Silver Solution Partner, DE) lists all
// roles on a single WordPress/Elementor career page. Each job card is a
// `e-loop-item-{id}` div whose class string carries the WP post id, the job
// category (Atlassian / DevOps / Marketing), and one or more
// `job_location-{slug}` tags. The job-detail URL is JSON-encoded inside a
// `data-ep-wrapper-link` attribute. XALT's lineup is mixed — Atlassian
// consultants alongside DevOps, sales, content roles — so we filter to the
// Atlassian taxonomy classes the CMS already applies. Each item appears in
// multiple Elementor grids on the page, so we dedup by id.
const CAREERS_URL = 'https://www.xalt.de/en/about-us/karriere/';

export async function scrapeXalt(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`XALT: HTTP ${res.status} — returning empty`);
    return [];
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const seen = new Set<string>();
  const jobs: Job[] = [];

  const chunks = html.split('e-loop-item e-loop-item-').slice(1);

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/);
    if (!idMatch) continue;
    const sourceId = idMatch[1];
    if (seen.has(sourceId)) continue;

    // The class string and dataset live in the first ~600 chars of the chunk.
    const header = chunk.slice(0, 600);
    if (!/category-job/.test(header)) continue;
    // XALT's own taxonomy: `tag-job-atlassian` or `category-atlassian-jobs`.
    // Anything else (DevOps-only, Marketing, working-student) is out of scope.
    if (!/tag-job-atlassian|category-atlassian-jobs/.test(header)) continue;

    const linkMatch = chunk.match(/data-ep-wrapper-link="([^"]+)"/);
    let url = '';
    if (linkMatch) {
      // attribute value has HTML-encoded JSON: &quot;url&quot;:&quot;...&quot;
      const decoded = decodeEntities(linkMatch[1]);
      url = decoded.match(/"url":"([^"]+)"/)?.[1].replace(/\\\//g, '/') ?? '';
    }
    if (!url) continue;

    const titleMatch = chunk.match(
      /<h[1-6][^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>\s*([^<]+?)\s*<\/h[1-6]>/
    );
    const title = decodeEntities((titleMatch?.[1] ?? '').trim());
    if (!title) continue;

    const locClasses = [...header.matchAll(/job_location-([a-z0-9-]+)/gi)].map((m) => m[1]);
    const locationLabel = locClasses
      .map((l) => l.replace(/-/g, ' ').replace(/muenchen/i, 'München'))
      .join(', ');

    seen.add(sourceId);
    jobs.push({
      id: buildStableJobId('xalt', sourceId),
      sourceId,
      source: 'XALT',
      title,
      company: 'XALT',
      location: locationLabel,
      locationNormalised: normaliseLocation(locationLabel),
      url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
