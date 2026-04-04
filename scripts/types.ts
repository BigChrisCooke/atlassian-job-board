export interface Job {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  locationNormalised: string;
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
}

export interface SmartRecruitersSource {
  companyId: string;
  name: string;
}

export interface TeamtailorSource {
  baseUrl: string;
  name: string;
}

export interface JobsDataFile {
  generatedAt: string;
  totalActive: number;
  jobs: Job[];
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
