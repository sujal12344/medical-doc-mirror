export type SubmissionStep = {
  step: number;
  title: string;
  description: string;
  duration?: string;
};

export type FormType = {
  name: string;
  description: string;
  mandatory: boolean;
};

export type FeeStructure = {
  category: string;
  amount: string;
  notes?: string;
};

export type KeyLaw = {
  name: string;
  description: string;
  year?: string;
};

export type CountryCompliance = {
  countryCode: string;
  countryName: string;
  flag: string;
  region: string;

  overview: string;

  regulatoryAuthority: {
    name: string;
    abbreviation: string;
    website: string;
    description: string;
  };

  classification: {
    system: string;
    classes: { name: string; description: string; examples: string }[];
  };

  keyLaws: KeyLaw[];

  submissionFlow: SubmissionStep[];

  requiredForms: FormType[];

  timelines: {
    standardReview: string;
    expeditedReview?: string;
    renewalPeriod: string;
    notes?: string;
  };

  fees: FeeStructure[];

  localRequirements: string[];

  tips: string[];

  recentUpdates?: string[];
};
