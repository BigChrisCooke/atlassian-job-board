import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Sngular is an Atlassian Platinum/Gold Solution Partner with a broad consulting
// roster (data, mobile, cloud — mostly non-Atlassian). The jobs page renders all
// roles as `m-card-job` blocks in the initial HTML, so fetch+regex is sufficient.
// We filter to Atlassian-relevant titles to avoid flooding the board with
// unrelated dev roles — same pattern as Samsara/Kalles Group in Greenhouse.
const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;
const CAREERS_URL = 'https://www.sngular.com/talent-and-culture/jobs';
const BASE_URL = 'https://www.sngular.com';

export async function scrapeSngular(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`Sngular: HTTP ${res.status} — returning empty`);
    return [];
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];

  // Each card opens with `<div class="m-card-job">`. Splitting on that boundary
  // gives a clean per-card chunk without having to balance nested </div>s.
  const cardChunks = html.split('<div class="m-card-job">').slice(1);

  for (const chunk of cardChunks) {
    const linkMatch = chunk.match(/href="(\/talent-and-culture\/jobs\/(\d+)\/[^"]+)"/);
    if (!linkMatch) continue;
    const relUrl = linkMatch[1];
    const sourceId = linkMatch[2];

    const titleMatch = chunk.match(/<p class="m-card-job__title[^"]*">\s*([^<]+?)\s*<\/p>/);
    const title = decodeEntities((titleMatch?.[1] ?? '').trim());
    if (!title) continue;

    if (!ATLASSIAN_TITLE_FILTER.test(title)) continue;

    // The label "Location" is followed by a sibling <p> with the value.
    const locMatch = chunk.match(
      /<p class="m-card-job__label[^"]*">Location<\/p>\s*<p[^>]*>\s*([^<]+?)\s*<\/p>/
    );
    const location = decodeEntities((locMatch?.[1] ?? '').trim());

    jobs.push({
      id: buildStableJobId('sngular', sourceId),
      sourceId,
      source: 'Sngular',
      title,
      company: 'Sngular',
      location,
      locationNormalised: normaliseLocation(location),
      url: `${BASE_URL}${relUrl}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
