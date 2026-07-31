import assert from 'node:assert/strict';
import test from 'node:test';

test('scrapes a Workday role with a stable ID and source-specific title correction', async () => {
  const engine = await import('./workday.js').catch(() => undefined);
  assert.ok(engine, 'the Workday engine should exist');

  const searchResponse = {
    total: 2,
    jobPostings: [
      {
        title: 'NDS Program Office IT Program Administrator - Cloud Altassian Administrator',
        externalPath:
          '/job/Centennial-CO/NDS-Program-Office-IT-Program-Administrator---Cloud-Altassian-Administrator_R22795',
        bulletFields: ['R22795'],
      },
      {
        title: 'NDS Program Office IT Program Administrator - Governance',
        externalPath:
          '/job/Centennial-CO/NDS-Program-Office-IT-Program-Administrator---Governance_R22796',
        bulletFields: ['R22796'],
      },
    ],
  };

  const details = new Map([
    ['R22795', { jobPostingInfo: {
      jobReqId: 'R22795',
      title: 'NDS Program Office IT Program Administrator - Cloud Altassian Administrator',
      jobDescription: '<p>Administer Atlassian Cloud, Jira, and Confluence.</p>',
      location: 'Centennial, CO',
      additionalLocations: ['Lincoln, NE', 'Remote', 'Madison, WI'],
      timeType: 'Full time',
      externalUrl: 'https://nelnet.wd1.myworkdayjobs.com/MyNelnet/job/Centennial-CO/NDS-Program-Office-IT-Program-Administrator---Cloud-Altassian-Administrator_R22795',
      posted: true,
      canApply: true,
    } }],
    ['R22796', { jobPostingInfo: {
      jobReqId: 'R22796',
      title: 'NDS Program Office IT Program Administrator - Governance',
      jobDescription: '<p>Governance role.</p>',
      location: 'Centennial, CO',
      additionalLocations: [],
      timeType: 'Full time',
      externalUrl: 'https://nelnet.wd1.myworkdayjobs.com/MyNelnet/job/Centennial-CO/NDS-Program-Office-IT-Program-Administrator---Governance_R22796',
      posted: true,
      canApply: true,
    } }],
  ]);

  const fetcher: typeof fetch = async (input, init) => {
    if (init?.method === 'POST') return Response.json(searchResponse);
    const reqId = String(input).includes('R22795') ? 'R22795' : 'R22796';
    return Response.json(details.get(reqId));
  };

  const jobs = await engine.scrapeWorkday({
    baseUrl: 'https://nelnet.wd1.myworkdayjobs.com',
    tenant: 'nelnet',
    site: 'MyNelnet',
    name: 'Nelnet',
    searchTerms: ['Atlassian'],
    titleFilter: /atlassian|jira|confluence|bitbucket/i,
    titleCorrections: {
      R22795: 'NDS Program Office IT Program Administrator - Cloud Atlassian Administrator',
    },
  }, fetcher);

  assert.equal(jobs.length, 1);
  assert.deepEqual(jobs[0], {
    id: 'nelnet-workday-r22795',
    sourceId: 'R22795',
    source: 'Nelnet',
    title: 'NDS Program Office IT Program Administrator - Cloud Atlassian Administrator',
    company: 'Nelnet',
    location: 'Centennial, CO · Lincoln, NE · Remote · Madison, WI',
    locationNormalised: ['remote', 'usa'],
    type: 'Full time',
    description: '<p>Administer Atlassian Cloud, Jira, and Confluence.</p>',
    url: details.get('R22795')!.jobPostingInfo.externalUrl,
    firstSeen: jobs[0].firstSeen,
    lastSeen: jobs[0].lastSeen,
    isActive: true,
  });
});

test('paginates through all Workday search results', async () => {
  const { scrapeWorkday } = await import('./workday.js');
  const requestedOffsets: number[] = [];

  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { offset: number; limit: number };
      requestedOffsets.push(body.offset);
      const start = body.offset;
      const count = start === 0 ? 20 : 1;
      return Response.json({
        total: 21,
        jobPostings: Array.from({ length: count }, (_, index) => {
          const id = `R${start + index + 1}`;
          return { externalPath: `/job/Example-${id}`, bulletFields: [id] };
        }),
      });
    }

    const sourceId = url.match(/R\d+$/)?.[0];
    assert.ok(sourceId);
    return Response.json({ jobPostingInfo: {
      jobReqId: sourceId,
      title: `Example role ${sourceId}`,
      externalUrl: `https://example.com/${sourceId}`,
      posted: true,
      canApply: true,
    } });
  };

  const jobs = await scrapeWorkday({
    baseUrl: 'https://example.wd1.myworkdayjobs.com',
    tenant: 'example',
    site: 'Careers',
    name: 'Example',
    searchTerms: ['Atlassian'],
  }, fetcher);

  assert.deepEqual(requestedOffsets, [0, 20]);
  assert.equal(jobs.length, 21);
});

test('skips a Workday posting removed between search and detail requests', async () => {
  const { scrapeWorkday } = await import('./workday.js');
  const fetcher: typeof fetch = async (_input, init) => {
    if (init?.method === 'POST') {
      return Response.json({
        total: 1,
        jobPostings: [{ externalPath: '/job/Closed-role_R1', bulletFields: ['R1'] }],
      });
    }
    return new Response('', { status: 404 });
  };

  const jobs = await scrapeWorkday({
    baseUrl: 'https://example.wd1.myworkdayjobs.com',
    tenant: 'example',
    site: 'Careers',
    name: 'Example',
    searchTerms: ['Atlassian'],
  }, fetcher);

  assert.deepEqual(jobs, []);
});

test('retries a transient Workday detail server error once', async () => {
  const { scrapeWorkday } = await import('./workday.js');
  let detailAttempts = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    if (init?.method === 'POST') {
      return Response.json({
        total: 1,
        jobPostings: [{ externalPath: '/job/Atlassian-role_R1', bulletFields: ['R1'] }],
      });
    }
    detailAttempts += 1;
    if (detailAttempts === 1) return new Response('', { status: 500 });
    return Response.json({ jobPostingInfo: {
      jobReqId: 'R1',
      title: 'Atlassian Administrator',
      externalUrl: 'https://example.com/R1',
      posted: true,
      canApply: true,
    } });
  };

  const jobs = await scrapeWorkday({
    baseUrl: 'https://example.wd1.myworkdayjobs.com',
    tenant: 'example',
    site: 'Careers',
    name: 'Example',
    searchTerms: ['Atlassian'],
  }, fetcher);

  assert.equal(detailAttempts, 2);
  assert.equal(jobs.length, 1);
});
