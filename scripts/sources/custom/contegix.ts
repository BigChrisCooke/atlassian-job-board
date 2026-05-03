import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const LIST_URL = 'https://jobs.jobvite.com/contegix/jobs';

export async function scrapeContegix(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Contegix: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Jobvite format: <a href="/contegix/job/CODE">Job Title</a>
  const jobPattern = /<a[^>]+href="(\/contegix\/job\/[^"]+)"[^>]*>([^<]{5,120})<\/a>/g;
  const seen = new Set<string>();
  const jobs: Job[] = [];

  let match: RegExpExecArray | null;
  while ((match = jobPattern.exec(html)) !== null) {
    const path = match[1];
    const title = match[2].trim();

    if (seen.has(path) || title.toLowerCase().includes('apply') || title.length < 5) continue;
    seen.add(path);

    jobs.push({
      id: buildStableJobId('contegix', path.split('/').pop() ?? path),
      sourceId: path.split('/').pop() ?? path,
      source: 'Contegix',
      title,
      company: 'Contegix',
      location: 'Remote, USA',
      locationNormalised: normaliseLocation('usa'),
      url: `https://jobs.jobvite.com${path}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
