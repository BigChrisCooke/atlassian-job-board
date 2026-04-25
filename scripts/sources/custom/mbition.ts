import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://mbition.io';
const LIST_URL = `${BASE_URL}/career/`;

// MBition is a Mercedes-Benz subsidiary, not an Atlassian partner — most roles
// are unrelated. Only keep Atlassian-relevant titles for this board.
const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export async function scrapeMBition(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`MBition: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Individual job pages: /career/<slug>/
  const slugPattern = /href="(?:https?:\/\/mbition\.io)?\/career\/([a-z0-9][a-z0-9-]+)\/?"/gi;
  const slugs = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = slugPattern.exec(html)) !== null) {
    slugs.add(match[1]);
  }

  const jobs: Job[] = [];

  for (const slug of slugs) {
    // German job titles often end with "-all-genders" or "-m-w-d", optionally
    // followed by a location token (e.g. "-bulgaria", "-germany").
    const cleaned = slug
      .replace(/-all-genders(-[a-z]+)?$/i, '$1')
      .replace(/-m-w-d(-[a-z]+)?$/i, '$1');

    const locMatch = cleaned.match(
      /-(bulgaria|sofia|germany|berlin|stuttgart|sindelfingen|remote)$/i,
    );
    const rawLocation = locMatch
      ? locMatch[1].replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Sofia, Bulgaria';

    const titleSlug = locMatch ? cleaned.slice(0, -locMatch[0].length) : cleaned;
    const title = titleSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    if (!title) continue;
    if (!ATLASSIAN_TITLE_FILTER.test(title) && !ATLASSIAN_TITLE_FILTER.test(slug)) continue;

    jobs.push({
      id: buildJobId('mbition', title, rawLocation),
      sourceId: slug,
      source: 'MBition',
      title,
      company: 'MBition',
      location: rawLocation,
      locationNormalised: normaliseLocation(rawLocation),
      url: `${BASE_URL}/career/${slug}/`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
