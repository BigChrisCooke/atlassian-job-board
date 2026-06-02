import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Atlas Bench (Atlassian Platinum Solution Partner) uses Zoho Recruit's hosted
// careers page. The jobs are rendered client-side after the JS bundle runs —
// raw fetch returns 1.7MB of inert HTML — so Playwright is required. Pure
// Atlassian shop, no title filter needed.
const CAREERS_URL = 'https://atlas-bench.zohorecruit.com/jobs/Careers';

interface RawJob {
  href: string;
  title: string;
}

export async function scrapeAtlasBench(): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(CAREERS_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Zoho Recruit job-detail links follow /jobs/Careers/{numericId}/{slug}.
    // The top-level /jobs/Careers itself matches the prefix but lacks an id,
    // so filter by the digit segment.
    const raw = (await page.$$eval('a[href*="/jobs/Careers/"]', (els) =>
      (els as HTMLAnchorElement[]).map((a) => ({
        href: a.href,
        title: (a.textContent ?? '').trim(),
      }))
    )) as RawJob[];

    const now = new Date().toISOString();
    const seen = new Set<string>();
    const jobs: Job[] = [];

    for (const r of raw) {
      const idMatch = r.href.match(/\/Careers\/(\d+)\//);
      if (!idMatch) continue;
      const sourceId = idMatch[1];
      if (seen.has(sourceId)) continue;
      seen.add(sourceId);

      const title = decodeEntities(r.title);
      if (!title) continue;

      // Atlas Bench's board doesn't surface a separate location element on the
      // listing page — many titles encode it inline (e.g. "*Global*"). Leave
      // raw and let normaliseLocation extract whatever it can.
      jobs.push({
        id: buildStableJobId('atlas-bench', sourceId),
        sourceId,
        source: 'Atlas Bench',
        title,
        company: 'Atlas Bench',
        location: '',
        locationNormalised: normaliseLocation(title),
        url: r.href,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      });
    }

    return jobs;
  } finally {
    await browser.close();
  }
}
