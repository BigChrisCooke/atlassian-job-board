import type { WorkableSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira admin|jira migration/i;

export const WORKABLE_SOURCES: WorkableSource[] = [
  // Atlassian partners — scrape all roles
  { slug: 'nimaworks',  name: 'Nimaworks' },
  { slug: 'praecipio',  name: 'Praecipio' },
  { slug: 'cententia',  name: 'Cententia' },
  // Non-partner IT companies — filter to Atlassian-relevant titles only
  { slug: 'mastek',     name: 'Mastek', titleFilter: ATLASSIAN_TITLE_FILTER },
];
