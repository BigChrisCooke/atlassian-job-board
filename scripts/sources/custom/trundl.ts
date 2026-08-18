import type { Job } from '../../types.js';
import { buildStableJobId, decodeEntities, normaliseLocation } from '../../utils/normalise.js';

// Trundl (Platinum Enterprise Atlassian Solution Partner - US/Canada/India)
// lists its handful of openings inline on a single WordPress page. There is no
// ATS, no REST endpoint and no per-job URL: each role is a set of headings:
//   Job Title: ...
//   Location: ...
// followed by the description. They're a pure Atlassian shop with a tiny board,
// so we scrape all roles (no title filter). With no per-job id we key on a slug
// of the title and link every role to the careers page.
const CAREERS_URL = 'https://trundl.com/trundl-careers/';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function htmlToLines(html: string): string[] {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(h[1-6]|p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export async function scrapeTrundl(): Promise<Job[]> {
  const res = await fetch(CAREERS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ApwideJobBot/1.0)' },
  });

  if (!res.ok) {
    console.warn(`Trundl: HTTP ${res.status} - returning empty`);
    return [];
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const jobs: Job[] = [];
  const seen = new Set<string>();
  const lines = htmlToLines(html);

  for (let i = 0; i < lines.length; i++) {
    const titleLine = lines[i].match(/^Job Title:\s*(.*)$/i);
    if (!titleLine) continue;

    // One Trundl role currently renders "Job Title:" and the title as separate
    // headings, so fall through to the next text line when the label is empty.
    const title = titleLine[1]?.trim() || lines[i + 1]?.trim() || '';
    if (!title) continue;

    const sourceId = slugify(title);
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const locationLine = lines
      .slice(i + 1, i + 12)
      .find((line) => /^Location:\s*/i.test(line));
    const location = locationLine?.replace(/^Location:\s*/i, '').trim() ?? '';

    jobs.push({
      id: buildStableJobId('trundl', sourceId),
      sourceId,
      source: 'Trundl',
      title,
      company: 'Trundl',
      location,
      locationNormalised: normaliseLocation(location),
      url: CAREERS_URL,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
