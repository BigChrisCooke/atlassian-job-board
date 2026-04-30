import type { PersonioSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const PERSONIO_SOURCES: PersonioSource[] = [
  // Atlassian-focused shops — scrape all roles
  { slug: 'k15t',          name: 'K15t' },
  { slug: 'cross-alm',     name: 'Cross ALM' },
  // Broader IT consultancies — filter to Atlassian-relevant titles only
  { slug: 'codecentric',   name: 'codecentric AG', titleFilter: ATLASSIAN_TITLE_FILTER },
  { slug: 'arineo-gmbh',   name: 'Arineo',         titleFilter: ATLASSIAN_TITLE_FILTER },
];
