import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

const CAREERS_URL = 'https://xpand-it.com/en/careers/';
const BASE_URL = 'https://xpand-it.com';

export async function scrapeXpandIt(): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Don't block resources — Cloudflare bot detection may check for full browser behaviour
    await page.goto(CAREERS_URL, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    // Retry once if the page failed to settle
    const url = page.url();
    if (url.includes('challenge') || url.includes('captcha')) {
      await page.waitForTimeout(5_000);
      await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
    }

    console.log(`  [xpandit] landed on: ${page.url()}`);

    // Cloudflare serves block pages at the original URL — detect via page content
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    if (bodyText.toLowerCase().includes('cloudflare') && /\b(error|blocked|checking)\b/i.test(bodyText)) {
      throw new Error('Blocked by Cloudflare — skipping to preserve existing job data');
    }

    // Try multiple URL patterns — Portuguese companies sometimes use /jobs/, /vagas/, or /en/careers/
    const selectors = [
      'a[href*="/careers/"]',
      'a[href*="/jobs/"]',
      'a[href*="/vagas/"]',
      'a[href*="/job/"]',
      'a[href*="/oferta/"]',
    ];

    let rawJobs: { href: string; title: string; location: string }[] = [];

    for (const sel of selectors) {
      const found = await page.$$eval(sel, (anchors) =>
        (anchors as HTMLAnchorElement[]).map((a) => {
          const h3 = a.querySelector('h3');
          const h4 = a.querySelector('h4');
          const heading = h3 ?? h4;
          const title =
            heading?.textContent?.trim() ??
            a.querySelector('[class*="title"], [class*="position"]')?.textContent?.trim() ??
            a.textContent?.trim() ??
            '';
          const location =
            a.querySelector('p, [class*="location"], [class*="place"]')?.textContent?.trim() ?? '';
          return { href: a.href, title, location };
        })
      ).catch(() => []);

      // Filter out root pages and nav links
      const listings = found.filter((j) => {
        const clean = j.href.replace(/\/$/, '');
        const isRoot = ['careers', 'jobs', 'vagas', 'job', 'oferta'].some(
          (p) => clean.endsWith(`/${p}`) || clean.endsWith(`/en/${p}`)
        );
        return !isRoot && j.title.length > 1;
      });

      if (listings.length > 0) {
        rawJobs = listings;
        console.log(`  [xpandit] found ${listings.length} jobs via selector: ${sel}`);
        break;
      }
    }

    if (rawJobs.length === 0) {
      // Log all hrefs on the page to help diagnose
      const allLinks = await page.$$eval('a[href]', (as) =>
        (as as HTMLAnchorElement[]).map((a) => a.href)
      );
      console.log(`  [xpandit] 0 jobs found. Sample page links:\n    ${allLinks.slice(0, 15).join('\n    ')}`);
    }

    const now = new Date().toISOString();
    const seen = new Set<string>();

    return rawJobs
      .filter((j) => {
        if (seen.has(j.href)) return false;
        seen.add(j.href);
        return true;
      })
      .map((j) => ({
        id: buildJobId('xpandit', j.title, j.location),
        sourceId: j.href.split('/').filter(Boolean).pop() ?? j.href,
        source: 'Xpand IT',
        title: j.title,
        company: 'Xpand IT',
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
