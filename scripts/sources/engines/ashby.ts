import { chromium } from 'playwright';
import type { Job, AshbySource, AshbyPosting } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

export async function scrapeAshby(source: AshbySource): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Block images/fonts/media to speed up load
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(`https://jobs.ashbyhq.com/${source.slug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    try {
      await page.waitForFunction(
        'window.__appData && window.__appData.jobBoard !== null',
        { timeout: 30_000 }
      );
    } catch {
      // First attempt timed out — wait 5s and retry once before giving up
      await new Promise((r) => setTimeout(r, 5_000));
      try {
        await page.waitForFunction(
          'window.__appData && window.__appData.jobBoard !== null',
          { timeout: 20_000 }
        );
      } catch {
        return [];
      }
    }

    const appData = await page.evaluate(() => (window as any).__appData);
    const postings: AshbyPosting[] = appData?.jobBoard?.jobPostings ?? [];

    const now = new Date().toISOString();

    return postings.map((p) => ({
      id: buildStableJobId(source.slug, p.id),
      sourceId: p.id,
      source: source.name,
      title: p.title,
      company: source.name,
      location: p.locationName ?? '',
      locationNormalised: normaliseLocation(p.locationName ?? ''),
      department: p.departmentName,
      type: p.employmentType,
      url: `https://jobs.ashbyhq.com/${source.slug}/${p.id}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    }));
  } finally {
    await browser.close();
  }
}
