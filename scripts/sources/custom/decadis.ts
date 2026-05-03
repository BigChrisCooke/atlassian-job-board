import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const LIST_URL = 'https://www.decadis.de/atlassian-solutions/jobs';
const BASE_URL = 'https://www.decadis.de';

export async function scrapeDecadis(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Decadis: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Job links follow the pattern: href="/jobs/some-job-slug"
  const jobPattern = /href="(\/jobs\/[a-z0-9][a-z0-9-]{3,})"[^>]*>[\s\S]*?<\/a>/g;
  const seen = new Set<string>();
  const jobs: Job[] = [];

  // Extract job slugs first
  const slugPattern = /href="(\/jobs\/[a-z0-9][a-z0-9-]{3,})"/g;
  let match: RegExpExecArray | null;

  while ((match = slugPattern.exec(html)) !== null) {
    const path = match[1];
    if (seen.has(path)) continue;
    seen.add(path);
  }

  // For each unique job path, extract title from surrounding HTML
  for (const path of seen) {
    // Find the job title near this href
    const hrefIndex = html.indexOf(`href="${path}"`);
    if (hrefIndex === -1) continue;

    // Look backwards for a heading tag containing the title
    const surroundingHtml = html.slice(Math.max(0, hrefIndex - 600), hrefIndex + 200);

    // Try to find a heading (h1–h4) or strong/span with job title
    const titleMatch =
      surroundingHtml.match(/<h[1-4][^>]*>([^<]{5,120})<\/h[1-4]>/) ||
      surroundingHtml.match(/<strong[^>]*>([^<]{5,120})<\/strong>/) ||
      surroundingHtml.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{5,120})<\/span>/i);

    const title = titleMatch ? titleMatch[1].trim() : path.split('/').pop()!.replace(/-m-w-d$/, '').replace(/-/g, ' ');
    if (!title || title.length < 5) continue;

    // Location appears as text near the job entry — default to Koblenz based on known data
    const locationMatch = surroundingHtml.match(/Koblenz|Remote|Berlin|München|Munich|Frankfurt/i);
    const rawLocation = locationMatch ? locationMatch[0] : 'Koblenz, Germany';

    jobs.push({
      id: buildStableJobId('decadis', path),
      sourceId: path,
      source: 'Decadis',
      title,
      company: 'Decadis',
      location: rawLocation,
      locationNormalised: normaliseLocation(rawLocation),
      url: `${BASE_URL}${path}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
