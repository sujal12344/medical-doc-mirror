import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { queryProductDocuments } from "@/lib/productVectorIndex";

const SECTION3_PROMPT = `
Generate the "3.0 Essential Principles (EP) Checklist" section using the exact hierarchical table structure defined in the reference DMF.

Requirements:
* The output must contain a single comprehensive compliance table.
* Generate category rows (e.g., 1, 2, 3) and their associated requirement rows (e.g., 1.1, 1.2, 1.3).
* Preserve the hierarchical numbering and structure.
* Do not generate a simplified compliance matrix. Match the DMF format exactly.
* If an Essential Principle is not applicable, mark it as "No" or "NA" and provide a justification.
* Populate "Applicable Standard / Internal Procedure" using ISO standards, SOPs, validation reports, risk management documents, and quality system procedures.
* Populate "Technical Documentation Reference / Evidence Location" using information extracted from the uploaded documentation.
* Use professional CDSCO, IMDRF, and ISO 13485 regulatory language.
* Ensure all content is device-specific and evidence-based.
* Do not generate narrative text, summaries, conclusions, notes, or additional sections.
* Output only the completed DMF-ready compliance table formatted using Markdown.

Use the following columns exactly:
S. No | Section / Category | Essential Principle / Requirement | Applies (Yes / No / NA) | Applicable Standard / Internal Procedure | Technical Documentation Reference / Evidence Location

The categories to cover should include, but are not limited to:
1. Chemical, Physical & Biological Properties
2. Infection & Microbial Contamination
3. Materials of Biological Origin
4. Environmental Properties
5. Performance Evaluation
6. Protection Against Radiation
7. Software Validation
8. Energy Source Connection
9. Mechanical & Thermal Risks
10. Self-Testing Devices
11. Label & Instructions for Use
12. CDSCO Performance Evaluation

Analyze the uploaded IFU, labeling, intended use, device specifications, risk management information, performance data, and technical documentation to determine compliance.

==================================================
OUTPUT FORMAT
=============

Return a flat JSON object with exactly this key:

{
  "3": "<The Markdown table of the Essential Principles Checklist>"
}

Return ONLY valid JSON — no markdown fences around the JSON, no preamble, no explanation.
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
        for (const sid of ["s4", "s5", "s6", "s7", "s8", "s9", "s10_sensitivity", "s11_specificity", "s14_stability"]) {
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
            const query = `IFU "Instructions for Use" ${(product as Record<string, unknown>).name ?? ""} risk management performance evaluation software materials biological origin safety`;
            vectorContext = await queryProductDocuments(userId, productNamespaceId, query, 25);
        } catch (e) {
            console.warn("[section3] Pinecone query failed:", e);
        }

        // ── Build the full context for GPT ─────────────────────────────────────
        const contextParts: string[] = [];
        if (vectorContext.trim()) {
            contextParts.push(`--- Pinecone RAG Context (product + IFU knowledge) ---\n${vectorContext}`);
        }
        if (existingSectionContent.length > 0) {
            contextParts.push(`--- Already-Generated Section Content ---\n${existingSectionContent.join("\n\n")}`);
        }
        if (uploadedText.trim()) {
            contextParts.push(`--- Uploaded Document Content ---\n${uploadedText.slice(0, 60_000)}`);
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
                        "You are a Regulatory Affairs specialist with expertise in CDSCO Device Master File (DMF) requirements for IVD medical devices. Generate professional, beautifully formatted responses. Follow all instructions exactly and return only valid JSON.",
                },
                {
                    role: "user",
                    content: `${SECTION3_PROMPT}\n\nSOURCE CONTEXT:\n${sourceContext}`,
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
            console.error("[section3] JSON parse failed:", rawJson.slice(0, 300));
            return NextResponse.json(
                { error: "AI did not return valid JSON" },
                { status: 500 }
            );
        }

        if (!doc.sections) doc.sections = new Map();

        const fieldToSectionMapping: Record<string, string> = {
            "3": "s3",
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
        console.error("POST section3 failed:", error);
        return NextResponse.json(
            { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown error") },
            { status: 500 }
        );
    }
}
