import type { RegulatoryFramework } from "@/lib/frameworks/types";

export type SectionData = {
  fields: Record<string, string>;
  fieldSources?: Record<string, string>;
  completionPct: number;
};

/** Read document.sections (Mongoose Map or lean object) into a plain object. */
export function sectionsToPlain(sections: unknown): Record<string, SectionData> {
  if (!sections) return {};

  const entries =
    sections instanceof Map
      ? Array.from(sections.entries())
      : Object.entries(sections as Record<string, SectionData>);

  const out: Record<string, SectionData> = {};
  for (const [sectionId, sec] of entries) {
    const raw = sec as SectionData;
    const fields =
      raw.fields instanceof Map
        ? Object.fromEntries(raw.fields)
        : { ...(raw.fields || {}) };
    const fieldSources =
      raw.fieldSources instanceof Map
        ? Object.fromEntries(raw.fieldSources)
        : { ...(raw.fieldSources || {}) };
    out[sectionId] = {
      fields,
      fieldSources,
      completionPct: raw.completionPct ?? 0,
    };
  }
  return out;
}

/** Write sections back onto a Mongoose document (fields may contain dots e.g. 1.1a). */
export function persistSections(
  doc: { sections: Map<string, SectionData>; markModified: (path: string) => void },
  sections: Record<string, SectionData>,
  options?: { log?: boolean },
): void {
  for (const [sectionId, section] of Object.entries(sections)) {
    const fieldKeys = Object.keys(section.fields);
    if (options?.log) {
      const dotted = fieldKeys.filter((k) => k.includes("."));
      console.log("[dmf-autofill] persist section", {
        sectionId,
        fieldCount: fieldKeys.length,
        dottedFieldIds: dotted.length,
        sampleKeys: fieldKeys.slice(0, 8),
      });
    }
    doc.sections.set(sectionId, {
      fields: { ...section.fields },
      fieldSources: section.fieldSources ? { ...section.fieldSources } : undefined,
      completionPct: section.completionPct ?? 0,
    });
  }
  doc.markModified("sections");
}

export function buildValidFieldIdSets(
  framework: RegulatoryFramework,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const section of framework.sections) {
    map.set(section.id, new Set(section.fields.map((f) => f.id)));
  }
  return map;
}

export function isValidFrameworkField(
  validBySection: Map<string, Set<string>>,
  sectionId: string,
  fieldId: string,
): boolean {
  return validBySection.get(sectionId)?.has(fieldId) ?? false;
}

/**
 * Parse composite keys like "s1.1.1a" → section s1, field 1.1a.
 * First-dot split is wrong when fieldId contains dots (e.g. s1.1a → field "1a").
 */
export function parseSectionFieldKey(
  key: string,
  validBySection: Map<string, Set<string>>,
): { sectionId: string; fieldId: string } | null {
  const sortedSectionIds = [...validBySection.keys()].sort(
    (a, b) => b.length - a.length,
  );

  // --- Strict match: key = "sectionId.fieldId" (fieldId may itself contain dots) ---
  for (const sectionId of sortedSectionIds) {
    const prefix = `${sectionId}.`;
    if (!key.startsWith(prefix)) continue;
    const fieldId = key.slice(prefix.length);
    if (fieldId && validBySection.get(sectionId)?.has(fieldId)) {
      return { sectionId, fieldId };
    }
  }

  // --- Lenient fallback: GPT may drop a leading numeric segment from the fieldId ---
  // e.g. GPT returns "s1.1a" but real fieldId is "1.1a" (key should be "s1.1.1a")
  for (const sectionId of sortedSectionIds) {
    const prefix = `${sectionId}.`;
    if (!key.startsWith(prefix)) continue;
    const partialFieldId = key.slice(prefix.length); // e.g. "1a" when fieldId is "1.1a"
    const fieldSet = validBySection.get(sectionId);
    if (!fieldSet) continue;
    // Find any valid fieldId that ends with ".partialFieldId" or equals partialFieldId
    for (const fieldId of fieldSet) {
      if (fieldId === partialFieldId || fieldId.endsWith(`.${partialFieldId}`)) {
        return { sectionId, fieldId };
      }
    }
  }

  return null;
}


export function completionPctForSection(
  framework: RegulatoryFramework,
  sectionId: string,
  fields: Record<string, string>,
): number {
  const fwSection = framework.sections.find((s) => s.id === sectionId);
  if (!fwSection || fwSection.fields.length === 0) return 0;
  const filled = fwSection.fields.filter((f) => fields[f.id]?.trim()).length;
  return Math.round((filled / fwSection.fields.length) * 100);
}
