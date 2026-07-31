import type { Job, WorkdaySource } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

interface WorkdaySearchPosting {
  externalPath: string;
  bulletFields?: string[];
}

interface WorkdaySearchResponse {
  total?: number;
  jobPostings?: WorkdaySearchPosting[];
}

interface WorkdayPostingInfo {
  jobReqId?: string;
  title: string;
  jobDescription?: string;
  location?: string;
  additionalLocations?: string[];
  timeType?: string;
  externalUrl: string;
  posted?: boolean;
  canApply?: boolean;
}

interface WorkdayDetailResponse {
  jobPostingInfo?: WorkdayPostingInfo;
}

const USER_AGENT = 'Mozilla/5.0 (compatible; ApwideJobBot/1.0)';

async function fetchWithServerRetry(
  fetcher: typeof fetch,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetcher(input, init);
  if (response.status < 500) return response;
  return fetcher(input, init);
}

export async function scrapeWorkday(
  source: WorkdaySource,
  fetcher: typeof fetch = fetch,
): Promise<Job[]> {
  const apiRoot = `${source.baseUrl.replace(/\/$/, '')}/wday/cxs/${source.tenant}/${source.site}`;
  const postings = new Map<string, WorkdaySearchPosting>();

  for (const searchText of source.searchTerms) {
    let offset = 0;

    while (true) {
      const response = await fetchWithServerRetry(fetcher, `${apiRoot}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          appliedFacets: {},
          limit: 20,
          offset,
          searchText,
        }),
      });

      if (!response.ok) {
        throw new Error(`${source.name}: Workday search HTTP ${response.status}`);
      }

      const data = (await response.json()) as WorkdaySearchResponse;
      const page = data.jobPostings ?? [];
      for (const posting of page) {
        postings.set(posting.externalPath, posting);
      }

      offset += page.length;
      if (page.length === 0 || offset >= (data.total ?? page.length)) break;
    }
  }

  const now = new Date().toISOString();
  const jobs: Job[] = [];

  for (const posting of postings.values()) {
    const response = await fetchWithServerRetry(fetcher, `${apiRoot}${posting.externalPath}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (response.status === 404 || response.status === 410) continue;
    if (!response.ok) {
      throw new Error(`${source.name}: Workday job detail HTTP ${response.status}`);
    }

    const data = (await response.json()) as WorkdayDetailResponse;
    const info = data.jobPostingInfo;
    if (!info || info.posted === false || info.canApply === false) continue;

    const sourceId = info.jobReqId ?? posting.bulletFields?.[0];
    if (!sourceId) continue;

    const title = source.titleCorrections?.[sourceId] ?? info.title;
    if (source.titleFilter && !source.titleFilter.test(title)) continue;

    const locations = [info.location, ...(info.additionalLocations ?? [])]
      .filter((location): location is string => Boolean(location))
      .filter((location, index, all) => all.indexOf(location) === index);
    const location = locations.join(' · ');

    jobs.push({
      id: buildStableJobId(`${source.name}-workday`, sourceId),
      sourceId,
      source: source.name,
      title,
      company: source.name,
      location,
      locationNormalised: normaliseLocation(location),
      type: info.timeType,
      description: info.jobDescription,
      url: info.externalUrl,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
