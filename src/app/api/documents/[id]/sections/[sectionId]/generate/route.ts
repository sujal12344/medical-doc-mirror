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

const LOG = "[section-generate]";

function preview(value: string, max = 80): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}

/**
 * Generate/extract data for a specific section from uploaded documents
 * Works for MD-1 and other frameworks
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, sectionId } = await params;

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const section = fw.sections.find((s) => s.id === sectionId);
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const sections = sectionsToPlain(doc.sections);
    const validFieldIds = buildValidFieldIdSets(fw);

    console.log(`${LOG} start`, {
      documentId: id,
      sectionId,
      frameworkId: doc.frameworkId,
      sectionTitle: section.title,
      uploadedDocsCount: doc.uploadedDocs?.length || 0,
    });

    // Get uploaded documents
    const uploadedDocs = (doc.uploadedDocs || []) as Array<{
      fileName: string;
      mimeType: string;
      base64: string;
      uploadedAt: Date;
    }>;

    if (uploadedDocs.length === 0) {
      return NextResponse.json(
        { error: "No documents uploaded. Please upload a document first." },
        { status: 400 }
      );
    }

    // Extract text from the most recently uploaded document
    const latestDoc = uploadedDocs[uploadedDocs.length - 1];
    let extractedText = "";

    try {
      extractedText = await extractTextFromDocument(
        latestDoc.base64,
        latestDoc.mimeType,
        latestDoc.fileName
      );
      console.log(`${LOG} Extracted ${extractedText.length} chars from ${latestDoc.fileName}`);
    } catch (error) {
      console.error(`${LOG} Failed to extract ${latestDoc.fileName}:`, error);
      // Continue with empty text - AI can still try to work with it
      extractedText = "";
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { 
          error: "Could not extract meaningful text from the document. Please ensure it's a valid PDF or DOCX file with text content (not scanned images).",
          filledCount: 0 
        },
        { status: 400 }
      );
    }

    // Build field list for this section only
    const fieldList = section.fields.map((f) => `${section.id}|${f.id}|${f.label}|${f.hint || ""}`);

    // Call GPT to extract fields for this section
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a regulatory affairs specialist helping to extract information for ${fw.documentType} documents.

RULES:
- Output ONLY valid JSON.
- Each key MUST be "sectionId.fieldId" — concatenate the EXACT sectionId and the EXACT fieldId from the field list, joined by a dot.
- If a field has no relevant data in the document, OMIT it. Do NOT output empty or placeholder values.
- Keep values concise but complete. For tabular fields, output valid Markdown tables.
- For dates, use DD/MM/YYYY format if extracting from Indian documents.
- For tables requested in hints (e.g., "One row per line: ..."), output properly formatted Markdown tables with headers and separator rows.
- Respond with ONLY the JSON object, no markdown fences, no explanation.`,
        },
        {
          role: "user",
          content: `Section: ${section.title}
Description: ${section.description || ""}
${section.from ? `Expected source document type: ${section.from}` : ""}

FIELDS TO FILL (sectionId|fieldId|label|hint):
${fieldList.join("\n")}

SOURCE DOCUMENT: ${latestDoc.fileName}
${extractedText}

Return JSON mapping "sectionId.fieldId" to extracted values.`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: Record<string, string> = {};

    try {
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(`${LOG} GPT JSON parse failed for section ${sectionId}`, {
        rawPreview: preview(raw, 200),
      });
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    let filledCount = 0;

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

      const { sectionId: sid, fieldId } = parsedKey;

      if (!sections[sid]) sections[sid] = { fields: {}, completionPct: 0 };
      const sFields = { ...sections[sid].fields };

      // Always update the field (override existing value on re-upload)
      sFields[fieldId] = stringValue;
      filledCount++;
      console.log(`${LOG} Filled ${key}: ${preview(stringValue)}`);

      sections[sid].fields = sFields;
      sections[sid].completionPct = completionPctForSection(fw, sid, sFields);
    }

    // Save updated sections
    persistSections(doc, sections, { log: true });
    await doc.save();

    console.log(`${LOG} saved`, {
      documentId: id,
      sectionId,
      filledCount,
      savedFields: Object.keys(sections[sectionId]?.fields || {}),
    });
    console.log(`${LOG} completed`, {
      filledCount,
    });

    return NextResponse.json({
      success: true,
      filledCount,
      sectionId,
      message: `Extracted and filled ${filledCount} fields from ${latestDoc.fileName}`,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`${LOG} failed:`, error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
