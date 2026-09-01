export interface DocumentSuggestionLink {
  label: string;
  url: string;
}

export interface DocumentSuggestionRule {
  id: string;
  name: string;
  keywords: string[];
  requiredSourceContexts: string[]; // If empty, applies to all forms
  links?: DocumentSuggestionLink[];
}

export const SUGGESTION_RULES: DocumentSuggestionRule[] = [
  {
    id: "fee-challan",
    name: "Bharatkosh Fee Receipt / Challan",
    keywords: ["fee", "bharatkosh", "challan"],
    requiredSourceContexts: [], // Applies to any form needing a fee
    links: [
      { label: "Receipt Example", url: "https://bharatkosh.gov.in/Static/Template/UserguideBharatkosh.pdf#page=15" },
      { label: "Challan Example", url: "https://bharatkosh.gov.in/Static/Template/UserguideBharatkosh.pdf#page=17" },
      { label: "User Manual", url: "https://cdscoonline.gov.in/CDSCO/resources/app_srv/cdsco/global/Online_Payment_User_Manual_v1.0.pdf" }
    ]
  },
  {
    id: "ethics-committee",
    name: "Ethics Committee Approval Letter",
    keywords: ["ethics"],
    requiredSourceContexts: ["LEGAL", "CLINICAL"],
    links: [
      { label: "ICMR Guidelines", url: "https://ethics.ncdirindia.org/asset/pdf/ICMR_National_Ethical_Guidelines.pdf" },
      { label: "EC Registration (CDSCO)", url: "https://cdsco.gov.in/opencms/opencms/en/Clinical-Trial/Ethics-Committee/" }
    ]
  },
  {
    id: "sponsor-agreement",
    name: "The agreement between the Sponsor and Principal investigator",
    keywords: ["sponsor", "contact", "email", "fax"],
    requiredSourceContexts: ["LEGAL", "CLINICAL"],
    links: [
      { label: "Clinical Trial Agreement Guide", url: "https://www.paho.org/en/documents/regional-template-clinical-trial-agreement" }
    ]
  },
  {
    id: "biocompatibility",
    name: "Biocompatibility and Animal performance study data / Ex vivo tests",
    keywords: ["biocompatibility", "animal", "performance"],
    requiredSourceContexts: ["DMF"],
    links: [
      { label: "ISO 10993 Guidelines", url: "https://www.iso.org/obp/ui/#iso:std:iso:10993:-1:ed-5:v1:en" }
    ]
  },
  {
    id: "design-analysis",
    name: "Design analysis data (Mechanical, electrical, reliability, and software validation tests)",
    keywords: ["design", "mechanical", "electrical", "reliability"],
    requiredSourceContexts: ["DMF"],
    links: [
      { label: "IEC 60601-1 (Electrical Safety)", url: "https://www.iso.org/standard/65529.html" },
      { label: "IEC 62304 (Software)", url: "https://www.iso.org/standard/38421.html" }
    ]
  },
  {
    id: "risk-analysis",
    name: "Results of the risk analysis",
    keywords: ["risk"],
    requiredSourceContexts: ["DMF"],
    links: [
      { label: "ISO 14971 Risk Management", url: "https://www.iso.org/standard/72704.html" }
    ]
  },
  {
    id: "clinical-investigation-plan",
    name: "Clinical Investigation Plan (CIP) / Investigator Brochure (IB)",
    keywords: ["cip", "ib", "study"],
    requiredSourceContexts: ["CLINICAL"],
    links: [
      { label: "ISO 14155:2020 CIP Structure", url: "https://www.iso.org/obp/ui/#iso:std:iso:14155:ed-3:v1:en" },
      { label: "Investigator Brochure (WHO)", url: "https://cdn.who.int/media/docs/default-source/medicines/norms-and-standards/guidelines/regulatory-standards/trs850-annex3.pdf" }
    ]
  },
  {
    id: "qms-iso",
    name: "ISO Certificate or Quality Management System (QMS) documents",
    keywords: ["iso", "qms"],
    requiredSourceContexts: ["PMF", "QMS"],
    links: [
      { label: "ISO 13485 (Medical Devices)", url: "https://www.iso.org/standard/59752.html" },
      { label: "CDSCO QMS Guidelines", url: "https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Diagnostics/" }
    ]
  },
  {
    id: "site-master-file",
    name: "Site Master File (SMF) or Plant Master File",
    keywords: ["site", "plant"],
    requiredSourceContexts: ["PMF", "QMS"],
    links: [
      { label: "WHO SMF Guidelines", url: "https://cdn.who.int/media/docs/default-source/medicines/norms-and-standards/guidelines/production/trs961-annex14-who-gmp-sitemasterfile.pdf" }
    ]
  }
];
