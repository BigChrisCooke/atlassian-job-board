import type { WorkdaySource } from '../../types.js';

const ATLASSIAN_TITLE_FILTER = /atlassian|jira|confluence|bitbucket/i;

export const WORKDAY_SOURCES: WorkdaySource[] = [
  {
    baseUrl: 'https://nelnet.wd1.myworkdayjobs.com',
    tenant: 'nelnet',
    site: 'MyNelnet',
    name: 'Nelnet',
    searchTerms: ['Atlassian', 'Jira', 'Confluence', 'Bitbucket'],
    titleFilter: ATLASSIAN_TITLE_FILTER,
    titleCorrections: {
      R22795:
        'NDS Program Office IT Program Administrator - Cloud Atlassian Administrator',
    },
  },
];
