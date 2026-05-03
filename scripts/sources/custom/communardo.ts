import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://www.communardo.de';
const LIST_URL = `${BASE_URL}/karriere/?limit=all`;

export async function scrapeCommunardo(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Communardo: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Match job links and their titles
  const jobPattern = /href="(\/karriere\/stellenangebot\/[^"]+)"[^>]*>\s*([^<]{5,200})/g;
  const seen = new Set<string>();
  const jobs: Job[] = [];

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const path = match[1];
    const title = match[2]
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    if (seen.has(path) || !title) continue;
    seen.add(path);

    const slug = path.split('/').filter(Boolean).pop() ?? path;

    jobs.push({
      id: buildStableJobId('communardo', slug),
      sourceId: slug,
      source: 'Communardo',
      title,
      company: 'Communardo',
      location: 'Germany',
      locationNormalised: normaliseLocation('Germany'),
      url: `${BASE_URL}${path}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
