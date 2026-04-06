import type { Job } from '../../types.js';
import { buildJobId } from '../../utils/normalise.js';

const LIST_URL = 'https://ecore.inhire.app/vagas';
const BASE_URL = 'https://ecore.inhire.app';

export async function scrapeEcore(): Promise<Job[]> {
  // InHire is a JS SPA — requires Playwright to render
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(LIST_URL, { waitUntil: 'networkidle', timeout: 45000 });

    // Scroll to trigger any lazy-loaded jobs
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const links = await page.locator('a[href^="/vagas/"]').evaluateAll(
      (els) =>
        els.map((e) => ({
          href: e.getAttribute('href') ?? '',
          title: e.textContent?.trim() ?? '',
        }))
    );

    const now = new Date().toISOString();
    const seen = new Set<string>();
    const jobs: Job[] = [];

    for (const { href, title } of links) {
      if (!href || !title || seen.has(href)) continue;
      seen.add(href);

      // URL slug is the last path segment: /vagas/{uuid}/{slug}
      const sourceId = href.split('/')[2] ?? href;

      jobs.push({
        id: buildJobId('ecore', title, 'brazil'),
        sourceId,
        source: 'e-core',
        title,
        company: 'e-core',
        location: 'Brazil',
        locationNormalised: 'other',
        url: `${BASE_URL}${href}`,
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
