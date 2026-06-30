import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Trundl (Platinum Enterprise Atlassian Solution Partner — US/Canada/India)
// lists its handful of openings inline on a single WordPress page. There is no
// ATS, no REST endpoint and no per-job URL: each role is a pair of headings —
//   <h6><strong>Job Title: …</strong></h6>
//   <h6><strong>Location: …</strong></h6>
// followed by the description. They're a pure Atlassian shop with a tiny board,
// so we scrape all roles (no title filter). With no per-job id we key on a slug
// of the title and link every role to the careers page.
const CAREERS_URL = 'https://trundl.com/trundl-careers/';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function scrapeTrundl(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ApwideJobBot/1.0)' },
  });

  if (!res.ok) {
    console.warn(`Trundl: HTTP ${res.status} — returning empty`);
    return [];
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];
  const seen = new Set<string>();

  // Titles never contain a '<', so [^<] cleanly stops at the closing tag.
  const titleRe = /Job Title:\s*([^<]{2,120})/gi;
  for (const m of html.matchAll(titleRe)) {
    const title = decodeEntities(m[1].replace(/\s+/g, ' ').trim());
    if (!title) continue;

    const sourceId = slugify(title);
    if (seen.has(sourceId)) continue;   // guard against the title appearing twice
    seen.add(sourceId);

    // The Location heading follows the title within the same card.
    const window = html.slice(m.index, m.index + 600);
    const rawLoc = window.match(/Location:\s*([^<]{2,80})/i)?.[1] ?? '';
    const location = decodeEntities(rawLoc.replace(/\s+/g, ' ').trim());

    jobs.push({
      id: buildStableJobId('trundl', sourceId),
      sourceId,
      source: 'Trundl',
      title,
      company: 'Trundl',
      location,
      locationNormalised: normaliseLocation(location),
      url: CAREERS_URL,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
