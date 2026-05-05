import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";

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

    if (!combinedText.trim()) {
      return NextResponse.json({ error: "No source documents found. Upload documents to the product first." }, { status: 400 });
    }

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const truncated = combinedText.slice(0, 80_000);

    const fieldList = fw.sections.flatMap((s) =>
      s.fields.map((f) => `${s.id}|${f.id}|${f.label}|${f.hint}`)
    );

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a regulatory documentation expert. Given source documents from a medical device manufacturer, extract data and fill regulatory form fields.

RULES:
- Output ONLY valid JSON: an object mapping "sectionId.fieldId" to the extracted value string.
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

SOURCE DOCUMENTS:
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
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
    }

    let filledCount = 0;
    const sections = doc.sections instanceof Map ? Object.fromEntries(doc.sections) : (doc.sections || {});

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "string") continue;
      const [sectionId, fieldId] = key.split(".");
      if (!sectionId || !fieldId) continue;

      if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
      const sFields = sections[sectionId].fields instanceof Map
        ? Object.fromEntries(sections[sectionId].fields)
        : (sections[sectionId].fields || {});

      if (!sFields[fieldId] || !sFields[fieldId].trim()) {
        sFields[fieldId] = value;
        filledCount++;
      }
      sections[sectionId].fields = sFields;

      const fwSection = fw.sections.find((s) => s.id === sectionId);
      if (fwSection) {
        const filled = fwSection.fields.filter((f) => sFields[f.id] && sFields[f.id].trim()).length;
        sections[sectionId].completionPct = Math.round((filled / fwSection.fields.length) * 100);
      }
    }

    doc.sections = sections;
    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({ filledCount, totalParsed: Object.keys(parsed).length });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/documents/[id]/autofill failed:", error);
    return NextResponse.json({ error: "Autofill failed" }, { status: 500 });
  }
}
