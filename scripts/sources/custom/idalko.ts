import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const LIST_URL = 'https://idalko.com/job-list';

export async function scrapeIdalko(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`iDalko: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Job slugs are in links like: job-list/licence-expert
  const slugPattern = /job-list\/([a-z0-9-]+)/g;
  const seen = new Set<string>();
  const slugs: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = slugPattern.exec(html)) !== null) {
    const slug = match[1];
    if (!seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }

  // Derive title from slug (h2 text in page matches slug label)
  return slugs.map((slug) => {
    const title = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/\bTech\b/, 'Technical');

    return {
      id: buildJobId('idalko', title, 'belgium'),
      sourceId: slug,
      source: 'iDalko (Exalate)',
      title,
      company: 'iDalko (Exalate)',
      location: 'Belgium',
      locationNormalised: normaliseLocation('Belgium'),
      url: `https://idalko.com/job-list/${slug}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    };
  });
}
