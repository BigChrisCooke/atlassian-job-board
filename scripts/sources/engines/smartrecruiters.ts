import type { Job, SmartRecruitersSource } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

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
  const url = `https://api.smartrecruiters.com/v1/companies/${source.companyId}/postings?limit=100`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TogethaJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`SmartRecruiters ${source.companyId}: HTTP ${res.status}`);

  const data = await res.json();
  const postings: SRPosting[] = data.content ?? [];
  const now = new Date().toISOString();

  return postings.map((p) => {
    const location = p.location?.remote
      ? 'Remote'
      : p.location?.fullLocation ?? p.location?.city ?? '';

    return {
      id: buildJobId(source.companyId, p.name, location),
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
