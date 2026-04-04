import type { Job, BambooHRSource } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

interface BambooHRJob {
  id: string;
  jobOpeningName: string;
  departmentLabel?: string;
  employmentStatusLabel?: string;
  isRemote?: boolean;
  locationType?: string;
  atsLocation?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

export async function scrapeBambooHR(source: BambooHRSource): Promise<Job[]> {
  const url = `https://${source.slug}.bamboohr.com/careers/list`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TogethaJobBot/1.0',
    },
  });

  if (!res.ok) throw new Error(`BambooHR ${source.slug}: HTTP ${res.status}`);

  const data = await res.json();
  const jobs: BambooHRJob[] = data.result ?? [];
  const now = new Date().toISOString();

  return jobs
    .filter((j) => !j.jobOpeningName.toLowerCase().startsWith('learn more about'))
    .map((j) => {
      const loc = j.atsLocation;
      const location = j.isRemote
        ? 'Remote'
        : [loc?.city, loc?.state, loc?.country].filter(Boolean).join(', ');

      return {
        id: buildJobId(source.slug, j.jobOpeningName, location),
        sourceId: j.id,
        source: source.name,
        title: j.jobOpeningName,
        company: source.name,
        location,
        locationNormalised: normaliseLocation(location),
        department: j.departmentLabel ?? undefined,
        type: j.employmentStatusLabel ?? undefined,
        url: `https://${source.slug}.bamboohr.com/careers/${j.id}`,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      };
    });
}
