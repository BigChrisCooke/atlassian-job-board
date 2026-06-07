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
  {
    // Global SI + Atlassian partner. q= searches full text (incl. descriptions),
    // so titleContains restricts to roles that are actually Atlassian-titled —
    // otherwise hundreds of generic roles that merely mention Jira leak in.
    companyId: 'nagarro1',
    name: 'Nagarro',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
  {
    // Global SI + Atlassian partner — title-restricted (see Nagarro note above).
    companyId: 'inetum2',
    name: 'INETUM',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
  {
    // Global SI + Atlassian partner — title-restricted (see Nagarro note above).
    companyId: 'soprasteria1',
    name: 'Sopra Steria',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
  {
    companyId: 'Stefanini1',
    name: 'Stefanini',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
  {
    companyId: 'PublicisGroupe',
    name: 'Publicis Sapient',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
  {
    companyId: 'VisionetSystemsInc',
    name: 'Visionet',
    queries: [
      { q: 'atlassian', titleContains: 'atlassian' },
      { q: 'jira', titleContains: 'jira' },
      { q: 'confluence', titleContains: 'confluence' },
    ],
  },
];
