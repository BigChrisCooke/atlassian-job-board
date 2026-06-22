import type { Job } from '../../types.js';
import { buildStableJobId } from '../../utils/normalise.js';

const CAREERS_URL = 'https://www.mumosystems.com/careers/';

export async function scrapeMumo(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Mumo Systems: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Jobs are plain `job-card` divs: <h3>Title</h3><p>...</p><a href="detail-url">View Details</a>
  const cardPattern = /<div class="job-card">\s*<h3>([^<]+)<\/h3>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>View Details<\/a>/g;

  const jobs: Job[] = [];
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) !== null) {
    const title = match[1].trim();
    const url = match[2];
    const slug = url.split('/').filter(Boolean).pop() ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    jobs.push({
      id: buildStableJobId('mumo', slug),
      sourceId: slug,
      source: 'Mumo Systems',
      title,
      company: 'Mumo Systems',
      location: 'Location not specified',
      locationNormalised: [],
      url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
