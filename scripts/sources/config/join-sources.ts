import type { JoinSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const JOIN_SOURCES: JoinSource[] = [
  // Pure Atlassian shop — scrape all roles
  { slug: 'meskru',      name: 'MESKRU' },
  // Broader IT consultancies — filter to Atlassian-relevant titles only
  { slug: 'medialine',   name: 'Medialine',      titleFilter: ATLASSIAN_TITLE_FILTER },
  { slug: 'nangasystems', name: 'Nanga Systems', titleFilter: ATLASSIAN_TITLE_FILTER },
];
