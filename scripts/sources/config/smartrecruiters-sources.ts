import type { SmartRecruitersSource } from '../../types.js';

export const SMARTRECRUITERS_SOURCES: SmartRecruitersSource[] = [
  { companyId: 'TheAdaptavistGroup', name: 'Adaptavist' },
  {
    companyId: 'Devoteam',
    name: 'Devoteam',
    queries: [
      { q: 'atlassian' },
      { q: 'jira' },
      { q: 'confluence' },
    ],
  },
  {
    companyId: 'AXIANS',
    name: 'Axians',
    queries: [
      { q: 'atlassian' },
      { q: 'jira' },
      { q: 'confluence' },
    ],
  },
];
