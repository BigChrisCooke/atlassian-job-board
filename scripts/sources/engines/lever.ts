import type { Job, LeverSource, LeverPosting } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

export async function scrapeLeaver(source: LeverSource): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${source.slug}?mode=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0 (+https://www.apwide.com)' },
  });

  if (!res.ok) {
    throw new Error(`Lever fetch failed for ${source.slug}: HTTP ${res.status}`);
  }

  const postings: LeverPosting[] = await res.json();
  const now = new Date().toISOString();

  return postings.map((p) => {
    const location =
      p.categories?.location ??
      p.categories?.allLocations?.[0] ??
      '';

    return {
      id: buildStableJobId(source.slug, p.id),
      sourceId: p.id,
      source: source.name,
      title: p.text,
      company: source.name,
      location,
      locationNormalised: normaliseLocation(location),
      department: p.categories?.team,
      type: p.categories?.commitment,
      description: p.descriptionPlain?.slice(0, 300),
      url: p.hostedUrl,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    };
  });
}
