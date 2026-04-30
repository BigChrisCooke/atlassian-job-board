/**
 * One-time discovery tool for the Atlassian Solution Partner Directory.
 *
 * Crawls https://partnerdirectory.atlassian.com page by page, extracts each
 * partner's name + slug + tier + location + (where exposed) website URL, and
 * writes the result to src/data/candidate-partners.json for manual review.
 *
 * This does NOT add jobs to the board. It produces a candidate list so a
 * human (or follow-up scraper) can decide which partners to wire into the
 * weekly scrape.
 *
 *   npx playwright install chromium --with-deps   # one-time
 *   npx tsx scripts/discover-partners.ts          # run
 *
 * The script stops at the first page that yields zero partner cards.
 */

import { chromium, type Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DIRECTORY_URL = 'https://partnerdirectory.atlassian.com';
const OUTPUT_PATH = 'src/data/candidate-partners.json';
const MAX_PAGES = 50;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface CandidatePartner {
  name: string;
  slug: string;
  tier?: string;
  location?: string;
  detailUrl: string;
  websiteUrl?: string;
}

async function extractPartnersFromPage(page: Page): Promise<CandidatePartner[]> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('a[href*="partnerdirectory.atlassian.com/"]');
    const seen = new Set<string>();
    const out: CandidatePartner[] = [];

    cards.forEach((el) => {
      const a = el as HTMLAnchorElement;
      const url = new URL(a.href, location.href);
      if (url.hostname !== 'partnerdirectory.atlassian.com') return;
      const slug = url.pathname.replace(/^\/+|\/+$/g, '');
      if (!slug || slug.includes('/') || seen.has(slug)) return;
      seen.add(slug);

      const card = a.closest('[class*="card" i], li, article') ?? a;
      const text = (card.textContent ?? '').replace(/\s+/g, ' ').trim();

      const tierMatch = text.match(/\b(Platinum|Gold|Silver|Enterprise)\b/i);
      const locMatch = text.match(/(?:in|at)\s+([A-Z][A-Za-z\s,]{2,40})/);

      out.push({
        name: (a.textContent ?? '').trim() || slug,
        slug,
        tier: tierMatch?.[1],
        location: locMatch?.[1]?.trim(),
        detailUrl: a.href,
      });
    });

    return out;
  });
}

async function detectCloudflareBlock(page: Page): Promise<boolean> {
  const body = await page.evaluate(() => document.body?.innerText ?? '');
  return /just a moment|attention required|cloudflare|verify you are human/i.test(
    body.slice(0, 2000)
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const all = new Map<string, CandidatePartner>();

  try {
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const url = `${DIRECTORY_URL}/?page=${pageNum}`;
      console.log(`[discover] page ${pageNum} → ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      if (await detectCloudflareBlock(page)) {
        console.error(
          '[discover] Cloudflare challenge detected. Try running locally with ' +
            'a non-headless browser, or fall back to the WebSearch site:partnerdirectory.atlassian.com method.'
        );
        process.exit(2);
      }

      await page
        .waitForSelector('a[href*="partnerdirectory.atlassian.com/"]', { timeout: 20_000 })
        .catch(() => null);

      const partners = await extractPartnersFromPage(page);
      console.log(`[discover]   found ${partners.length} cards`);

      if (partners.length === 0) break;

      let added = 0;
      for (const p of partners) {
        if (!all.has(p.slug)) {
          all.set(p.slug, p);
          added++;
        }
      }
      if (added === 0) {
        console.log('[discover]   no new partners on this page, stopping');
        break;
      }
    }
  } finally {
    await browser.close();
  }

  const list = Array.from(all.values()).sort((a, b) => a.name.localeCompare(b.name));
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: list.length, partners: list },
      null,
      2
    )
  );

  console.log(`\n[discover] wrote ${list.length} partners to ${OUTPUT_PATH}`);
  console.log(`[discover] tier breakdown:`);
  const byTier: Record<string, number> = {};
  for (const p of list) byTier[p.tier ?? 'unknown'] = (byTier[p.tier ?? 'unknown'] ?? 0) + 1;
  for (const [t, n] of Object.entries(byTier).sort((a, b) => b[1] - a[1])) {
    console.log(`           ${t.padEnd(12)} ${n}`);
  }
}

main().catch((err) => {
  console.error('[discover] failed:', err);
  process.exit(1);
});
