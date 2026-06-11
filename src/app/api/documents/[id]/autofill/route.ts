import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import {
  applyPrefillToSections,
  buildProductContextForDmfAutofill,
  getProductDmfPrefill,
} from "@/lib/dmfProductPrefill";
import {
  buildValidFieldIdSets,
  completionPctForSection,
  parseSectionFieldKey,
  persistSections,
  sectionsToPlain,
} from "@/lib/documentSections";

const LOG = "[dmf-autofill]";

function preview(value: string, max = 80): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const product = await Product.findById(doc.productId).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const uploadedDocs = (product.uploadedDocs || []) as { originalName: string; extractedText: string }[];
    const body = await req.json().catch(() => ({}));
    const extraText = (body.extraText as string) || "";

    const combinedText = [
      ...uploadedDocs.map((d) => `--- ${d.originalName} ---\n${d.extractedText}`),
      extraText ? `--- Chat Upload ---\n${extraText}` : "",
    ].filter(Boolean).join("\n\n");

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const sections = sectionsToPlain(doc.sections);
    const validFieldIds = buildValidFieldIdSets(fw);
    const productPrefill = getProductDmfPrefill(doc.frameworkId, product as Record<string, unknown>);
    const productPrefillCount = applyPrefillToSections(sections, fw, productPrefill);

    console.log(`${LOG} start`, {
      documentId: id,
      frameworkId: doc.frameworkId,
      framework: fw.documentType,
      productId: String(doc.productId),
      productName: (product as { name?: string }).name ?? "(no name)",
    });
    console.log(`${LOG} sources`, {
      uploadedDocs: uploadedDocs.length,
      extraTextChars: extraText.length,
      hasUploadedDocs: combinedText.trim().length > 0,
    });
    console.log(`${LOG} product prefill (${productPrefillCount} fields)`, Object.fromEntries(
      Object.entries(productPrefill).map(([k, v]) => [k, preview(v)]),
    ));

    const productContext = buildProductContextForDmfAutofill(product as Record<string, unknown>);
    const hasUploadedDocs = combinedText.trim().length > 0;
    const hasProductSeed =
      productPrefillCount > 0 || productContext.includes("Intended use") || productContext.includes("Predicate");

    if (!hasUploadedDocs && !hasProductSeed) {
      return NextResponse.json(
        { error: "No source data. Complete Phase 1 (intended use / predicate) or upload documents to the product." },
        { status: 400 },
      );
    }

    const truncated = hasUploadedDocs
      ? combinedText.slice(0, 80_000)
      : productContext;

    const fieldList = fw.sections.flatMap((s) =>
      s.fields.map((f) => `${s.id}|${f.id}|${f.label}|${f.hint}`)
    );

    // Build a concrete example from the first field in the framework so the prompt is unambiguous
    const exampleEntry = fw.sections[0]?.fields[0];
    const exampleKey = exampleEntry
      ? `${fw.sections[0].id}.${exampleEntry.id}`
      : "s1.1.1a";
    const exampleKey2 = fw.sections[1]?.fields[0]
      ? `${fw.sections[1].id}.${fw.sections[1].fields[0].id}`
      : "s2.2.0";

    console.log(`${LOG} fieldList sample (first 5)`, fieldList.slice(0, 5));
    console.log(`${LOG} key format example`, { exampleKey, exampleKey2 });

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a regulatory documentation expert. Given source documents from a medical device manufacturer, extract data and fill regulatory form fields.

RULES:
- Output ONLY valid JSON.
- Each key MUST be "sectionId.fieldId" — concatenate the EXACT sectionId and the EXACT fieldId from the field list, joined by a single dot.
- EXAMPLE: for a field listed as "${fw.sections[0]?.id}|${exampleEntry?.id}|...", the correct JSON key is "${exampleKey}". For "${fw.sections[1]?.id}|${fw.sections[1]?.fields[0]?.id}|...", use "${exampleKey2}".
- FieldIds often contain dots themselves (e.g. 1.1a, 2.1c, 20.productName). Always use the FULL fieldId exactly as shown in the FIELDS list.
- For field 1.2 (Regulatory Status in India): if predicate on CDSCO list → "Yes — approved" + predicate name; else "New device".
- For field 2.1c (Disorder/Condition): state the clinical disorder/condition detected — NOT the full intended-use paragraph (that belongs in 2.0 / 2.2).
- If a field has no relevant data in the documents, OMIT it (do not include empty or placeholder values).
- NEVER copy field labels or hints as values.
- Keep values concise but complete. For tables, use pipe-delimited rows.
- Respond with ONLY the JSON object, no markdown fences, no explanation.`,
        },
        {
          role: "user",
          content: `Framework: ${fw.documentType} (${fw.countryName} / ${fw.authority})

FIELDS TO FILL (sectionId|fieldId|label|hint):
${fieldList.join("\n")}

${hasUploadedDocs ? "SOURCE DOCUMENTS" : "SOURCE (product registration only — no uploaded IFU yet)"}:
${truncated}

${hasUploadedDocs ? `ALSO USE (Phase 1 product record — do not contradict):\n${productContext}\n` : ""}

Return JSON mapping "sectionId.fieldId" to extracted values.`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    console.log(`${LOG} GPT raw response (first 500 chars)`, raw.slice(0, 500));

    let parsed: Record<string, string> = {};
    try {
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(`${LOG} GPT JSON parse failed`, { rawPreview: preview(raw, 200) });
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
    }
    console.log(`${LOG} GPT parsed keys (all)`, Object.keys(parsed));

    const gptKeys = Object.keys(parsed);
    const rejected: { key: string; reason: string }[] = [];
    const gptApplied: string[] = [];
    const gptSkipped: string[] = [];

    let filledCount = productPrefillCount;

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "string") {
        rejected.push({ key, reason: "empty or non-string value" });
        continue;
      }
      const parsedKey = parseSectionFieldKey(key, validFieldIds);
      if (!parsedKey) {
        rejected.push({ key, reason: "unknown sectionId.fieldId (use e.g. s1.1.1a not s1.1a)" });
        continue;
      }
      const { sectionId, fieldId } = parsedKey;

      if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
      const sFields = { ...sections[sectionId].fields };

      if (!sFields[fieldId]?.trim()) {
        sFields[fieldId] = value;
        filledCount++;
        gptApplied.push(key);
      } else {
        gptSkipped.push(key);
      }
      sections[sectionId].fields = sFields;
      sections[sectionId].completionPct = completionPctForSection(fw, sectionId, sFields);
    }

    console.log(`${LOG} GPT response`, {
      keysReturned: gptKeys.length,
      applied: gptApplied.length,
      skippedAlreadyFilled: gptSkipped.length,
      rejected: rejected.length,
    });
    if (gptApplied.length) {
      console.log(`${LOG} GPT applied`, Object.fromEntries(
        gptApplied.map((k) => [k, preview(parsed[k] ?? "")]),
      ));
    }
    if (rejected.length) {
      console.log(`${LOG} GPT rejected keys`, rejected);
    }
    if (gptSkipped.length) {
      console.log(`${LOG} GPT skipped (already had value)`, gptSkipped);
    }

    const sectionSummary = Object.fromEntries(
      Object.entries(sections).map(([sid, sec]) => [
        sid,
        {
          completionPct: sec.completionPct,
          fieldCount: Object.keys(sec.fields).length,
          fieldIds: Object.keys(sec.fields).sort(),
        },
      ]),
    );
    console.log(`${LOG} sections before save`, sectionSummary);

    persistSections(doc, sections, { log: true });
    await doc.save();

    console.log(`${LOG} saved`, {
      documentId: id,
      filledCount,
      productPrefillCount,
      totalParsed: gptKeys.length,
    });

    return NextResponse.json({
      filledCount,
      productPrefillCount,
      totalParsed: Object.keys(parsed).length,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/documents/[id]/autofill failed:", error);
    return NextResponse.json({ error: "Autofill failed" }, { status: 500 });
  }
}
