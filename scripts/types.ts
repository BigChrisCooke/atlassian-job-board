export interface Job {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  locationNormalised: string[];
  department?: string;
  type?: string;
  description?: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
}

export interface LeverSource {
  slug: string;
  name: string;
}

export interface AshbySource {
  slug: string;
  name: string;
}

export interface PersonioSource {
  slug: string;
  name: string;
}

export interface GreenhouseSource {
  slug: string;
  name: string;
  titleFilter?: RegExp;  // if set, only include jobs whose title matches
}

export interface WorkableSource {
  slug: string;   // subdomain on apply.workable.com
  name: string;
  titleFilter?: RegExp;
}

export interface SmartRecruitersQuery {
  q: string;
  titleContains?: string;  // if set, further filter results to titles matching this string
}

export interface SmartRecruitersSource {
  companyId: string;
  name: string;
  queries?: SmartRecruitersQuery[];
}

export interface TeamtailorSource {
  baseUrl: string;
  name: string;
}

export interface BambooHRSource {
  slug: string;
  name: string;
}

export interface JobsDataFile {
  generatedAt: string;
  totalActive: number;
  jobs: Job[];
}

// --- Scrape report types ---

export type SourceStatus = 'ok' | 'failed' | 'skipped-cooldown';

export interface SourceResult {
  name: string;
  group: string;
  count: number;
  prevCount?: number;
  durationMs: number;
  status: SourceStatus;
  error?: string;
  consecutiveFailures: number;
}

export type AnomalyKind =
  | 'failed'
  | 'silent_zero'
  | 'runaway'
  | 'huge_drop'
  | 'cooldown'
  | 'duplicate_ids';

export interface BraveContext {
  query: string;
  results: Array<{ title: string; url: string; description: string }>;
}

export interface Anomaly {
  source: string;
  kind: AnomalyKind;
  message: string;          // plain-English, deterministic
  count: number;
  prevCount?: number;
  error?: string;
  context?: BraveContext;   // attached by the optional Brave pass
  synthesis?: string;       // attached by the optional GitHub Models pass
}

export interface ScrapeReport {
  generatedAt: string;
  durationMs: number;
  totalFresh: number;          // sum of jobs.length across all 'ok' sources this run
  totalActive: number;         // active jobs in jobs.json after merge
  prevTotalActive?: number;
  sources: SourceResult[];
  anomalies: Anomaly[];
  duplicateIds: string[];      // ids that appeared more than once in fresh batch
}

// Raw shapes returned by each ATS

export interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  descriptionPlain?: string;
  categories?: {
    commitment?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  createdAt: number;
}

export interface AshbyPosting {
  id: string;
  title: string;
  locationName?: string;
  departmentName?: string;
  employmentType?: string;
}
