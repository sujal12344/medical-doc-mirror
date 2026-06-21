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
};

/** Keys are "sectionId.fieldId" for RegulatoryDocument.sections */
export function getProductPmfPrefill(
  frameworkId: string,
  product: ProductLike,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (frameworkId !== "IN_PMF") return out;

  const name = (product.name || "").trim();
  const manufacturer = (product.manufacturer || "").trim();
  const description = (product.description || "").trim();

  console.log("[pmf-prefill] ── PMF INPUT ────────────────────────────");
  console.log("[pmf-prefill] product.name :", name || "(empty)");
  console.log("[pmf-prefill] manufacturer :", manufacturer || "(empty)");
  console.log("[pmf-prefill] description  :", description || "(empty)");

  const set = (sectionId: string, fieldId: string, value: string) => {
    const v = value.trim();
    if (v) {
      out[`${sectionId}.${fieldId}`] = v;
      console.log(`[pmf-prefill]   SET ${sectionId}.${fieldId} = "${v.slice(0, 60)}${v.length > 60 ? "…" : ""}"`);
    }
  };

  set("s1", "1.1", manufacturer || name);
  set("s1", "1.5", description);
  set("s1", "1.7", "Biochemistry, Hematology, ELISA, CLIA, FIA, Molecular Diagnostics");
  set("s6", "6.1", name);
  set("s7", "7.1", "ISO 13485:2016 Certified Quality Management System");

  console.log(`[pmf-prefill] ── OUTPUT: ${Object.keys(out).length} fields set ─────────────────`);
  return out;
}

export function applyPmfPrefillToSections(
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
