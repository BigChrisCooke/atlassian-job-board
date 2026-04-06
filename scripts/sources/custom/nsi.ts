import type { Job } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

// NSI uses Recruitee (company slug: nsiit). We filter for Atlassian-related roles only.
const API_URL = 'https://nsiit.recruitee.com/api/offers/?live=true';

interface RecruiteeOffer {
  id: number;
  title: string;
  city?: string;
  country_code?: string;
  remote?: boolean;
  careers_url?: string;
  slug?: string;
}

interface RecruiteeResponse {
  offers: RecruiteeOffer[];
}

export async function scrapeNsi(): Promise<Job[]> {
  const res = await fetch(API_URL, {
    headers: {
      'User-Agent': 'ApwideJobBot/1.0',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`NSI Recruitee: HTTP ${res.status}`);

  const data: RecruiteeResponse = await res.json();
  const now = new Date().toISOString();

  return data.offers
    .filter((o) => o.title.toLowerCase().includes('atlassian'))
    .map((o) => {
      const location = [o.city, o.country_code].filter(Boolean).join(', ') || 'Europe';
      return {
        id: buildJobId('nsi', o.title, location),
        sourceId: String(o.id),
        source: 'NSI',
        title: o.title,
        company: 'NSI',
        location,
        locationNormalised: normaliseNsiLocation(o.country_code, location),
        url: o.careers_url ?? `https://careers.nsigroup.eu/o/${o.slug}`,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      } satisfies Job;
    });
}

function normaliseNsiLocation(countryCode: string | undefined, raw: string): string {
  switch (countryCode) {
    case 'FR': return 'europe';
    case 'BE': return 'europe';
    case 'LU': return 'europe';
    case 'CA': return 'other';
    default: return normaliseLocation(raw);
  }
}
