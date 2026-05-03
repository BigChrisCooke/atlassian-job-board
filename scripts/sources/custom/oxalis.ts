import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const CAREERS_URL = 'https://oxalis.io/careers/';

export async function scrapeOxalis(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Oxalis: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];

  // Jobs are in a <ul class="wp-block-list"> as <li> items.
  // Format: <a href="applytojob url">Title</a>: Location
  // Some items have no link (no application URL available).
  const listPattern = /<li[^>]*>([\s\S]*?)<\/li>/g;

  let match: RegExpExecArray | null;
  while ((match = listPattern.exec(html)) !== null) {
    const liHtml = match[1];

    // Must contain applytojob.com to be a scrapeable listing
    if (!liHtml.includes('applytojob.com')) continue;

    const linkMatch = liHtml.match(/<a[^>]+href="(https:\/\/[^"]*applytojob\.com[^"]+)"[^>]*>([^<]+)<\/a>/);
    if (!linkMatch) continue;

    const url = linkMatch[1].trim();
    const title = linkMatch[2].trim();

    // Location follows the closing </a> tag, e.g.: ": Portland, OR"
    const afterLink = liHtml.replace(/<[^>]+>/g, '').trim();
    const locationRaw = afterLink.replace(/^[^:]+:\s*/, '').trim();
    const location = locationRaw || 'USA';

    jobs.push({
      id: buildStableJobId('oxalis', url.split('/').pop() ?? url),
      sourceId: url.split('/').pop() ?? url,
      source: 'Oxalis Solutions',
      title,
      company: 'Oxalis Solutions',
      location,
      locationNormalised: normaliseOxalisLocation(location),
      url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}

// Oxalis jobs are US-based cities not covered by the shared normaliser
function normaliseOxalisLocation(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('remote')) return 'remote';
  if (s.match(/ca|or|wa|va|tx|ny|fl|co|ma|pa|usa|united states/)) return 'usa';
  if (s.match(/portland|petaluma|sacramento|san francisco|san diego|seattle|norfolk/)) return 'usa';
  return normaliseLocation(raw);
}
