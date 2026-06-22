import type { TeamtailorSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const TEAMTAILOR_SOURCES: TeamtailorSource[] = [
  // Atlassian-focused shops — scrape all roles
  { baseUrl: 'https://career.eficode.com',         name: 'Eficode' },
  { baseUrl: 'https://career.refined.com',         name: 'Refined' },
  // Broader IT consultancies — filter to Atlassian-relevant titles only
  { baseUrl: 'https://knowmadmood.teamtailor.com', name: 'knowmad mood', titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://directio.teamtailor.com',    name: 'Directio',     titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://embriq.teamtailor.com',      name: 'Embriq',       titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://careers.itera.com',          name: 'Itera',        titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://career.pinja.com',           name: 'Pinja',        titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://jobs.reti.it',               name: 'Reti',         titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://jobb.softronic.se',          name: 'Softronic',    titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://careers.technia.com',        name: 'TECHNIA',      titleFilter: ATLASSIAN_TITLE_FILTER },
  { baseUrl: 'https://jobb.advania.se',            name: 'Advania Sverige', titleFilter: ATLASSIAN_TITLE_FILTER },
];
