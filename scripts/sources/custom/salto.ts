import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://www.salto.io';
const CAREERS_URL = `${BASE_URL}/careers`;

export async function scrapeSalto(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Salto: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Match the full anchor tag so title/location extraction stays within bounds
  const anchorPattern =
    /<a[^>]+href="(\/careers\/([a-z0-9][a-z0-9-]*))"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set<string>();
  const jobs: Job[] = [];

  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const path = match[1];
    const slug = match[2];
    const content = match[3];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const titleMatch = content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const locationMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/);

    // Strip any HTML tags from matched text
    const strip = (s: string) => s.replace(/<[^>]+>/g, '').trim();

    const toTitleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
    const title = titleMatch
      ? strip(titleMatch[1])
      : toTitleCase(slug.replace(/-\d+$/, '').replace(/-/g, ' '));
    const location = locationMatch ? strip(locationMatch[1]) : '';

    jobs.push({
      id: buildJobId('salto', title, location),
      sourceId: slug,
      source: 'Salto',
      title,
      company: 'Salto',
      location,
      locationNormalised: normaliseLocation(location),
      url: `${BASE_URL}${path}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
