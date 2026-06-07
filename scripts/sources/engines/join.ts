import type { Job, JoinSource } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

interface JoinJob {
  id: number;
  idParam: string;
  title: string;
  workplaceType: 'HYBRID' | 'REMOTE' | 'ON_SITE' | 'ONSITE';
  city?: { cityName: string; countryName: string };
  category?: { name: string };
}

interface JoinPagination {
  page: number;
  pageCount: number;
}

// Job data is embedded as Redux store JSON in JOIN.com's SSR'd HTML.
// Pattern: "jobs":{"items":[...], "pagination":{...}}
function extractPage(html: string): { jobs: JoinJob[]; pagination: JoinPagination } | null {
  const m = html.match(/"jobs":\{"items":(\[[\s\S]*?\]),"pagination":(\{[^}]+\})/);
  if (!m) return null;
  return {
    jobs: JSON.parse(m[1]),
    pagination: JSON.parse(m[2]),
  };
}

export async function scrapeJoin(source: JoinSource): Promise<Job[]> {
  const base = `https://join.com/companies/${source.slug}`;
  const headers = { 'User-Agent': 'ApwideJobBot/1.0' };
  const now = new Date().toISOString();
  const allJobs: JoinJob[] = [];

  // Fetch page 1 to discover total page count, then loop remaining pages
  const firstRes = await fetch(base, { headers });
  if (!firstRes.ok) throw new Error(`JOIN ${source.slug}: HTTP ${firstRes.status}`);
  const firstData = extractPage(await firstRes.text());
  if (!firstData) throw new Error(`JOIN ${source.slug}: could not parse jobs from page HTML`);

  allJobs.push(...firstData.jobs);
  const { pageCount } = firstData.pagination;

  for (let page = 2; page <= pageCount; page++) {
    const res = await fetch(`${base}?page=${page}`, { headers });
    if (!res.ok) throw new Error(`JOIN ${source.slug} page ${page}: HTTP ${res.status}`);
    const data = extractPage(await res.text());
    if (!data) break;
    allJobs.push(...data.jobs);
  }

  const filtered = source.titleFilter
    ? allJobs.filter((j) => source.titleFilter!.test(j.title))
    : allJobs;

  return filtered.map((j) => {
    const isRemote = j.workplaceType === 'REMOTE';
    const locationParts = [j.city?.cityName, j.city?.countryName].filter(Boolean);
    const location = isRemote ? 'Remote' : locationParts.join(', ') || 'Germany';

    return {
      id: buildStableJobId(source.slug, String(j.id)),
      sourceId: String(j.id),
      source: source.name,
      title: j.title.trim(),
      company: source.name,
      location,
      locationNormalised: isRemote ? ['remote'] : normaliseLocation(location),
      department: j.category?.name,
      url: `https://join.com/companies/${source.slug}/${j.idParam}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    } satisfies Job;
  });
}
