import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { queryProductDocuments } from "@/lib/productVectorIndex";
import {
  applyPmfPrefillToSections,
  getProductPmfPrefill,
} from "@/lib/pmfProductPrefill";
import {
  buildValidFieldIdSets,
  completionPctForSection,
  parseSectionFieldKey,
  persistSections,
  sectionsToPlain,
} from "@/lib/documentSections";

const LOG = "[pmf-autofill]";

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
    const productPrefill = getProductPmfPrefill(doc.frameworkId, product as Record<string, unknown>);
    const productPrefillCount = applyPmfPrefillToSections(sections, fw, productPrefill);

    console.log(`${LOG} start`, {
      documentId: id,
      frameworkId: doc.frameworkId,
      framework: fw.documentType,
      productId: String(doc.productId),
      productName: (product as { name?: string }).name ?? "(no name)",
    });

    const hasUploadedDocs = combinedText.trim().length > 0;
    const hasProductSeed = productPrefillCount > 0 || (product.name && product.manufacturer);

    if (!hasUploadedDocs && !hasProductSeed) {
      return NextResponse.json(
        { error: "No source data. Complete Phase 1 or upload manufacturing documents to the product." },
        { status: 400 },
      );
    }

    let pineconeContext = "";
    if (hasUploadedDocs) {
      try {
        const productNamespaceId = product.vectorNamespaceId || String(product._id);
        const queryText = `${product.manufacturer} manufacturing plant layout sanitation ventilation cleanroom classification staff factory manager equipment list calibration maintenance QMS ISO 13485 recall complaint`.slice(0, 500);
        console.log(`${LOG} Querying Pinecone namespace: product_${String((user as Record<string, unknown>)._id)}_${productNamespaceId}`);
        const retrieved = await queryProductDocuments(
          String((user as Record<string, unknown>)._id),
          productNamespaceId,
          queryText,
          20
        );
        if (retrieved && retrieved.trim()) {
          pineconeContext = retrieved;
          console.log(`${LOG} Successfully retrieved ${pineconeContext.length} chars of context from Pinecone.`);
        }
      } catch (queryErr) {
        console.warn(`${LOG} Pinecone query failed/skipped:`, queryErr);
      }
    }

    const truncated = hasUploadedDocs
      ? (pineconeContext
        ? `--- Vector Database Retrieved Context ---\n${pineconeContext}\n\n--- Full Document Sample ---\n${combinedText.slice(0, 40000)}`
        : combinedText.slice(0, 80_000))
      : `Product Name: ${product.name}\nManufacturer: ${product.manufacturer}\nDescription: ${product.description}`;

    const fieldList = fw.sections.flatMap((s) =>
      s.fields.map((f) => `${s.id}|${f.id}|${f.label}|${f.hint}`)
    );

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a CDSCO regulatory affairs specialist. Help the manufacturer compile their Plant Master File (PMF) for their IVD manufacturing site.
 
RULES:
- Output ONLY valid JSON.
- Each key MUST be "sectionId.fieldId" — concatenate the EXACT sectionId and the EXACT fieldId from the field list, joined by a dot (e.g. s1.1.1, s2.2.1, s3.3.1).
- If a field has no relevant data in the documents, OMIT it. Do NOT output empty or placeholder values.
- Keep values concise but complete. For tables/procedures, you MUST output fully valid Markdown tables/bullet points.
- Respond with ONLY the JSON object, no markdown fences, no explanation.`,
        },
        {
          role: "user",
          content: `Framework: ${fw.documentType} (${fw.countryName} / ${fw.authority})

FIELDS TO FILL (sectionId|fieldId|label|hint):
${fieldList.join("\n")}

SOURCE DOCUMENTS AND CONTEXT:
${truncated}

Return JSON mapping "sectionId.fieldId" to extracted values.`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: Record<string, string> = {};
    try {
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(`${LOG} GPT JSON parse failed`, { rawPreview: preview(raw, 200) });
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
    }

    const gptKeys = Object.keys(parsed);
    const rejected: { key: string; reason: string }[] = [];
    const gptApplied: string[] = [];
    const gptSkipped: string[] = [];

    let filledCount = productPrefillCount;

    const formatObjectToMarkdown = (obj: any): string => {
      if (obj === null || obj === undefined) return "";
      if (typeof obj !== "object") return String(obj);
      if (Array.isArray(obj)) {
        return obj.map((item) => `- ${item}`).join("\n");
      }
      return Object.entries(obj).map(([k, v]) => `**${k}**: ${v}`).join("\n");
    };

    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined) {
        rejected.push({ key, reason: "empty value" });
        continue;
      }
      const stringValue = formatObjectToMarkdown(value);
      if (!stringValue.trim()) {
        rejected.push({ key, reason: "empty string value" });
        continue;
      }
      const parsedKey = parseSectionFieldKey(key, validFieldIds);
      if (!parsedKey) {
        rejected.push({ key, reason: "unknown sectionId.fieldId" });
        continue;
      }
      const { sectionId, fieldId } = parsedKey;

      if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
      const sFields = { ...sections[sectionId].fields };

      if (!sFields[fieldId]?.trim()) {
        sFields[fieldId] = stringValue;
        filledCount++;
        gptApplied.push(key);
      } else {
        gptSkipped.push(key);
      }
      sections[sectionId].fields = sFields;
      sections[sectionId].completionPct = completionPctForSection(fw, sectionId, sFields);
    }

    persistSections(doc, sections, { log: false });
    await doc.save();

    console.log(`${LOG} saved`, {
      documentId: id,
      filledCount,
      totalParsed: gptKeys.length,
    });

    return NextResponse.json({
      filledCount,
      productPrefillCount,
      totalParsed: Object.keys(parsed).length,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/documents/[id]/pmf-autofill failed:", error);
    return NextResponse.json({ error: "Autofill failed" }, { status: 500 });
  }
}
