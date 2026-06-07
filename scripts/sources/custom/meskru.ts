import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const PAGE_URL = 'https://join.com/companies/meskru';

interface JoinJob {
  id: number;
  idParam: string;
  title: string;
  workplaceType: 'HYBRID' | 'REMOTE' | 'ON_SITE';
  city?: { cityName: string; countryName: string };
  country?: { iso3166: string };
  category?: { name: string };
}

export async function scrapeMeskru(): Promise<Job[]> {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });
  if (!res.ok) throw new Error(`MESKRU: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Job data is embedded in the Redux store state as JSON in the SSR'd HTML.
  // Pattern: "jobs":{"items":[...], "pagination":...}
  const match = html.match(/"jobs":\{"items":(\[[\s\S]*?\]),"pagination":/);
  if (!match) throw new Error('MESKRU: could not find jobs data in page HTML');

  const items: JoinJob[] = JSON.parse(match[1]);

  return items.map((j) => {
    const isRemote = j.workplaceType === 'REMOTE';
    const locationParts = [j.city?.cityName, j.city?.countryName].filter(Boolean);
    const location = isRemote ? 'Remote' : locationParts.join(', ') || 'Germany';

    return {
      id: buildStableJobId('meskru', String(j.id)),
      sourceId: String(j.id),
      source: 'MESKRU',
      title: j.title.trim(),
      company: 'MESKRU',
      location,
      locationNormalised: isRemote ? ['remote'] : normaliseLocation(location),
      department: j.category?.name,
      url: `https://join.com/companies/meskru/${j.idParam}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    } satisfies Job;
  });
}
