import type { RegulatoryFramework } from "@/lib/frameworks/types";
import {
  buildValidFieldIdSets,
  parseSectionFieldKey,
} from "@/lib/documentSections";

type ProductLike = {
  name?: string;
  manufacturer?: string;
  description?: string;
  intendedUse?: string;
  patientPopulation?: string;
  deviceClass?: string;
  deviceType?: string;
  predDevice?: {
    predicateExists?: boolean | null;
    predicateName?: string;
    predicateManufacturer?: string;
    predicateRegNo?: string;
    predicateBasis?: string;
    predicateClass?: string;
  };
};

/** Keys are "sectionId.fieldId" for RegulatoryDocument.sections */
export function getProductDmfPrefill(
  frameworkId: string,
  product: ProductLike,
): Record<string, string> {
  const out: Record<string, string> = {};
  const pred = product.predDevice;
  const intendedUse = (product.intendedUse || "").trim();
  const description = (product.description || "").trim();
  const name = (product.name || "").trim();
  const manufacturer = (product.manufacturer || "").trim();
  const deviceClass = (product.deviceClass || "").trim();
  const patientPopulation = (product.patientPopulation || "").trim();

  const set = (sectionId: string, fieldId: string, value: string) => {
    const v = value.trim();
    if (v) out[`${sectionId}.${fieldId}`] = v;
  };

  const predicateComparison = formatPredicateComparison(product, pred);
  const regulatoryStatusIndia = formatRegulatoryStatusIndia(pred);
  const disorderConditionIvD = formatDisorderConditionIvD(product);
  const novelFeatures = formatNovelFeatures(product, pred);

  if (frameworkId === "IN_DMF") {
    set("s1", "1.1a", name);
    set("s1", "1.1b", description);
    set("s1", "1.1c", novelFeatures);
    set("s1", "1.1e", deviceClass ? `Class ${deviceClass}` : "");
    set("s1", "1.2", regulatoryStatusIndia);
    set("s2", "2.0", intendedUse);
    set("s2", "2.1a", inferWhatIsDetected(product));
    set("s2", "2.1c", disorderConditionIvD);
    set("s2", "2.1g", patientPopulation);
    set("s2", "2.4", predicateComparison);
    return out;
  }

  if (frameworkId === "IN_DMF_MD") {
    set("s1", "1.1a", name);
    set("s1", "1.1b", description);
    set("s1", "1.1c", novelFeatures);
    set("s1", "1.1e", deviceClass ? `Class ${deviceClass}` : "");
    set("s1", "1.2", regulatoryStatusIndia);
    set("s2", "2.2", intendedUse);
    set("s2", "2.13", predicateComparison);
    return out;
  }

  return out;
}

/** §1.2 — approved on CDSCO predicate list vs new device (from Phase 1 predDevice). */
function formatRegulatoryStatusIndia(
  pred: ProductLike["predDevice"] | undefined,
): string {
  if (pred?.predicateExists === true) {
    const name = pred.predicateName?.trim();
    return name
      ? `Yes — approved. Predicate device on CDSCO list: ${name}`
      : "Yes — approved (predicate device on CDSCO list; see predicate section)";
  }
  if (pred?.predicateExists === false) {
    return "New device (not approved in India; no CDSCO-listed predicate)";
  }
  return "";
}

/**
 * §1.1c — features distinguishing subject device from predicate / prior art.
 * Uses predDevice.predicateBasis (CDSCO match rationale) + subject vs predicate deltas.
 */
function formatNovelFeatures(
  product: ProductLike,
  pred: ProductLike["predDevice"] | undefined,
): string {
  const subjectName = (product.name || "").trim();
  const description = (product.description || "").trim();

  if (pred?.predicateExists === false) {
    const lines = [
      "Novel device — no CDSCO-listed predicate (Phase 1 novel pathway).",
      description ? `Distinctive design / technology: ${description}` : "",
      pred.predicateBasis?.trim() ? `Pathway notes: ${pred.predicateBasis.trim()}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }

  if (pred?.predicateExists !== true) return "";

  const predName = (pred.predicateName || "").trim();
  const diffs = listDifferences(product, pred);
  const lines: string[] = [
    predName
      ? `Features distinguishing ${subjectName || "this device"} from CDSCO predicate "${predName}":`
      : "Features distinguishing subject device from selected predicate:",
    ...diffs.map((d) => `• ${d}`),
  ];

  if (description) {
    lines.push(`• Subject device technology / formulation: ${description}`);
  }

  if (pred.predicateBasis?.trim()) {
    lines.push(
      "",
      "Predicate selection rationale (Phase 1 — features assessed for equivalence vs distinction):",
      pred.predicateBasis.trim(),
    );
  }

  return lines.join("\n");
}

/** §2.1c — clinical disorder/condition, not the full intended-use statement (field 2.0). */
function formatDisorderConditionIvD(product: ProductLike): string {
  const desc = (product.description || "").trim();
  const name = (product.name || "").trim();
  const blob = `${name} ${desc}`;

  if (/albumin/i.test(blob)) {
    return (
      "Clinical conditions associated with abnormal serum albumin concentrations " +
      "(e.g. hepatic disease, nephrotic syndrome, malnutrition), where quantitative albumin measurement is indicated."
    );
  }

  const det = desc.match(
    /(?:determination|detection|measurement|quantification)\s+of\s+([^,.;]+)/i,
  );
  if (det) {
    const analyte = det[1].trim();
    return `Disorders and clinical situations requiring laboratory assessment of ${analyte}.`;
  }

  return "";
}

function inferWhatIsDetected(product: ProductLike): string {
  const desc = (product.description || "").trim();
  const name = (product.name || "").trim();
  const det = desc.match(
    /(?:determination|detection|measurement|quantification)\s+of\s+([^,.;]+)/i,
  );
  if (det) {
    const raw = det[1].trim();
    const analyte = raw.split(/\s+using\s+/i)[0]?.trim() || raw;
    return analyte;
  }
  if (/albumin/i.test(name)) return "Albumin (human serum)";
  return "";
}

function shortenManufacturer(value: string, maxLen = 120): string {
  const line = value.replace(/\s+/g, " ").trim();
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen)}…`;
}

function comparisonRow(
  aspect: string,
  subject: string,
  predicate: string,
  assessment: string,
): string {
  return `${aspect} | Subject (registered): ${subject || "—"} | Predicate (CDSCO): ${predicate || "—"} | ${assessment}`;
}

/** §2.4 / §2.13 — subject vs predicate substantial-equivalence comparison from Product + predDevice. */
function formatPredicateComparison(
  product: ProductLike,
  pred: ProductLike["predDevice"] | undefined,
): string {
  if (!pred || pred.predicateExists === null || pred.predicateExists === undefined) {
    return "";
  }

  if (pred.predicateExists === false) {
    return [
      "No predicate device — novel device pathway (Phase 1 registration).",
      "Subject device is not compared to a CDSCO-listed predicate.",
      pred.predicateBasis?.trim() ? `Pathway notes: ${pred.predicateBasis.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const subjectName = (product.name || "").trim();
  const subjectMfg = shortenManufacturer((product.manufacturer || "").trim());
  const subjectClass = (product.deviceClass || "").trim();
  const subjectUse = (product.intendedUse || "").trim();
  const subjectDesc = (product.description || "").trim();
  const subjectAnalyte = inferWhatIsDetected(product);
  const subjectSpecimen = (product.patientPopulation || "").trim() || "Per intended use";

  const predName = (pred.predicateName || "").trim();
  const predMfg = shortenManufacturer((pred.predicateManufacturer || "").trim());
  const predClass = (pred.predicateClass || "").trim();
  const predReg = (pred.predicateRegNo || "").trim();
  const predBasis = (pred.predicateBasis || "").trim();

  const rows: string[] = [
    comparisonRow(
      "Trade / product name",
      subjectName,
      predName,
      namesSimilar(subjectName, predName) ? "Similar (same analyte product family)" : "Different branding",
    ),
    comparisonRow(
      "Manufacturer",
      subjectMfg,
      predMfg,
      manufacturersSimilar(subjectMfg, predMfg) ? "Same or related legal entity" : "Different manufacturer",
    ),
    comparisonRow(
      "Intended use / clinical purpose",
      preview(subjectUse, 200),
      predBasis ? preview(predBasis, 120) : "Quantitative IVD for same clinical purpose as predicate",
      intendedUseSimilar(subjectUse, predName, predBasis) ? "Similar intended use" : "Review intended-use alignment",
    ),
    comparisonRow(
      "Analyte / what is detected",
      subjectAnalyte || preview(subjectDesc, 80),
      inferPredicateAnalyte(predName, predBasis),
      analyteSimilar(subjectAnalyte, predName) ? "Same analyte" : "Confirm analyte equivalence in dossier",
    ),
    comparisonRow(
      "Specimen / population",
      subjectSpecimen,
      "Human serum (typical for predicate IVD)",
      "Similar",
    ),
    comparisonRow(
      "Risk class (India MDR)",
      subjectClass ? `Class ${subjectClass}` : "—",
      predClass ? `Class ${predClass}` : "—",
      subjectClass && predClass && subjectClass !== predClass
        ? "Different class — provide classification justification"
        : "Same or aligned class",
    ),
    comparisonRow(
      "Technology / principle (summary)",
      preview(subjectDesc, 160),
      "Per predicate IFU / CDSCO listing (see predicate dossier)",
      "Same general IVD principle expected; confirm with bridging studies if design differs",
    ),
  ];

  if (predReg) {
    rows.push(`Predicate CDSCO licence / registration: ${predReg}`);
  }

  const differences = listDifferences(product, pred);
  const similarities = listSimilarities(product, pred);

  return [
    "SUBJECT DEVICE (this product — registered in Products collection)",
    `Name: ${subjectName || "—"}`,
    `Manufacturer: ${subjectMfg || "—"}`,
    `Risk class: ${subjectClass ? `Class ${subjectClass}` : "—"}`,
    `Intended use: ${subjectUse || "—"}`,
    `Description: ${subjectDesc || "—"}`,
    "",
    "PREDICATE DEVICE (CDSCO approved reference — predDevice)",
    `Name: ${predName || "—"}`,
    `Manufacturer: ${predMfg || "—"}`,
    `Risk class: ${predClass ? `Class ${predClass}` : "—"}`,
    predReg ? `Registration: ${predReg}` : "",
    "",
    "SIDE-BY-SIDE COMPARISON",
    ...rows,
    "",
    "SIMILARITIES",
    ...similarities.map((s) => `• ${s}`),
    "",
    "DIFFERENCES",
    ...differences.map((d) => `• ${d}`),
    "",
    predBasis ? `SUBSTANTIAL EQUIVALENCE STATEMENT (Phase 1 — predicateBasis):\n${predBasis}` : "",
    "",
    "CONCLUSION",
    buildEquivalenceConclusion(product, pred, differences.length === 0),
  ]
    .filter(Boolean)
    .join("\n");
}

function preview(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function namesSimilar(subject: string, predicate: string): boolean {
  if (!subject || !predicate) return false;
  const s = subject.toLowerCase();
  const p = predicate.toLowerCase();
  if (s === p) return true;
  const words = ["albumin", "hiv", "hbv", "glucose", "troponin"];
  return words.some((w) => s.includes(w) && p.includes(w));
}

function manufacturersSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  return na.includes(nb.slice(0, 12)) || nb.includes(na.slice(0, 12));
}

function intendedUseSimilar(subjectUse: string, predName: string, predBasis: string): boolean {
  const blob = `${subjectUse} ${predName} ${predBasis}`.toLowerCase();
  if (/albumin/.test(subjectUse.toLowerCase()) && /albumin/.test(blob)) return true;
  return predBasis.length > 20;
}

function inferPredicateAnalyte(predName: string, predBasis: string): string {
  if (/albumin/i.test(predName)) return "Albumin (human serum)";
  const m = predBasis.match(/determination of\s+([^,.;]+)/i);
  return m ? m[1].trim() : predName || "—";
}

function analyteSimilar(subjectAnalyte: string, predName: string): boolean {
  if (!subjectAnalyte || !predName) return false;
  const s = subjectAnalyte.toLowerCase();
  const p = predName.toLowerCase();
  return s.split(/\s+/).some((w) => w.length > 4 && p.includes(w));
}

function listSimilarities(product: ProductLike, pred: ProductLike["predDevice"]): string[] {
  const out: string[] = [];
  const analyte = inferWhatIsDetected(product);
  if (analyte && pred?.predicateName && analyteSimilar(analyte, pred.predicateName)) {
    out.push(`Same analyte / clinical target (${analyte}).`);
  }
  if ((product.intendedUse || "").trim()) {
    out.push("Subject intended use aligns with predicate clinical purpose (see Phase 1 predicate selection).");
  }
  const population = (product.patientPopulation || "").trim();
  if (population) {
    out.push(`Specimen / population: ${population}.`);
  }
  if (pred?.predicateBasis?.trim()) {
    out.push(`Phase 1 equivalence rationale: ${pred.predicateBasis.trim()}`);
  }
  if (out.length === 0) out.push("Subject and predicate selected under substantial-equivalence pathway in Phase 1.");
  return out;
}

function listDifferences(product: ProductLike, pred: ProductLike["predDevice"]): string[] {
  const out: string[] = [];
  const subjectName = (product.name || "").trim();
  const predName = (pred?.predicateName || "").trim();
  if (subjectName && predName && subjectName !== predName) {
    out.push(`Trade name: subject "${subjectName}" vs predicate "${predName}".`);
  }
  const subjectMfg = (product.manufacturer || "").trim();
  const predMfg = (pred?.predicateManufacturer || "").trim();
  if (subjectMfg && predMfg && !manufacturersSimilar(subjectMfg, predMfg)) {
    out.push(`Legal manufacturer differs: subject "${shortenManufacturer(subjectMfg, 60)}" vs predicate "${shortenManufacturer(predMfg, 60)}".`);
  }
  const sc = (product.deviceClass || "").trim();
  const pc = (pred?.predicateClass || "").trim();
  if (sc && pc && sc !== pc) {
    out.push(`India risk class: subject Class ${sc} vs predicate Class ${pc} — include classification justification.`);
  }
  const desc = (product.description || "").trim();
  if (desc) {
    out.push(`Subject-specific design / formulation details (e.g. reagent chemistry, packaging) as described in subject device description — confirm sameness or justify differences with data.`);
  }
  if (out.length === 0) out.push("No material differences identified from Phase 1 registration data; confirm with technical comparison to predicate IFU.");
  return out;
}

function buildEquivalenceConclusion(
  product: ProductLike,
  pred: ProductLike["predDevice"],
  noMaterialDiffs: boolean,
): string {
  const subject = (product.name || "").trim() || "Subject device";
  const predicate = (pred?.predicateName || "").trim() || "predicate device";
  if (pred?.predicateBasis?.trim()) {
    return (
      `${subject} is submitted as substantially equivalent to the CDSCO-listed predicate "${predicate}". ` +
      `${pred.predicateBasis.trim()} ` +
      (noMaterialDiffs
        ? "Differences are limited to naming/manufacturer presentation where applicable; clinical performance and intended use remain aligned."
        : "Identified differences above should be supported with analytical and, where required, clinical bridging data.")
    );
  }
  return (
    `${subject} is proposed as substantially equivalent to "${predicate}" per Phase 1 predicate pathway. ` +
    "Complete analytical comparison and predicate IFU cross-reference in the full dossier."
  );
}

export function buildProductContextForDmfAutofill(product: ProductLike): string {
  const pred = product.predDevice;
  const lines = [
    "--- Registered product (Phase 1 — use for DMF fields) ---",
    product.name ? `Product name: ${product.name}` : "",
    product.manufacturer ? `Manufacturer: ${product.manufacturer}` : "",
    product.deviceType ? `Device type: ${product.deviceType}` : "",
    product.deviceClass ? `Risk class: Class ${product.deviceClass}` : "",
    product.intendedUse ? `Intended use / claims: ${product.intendedUse}` : "",
    product.description ? `Description: ${product.description}` : "",
    product.patientPopulation ? `Patient population: ${product.patientPopulation}` : "",
    pred?.predicateExists != null
      ? `Predicate exists: ${pred.predicateExists ? "Yes" : "No (novel pathway)"}`
      : "",
    formatRegulatoryStatusIndia(pred)
      ? `Regulatory status in India (field 1.2): ${formatRegulatoryStatusIndia(pred)}`
      : "",
    (() => {
      const block = formatPredicateComparison(product, pred);
      return block ? `Predicate comparison (field 2.4):\n${preview(block, 1500)}` : "";
    })(),
  ].filter(Boolean);

  return lines.join("\n");
}

export function applyPrefillToSections(
  sections: Record<string, { fields: Record<string, string>; completionPct: number }>,
  framework: RegulatoryFramework,
  prefill: Record<string, string>,
): number {
  let count = 0;

  const validBySection = buildValidFieldIdSets(framework);

  for (const [key, value] of Object.entries(prefill)) {
    const parsed = parseSectionFieldKey(key, validBySection);
    if (!parsed || !value.trim()) continue;
    const { sectionId, fieldId } = parsed;

    if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
    const fields = { ...sections[sectionId].fields };

    if (!fields[fieldId]?.trim()) {
      fields[fieldId] = value;
      count++;
    }
    sections[sectionId].fields = fields;

    const fwSection = framework.sections.find((s) => s.id === sectionId);
    if (fwSection) {
      const filled = fwSection.fields.filter((f) => fields[f.id]?.trim()).length;
      sections[sectionId].completionPct = Math.round((filled / fwSection.fields.length) * 100);
    }
  }

  return count;
}
