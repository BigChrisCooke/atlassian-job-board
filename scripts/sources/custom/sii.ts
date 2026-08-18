import { chromium } from 'playwright';
import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Sii Poland (Atlassian Platinum Solution Partner — the group's Atlassian
// practice has been based in Poland since 2016). Sii Group is federated: each
// country runs its own careers site, and the group site's board
// (sii-group.com/en-FR/join-us) is France-only — `?title=atlassian` there
// returns 0 while `?title=devops` returns 19. Poland is the only entity with
// Atlassian roles, so this scrapes sii.pl directly rather than a global feed.
//
// The board is an Alpine.js app (`x-text` / `:href` bindings), so the listing
// HTML is empty until the bundle runs — Playwright is required.
//
// The trailing path segment is a free-text keyword filter across the whole
// posting, which narrows 400+ Polish IT roles down to ~9. That filter is too
// loose to use on its own: it also matches the site-wide "Sii x Atlassian"
// partnership nav link and "Technologies & tools" lists, so a generic QA role
// mentioning Jira scores a hit. ATLASSIAN_TITLE_FILTER is applied on top to
// keep only roles that are actually about the Atlassian stack.
const CAREERS_URL = 'https://sii.pl/en/job-ads/all/all/atlassian/';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

interface RawCard {
  href: string;
  title: string;
  seniority: string;
  workMode: string;
  location: string;
}

export async function scrapeSii(): Promise<Job[]> {
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

    // Cards are rendered client-side; wait for the first one rather than a
    // fixed sleep. A genuinely empty result set is possible (the whole point
    // of the filter), so treat the timeout as "no matches" and move on.
    try {
      await page.waitForSelector('a[href*="/en/job-ads/id/"]', { timeout: 30_000 });
    } catch {
      console.warn('Sii Poland: no job cards rendered — returning empty');
      return [];
    }

    // Everything here runs in the page, where the bundler's `keepNames` helper
    // does not exist — so no named inner functions, only inline expressions.
    //
    // Each label span wraps an inline SVG icon, and that SVG carries a <style>
    // block. textContent would splice the raw CSS ("​.cls-1 { stroke-width: 0px; }")
    // into the value, so read innerText, which ignores non-rendered nodes.
    const raw = (await page.$$eval('a[href*="/en/job-ads/id/"]', (els) =>
      (els as HTMLAnchorElement[]).map((a) => ({
        href: a.href,
        title: ((a.querySelector('.nsw-m-job-add-card__title') as HTMLElement | null)?.innerText ?? '')
          .replace(/\s+/g, ' ').trim(),
        seniority: ((a.querySelector('.js-seniority') as HTMLElement | null)?.innerText ?? '')
          .replace(/\s+/g, ' ').trim(),
        workMode: ((a.querySelector('.js-workmode') as HTMLElement | null)?.innerText ?? '')
          .replace(/\s+/g, ' ').trim(),
        location: ((a.querySelector('.js-locations') as HTMLElement | null)?.innerText ?? '')
          .replace(/\s+/g, ' ').trim(),
      }))
    )) as RawCard[];

    const now = new Date().toISOString();
    const seen = new Set<string>();
    const jobs: Job[] = [];

    for (const card of raw) {
      // /en/job-ads/id/{numericId}/{slug}/
      const idMatch = card.href.match(/\/job-ads\/id\/(\d+)\//);
      if (!idMatch) continue;
      const sourceId = idMatch[1];
      if (seen.has(sourceId)) continue;

      const title = decodeEntities(card.title);
      if (!title) continue;
      if (!ATLASSIAN_TITLE_FILTER.test(title)) continue;

      seen.add(sourceId);

      // The board renders these as comma-separated lists ("Remote, Hybrid,
      // Office") and leaves a trailing separator on the last item.
      const tidy = (s: string) => s.replace(/[,\s]+$/, '').trim();

      // "Multiple locations" is the board's placeholder for a role open in
      // several offices — it carries no geography, so fall back to the country.
      const cardLocation = tidy(card.location);
      const rawLocation = /multiple locations/i.test(cardLocation) ? 'Poland' : cardLocation;
      const workMode = tidy(card.workMode);
      const location = [rawLocation, workMode].filter(Boolean).join(' · ');

      jobs.push({
        id: buildStableJobId('sii', sourceId),
        sourceId,
        source: 'Sii Poland',
        title,
        company: 'Sii Poland',
        location,
        // Always normalise against the country: this is the Polish entity, and
        // the board writes city names without diacritics ("Wroclaw"), which the
        // shared normaliser only matches in their accented form ("wrocław").
        locationNormalised: normaliseLocation(`${rawLocation} ${workMode} Poland`),
        type: tidy(card.seniority) || undefined,
        url: card.href,
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
