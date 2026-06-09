/** Normalize MongoDB lean document.sections (Map or nested objects) for the editor. */
export function normalizeDocumentSections(
  sections: unknown,
): Record<string, { fields: Record<string, string>; completionPct: number }> {
  if (!sections) return {};

  const sectionEntries =
    sections instanceof Map
      ? Array.from(sections.entries())
      : Object.entries(sections as Record<string, unknown>);

  const out: Record<string, { fields: Record<string, string>; completionPct: number }> = {};

  for (const [sectionId, raw] of sectionEntries) {
    const sec = raw as { fields?: unknown; completionPct?: number };
    let fields: Record<string, string> = {};
    if (sec.fields instanceof Map) {
      fields = Object.fromEntries(sec.fields) as Record<string, string>;
    } else if (sec.fields && typeof sec.fields === "object") {
      fields = { ...(sec.fields as Record<string, string>) };
    }
    out[sectionId] = {
      fields,
      completionPct: sec.completionPct ?? 0,
    };
  }

  return out;
}

export function countDocumentFieldCompletion(
  sections: Record<string, { fields: Record<string, string>; completionPct: number }>,
  totalFields: number,
): { filled: number; total: number; pct: number } {
  let filled = 0;
  for (const sec of Object.values(sections)) {
    for (const v of Object.values(sec.fields || {})) {
      if (typeof v === "string" && v.trim()) filled++;
    }
  }
  const total = totalFields > 0 ? totalFields : filled || 1;
  return { filled, total, pct: Math.round((filled / total) * 100) };
}
