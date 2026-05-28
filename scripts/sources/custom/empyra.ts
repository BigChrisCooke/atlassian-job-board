import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

// Empyra (Atlassian Platinum Solution Partner, US/India) embeds Keka HRMS on
// /careers. The embed JS hits this JSON endpoint for the active jobs list — we
// call it directly. Identifier comes from the embed config on empyra.com/careers.
const API_URL =
  'https://empyra.keka.com/careers/api/embedjobs/default/active/4a5fd503-f542-42da-83f0-13c37c2a3af6';
const JOB_URL_BASE = 'https://empyra.keka.com/careers/jobdetails/';

interface KekaJobLocation {
  name?: string;
  city?: string;
}

interface KekaJob {
  id: number;
  title: string;
  departmentName?: string;
  jobLocations?: KekaJobLocation[];
}

export async function scrapeEmpyra(): Promise<Job[]> {
  const res = await fetch(API_URL, {
    headers: { 'User-Agent': 'ApwideJobBot/1.0' },
  });

  if (!res.ok) {
    console.warn(`Empyra: HTTP ${res.status} — returning empty`);
    return [];
  }

  const data = (await res.json()) as KekaJob[];
  const now = new Date().toISOString();

  return data.map((job) => {
    const location = (job.jobLocations ?? [])
      .map((l) => l.city || l.name || '')
      .filter(Boolean)
      .join(', ');

    return {
      id: buildStableJobId('empyra', String(job.id)),
      sourceId: String(job.id),
      source: 'Empyra',
      title: job.title,
      company: 'Empyra',
      location,
      locationNormalised: normaliseLocation(location),
      department: job.departmentName || undefined,
      url: `${JOB_URL_BASE}${job.id}`,
      firstSeen: now,
      lastSeen: now,
      isActive: true,
    };
  });
}
