import type { BreezyHRSource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const BREEZYHR_SOURCES: BreezyHRSource[] = [
  // Marketplace app vendor (Jira/Confluence/Bitbucket workflow apps) —
  // their board also carries a generic "Contact us!" CTA posting, which
  // the title filter naturally excludes.
  { slug: 'herocoders', name: 'HeroCoders', titleFilter: ATLASSIAN_TITLE_FILTER },
];
