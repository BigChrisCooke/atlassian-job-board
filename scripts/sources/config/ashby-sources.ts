import type { AshbySource } from '../../types.js';

export const ASHBY_SOURCES: AshbySource[] = [
  { slug: 'tempo-io', name: 'Tempo' },
  { slug: 'rewind',   name: 'Rewind' },
  // Migrated from Workable — old apply.workable.com/praecipio account is stale.
  { slug: 'praecipio', name: 'Praecipio' },
];
