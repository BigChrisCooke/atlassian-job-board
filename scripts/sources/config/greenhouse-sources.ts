import type { GreenhouseSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira admin|jira migration/i;

export const GREENHOUSE_SOURCES: GreenhouseSource[] = [
  // Atlassian partners — scrape all roles
  { slug: 'appfire',        name: 'Appfire' },
  { slug: 'smartbear',      name: 'SmartBear' },
  { slug: 'moduscreate',    name: 'Modus Create' },
  { slug: 'lucidsoftware',  name: 'Lucid' },
  // Non-partner companies — filter to Atlassian-relevant titles only
  { slug: 'samsara',        name: 'Samsara',  titleFilter: ATLASSIAN_TITLE_FILTER },
];
