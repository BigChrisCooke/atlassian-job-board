import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://seibert.group';
const LIST_URL = `${BASE_URL}/offene-stellen/`;

export async function scrapeSeibert(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Seibert: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Match job page links with their adjacent title text
  const jobPattern = /href="(https:\/\/seibert\.group\/jobs\/[^"]+)"[^>]*>\s*<[^>]+>\s*([^<]{5,200})/g;
  const seen = new Set<string>();
  const jobs: Job[] = [];

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim().replace(/&amp;/g, '&');

    if (seen.has(url) || !title) continue;
    seen.add(url);

    const slug = url.split('/').filter(Boolean).pop() ?? url;

    jobs.push({
      id: buildStableJobId('seibert', slug),
      sourceId: slug,
      source: 'Seibert Group',
      title,
      company: 'Seibert Group',
      location: 'Germany',
      locationNormalised: normaliseLocation('Germany'),
      url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
