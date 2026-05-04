import type { TeamtailorSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const TEAMTAILOR_SOURCES: TeamtailorSource[] = [
  // Atlassian-focused shops — scrape all roles
  { baseUrl: 'https://career.eficode.com',         name: 'Eficode' },
  { baseUrl: 'https://career.refined.com',         name: 'Refined' },
  // Broader IT consultancies — filter to Atlassian-relevant titles only
  { baseUrl: 'https://knowmadmood.teamtailor.com', name: 'knowmad mood', titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://directio.teamtailor.com',    name: 'Directio',     titleFilter: ATLASSIAN_TITLE_FILTER },
];
