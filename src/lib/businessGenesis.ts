/** Phase 0 — Business Genesis (MDR flowchart steps 0.1–0.9) */

export type RegStatus = "pending" | "in-progress" | "complete";

export type RegBlock = {
  status: RegStatus;
  number?: string;
  documentUrl: string;
};

export type BankSignatory = {
  name: string;
  designation: string;
};

export type BusinessGenesisData = {
  secA: {
    gst: RegBlock;
    msme: RegBlock;
    iec: RegBlock;
    shopEstablishment: RegBlock;
    professionalTax: RegBlock;
    esicEpfo: RegBlock;
  };
  secB: {
    legalEntityExists: boolean | null;
    entityType: "" | "pvt-ltd" | "llp" | "opc" | "partnership" | "sole-prop";
    runNameApproval: boolean;
    dscDinObtained: boolean;
    moaAoaDrafted: boolean;
    moaIncludesMedicalDeviceObject: boolean;
    spicePlusFiled: boolean;
    cin: string;
    pan: string;
    tan: string;
    incorporationDate: string;
    incorporationDocUrl: string;
  };
  secC: {
    bankAccountOpened: boolean;
    bankName: string;
    accountNumber: string;
    adCodeObtained: boolean;
    signatories: BankSignatory[];
  };
  secD: {
    trademarkStatus: "" | "not-filed" | "filed" | "registered";
    trademarkNumber: string;
    trademarkDocUrl: string;
    domainRegistered: boolean;
    domainName: string;
    patentFiled: boolean;
    designFiled: boolean;
    ndaTemplateUrl: string;
  };
  secE: {
    tamAnalysisDone: boolean;
    reimbursementLandscapeDone: boolean;
    reimbursementNotes: string;
    competitorScanDone: boolean;
    patentLandscapeDone: boolean;
    patentLandscapeNotes: string;
    pathwayIndia: boolean;
    pathwayCE: boolean;
    pathwayFDA: boolean;
    regulatoryPathwayChosen: boolean;
    pathwayNotes: string;
    targetCountries: string[];
    trademarkPlanningDone: boolean;
  };
  overallCompletionPct?: number;
  phase0Complete?: boolean;
};

const defaultReg = (): RegBlock => ({ status: "pending", number: "", documentUrl: "" });

export function defaultBusinessGenesis(): BusinessGenesisData {
  return {
    secA: {
      gst: defaultReg(),
      msme: defaultReg(),
      iec: defaultReg(),
      shopEstablishment: { status: "pending", documentUrl: "" },
      professionalTax: { status: "pending", documentUrl: "" },
      esicEpfo: { status: "pending", documentUrl: "" },
    },
    secB: {
      legalEntityExists: null,
      entityType: "",
      runNameApproval: false,
      dscDinObtained: false,
      moaAoaDrafted: false,
      moaIncludesMedicalDeviceObject: false,
      spicePlusFiled: false,
      cin: "",
      pan: "",
      tan: "",
      incorporationDate: "",
      incorporationDocUrl: "",
    },
    secC: {
      bankAccountOpened: false,
      bankName: "",
      accountNumber: "",
      adCodeObtained: false,
      signatories: [{ name: "", designation: "" }],
    },
    secD: {
      trademarkStatus: "",
      trademarkNumber: "",
      trademarkDocUrl: "",
      domainRegistered: false,
      domainName: "",
      patentFiled: false,
      designFiled: false,
      ndaTemplateUrl: "",
    },
    secE: {
      tamAnalysisDone: false,
      reimbursementLandscapeDone: false,
      reimbursementNotes: "",
      competitorScanDone: false,
      patentLandscapeDone: false,
      patentLandscapeNotes: "",
      pathwayIndia: true,
      pathwayCE: false,
      pathwayFDA: false,
      regulatoryPathwayChosen: false,
      pathwayNotes: "",
      targetCountries: ["IN"],
      trademarkPlanningDone: false,
    },
  };
}

function mergeReg(existing: Partial<RegBlock> | undefined, withNumber: boolean): RegBlock {
  const base = defaultReg();
  if (!existing) return base;
  return {
    status: (existing.status as RegStatus) || base.status,
    ...(withNumber ? { number: existing.number ?? "" } : {}),
    documentUrl: existing.documentUrl ?? "",
  };
}

export function buildInitialBusinessGenesis(initialData?: Record<string, unknown>): BusinessGenesisData {
  const d = defaultBusinessGenesis();
  if (!initialData) return d;

  const secA = (initialData.secA ?? {}) as BusinessGenesisData["secA"];
  const secB = (initialData.secB ?? {}) as Record<string, unknown>;
  const secC = (initialData.secC ?? {}) as Record<string, unknown>;
  const secD = (initialData.secD ?? {}) as Record<string, unknown>;
  const secE = (initialData.secE ?? {}) as Record<string, unknown>;

  const incDate = secB.incorporationDate;
  let incorporationDate = "";
  if (incDate) {
    incorporationDate = new Date(incDate as string).toISOString().slice(0, 10);
  }

  const signatories =
    Array.isArray(secC.signatories) && secC.signatories.length > 0
      ? (secC.signatories as Array<{ name?: string; designation?: string }>).map((s) => ({
          name: String(s.name ?? ""),
          designation: String(s.designation ?? ""),
        }))
      : d.secC.signatories;

  return {
    secA: {
      gst: mergeReg(secA.gst, true),
      msme: mergeReg(secA.msme, true),
      iec: mergeReg(secA.iec, true),
      shopEstablishment: mergeReg(secA.shopEstablishment, false),
      professionalTax: mergeReg(secA.professionalTax, false),
      esicEpfo: mergeReg(secA.esicEpfo, false),
    },
    secB: {
      ...d.secB,
      legalEntityExists:
        secB.legalEntityExists === true ? true : secB.legalEntityExists === false ? false : null,
      entityType: (secB.entityType as BusinessGenesisData["secB"]["entityType"]) || "",
      runNameApproval: !!secB.runNameApproval,
      dscDinObtained: !!secB.dscDinObtained,
      moaAoaDrafted: !!secB.moaAoaDrafted,
      moaIncludesMedicalDeviceObject: !!secB.moaIncludesMedicalDeviceObject,
      spicePlusFiled: !!secB.spicePlusFiled,
      cin: (secB.cin as string) || "",
      pan: (secB.pan as string) || "",
      tan: (secB.tan as string) || "",
      incorporationDate,
      incorporationDocUrl: (secB.incorporationDocUrl as string) || "",
    },
    secC: {
      bankAccountOpened: !!secC.bankAccountOpened,
      bankName: (secC.bankName as string) || "",
      accountNumber: (secC.accountNumber as string) || "",
      adCodeObtained: !!secC.adCodeObtained,
      signatories,
    },
    secD: {
      trademarkStatus: (secD.trademarkStatus as BusinessGenesisData["secD"]["trademarkStatus"]) || "",
      trademarkNumber: (secD.trademarkNumber as string) || "",
      trademarkDocUrl: (secD.trademarkDocUrl as string) || "",
      domainRegistered: !!secD.domainRegistered,
      domainName: (secD.domainName as string) || "",
      patentFiled: !!secD.patentFiled,
      designFiled: !!secD.designFiled,
      ndaTemplateUrl: (secD.ndaTemplateUrl as string) || "",
    },
    secE: {
      tamAnalysisDone: !!secE.tamAnalysisDone,
      reimbursementLandscapeDone: !!secE.reimbursementLandscapeDone,
      reimbursementNotes: (secE.reimbursementNotes as string) || "",
      competitorScanDone: !!secE.competitorScanDone,
      patentLandscapeDone: !!secE.patentLandscapeDone,
      patentLandscapeNotes: (secE.patentLandscapeNotes as string) || "",
      pathwayIndia: true,
      pathwayCE: false,
      pathwayFDA: false,
      regulatoryPathwayChosen: !!secE.regulatoryPathwayChosen,
      pathwayNotes: (secE.pathwayNotes as string) || "",
      targetCountries: ["IN"],
      trademarkPlanningDone: !!(secE.trademarkPlanningDone ?? secD.trademarkStatus),
    },
  };
}

/** Normalize legacy/partial MongoDB documents before reading fields */
export function normalizeBusinessGenesis(
  data?: Partial<BusinessGenesisData> | Record<string, unknown> | null,
): BusinessGenesisData {
  if (!data || typeof data !== "object") {
    return defaultBusinessGenesis();
  }
  return buildInitialBusinessGenesis(data as Record<string, unknown>);
}

/** Weighted completion aligned to flowchart steps 0.1–0.9 */
export function computePhase0Completion(
  data?: Partial<BusinessGenesisData> | Record<string, unknown> | null,
): number {
  const normalized = normalizeBusinessGenesis(data);
  const weights: { weight: number; done: boolean }[] = [];
  const { secE: e, secB: b, secC: c, secA: a, secD: d } = normalized;

  // 0.1 Business need
  weights.push({ weight: 2, done: e.tamAnalysisDone });
  weights.push({ weight: 2, done: e.reimbursementLandscapeDone });

  // 0.2 Competitor + patent
  weights.push({ weight: 2, done: e.competitorScanDone });
  weights.push({ weight: 2, done: e.patentLandscapeDone });

  // 0.3 Regulatory pathway
  weights.push({ weight: 2, done: e.pathwayIndia || e.pathwayCE || e.pathwayFDA });
  weights.push({ weight: 2, done: e.targetCountries.length > 0 });
  weights.push({ weight: 2, done: e.regulatoryPathwayChosen });
  weights.push({ weight: 1, done: e.trademarkPlanningDone });

  // 0.4 Entity decision
  weights.push({ weight: 2, done: b.legalEntityExists !== null });

  if (b.legalEntityExists === false) {
    weights.push({ weight: 2, done: !!b.entityType });
    weights.push({ weight: 1, done: b.runNameApproval });
    weights.push({ weight: 1, done: b.dscDinObtained });
    weights.push({ weight: 1, done: b.moaAoaDrafted });
    weights.push({ weight: 2, done: b.moaIncludesMedicalDeviceObject });
    weights.push({ weight: 1, done: b.spicePlusFiled });
    weights.push({ weight: 2, done: !!b.cin && !!b.pan });
    weights.push({ weight: 1, done: !!b.incorporationDate });
    weights.push({ weight: 1, done: !!b.incorporationDocUrl });
  } else if (b.legalEntityExists === true) {
    weights.push({ weight: 3, done: !!b.entityType || !!b.cin });
  }

  // 0.7 Bank
  weights.push({ weight: 2, done: c.bankAccountOpened });
  weights.push({ weight: 1, done: !!c.bankName });
  weights.push({ weight: 2, done: c.adCodeObtained });
  weights.push({
    weight: 1,
    done: c.signatories.some((s) => s.name.trim().length > 0 && s.designation.trim().length > 0),
  });

  // 0.8 Statutory (core import trio weighted higher)
  weights.push({ weight: 3, done: a.gst.status === "complete" });
  weights.push({ weight: 2, done: a.msme.status === "complete" });
  weights.push({ weight: 3, done: a.iec.status === "complete" });
  weights.push({ weight: 1, done: a.shopEstablishment.status === "complete" });
  weights.push({ weight: 1, done: a.professionalTax.status === "complete" });

  // 0.9 IP
  weights.push({ weight: 1, done: !!d.trademarkStatus });
  if (d.trademarkStatus === "filed" || d.trademarkStatus === "registered") {
    weights.push({ weight: 2, done: !!d.trademarkDocUrl });
  }
  weights.push({ weight: 1, done: d.domainRegistered });
  weights.push({ weight: 1, done: !!d.ndaTemplateUrl });

  const total = weights.reduce((s, w) => s + w.weight, 0);
  const earned = weights.filter((w) => w.done).reduce((s, w) => s + w.weight, 0);
  return Math.min(100, Math.round((earned / total) * 100));
}

export function isPhase0Complete(
  data?: Partial<BusinessGenesisData> | Record<string, unknown> | null,
): boolean {
  return computePhase0Completion(data) >= 85;
}

/** Phase 0 / product registration: India-only until multi-market launch */
export const INDIA_ONLY_NOTICE =
  "India is pre-selected and required for MDR 2017 / CDSCO. Other markets can be enabled when you expand internationally.";

export function enforceIndiaOnlySecE(secE: BusinessGenesisData["secE"]): BusinessGenesisData["secE"] {
  return {
    ...secE,
    pathwayIndia: true,
    pathwayCE: false,
    pathwayFDA: false,
    targetCountries: ["IN"],
  };
}

export const REGULATORY_PATHWAY_OPTIONS = [
  { id: "pathwayIndia", label: "India MDR 2017 / CDSCO", indiaOnly: true },
  { id: "pathwayCE", label: "EU MDR / IVDR (CE)", indiaOnly: false },
  { id: "pathwayFDA", label: "US FDA", indiaOnly: false },
] as const;

export const PATHWAY_MARKET_OPTIONS = [
  { code: "IN", label: "India (MDR 2017 / CDSCO)", indiaOnly: true },
  { code: "EU", label: "European Union (MDR / IVDR)", indiaOnly: false },
  { code: "US", label: "United States (FDA)", indiaOnly: false },
  { code: "UK", label: "United Kingdom (UKCA)", indiaOnly: false },
  { code: "AU", label: "Australia (TGA)", indiaOnly: false },
  { code: "SG", label: "Singapore (HSA)", indiaOnly: false },
  { code: "OTHER", label: "Other markets (ASEAN, GCC, etc.)", indiaOnly: false },
] as const;
