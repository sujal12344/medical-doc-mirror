export type { FrameworkField, FrameworkSection, RegulatoryFramework, RegionGroup } from "./types";

import { US_FRAMEWORKS } from "./americas/us";
import { CA_FRAMEWORKS } from "./americas/canada";
import { BR_FRAMEWORKS } from "./americas/brazil";
import { MX_FRAMEWORKS } from "./americas/mexico";
import { AR_FRAMEWORKS } from "./americas/argentina";
import { CO_FRAMEWORKS } from "./americas/colombia";
import { CL_FRAMEWORKS } from "./americas/chile";

import { EU_FRAMEWORKS } from "./europe/eu";
import { UK_FRAMEWORKS } from "./europe/uk";
import { CH_FRAMEWORKS } from "./europe/switzerland";
import { TR_FRAMEWORKS } from "./europe/turkey";
import { RU_FRAMEWORKS } from "./europe/russia";

import { IN_FRAMEWORKS } from "./asia/india";
import { IN_PMF_FRAMEWORK } from "./asia/india-pmf";
import { CN_FRAMEWORKS } from "./asia/china";
import { JP_FRAMEWORKS } from "./asia/japan";
import { KR_FRAMEWORKS } from "./asia/south-korea";
import { TW_FRAMEWORKS } from "./asia/taiwan";

import { AU_FRAMEWORKS } from "./oceania/australia";
import { NZ_FRAMEWORKS } from "./oceania/new-zealand";

import { SG_FRAMEWORKS } from "./southeast-asia/singapore";
import { TH_FRAMEWORKS } from "./southeast-asia/thailand";
import { ID_FRAMEWORKS } from "./southeast-asia/indonesia";
import { MY_FRAMEWORKS } from "./southeast-asia/malaysia";
import { PH_FRAMEWORKS } from "./southeast-asia/philippines";
import { VN_FRAMEWORKS } from "./southeast-asia/vietnam";
import { ASEAN_FRAMEWORKS } from "./southeast-asia/asean-csdt";

import { SA_FRAMEWORKS } from "./middle-east/saudi-arabia";
import { AE_FRAMEWORKS } from "./middle-east/uae";
import { IL_FRAMEWORKS } from "./middle-east/israel";
import { EG_FRAMEWORKS } from "./middle-east/egypt";

import { ZA_FRAMEWORKS } from "./africa/south-africa";
import { NG_FRAMEWORKS } from "./africa/nigeria";
import { KE_FRAMEWORKS } from "./africa/kenya";

import { PK_FRAMEWORKS } from "./south-asia/pakistan";
import { BD_FRAMEWORKS } from "./south-asia/bangladesh";

import type { FrameworkDeviceType, RegulatoryFramework, RegionGroup } from "./types";

export type { FrameworkDeviceType };

export const FRAMEWORKS: RegulatoryFramework[] = [
  IN_PMF_FRAMEWORK,
  ...IN_FRAMEWORKS,
  ...US_FRAMEWORKS,
  ...EU_FRAMEWORKS,
  ...CN_FRAMEWORKS,
  ...JP_FRAMEWORKS,
  ...KR_FRAMEWORKS,
  ...CA_FRAMEWORKS,
  ...AU_FRAMEWORKS,
  ...UK_FRAMEWORKS,
  ...BR_FRAMEWORKS,
  ...CH_FRAMEWORKS,
  ...SA_FRAMEWORKS,
  ...AE_FRAMEWORKS,
  ...IL_FRAMEWORKS,
  ...SG_FRAMEWORKS,
  ...TW_FRAMEWORKS,
  ...TH_FRAMEWORKS,
  ...MY_FRAMEWORKS,
  ...ID_FRAMEWORKS,
  ...TR_FRAMEWORKS,
  ...RU_FRAMEWORKS,
  ...MX_FRAMEWORKS,
  ...AR_FRAMEWORKS,
  ...CO_FRAMEWORKS,
  ...CL_FRAMEWORKS,
  ...NZ_FRAMEWORKS,
  ...PH_FRAMEWORKS,
  ...VN_FRAMEWORKS,
  ...ASEAN_FRAMEWORKS,
  ...EG_FRAMEWORKS,
  ...ZA_FRAMEWORKS,
  ...NG_FRAMEWORKS,
  ...KE_FRAMEWORKS,
  ...PK_FRAMEWORKS,
  ...BD_FRAMEWORKS,
];

export const REGION_GROUPS: RegionGroup[] = [
  {
    region: "Asia",
    countries: [
      { code: "IN", name: "India", flag: "🇮🇳", frameworkCount: IN_FRAMEWORKS.length + 1 },
      { code: "CN", name: "China", flag: "🇨🇳", frameworkCount: CN_FRAMEWORKS.length },
      { code: "JP", name: "Japan", flag: "🇯🇵", frameworkCount: JP_FRAMEWORKS.length },
      { code: "KR", name: "South Korea", flag: "🇰🇷", frameworkCount: KR_FRAMEWORKS.length },
      { code: "TW", name: "Taiwan", flag: "🇹🇼", frameworkCount: TW_FRAMEWORKS.length },
    ],
  },
  {
    region: "Americas",
    countries: [
      { code: "US", name: "United States", flag: "🇺🇸", frameworkCount: US_FRAMEWORKS.length },
      { code: "CA", name: "Canada", flag: "🇨🇦", frameworkCount: CA_FRAMEWORKS.length },
      { code: "BR", name: "Brazil", flag: "🇧🇷", frameworkCount: BR_FRAMEWORKS.length },
      { code: "MX", name: "Mexico", flag: "🇲🇽", frameworkCount: MX_FRAMEWORKS.length },
      { code: "AR", name: "Argentina", flag: "🇦🇷", frameworkCount: AR_FRAMEWORKS.length },
      { code: "CO", name: "Colombia", flag: "🇨🇴", frameworkCount: CO_FRAMEWORKS.length },
      { code: "CL", name: "Chile", flag: "🇨🇱", frameworkCount: CL_FRAMEWORKS.length },
    ],
  },
  {
    region: "Europe",
    countries: [
      { code: "EU", name: "European Union", flag: "🇪🇺", frameworkCount: EU_FRAMEWORKS.length },
      { code: "GB", name: "United Kingdom", flag: "🇬🇧", frameworkCount: UK_FRAMEWORKS.length },
      { code: "CH", name: "Switzerland", flag: "🇨🇭", frameworkCount: CH_FRAMEWORKS.length },
      { code: "TR", name: "Turkey", flag: "🇹🇷", frameworkCount: TR_FRAMEWORKS.length },
      { code: "RU", name: "Russia", flag: "🇷🇺", frameworkCount: RU_FRAMEWORKS.length },
    ],
  },
  {
    region: "Oceania",
    countries: [
      { code: "AU", name: "Australia", flag: "🇦🇺", frameworkCount: AU_FRAMEWORKS.length },
      { code: "NZ", name: "New Zealand", flag: "🇳🇿", frameworkCount: NZ_FRAMEWORKS.length },
    ],
  },
  {
    region: "Southeast Asia",
    countries: [
      { code: "SG", name: "Singapore", flag: "🇸🇬", frameworkCount: SG_FRAMEWORKS.length },
      { code: "TH", name: "Thailand", flag: "🇹🇭", frameworkCount: TH_FRAMEWORKS.length },
      { code: "MY", name: "Malaysia", flag: "🇲🇾", frameworkCount: MY_FRAMEWORKS.length },
      { code: "ID", name: "Indonesia", flag: "🇮🇩", frameworkCount: ID_FRAMEWORKS.length },
      { code: "PH", name: "Philippines", flag: "🇵🇭", frameworkCount: PH_FRAMEWORKS.length },
      { code: "VN", name: "Vietnam", flag: "🇻🇳", frameworkCount: VN_FRAMEWORKS.length },
      { code: "ASEAN", name: "ASEAN (CSDT)", flag: "🌏", frameworkCount: ASEAN_FRAMEWORKS.length },
    ],
  },
  {
    region: "Middle East",
    countries: [
      { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", frameworkCount: SA_FRAMEWORKS.length },
      { code: "AE", name: "UAE", flag: "🇦🇪", frameworkCount: AE_FRAMEWORKS.length },
      { code: "IL", name: "Israel", flag: "🇮🇱", frameworkCount: IL_FRAMEWORKS.length },
      { code: "EG", name: "Egypt", flag: "🇪🇬", frameworkCount: EG_FRAMEWORKS.length },
    ],
  },
  {
    region: "Africa",
    countries: [
      { code: "ZA", name: "South Africa", flag: "🇿🇦", frameworkCount: ZA_FRAMEWORKS.length },
      { code: "NG", name: "Nigeria", flag: "🇳🇬", frameworkCount: NG_FRAMEWORKS.length },
      { code: "KE", name: "Kenya", flag: "🇰🇪", frameworkCount: KE_FRAMEWORKS.length },
    ],
  },
  {
    region: "South Asia",
    countries: [
      { code: "PK", name: "Pakistan", flag: "🇵🇰", frameworkCount: PK_FRAMEWORKS.length },
      { code: "BD", name: "Bangladesh", flag: "🇧🇩", frameworkCount: BD_FRAMEWORKS.length },
    ],
  },
];

export function getFramework(id: string) {
  return FRAMEWORKS.find((f) => f.id === id);
}

export function getFrameworksByCountry(countryCode: string) {
  return FRAMEWORKS.filter((f) => f.countryCode === countryCode);
}

/** Resolve IVD vs medical-device when framework has no explicit deviceType tag */
function inferFrameworkDeviceType(fw: RegulatoryFramework): FrameworkDeviceType | "both" {
  if (fw.deviceType) return fw.deviceType;

  const id = fw.id.toUpperCase();
  const doc = fw.documentType.toLowerCase();

  if (
    id.includes("IVDR") ||
    /_IVD$/.test(id) ||
    id.endsWith("_IVD") ||
    doc.includes("(ivd)") ||
    doc.includes("ivd registration") ||
    (doc.includes("ivd") && !doc.includes("medical device"))
  ) {
    return "ivd";
  }

  if (
    id.includes("_MDR") ||
    id === "IN_DMF_MD" ||
    doc.includes("(medical device)") ||
    doc.includes("medical device registration")
  ) {
    return "medical-device";
  }

  return "both";
}

export function frameworkMatchesDeviceType(
  fw: RegulatoryFramework,
  productDeviceType: FrameworkDeviceType,
): boolean {
  const category = inferFrameworkDeviceType(fw);
  if (category === "both") return productDeviceType === "medical-device";
  return category === productDeviceType;
}

export function filterFrameworksByDeviceType(
  frameworks: RegulatoryFramework[],
  productDeviceType: FrameworkDeviceType,
): RegulatoryFramework[] {
  return frameworks.filter((fw) => frameworkMatchesDeviceType(fw, productDeviceType));
}

export function getAllCountryCodes(): string[] {
  return [...new Set(FRAMEWORKS.map((f) => f.countryCode))];
}

export function getTotalFieldCount(frameworkId: string): number {
  const fw = getFramework(frameworkId);
  if (!fw) return 0;
  return fw.sections.reduce((sum, s) => sum + s.fields.length, 0);
}
