import type { Job, SmartRecruitersSource, SmartRecruitersQuery } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

interface SRPosting {
  id: string;
  name: string;
  releasedDate: string;
  location: {
    city?: string;
    country?: string;
    remote?: boolean;
    fullLocation?: string;
  };
  department?: { label: string };
  typeOfEmployment?: { label: string };
}

export async function scrapeSmartRecruiters(source: SmartRecruitersSource): Promise<Job[]> {
  const queries: Array<SmartRecruitersQuery | null> = source.queries ?? [null];
  const seen = new Set<string>();
  const postings: SRPosting[] = [];

  for (const query of queries) {
    const url = `https://api.smartrecruiters.com/v1/companies/${source.companyId}/postings?limit=100${query ? `&q=${encodeURIComponent(query.q)}` : ''}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ApwideJobBot/1.0' },
    });
    if (!res.ok) throw new Error(`SmartRecruiters ${source.companyId}: HTTP ${res.status}`);
    const data = await res.json();
    for (const p of (data.content ?? []) as SRPosting[]) {
      if (seen.has(p.id)) continue;
      if (query?.titleContains && !p.name.toLowerCase().includes(query.titleContains.toLowerCase())) continue;
      seen.add(p.id);
      postings.push(p);
    }
  }
  const now = new Date().toISOString();

  return postings.map((p) => {
    const location = p.location?.remote
      ? 'Remote'
      : p.location?.fullLocation ?? p.location?.city ?? '';

    return {
      id: buildStableJobId(source.companyId, p.id),
      sourceId: p.id,
      source: source.name,
      title: p.name,
      company: source.name,
      location,
      locationNormalised: normaliseLocation(location),
      department: p.department?.label,
      type: p.typeOfEmployment?.label,
      url: `https://jobs.smartrecruiters.com/${source.companyId}/${p.id}`,
      firstSeen: p.releasedDate ?? now,
      lastSeen: now,
      isActive: true,
    };
  });
}
