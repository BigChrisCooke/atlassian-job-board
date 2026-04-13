import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

// The English careers page is blocked by Cloudflare WAF, but the
// Portuguese opportunities page loads fine and lists all jobs.
const CAREERS_URL = 'https://xpand-it.com/pt-pt/carreiras/oportunidades-emprego/';

export async function scrapeXpandIt(): Promise<Job[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-PT',
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.goto(CAREERS_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    // Wait for job links to appear (the page keeps loading resources)
    try {
      await page.waitForSelector('a[href*="/oportunidades-emprego/"]', { timeout: 60_000 });
    } catch {
      // Links may already be in the static HTML
    }
    await page.waitForTimeout(3_000);
    console.log(`  [xpandit] loaded: ${page.url()}`);

    // Dismiss cookie banner if present
    try {
      await page.click('text=Aceitar Todos', { timeout: 5_000 });
      await page.waitForTimeout(2_000);
    } catch {
      /* no banner */
    }

    // Check for Cloudflare block
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    if (bodyText.includes('Sorry, you have been blocked')) {
      throw new Error('Blocked by Cloudflare — skipping to preserve existing job data');
    }

    // Extract job links — they follow the pattern /pt-pt/oportunidades-emprego/{dept}/{slug}/
    const rawJobs = await page.$$eval(
      'a[href*="/oportunidades-emprego/"]',
      (anchors) => {
        const seen = new Set<string>();
        const jobs: { href: string; title: string }[] = [];
        for (const a of anchors as HTMLAnchorElement[]) {
          const href = a.href.replace(/\/$/, '');
          // Only keep deep links (dept/slug), not the listing page itself
          const parts = href.split('/oportunidades-emprego/')[1]?.split('/').filter(Boolean);
          if (!parts || parts.length < 2) continue;
          if (seen.has(href)) continue;
          seen.add(href);
          // Title from link text or slug
          const text = a.textContent?.trim() ?? '';
          const title = text.length > 3 ? text : parts[parts.length - 1].replace(/-/g, ' ');
          jobs.push({ href, title });
        }
        return jobs;
      }
    );

    console.log(`  [xpandit] found ${rawJobs.length} jobs on careers page`);

    const now = new Date().toISOString();

    return rawJobs.map((j) => {
      // Convert Portuguese URL to English for end users
      const englishUrl = j.href
        .replace('/pt-pt/oportunidades-emprego/', '/en/careers/find-opportunities/');

      // Title-case the title
      const title = j.title
        .split(' ')
        .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(' ');

      return {
        id: buildJobId('xpandit', title, 'Portugal'),
        sourceId: j.href.split('/').filter(Boolean).pop() ?? j.href,
        source: 'Xpand IT',
        title,
        company: 'Xpand IT',
        location: 'Portugal',
        locationNormalised: normaliseLocation('Portugal'),
        url: englishUrl,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      };
    });
  } finally {
    await browser.close();
  }
}
