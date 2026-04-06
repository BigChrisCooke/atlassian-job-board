import type { Job } from '../../types.js';
import { buildJobId } from '../../utils/normalise.js';

// GetConnected (Italy) and Gruppo Euris share this Altamira ATS portal.
// We scrape all visible listings and filter for Atlassian-relevant roles.
const LIST_URL = 'https://euris.altamiraweb.com/';
const BASE_URL = 'https://euris.altamiraweb.com';

export async function scrapeEuris(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Euris/GetConnected Altamira: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];

  // Job links: href="/annunci-lavoro/job-details?JobID=NUMBER" ...>Title</a>
  const jobPattern = /href="(\/annunci-lavoro\/job-details\?JobID=(\d+))"[^>]*>([^<]+)<\/a>/g;
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const path = match[1];
    const jobId = match[2];
    const title = match[3].trim();

    if (seen.has(jobId) || !title) continue;
    // Filter for Atlassian-relevant roles only
    if (!title.toLowerCase().includes('atlassian')) continue;
    seen.add(jobId);

    jobs.push({
      id: buildJobId('euris', title, 'italy'),
      sourceId: jobId,
      source: 'GetConnected / Euris',
      title,
      company: 'GetConnected / Euris',
      location: 'Italy',
      locationNormalised: 'europe',
      url: `${BASE_URL}${path}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
