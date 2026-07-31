import assert from 'node:assert/strict';
import test from 'node:test';
import type { Job } from './types.js';

const staleInactiveJob: Job = {
  id: 'other-r1',
  sourceId: 'R1',
  source: 'Other Company',
  title: 'Example',
  company: 'Other Company',
  location: 'Remote',
  locationNormalised: ['remote'],
  url: 'https://example.com/R1',
  firstSeen: '2026-01-01T00:00:00.000Z',
  lastSeen: '2026-01-01T00:00:00.000Z',
  isActive: false,
};

test('keeps stale inactive jobs outside the --only source scope', async () => {
  const dedupe = await import('./dedupe.js');
  assert.equal(typeof dedupe.shouldRetainAfterPrune, 'function');

  const retained = dedupe.shouldRetainAfterPrune(
    staleInactiveJob,
    '2026-07-01T00:00:00.000Z',
    ['nelnet'],
  );

  assert.equal(retained, true);
});

test('prunes stale inactive jobs inside the --only source scope', async () => {
  const dedupe = await import('./dedupe.js');
  assert.equal(typeof dedupe.shouldRetainAfterPrune, 'function');

  const retained = dedupe.shouldRetainAfterPrune(
    { ...staleInactiveJob, source: 'Nelnet' },
    '2026-07-01T00:00:00.000Z',
    ['nelnet'],
  );

  assert.equal(retained, false);
});
