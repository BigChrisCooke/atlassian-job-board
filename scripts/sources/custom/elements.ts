import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const CAREERS_URL = 'https://elements-apps.com/careers/';
const BASE_URL = 'https://elements-apps.com';

export async function scrapeElements(): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Block images/fonts/media — but keep XHR/fetch so WordPress AJAX can load jobs
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(CAREERS_URL, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    // WP Job Manager renders <li class="job_listing">, other plugins vary.
    // Try the most common selectors in order.
    const selectors = [
      '.job_listing a',
      '.job-listing a',
      '.careers__item a',
      '[class*="job_listing"] a',
      '[class*="job-listing"] a',
      'a[href*="/job/"]',
      'a[href*="/jobs/"]',
      'a[href*="/careers/"]',
    ];

    let rawJobs: { href: string; title: string; location: string }[] = [];

    for (const sel of selectors) {
      rawJobs = await page.$$eval(sel, (anchors) =>
        (anchors as HTMLAnchorElement[]).map((a) => ({
          href: a.href,
          title:
            a.querySelector('h3, h4, .position, .job-title, [class*="title"]')?.textContent?.trim() ??
            a.textContent?.trim() ??
            '',
          location:
            a.querySelector('.location, [class*="location"], p')?.textContent?.trim() ?? '',
        }))
      ).catch(() => []);

      if (rawJobs.length > 0) break;
    }

    const now = new Date().toISOString();
    const seen = new Set<string>();

    return rawJobs
      .filter((j) => {
        if (!j.title || !j.href) return false;
        // Drop links that are just the careers page root
        const clean = j.href.replace(/\/$/, '');
        if (clean.endsWith('/careers')) return false;
        if (seen.has(j.href)) return false;
        seen.add(j.href);
        return true;
      })
      .map((j) => ({
        id: buildStableJobId('elements', j.href.split('/').filter(Boolean).pop() ?? j.href),
        sourceId: j.href.split('/').filter(Boolean).pop() ?? j.href,
        source: 'Elements',
        title: j.title,
        company: 'Elements',
        location: j.location,
        locationNormalised: normaliseLocation(j.location),
        url: j.href.startsWith('http') ? j.href : `${BASE_URL}${j.href}`,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      }));
  } finally {
    await browser.close();
  }
}
