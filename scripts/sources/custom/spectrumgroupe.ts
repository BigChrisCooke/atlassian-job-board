import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

const LIST_URL = 'https://spectrumgroupe.fr/en/jobs/discover-all-our-offers/';

export async function scrapeSpectrumGroupe(): Promise<Job[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) throw new Error(`Spectrum Groupe: HTTP ${res.status}`);

  const html = await res.text();
  const now = new Date().toISOString();

  // Links appear one position before their matching h2 title in the DOM
  const links = [...html.matchAll(/href="(https:\/\/spectrumgroupe\.fr\/en\/job\/[^"]+)"/g)].map(m => m[1]);
  const titles = [...html.matchAll(/<h2[^>]*>\s*([^<]{5,120})\s*<\/h2>/g)].map(m =>
    m[1].replace(/&#\d+;/g, '-').replace(/&amp;/g, '&').trim()
  );

  const jobs: Job[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < Math.min(links.length, titles.length); i++) {
    const url = links[i];
    const rawTitle = titles[i];
    if (seen.has(url)) continue;
    seen.add(url);

    // Extract location from title suffix (e.g. "Job Title – CAIRO / EGYPT")
    const locMatch = rawTitle.match(/[–-]\s*([A-Z][A-Z/ ]+)$/);
    const location = locMatch ? locMatch[1].trim() : 'France';
    const title = rawTitle.replace(/\s*[–-]\s*[A-Z][A-Z/ ]+$/, '').trim();

    jobs.push({
      id: buildStableJobId('spectrumgroupe', url.split('/').filter(Boolean).pop() ?? url),
      sourceId: url.split('/').filter(Boolean).pop() ?? url,
      source: 'Spectrum Groupe',
      title,
      company: 'Spectrum Groupe',
      location,
      locationNormalised: normaliseLocation(location),
      url,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    });
  }

  return jobs;
}
