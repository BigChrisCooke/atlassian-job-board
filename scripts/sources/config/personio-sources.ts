import type { PersonioSource } from '../../types.js';

// Mixed shops (Atlassian + monday.com/AWS) get this filter so we only pull
// their Atlassian-ecosystem roles. Pure-Atlassian shops below scrape all roles.
const ATLASSIAN_TITLE_FILTER = /atlassian|jira admin|jira migration/i;

export const PERSONIO_SOURCES: PersonioSource[] = [
  { slug: 'k15t', name: 'K15t' },
  { slug: 'automation-consultants-ltd', name: 'Automation Consultants' },
  { slug: 'demicon', name: 'DEMICON', titleFilter: ATLASSIAN_TITLE_FILTER },
  { slug: 'hiq', name: 'HiQ', titleFilter: ATLASSIAN_TITLE_FILTER },
  { slug: 'tngtech', name: 'TNG Technology', titleFilter: ATLASSIAN_TITLE_FILTER },
];
