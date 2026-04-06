import type { Job } from '../../types.js';
import { normaliseLocation } from '../../utils/normalise.js';

const API_BASE = 'https://remoteok.com/api';
const TAGS = ['atlassian', 'jira'];

// For the broad 'jira' tag, only include roles where Atlassian/Jira is the primary focus
// For the broad 'jira' tag, only keep roles where Jira/Atlassian is clearly primary
const JIRA_TITLE_FILTER = /atlassian|jira|confluence|bitbucket|itsm|service desk/i;

interface RemoteOKJob {
  slug: string;
  position: string;
  company: string;
  location?: string;
  tags?: string[];
  url: string;
}

export async function scrapeRemoteOK(): Promise<Job[]> {
  const seen = new Set<string>();
  const results: Job[] = [];
  const now = new Date().toISOString();

  for (const tag of TAGS) {
    const res = await fetch(`${API_BASE}?tag=${tag}`, {
      headers: {
        'User-Agent': 'ApwideJobBot/1.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`RemoteOK (${tag}): HTTP ${res.status}`);

    const data: unknown[] = await res.json();
    // First element is always a legal notice object — skip it
    const listings = data.slice(1) as RemoteOKJob[];

    for (const j of listings) {
      if (!j.slug || !j.position || !j.company) continue;
      if (seen.has(j.slug)) continue;
      // For the general 'jira' tag, filter to roles where it's the primary skill
      if (tag === 'jira' && !JIRA_TITLE_FILTER.test(j.position)) continue;
      seen.add(j.slug);

      results.push({
        id: `remoteok-${j.slug}`,
        sourceId: j.slug,
        source: 'Remote OK',
        title: j.position,
        company: j.company,
        location: j.location || 'Remote',
        locationNormalised: normaliseLocation(j.location || 'remote'),
        url: `https://remoteok.com/remote-jobs/${j.slug}`,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      });
    }
  }

  return results;
}
