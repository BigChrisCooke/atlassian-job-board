import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const BASE_URL = 'https://www.catworkx.com';
const LIST_URL = `${BASE_URL}/en/karriere/stellenangebote`;

export async function scrapeCatworkx(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`catworkx: HTTP ${res.status}`);

  const html = await res.text();

  // Job pages are at /stellenangebote/catworkx/slug
  const jobPattern = /href="(https:\/\/www\.catworkx\.com\/stellenangebote\/catworkx\/([^"]+))"/g;
  const seen = new Set<string>();
  const jobs: Array<{ url: string; slug: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const url = match[1];
    const slug = match[2];
    if (!seen.has(url)) {
      seen.add(url);
      jobs.push({ url, slug });
    }
  }

  const now = new Date().toISOString();

  const results = await Promise.all(
    jobs.map(async ({ url, slug }) => {
      try {
        const pageRes = await fetch(url, { headers: { 'User-Agent': 'ApwideJobBot/1.0' } });
        const pageHtml = await pageRes.text();

        // og:title format: "Job Title | Job opening"
        const ogMatch = pageHtml.match(/property="og:title"\s+content="([^"]+)"/);
        const rawTitle = ogMatch ? ogMatch[1] : slug.replace(/-/g, ' ');
        const title = rawTitle.replace(/\s*\|.*$/, '').trim();

        // Try to extract location from title (e.g. "... USA")
        const locMatch = title.match(/\b(USA|Germany|Austria|Switzerland|DACH|Europe|Remote)\b/i);
        const location = locMatch ? locMatch[1] : 'Germany';

        return {
          id: buildJobId('catworkx', title, location),
          sourceId: slug,
          source: 'catworkx',
          title: title.replace(/\s+(USA|Germany|Austria|Switzerland|DACH|Europe|Remote)\s*$/i, '').trim(),
          company: 'catworkx',
          location,
          locationNormalised: normaliseLocation(location),
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

  return results.filter((j): j is Job => j !== null);
}
