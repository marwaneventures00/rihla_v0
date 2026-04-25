export type Personality = {
  investigative: number;
  social: number;
  enterprising: number;
  artistic: number;
  conventional: number;
  realistic: number;
  uncertainty: number;
  socialMotivation: number;
};

export type OnboardingState = {
  // Step 1
  field: string;
  level: string;
  institutionName: string;
  institutionType: string;
  // Step 2
  sectors: string[];
  workEnv: string;
  geography: string;
  ambition: number;
  // Step 3
  personality: Personality;
};

export const defaultOnboarding: OnboardingState = {
  field: '',
  level: '',
  institutionName: '',
  institutionType: '',
  sectors: [],
  workEnv: '',
  geography: '',
  ambition: 3,
  personality: {
    investigative: 0,
    social: 0,
    enterprising: 0,
    artistic: 0,
    conventional: 0,
    realistic: 0,
    uncertainty: 0,
    socialMotivation: 0,
  },
};

export type Pathway = {
  title: string;
  fitScore: number;
  whyItFits: string[];
  trajectory: { Y1: string; Y3: string; Y5: string };
  salaryRange: { min: number; max: number };
  topEmployers: string[];
  skillsGap: string[];
};

export type PathwayResult = {
  readinessScore: number;
  topTraits: string[];
  pathways: Pathway[];
  actionPlan: string[];
};

export const STORAGE_KEY = 'masarat:onboarding';
