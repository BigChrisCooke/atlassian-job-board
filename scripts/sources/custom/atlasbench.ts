import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Atlas Bench (Atlassian Platinum Solution Partner) uses Zoho Recruit's hosted
// careers page. The jobs are rendered client-side after the JS bundle runs, so
// Playwright is required. Pure Atlassian shop, no title filter needed.
const CAREERS_URL = 'https://atlas-bench.zohorecruit.com/jobs/Careers';

interface RawJob {
  href: string;
  title: string;
}

interface JobDetails {
  location: string;
  type?: string;
}

function readDetailValue(lines: string[], label: string): string {
  const i = lines.findIndex((line) => line.toLowerCase() === label.toLowerCase());
  return i >= 0 ? (lines[i + 1] ?? '').trim() : '';
}

function parseJobDetails(text: string): JobDetails {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  const city = readDetailValue(lines, 'City');
  const state = readDetailValue(lines, 'State/Province');
  const country = readDetailValue(lines, 'Country');
  let type = readDetailValue(lines, 'Job Type');
  if (!type) {
    const headerType = lines.find((line) => /^Atlas Bench\s*\|/i.test(line));
    type = headerType?.split('|')[1]?.trim() ?? '';
  }

  const locationParts = city && country
    ? [city, country]
    : [city || state, country].filter(Boolean);
  let location = locationParts.join(', ');

  if (!location) {
    const headerLocation = lines.find((line) => /\|\s*Posted on\b/i.test(line));
    location = headerLocation?.split('|')[0]?.trim() ?? '';
  }

  return { location, type: type || undefined };
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

      let details: JobDetails = { location: '' };
      try {
        await page.goto(r.href, { waitUntil: 'networkidle', timeout: 60_000 });
        await page.waitForTimeout(1000);
        details = parseJobDetails(await page.locator('body').innerText({ timeout: 10_000 }));
      } catch {
        // Detail pages add location/type metadata; keep the listing if one
        // page is temporarily slow or blocked.
      }

      jobs.push({
        id: buildStableJobId('atlas-bench', sourceId),
        sourceId,
        source: 'Atlas Bench',
        title,
        company: 'Atlas Bench',
        location: details.location,
        locationNormalised: normaliseLocation(`${details.location} ${title}`),
        type: details.type,
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
