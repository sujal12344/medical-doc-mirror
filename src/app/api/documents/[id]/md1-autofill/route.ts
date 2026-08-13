import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import {
  buildValidFieldIdSets,
  completionPctForSection,
  parseSectionFieldKey,
  persistSections,
  sectionsToPlain,
} from "@/lib/documentSections";
import { extractTextFromDocument } from "@/lib/pdfExtractor";

const LOG = "[md1-autofill]";

function preview(value: string, max = 80): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}

/**
 * MD-1 autofill route — processes multiple uploaded documents
 * Each document corresponds to a specific MD-1 section based on the "from" field
 */
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

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const sections = sectionsToPlain(doc.sections);
    const validFieldIds = buildValidFieldIdSets(fw);

    console.log(`${LOG} start`, {
      documentId: id,
      frameworkId: doc.frameworkId,
      framework: fw.documentType,
      uploadedDocsCount: doc.uploadedDocs?.length || 0,
    });

    // Get uploaded documents from the regulatory document
    const uploadedDocs = (doc.uploadedDocs || []) as Array<{
      fileName: string;
      mimeType: string;
      base64: string;
      uploadedAt: Date;
    }>;

    if (uploadedDocs.length === 0) {
      return NextResponse.json(
        { error: "No documents uploaded. Please upload required documents for MD-1 application." },
        { status: 400 }
      );
    }

    // Extract text from uploaded documents
    const extractedDocs = await Promise.all(
      uploadedDocs.map(async (doc) => {
        try {
          const content = await extractTextFromDocument(doc.base64, doc.mimeType, doc.fileName);
          console.log(`${LOG} Extracted ${content.length} chars from ${doc.fileName}`);
          return {
            fileName: doc.fileName,
            content,
          };
        } catch (error) {
          console.error(`${LOG} Failed to extract ${doc.fileName}:`, error);
          return {
            fileName: doc.fileName,
            content: `[Document: ${doc.fileName}]\nExtraction failed.`,
          };
        }
      })
    );

    let filledCount = 0;
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Process each section that has a "from" field (indicates document requirement)
    for (const section of fw.sections) {
      if (!section.from) continue;

      console.log(`${LOG} Processing section ${section.id}: ${section.title} (from: ${section.from})`);

      // Find relevant uploaded document(s) for this section
      const relevantDocs = extractedDocs.filter((doc) =>
        doc.fileName.toLowerCase().includes(section.from?.toLowerCase().split("/")[0] || "")
      );

      if (relevantDocs.length === 0) {
        console.log(`${LOG} No relevant document found for section ${section.id}`);
        continue;
      }

      const combinedContent = relevantDocs.map((d) => `--- ${d.fileName} ---\n${d.content}`).join("\n\n");

      // Build field list for this section only
      const fieldList = section.fields.map((f) => `${section.id}|${f.id}|${f.label}|${f.hint}`);

      // Call GPT to extract fields for this section
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a CDSCO regulatory affairs specialist helping to extract information for MD-1 (Notified Body Registration) application documents.

RULES:
- Output ONLY valid JSON.
- Each key MUST be "sectionId.fieldId" — concatenate the EXACT sectionId and the EXACT fieldId from the field list, joined by a dot.
- If a field has no relevant data in the documents, OMIT it. Do NOT output empty or placeholder values.
- Keep values concise but complete. For tabular fields (like SOPs or personnel lists), output valid Markdown tables.
- For dates, use DD/MM/YYYY format if extracting from Indian documents.
- For tables requested in hints (e.g., "One row per line: ..."), output properly formatted Markdown tables with headers and separator rows.
- Respond with ONLY the JSON object, no markdown fences, no explanation.`,
          },
          {
            role: "user",
            content: `Section: ${section.title}
Description: ${section.description}
Expected source document type: ${section.from}

FIELDS TO FILL (sectionId|fieldId|label|hint):
${fieldList.join("\n")}

SOURCE DOCUMENT(S):
${combinedContent}

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
        console.error(`${LOG} GPT JSON parse failed for section ${section.id}`, { rawPreview: preview(raw, 200) });
        continue;
      }

      // Apply extracted fields to sections
      for (const [key, value] of Object.entries(parsed)) {
        if (value === null || value === undefined) continue;
        
        const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        if (!stringValue.trim()) continue;

        const parsedKey = parseSectionFieldKey(key, validFieldIds);
        if (!parsedKey) {
          console.log(`${LOG} Unknown field key: ${key}`);
          continue;
        }

        const { sectionId, fieldId } = parsedKey;

        if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
        const sFields = { ...sections[sectionId].fields };

        if (!sFields[fieldId]?.trim()) {
          sFields[fieldId] = stringValue;
          filledCount++;
          console.log(`${LOG} Filled ${key}: ${preview(stringValue)}`);
        }

        sections[sectionId].fields = sFields;
        sections[sectionId].completionPct = completionPctForSection(fw, sectionId, sFields);
      }
    }

    // Save updated sections
    persistSections(doc, sections, { log: false });
    await doc.save();

    console.log(`${LOG} saved`, {
      documentId: id,
      filledCount,
      sectionsProcessed: fw.sections.filter((s) => s.from).length,
    });

    return NextResponse.json({
      filledCount,
      sectionsProcessed: fw.sections.filter((s) => s.from).length,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/documents/[id]/md1-autofill failed:", error);
    return NextResponse.json({ error: "Autofill failed" }, { status: 500 });
  }
}
