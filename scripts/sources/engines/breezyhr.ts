import type { Job, BreezyHRSource } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

interface BreezyHRJob {
  id: string;
  name: string;
  url: string;
  type?: { name?: string };
  department?: string | null;
  location: {
    name: string;
    is_remote?: boolean;
  };
}

export async function scrapeBreezyHR(source: BreezyHRSource): Promise<Job[]> {
  const url = `https://${source.slug}.breezy.hr/json`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`BreezyHR ${source.slug}: HTTP ${res.status}`);

  const jobs: BreezyHRJob[] = await res.json();
  const now = new Date().toISOString();

  const filtered = source.titleFilter
    ? jobs.filter((j) => source.titleFilter!.test(j.name))
    : jobs;

  return filtered.map((j) => {
    const isRemote = j.location?.is_remote ?? false;
    const location = isRemote ? 'Remote' : (j.location?.name ?? '');

    return {
      id: buildStableJobId(source.slug, j.id),
      sourceId: j.id,
      source: source.name,
      title: j.name,
      company: source.name,
      location,
      locationNormalised: isRemote ? ['remote'] : normaliseLocation(location),
      department: j.department ?? undefined,
      type: j.type?.name,
      url: j.url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    } satisfies Job;
  });
}
