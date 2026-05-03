import type { Job } from '../../types.js';
import { buildStableJobId } from '../../utils/normalise.js';

const VACANCIES_URL = 'https://softgile.com/en/vakansiyi/';

export async function scrapeSoftgile(): Promise<Job[]> {
  const res = await fetch(VACANCIES_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Softgile: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];

  // Jobs are in accordion FAQ items: <div class="faq ..."><section class="toggle"><label>TITLE</label>
  // The apply instruction is email-based (no direct apply URL), so link to the vacancies page.
  const faqPattern = /<div[^>]+class="[^"]*\bfaq\b[^"]*"[^>]*>[\s\S]*?<label>([^<]+)<\/label>/g;
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = faqPattern.exec(html)) !== null) {
    const title = match[1].trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);

    // Softgile's accordion has no per-job IDs/URLs, so the title-derived
    // sourceId is the most stable identifier we can extract here.
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    jobs.push({
      id: buildStableJobId('softgile', titleSlug),
      sourceId: titleSlug,
      source: 'Softgile',
      title,
      company: 'Softgile',
      location: 'Remote, Europe',
      locationNormalised: 'remote',
      url: VACANCIES_URL,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
