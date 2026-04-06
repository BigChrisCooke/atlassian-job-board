import type { Job, WorkableSource } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

interface WorkableJob {
  shortcode: string;
  title: string;
  department?: string;
  city?: string;
  state?: string;
  country?: string;
  remote?: boolean;
  url?: string;
}

interface WorkableResponse {
  name: string;
  jobs: WorkableJob[];
}

export async function scrapeWorkable(source: WorkableSource): Promise<Job[]> {
  const url = `https://apply.workable.com/api/v1/widget/accounts/${source.slug}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Workable ${source.slug}: HTTP ${res.status}`);

  const data: WorkableResponse = await res.json();
  const allJobs = data.jobs ?? [];
  const jobs = source.titleFilter
    ? allJobs.filter((j) => source.titleFilter!.test(j.title))
    : allJobs;

  const now = new Date().toISOString();

  return jobs.map((j) => {
    const locationParts = [j.city, j.state, j.country].filter(Boolean);
    const location = j.remote ? 'Remote' : locationParts.join(', ') || 'Location not specified';
    const applyUrl = j.url ?? `https://apply.workable.com/${source.slug}/j/${j.shortcode}/`;

    return {
      id: buildJobId(source.slug, j.title, location),
      sourceId: j.shortcode,
      source: source.name,
      title: j.title,
      company: source.name,
      location,
      locationNormalised: j.remote ? 'remote' : normaliseLocation(location),
      department: j.department,
      url: applyUrl,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    } satisfies Job;
  });
}
