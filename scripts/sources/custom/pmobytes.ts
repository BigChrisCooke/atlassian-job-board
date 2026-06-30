import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// PMOBytes (Atlassian Solution Partner — a PMO/Atlassian consultancy) runs
// WordPress with the WP Job Manager plugin, but the `jobpost` post type is not
// whitelisted on their REST API (wp-json returns rest_no_route). The reliable
// public surface is the plugin's RSS feed at /jobs/feed/, which lists every
// open role with a stable post id embedded in the <guid> (…?post_type=jobpost&p=8462).
// They're a focused Atlassian shop, so we scrape all roles (no title filter).
// The feed carries no location field and the job pages expose no JobPosting
// schema, so location is left empty (normaliseLocation → 'other').
const FEED_URL = 'https://pmobytes.com/jobs/feed/';

export async function scrapePmobytes(): Promise<Job[]> {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`PMOBytes: HTTP ${res.status} — returning empty`);
    return [];
  }

  const xml = await res.text();
  const now = new Date().toISOString();

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.flatMap((item) => {
    const rawTitle = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? item.match(/<title>(.*?)<\/title>/)?.[1]
      ?? '';
    const title = decodeEntities(rawTitle).trim();
    if (!title) return [];

    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? FEED_URL;

    // Stable id: numeric post id from the guid; fall back to the URL slug.
    const guid = item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? '';
    const postId = guid.match(/[?&;]p=(\d+)/)?.[1];
    const sourceId = postId ?? (link.replace(/\/$/, '').split('/').pop() ?? title);

    return [{
      id: buildStableJobId('pmobytes', sourceId),
      sourceId,
      source: 'PMOBytes',
      title,
      company: 'PMOBytes',
      location: '',
      locationNormalised: normaliseLocation(''),
      url: link,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    }];
  });
}
