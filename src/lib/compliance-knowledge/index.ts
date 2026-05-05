export type { CountryCompliance, SubmissionStep, FormType, FeeStructure, KeyLaw } from "./types";
export { COMPLIANCE_DATA } from "./data";

import { COMPLIANCE_DATA } from "./data";

export function getComplianceByCountry(code: string) {
  return COMPLIANCE_DATA.find((c) => c.countryCode === code);
}

export function getComplianceByRegion(region: string) {
  return COMPLIANCE_DATA.filter((c) => c.region === region);
}

export function getAllRegions(): string[] {
  return [...new Set(COMPLIANCE_DATA.map((c) => c.region))];
}
