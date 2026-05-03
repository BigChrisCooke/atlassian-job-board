import type { Job, TeamtailorSource } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

export async function scrapeTeamtailor(source: TeamtailorSource): Promise<Job[]> {
  const rssUrl = `${source.baseUrl}/jobs.rss`;
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Teamtailor ${source.baseUrl}: HTTP ${res.status}`);

  const xml = await res.text();
  const now = new Date().toISOString();

  // Extract <item> blocks
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.map((item) => {
    const rawTitle = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? item.match(/<title>(.*?)<\/title>/)?.[1]
      ?? '';
    const title = decodeEntities(rawTitle);
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
    const city = item.match(/<tt:city>(.*?)<\/tt:city>/)?.[1] ?? '';
    const country = item.match(/<tt:country>(.*?)<\/tt:country>/)?.[1] ?? '';
    const locationName = item.match(/<tt:name>(.*?)<\/tt:name>/)?.[1] ?? '';
    const department = item.match(/<tt:department>(.*?)<\/tt:department>/)?.[1] ?? undefined;

    const location = locationName || (city && country ? `${city}, ${country}` : city || country || '');
    const jobSlug = link.split('/').pop() ?? link;

    return {
      id: buildStableJobId(new URL(source.baseUrl).hostname, jobSlug),
      sourceId: jobSlug,
      source: source.name,
      title,
      company: source.name,
      location,
      locationNormalised: normaliseLocation(location),
      department: department || undefined,
      url: link,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    };
  });
}
