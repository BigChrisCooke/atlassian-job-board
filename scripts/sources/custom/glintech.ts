import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://www.glintech.com';
const LIST_URL = `${BASE_URL}/about/careers/`;

export async function scrapeGlintech(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'TogethaJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`GLINtech: HTTP ${res.status}`);

  const html = await res.text();

  // Extract career page slugs (exclude generic 'expressions-of-interest')
  const slugPattern = /\/about\/careers\/([a-z0-9-]+)\//g;
  const seen = new Set<string>();
  const slugs: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = slugPattern.exec(html)) !== null) {
    const slug = match[1];
    if (slug !== 'expressions-of-interest' && !seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }

  const now = new Date().toISOString();

  const jobs = await Promise.all(
    slugs.map(async (slug) => {
      const url = `${BASE_URL}/about/careers/${slug}/`;
      try {
        const pageRes = await fetch(url, { headers: { 'User-Agent': 'TogethaJobBot/1.0' } });
        const pageHtml = await pageRes.text();

        // og:title contains "Job Title at GLiNTECH"
        const ogMatch = pageHtml.match(/property="og:title"\s+content="([^"]+)"/);
        const rawTitle = ogMatch ? ogMatch[1] : slug.replace(/-/g, ' ');
        const title = rawTitle.replace(/\s+at\s+GLi?NTECH.*$/i, '').trim();

        return {
          id: buildJobId('glintech', title, 'australia'),
          sourceId: slug,
          source: 'GLINtech',
          title,
          company: 'GLINtech',
          location: 'Australia',
          locationNormalised: normaliseLocation('Australia'),
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
