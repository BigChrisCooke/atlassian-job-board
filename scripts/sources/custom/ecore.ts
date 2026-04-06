import type { Job } from '../../types.js';
import { buildJobId } from '../../utils/normalise.js';

// InHire public API — no Playwright needed
const API_URL = 'https://api.inhire.app/job-posts/public/pages';
const BASE_URL = 'https://ecore.inhire.app/vagas';

interface InHireJob {
  jobId: string;
  displayName: string;
  city?: string;
  country?: string;
  remote?: boolean;
}

export async function scrapeEcore(): Promise<Job[]> {
  const res = await fetch(API_URL, {
    headers: {
      'User-Agent': 'ApwideJobBot/1.0',
      'Accept': 'application/json',
      'X-Tenant': 'ecore',
    },
  });

  if (!res.ok) throw new Error(`e-core InHire: HTTP ${res.status}`);

  const data = await res.json();

  // jobsPage is an object keyed by index: { "0": {...}, "1": {...}, ... }
  const jobs: InHireJob[] = Object.values(data.jobsPage ?? {});
  const now = new Date().toISOString();

  return jobs
    .filter((j) => j.jobId && j.displayName)
    .map((j) => ({
      id: buildJobId('ecore', j.displayName, 'brazil'),
      sourceId: j.jobId,
      source: 'e-core',
      title: j.displayName,
      company: 'e-core',
      location: 'Brazil',
      locationNormalised: 'other',
      url: `${BASE_URL}/${j.jobId}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    }));
}
