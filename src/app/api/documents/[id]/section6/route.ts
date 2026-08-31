import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { queryProductDocuments } from "@/lib/productVectorIndex";

const SECTION6_PROMPT = `
6. PRODUCT VALIDATION AND VERIFICATION
======================================

Generate Section 6 in accordance with CDSCO Device Master File requirements.

This section should provide a concise overview of the validation and verification studies performed to demonstrate conformity with the intended use and applicable Essential Principles. Summarize analytical performance, stability, and clinical evaluation studies described in detail in Sections 7–11.

Write all sections in continuous scientific and regulatory language. Use only information available in the uploaded documents and do not fabricate data.

==================================================
6.1 COA / SUMMARY INFORMATION
=============================

Generate a concise summary describing the study objectives, methodology, key findings, and conclusions. Include analytical performance, stability, and clinical evaluation where applicable. Avoid repeating detailed tables.

==================================================
6.2 DETAILED INFORMATION
========================

Provide a narrative overview of the complete validation activities, including study design, methods, statistical analyses, and major findings. Refer to Sections 7–19 for detailed results.

==================================================
6.3 VALIDATION PROTOCOL
=======================

Describe the study design, sample types, controls, replicates, statistical methods, acceptance criteria, and applicable CLSI or regulatory requirements.

==================================================
6.4 VALIDATION RESULTS
======================

Summarize the principal validation findings, including precision, accuracy, linearity, sensitivity, specificity, reproducibility, stability, and clinical performance where supported by the available information.

==================================================
6.5 VALIDATION CONCLUSION
=========================

Provide an overall scientific and regulatory conclusion explaining how the validation studies demonstrate the safety, performance, reliability, and suitability of the device for its intended use.

==================================================
8.1 SPECIMEN TYPE
=================
==================================================
8.1 SPECIMEN TYPE
=================

Describe the specimen types supported by the device.

CRITICAL SOURCE RULE:

* Do NOT use information from newly uploaded performance, analytical validation, precision, stability, or other study documents.
* Use ONLY information contained in the "Vector DB Matches (IFU & Product Context)" section.
* Do NOT use external medical or laboratory knowledge.
* If specimen information is absent from the Vector DB matches, state:
  "Specimen type information is not available in the IFU."

IMPORTANT:

* Preserve the organization and meaning provided in the IFU.
* Do NOT merge all specimen information into a single paragraph.
* Create a separate numbered subsection for every specimen type mentioned in the IFU.
* Do NOT assume that only one specimen type exists.
* Include all instructions, precautions, limitations, and notes associated with each specimen type.

For each specimen type, describe (only when supported by the IFU):

* Collection requirements
* Preparation before analysis
* Storage conditions
* Transportation requirements
* Temperature requirements prior to analysis
* Freeze-thaw limitations
* Anticoagulants, preservatives, or additives that are recommended or prohibited
* Special handling instructions
* Warnings, precautions, or attention statements

If the IFU contains explicit notes such as "Attention:", "Warning:", or "Precaution:", reproduce them under the corresponding specimen type.

OUTPUT FORMAT

1. [Specimen Type]

Detailed description.

Attention:

* ...

2. [Specimen Type]

Detailed description.

Attention:

* ...

3. [Specimen Type]

Detailed description.

Attention:

* ...

Generate specimen comparison tables only when sufficient information is available from the Vector DB matches.

Do not summarize multiple specimen types together.
Do not invent collection tubes, clotting times, centrifugation procedures, storage durations, hemolysis precautions, or validation statements unless explicitly stated in the IFU.
Maintain terminology and restrictions exactly as described in the IFU.


==================================================
RULES
=====

* Write in continuous paragraph form.
* Avoid bullet-point summaries.
* Do not fabricate values or studies.
* Section 6 should summarize, not duplicate, the detailed information presented in Sections 7–11.

==================================================
OUTPUT FORMAT
=============

Return a flat JSON object with exactly these keys:

{
  "6.1": "<COA / Summary Information paragraph>",
  "6.2": "<Detailed Information paragraph>",
  "6.3": "<Validation Protocol paragraph>",
  "6.4": "<Validation Results paragraph>",
  "6.5": "<Validation Conclusion paragraph>",
  "8.1": "<Specimen Type narrative (including tables if applicable)>"
}

Return ONLY valid JSON — no markdown fences, no preamble, no explanation.
`;


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    if (!env.OPENAI_API_KEY)
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const product = await Product.findById((doc.contextPayload?.productId || doc.contextPayload?.productIds?.[0])).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    // ── Build context from uploaded product docs ────────────────────────────
    const uploadedDocs = (
      (product as Record<string, unknown>).uploadedDocs as {
        originalName: string;
        extractedText: string;
      }[]
    ) || [];

    const uploadedText = uploadedDocs
      .map((d) => `--- ${d.originalName} ---\n${d.extractedText}`)
      .join("\n\n");

    // ── Pull existing section content from the saved document ───────────────
    const sections = doc.sections instanceof Map
      ? Object.fromEntries(doc.sections.entries())
      : doc.sections ?? {};

    const existingSectionContent: string[] = [];
    for (const sid of ["s7", "s8", "s9", "s10_sensitivity", "s11_specificity", "s14_stability"]) {
      const sec = sections[sid];
      if (sec?.fields) {
        for (const [fid, val] of Object.entries(sec.fields as Record<string, string>)) {
          if (val?.trim()) {
            existingSectionContent.push(`[Section ${sid} / Field ${fid}]\n${String(val).slice(0, 3000)}`);
          }
        }
      }
    }

    // ── Pinecone RAG retrieval ──────────────────────────────────────────────
    const productNamespaceId =
      (product as Record<string, unknown>).vectorNamespaceId as string ||
      String((product as Record<string, unknown>)._id);
    const userId = String((user as Record<string, unknown>)._id);

    let vectorContext = "";
    try {
      // Query restricted to "autofill" purpose = IFU / product knowledge uploaded by the user.
      // Analytics study vectors (precision, accuracy, linearity, etc.) are intentionally excluded.
      const ifuQuery = `${(product as Record<string, unknown>).name ?? ""} instructions for use IFU intended use specimen type sample matrix collection storage transportation procedure reagents principle method clinical indication patient population contraindications warnings precautions device description`;
      vectorContext = await queryProductDocuments(userId, productNamespaceId, ifuQuery, 20, "autofill");
    } catch (e) {
      console.warn("[section6] Pinecone query failed:", e);
    }


    // ── Build the full context for GPT ─────────────────────────────────────
    const contextParts: string[] = [];
    if (vectorContext.trim()) {
      contextParts.push(`--- Vector DB Matches (IFU & Product Context) ---\n${vectorContext}`);
    }
    if (existingSectionContent.length > 0) {
      contextParts.push(`--- Already-Generated Section Content (§7–§19) ---\n${existingSectionContent.join("\n\n")}`);
    }
    if (uploadedText.trim()) {
      contextParts.push(`--- Uploaded Document Content ---\n${uploadedText.slice(0, 60_000)}`);
    }

    if (contextParts.length === 0) {
      return NextResponse.json(
        { error: "No source data available. Please upload product documents or generate Sections 7–11 first." },
        { status: 400 }
      );
    }

    const sourceContext = contextParts.join("\n\n");

    // ── GPT call ────────────────────────────────────────────────────────────
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Regulatory Affairs specialist with expertise in CDSCO Device Master File (DMF) requirements for IVD medical devices. Generate professional, scientifically rigorous validation and verification summaries. Follow all instructions exactly and return only valid JSON.",
        },
        {
          role: "user",
          content: `${SECTION6_PROMPT}\n\nSOURCE CONTEXT:\n${sourceContext}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    let generatedData: Record<string, string> = {};
    try {
      generatedData = JSON.parse(rawJson);
    } catch {
      console.error("[section6] JSON parse failed:", rawJson.slice(0, 300));
      return NextResponse.json(
        { error: "AI did not return valid JSON" },
        { status: 500 }
      );
    }

    // ── Persist to section s6 and s8 ─────────────────────────────────────────
    if (!doc.sections) doc.sections = new Map();

    const fieldToSectionMapping: Record<string, string> = {
      "6.1": "s6",
      "6.2": "s6",
      "6.3": "s6",
      "6.4": "s6",
      "6.5": "s6",
      "8.1": "s8",
    };


    const affectedSections = new Set<string>();
    for (const [fieldId, val] of Object.entries(generatedData)) {
      const sectionId = fieldToSectionMapping[fieldId];
      if (!sectionId) continue;
      affectedSections.add(sectionId);

      const sectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
      sectionData.fields = {
        ...sectionData.fields,
        [fieldId]: typeof val === "string" ? val : JSON.stringify(val),
      };
      doc.sections.set(sectionId, sectionData);
    }

    // Recalculate completion pct
    for (const sectionId of affectedSections) {
      const sectionData = doc.sections.get(sectionId);
      const secObj = fw.sections.find((s) => s.id === sectionId);
      if (sectionData && secObj) {
        const total = secObj.fields.length;
        const filled = secObj.fields.filter((f) =>
          String(sectionData.fields[f.id] || "").trim()
        ).length;
        sectionData.completionPct = Math.round((filled / total) * 100);
        doc.sections.set(sectionId, sectionData);
      }
    }

    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      results: generatedData,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST section6 failed:", error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
