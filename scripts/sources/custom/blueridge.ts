import type { Job } from '../../types.js';
import { buildStableJobId, normaliseLocation } from '../../utils/normalise.js';

// Blue Ridge Consultants runs job postings as Jira Service Management
// "request types" in a public customer portal (portal id 236), not a
// conventional ATS. The portal's React frontend hydrates from this
// unauthenticated batched-model endpoint.
const MODELS_URL = 'https://blueridgeconsultants.atlassian.net/rest/servicedesk/1/customer/models';
const PORTAL_ID = 236;

interface JsmReqType {
  id: string;
  name: string;
}

interface JsmModelsResponse {
  portal?: {
    portalBaseUrl: string;
    reqTypes?: JsmReqType[];
  };
}

export async function scrapeBlueRidge(): Promise<Job[]> {
  const res = await fetch(MODELS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ApwideJobBot/1.0' },
    body: JSON.stringify({
      options: { portal: { id: PORTAL_ID, expand: ['reqTypes'] }, portalId: PORTAL_ID },
      models: ['portal'],
    }),
  });

  if (!res.ok) throw new Error(`Blue Ridge Consultants: HTTP ${res.status}`);

  const data: JsmModelsResponse = await res.json();
  const reqTypes = data.portal?.reqTypes ?? [];
  const now = new Date().toISOString();

  return reqTypes.map((rt) => ({
    id: buildStableJobId('blueridge', rt.id),
    sourceId: rt.id,
    source: 'Blue Ridge Consultants',
    title: rt.name,
    company: 'Blue Ridge Consultants',
    location: 'Greenville, SC',
    locationNormalised: normaliseLocation('Greenville, SC'),
    url: `https://blueridgeconsultants.atlassian.net/helpcenter/jobs/portal/${PORTAL_ID}/group/${PORTAL_ID}/create/${rt.id}`,
    firstSeen: now,
    lastSeen: now,
    isActive: true,
  } satisfies Job));
}
