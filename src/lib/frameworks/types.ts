export type FrameworkField = {
  id: string;
  label: string;
  hint: string;
  textarea?: boolean;
};

export type FrameworkSection = {
  id: string;
  title: string;
  description: string;
  fields: FrameworkField[];
};

export type RegulatoryFramework = {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  authority: string;
  documentType: string;
  sections: FrameworkSection[];
};

export type RegionGroup = {
  region: string;
  countries: { code: string; name: string; flag: string; frameworkCount: number }[];
};
