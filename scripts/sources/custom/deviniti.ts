import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://deviniti.com';
const LIST_URL = `${BASE_URL}/jobs/`;

export async function scrapeDeviniti(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Deviniti: HTTP ${res.status}`);

  const html = await res.text();

  // Extract job page URLs (format: /job/slug/)
  const jobPattern = /href="(https:\/\/deviniti\.com\/job\/([^"]+))"/g;
  const seen = new Set<string>();
  const slugs: Array<{ url: string; slug: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const url = match[1].replace(/\/$/, '') + '/';
    const slug = match[2].replace(/\/$/, '');
    if (!seen.has(url)) {
      seen.add(url);
      slugs.push({ url, slug });
    }
  }

  const now = new Date().toISOString();

  // Fetch each job page to get the title from <title> tag
  const jobs = await Promise.all(
    slugs.map(async ({ url, slug }) => {
      try {
        const pageRes = await fetch(url, { headers: { 'User-Agent': 'ApwideJobBot/1.0' } });
        const pageHtml = await pageRes.text();
        const titleMatch = pageHtml.match(/<title>([^<|]+)/);
        const title = decodeEntities(titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' '));

        return {
          id: buildStableJobId('deviniti', slug),
          sourceId: slug,
          source: 'Deviniti',
          title,
          company: 'Deviniti',
          location: 'Poland',
          locationNormalised: normaliseLocation('Poland'),
          url,
          firstSeen: now,
          lastSeen: now,
          isActive: true,
        } satisfies Job;
      } catch {
        return null;
      }
    })
  );

  return jobs.filter((j): j is Job => j !== null);
}
