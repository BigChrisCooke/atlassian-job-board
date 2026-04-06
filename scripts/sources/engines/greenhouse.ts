import type { Job, GreenhouseSource } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  first_published?: string;
  updated_at?: string;
  location: { name: string };
  departments: Array<{ name: string }>;
}

export async function scrapeGreenhouse(source: GreenhouseSource): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${source.slug}/jobs`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Greenhouse ${source.slug}: HTTP ${res.status}`);

  const data = await res.json();
  const allJobs: GreenhouseJob[] = data.jobs ?? [];
  const jobs = source.titleFilter
    ? allJobs.filter((j) => source.titleFilter!.test(j.title))
    : allJobs;
  const now = new Date().toISOString();

  return jobs.map((j) => ({
    id: buildJobId(source.slug, j.title, j.location?.name ?? ''),
    sourceId: String(j.id),
    source: source.name,
    title: j.title,
    company: source.name,
    location: j.location?.name ?? '',
    locationNormalised: normaliseLocation(j.location?.name ?? ''),
    department: j.departments?.[0]?.name,
    url: j.absolute_url,
    firstSeen: j.first_published ?? now,
    lastSeen: now,
    isActive: true,
  }));
}
