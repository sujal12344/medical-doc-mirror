import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { queryProductDocuments } from "@/lib/productVectorIndex";
const SECTION22_PROMPT = (productName: string) => `
You are a regulatory affairs expert preparing information for an Indian CDSCO Device Master File (DMF) for an in vitro diagnostic medical device.

Generate a beautifully formatted regulatory response for Section 22.0 "Information Required to be submitted for the in-vitro diagnostic medical device" using the product name "${productName}".

You MUST output exactly the following 9 points, formatted with clear spacing, bold questions, and clean paragraphs. Use the exact product name "${productName}" where referenced:

(1) **The details of source antigen or antibody as the case may be and characterization of the same. Process control of coating of antigen or antibody on the base material like Nitrocellulose paper, strips or cards or ELISA wells etc. Detailed composition of the in vitro diagnostic medical device and manufacturing flow chart process of the in vitro diagnostic medical device showing the specific flow diagram of individual components or source of the individual components.**

Not applicable, Antigen and antibody not used in the manufacturing. For the manufacturing flow chart process, please refer to Flow Chart of Production Process ${productName}.

(2) **Test protocol of the in vitro diagnostic medical device showing the specifications and method of testing. In house evaluation report of sensitivity, specificity and stability studies carried out by the manufacturer.**

Please refer to In-house Finished good test report.

(3) **In case of imported diagnostic in vitro diagnostic medical devices, the report of evaluation in details conducted by the National Control Authority of country of origin.**

Not applicable, as product being manufactured in house.

(4) **Specimen batch test report for at least consecutive 3 batches showing specification of each testing parameter.**

Please refer to ${productName}.

(5) **The detailed test report of all the components used/packed in the finished in vitro diagnostic medical device.**

Please refer to COA of ${productName}.

(6) **Pack size and labeling.**

Please refer to Labels of ${productName}.

(7) **Product inserts.**

Please refer to point no. 20.

(8) **Specific evaluation report, if done by any laboratory in India, showing the sensitivity and specificity of the in vitro diagnostic medical device.**

N/A. There is no evaluation report conducted by Indian laboratories.

(9) **Specific processing like safe handling, material control, area control, process control, and stability studies, storage at quarantine stage and finished stage, packaging should be highlighted in the product dossier.**

Please refer to Site Master File.

==================================================
OUTPUT FORMAT
=============

Return a flat JSON object with exactly this key:

{
  "22": "<IVD-Specific Information formatted using Markdown with double line breaks between points for readability>"
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
            const query = `IFU "Instructions for Use" ${(product as Record<string, unknown>).name ?? ""} raw materials composition manufacturing test protocol stability batch labeling product insert`;
            vectorContext = await queryProductDocuments(userId, productNamespaceId, query, 25);
        } catch (e) {
            console.warn("[section22] Pinecone query failed:", e);
        }

        // ── Build the full context for GPT ─────────────────────────────────────
        const contextParts: string[] = [];
        if (vectorContext.trim()) {
            contextParts.push(`--- Pinecone RAG Context (product + IFU knowledge) ---\n${vectorContext}`);
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
        const productName = (product as Record<string, unknown>).name as string || "the device";

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
                    content: `${SECTION22_PROMPT(productName)}\n\nSOURCE CONTEXT:\n${sourceContext}`,
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

        if (!doc.sections) doc.sections = new Map();

        const fieldToSectionMapping: Record<string, string> = {
            "22": "s22",
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