export type FrameworkField = {
  id: string;
  label: string;
  hint: string;
  textarea?: boolean;
  allowUpload?: boolean;
  fieldType?: "text" | "image";
  readonly?: boolean;
  redirectSectionId?: string;
  redirectLabel?: string;
};

export type FrameworkSection = {
  id: string;
  title: string;
  description: string;
  from?: string; // Documents to upload (e.g., "IOC/AOA/MOA", "Accreditation Certificate")
  fields: FrameworkField[];
};

export type FrameworkDeviceType = "ivd" | "medical-device";

export type RegulatoryFramework = {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  authority: string;
  documentType: string;
  /** When set, framework is only offered for matching product.deviceType */
  deviceType?: FrameworkDeviceType;
  sections: FrameworkSection[];
};

export type RegionGroup = {
  region: string;
  countries: { code: string; name: string; flag: string; frameworkCount: number }[];
};
