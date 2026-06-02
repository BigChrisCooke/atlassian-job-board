import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Ariel Partners (Atlassian Silver Solution Partner, US) lists openings on
// their CatsOne-hosted board. The careers HTML is server-rendered: each role
// is an <a> with class `sc-uJMKN` (styled-components, hash is stable) wrapping
// title / "Category" / "Location" cells. CatsOne's CDN is fine with a plain
// fetch — no Playwright needed. Their lineup is heavy on .NET / Drupal / test
// engineering so a title filter is essential; otherwise the board fills up
// with unrelated roles. Same shape as Samsara/Kalles in Greenhouse.
const CAREERS_URL = 'https://arielpartners.catsone.com/careers/12667-General';
const BASE_URL = 'https://arielpartners.catsone.com';
const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export async function scrapeAriel(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`Ariel Partners: HTTP ${res.status} — returning empty`);
    return [];
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];

  // Each card is <a href="/careers/12667-General/jobs/{id}-{slug}"> followed
  // by a flex row of div cells. Match the anchor and capture the row body
  // up to the next </a>.
  const cardRe =
    /<a[^>]*href="(\/careers\/12667-General\/jobs\/(\d+)-[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const m of html.matchAll(cardRe)) {
    const relUrl = m[1];
    const sourceId = m[2];
    const body = m[3];

    // The first column inside the card is the role title.
    const titleMatch = body.match(/<div[^>]*col-12[^>]*>\s*([^<]+?)\s*<\/div>/);
    const title = decodeEntities((titleMatch?.[1] ?? '').trim());
    if (!title) continue;

    if (!ATLASSIAN_TITLE_FILTER.test(title)) continue;

    // CatsOne's layout pairs label/value divs alternately ("Location" label
    // then the value). Pull whichever value follows the Location label.
    const locMatch = body.match(/>\s*Location\s*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/);
    const location = decodeEntities((locMatch?.[1] ?? '').trim());

    const deptMatch = body.match(/>\s*Category\s*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/);
    const department = decodeEntities((deptMatch?.[1] ?? '').trim()) || undefined;

    jobs.push({
      id: buildStableJobId('ariel', sourceId),
      sourceId,
      source: 'Ariel Partners',
      title,
      company: 'Ariel Partners',
      location,
      locationNormalised: normaliseLocation(location),
      department,
      url: `${BASE_URL}${relUrl}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
