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

    let pineconeContext = "";
    if (hasUploadedDocs) {
      try {
        const productNamespaceId = product.vectorNamespaceId || String(product._id);
        const queryText = `${product.name} standard formulation pH packaging kit contents manufacturing process compounding QC test parameters acceptance criteria manufacturing site address European Material Reference ${product.description || ""}`.slice(0, 500);
        console.log(`${LOG} Querying Pinecone namespace: product_${String((user as Record<string, unknown>)._id)}_${productNamespaceId} with query: "${queryText}"`);
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
      messages: [        {
          role: "system",
          content: `You are a regulatory documentation expert. Given source documents from a medical device manufacturer, extract data and fill regulatory form fields.
 
RULES:
- Output ONLY valid JSON.
- Each key MUST be "sectionId.fieldId" — concatenate the EXACT sectionId and the EXACT fieldId from the field list, joined by a single dot.
- EXAMPLE: for a field listed as "${fw.sections[0]?.id}|${exampleEntry?.id}|...", the correct JSON key is "${exampleKey}". For "${fw.sections[1]?.id}|${fw.sections[1]?.fields[0]?.id}|...", use "${exampleKey2}".
- FieldIds often contain dots themselves (e.g. 1.1a, 2.1c, 20.productName). Always use the FULL fieldId exactly as shown in the FIELDS list.
- For field 1.2 (Regulatory Status in India): if predicate on CDSCO list → "Yes — approved" + predicate name; else "New device".
- For field 2.1c (Disorder/Condition): state the clinical disorder/condition detected — NOT the full intended-use paragraph (that belongs in 2.0 / 2.2).
- If a field has no relevant data in the documents, OMIT it (do not include empty or placeholder values). EXCEPTION: You MUST always generate s4.4.upload (inferring device hazards) even if not stated in the source.
- NEVER copy field labels or hints as values.
- Keep values concise but complete. For tables, you MUST output fully valid Markdown tables including the mandatory separator row (e.g., |---|---|). Do NOT output raw pipe-delimited strings without the separator row.
- Respond with ONLY the JSON object, no markdown fences, no explanation.
 
FIELD EXTRACTION GUIDELINES:
- s4.4.summary (Risk Management Summary): You are a Senior ISO 14971:2019 Risk Management Expert. TASK: Generate a comprehensive, narrative Risk Management Summary and explanation. Explain the methodology used to identify device-specific hazards, assess risks, and implement controls. Summarize the overall residual risk profile of the device based on the source documents. Conclude that the medical benefits outweigh the residual risks, in accordance with ISO 14971 requirements. Write 3-4 highly professional paragraphs. DO NOT generate a table for this field.
- s4.4.upload (Risk Management Report Table): You are a Senior ISO 14971:2019 Risk Management Expert. TASK: Generate a highly detailed, device-specific Risk Management Report table with hazards. OUTPUT REQUIREMENT: You MUST output a strictly valid Markdown table. You MUST start your response with the exact table headers and separators below:
| Hazard ID | Component / Source | Associated Hazard | Initial S | Initial P | Initial R | Risk Control Measure (Mitigation) | Residual S | Residual P | Residual R |
|---|---|---|---|---|---|---|---|---|---|
Then generate the rows for each hazard. COLUMN DEFINITIONS: Hazard ID (Format: HZ-01, HZ-02, HZ-03, etc.); Initial/Residual S (1=Negligible, 2=Minor, 3=Serious); P (1=Remote, 2=Occasional, 3=Frequent). R = S × P. Risk Control Measure: Detail highly specific, practical ISO 14971 compliant controls (e.g. specific QC tests, exact storage validations, explicit labeling warnings), min 2 mitigations per hazard. Residual S MUST generally remain the same as Initial S (mitigation primarily reduces Probability). RISK IDENTIFICATION: Do NOT generate generic risks like "User error", "Environmental factors", or "Equipment failure". You MUST deeply analyze the source documents and extract ACTUAL device-specific components, reagents, biological materials, preservatives, manufacturing processes, storage requirements, performance characteristics, interferences, labeling warnings, and intended use as the "Component / Source". Generate a comprehensive risk profile of 8 to 15+ hazards that are clearly traceable to the uploaded device documentation. OUTPUT FORMAT: Return a fully formatted Markdown table with headers and separators. Do not generate placeholder text or explanations.
- s5.5.0: Generate a markdown-formatted Essential Requirements Checklist (ERC) table with columns: No | Essential Requirement | Applies (Yes/No/NA) | Applicable Std /Procedure | Response. Inspect the source text to adapt the responses to the physical state and chemical nature of the device components. Audit and ensure compliance on these key operational vectors:
  * Row 1.1: Detail analytical performance stability and list all tested interfering or cross-reacting compounds or endogenous proteins declared in the instructions for use (IFU).
  * Row 1.2: State the specific primary containment strategy (e.g., fluid-sealed bottles or moisture-resistant vials) designed to eliminate leakage risks during transport and handling.
  * Rows 2.1 & 2.2: Verify whether biological active ingredients, animal-derived vectors, or hazardous chemical preservatives are utilized, outlining risk-mitigation packaging protocols.
  * Row 2.5 & 2.7: Detail the specific microbiological state or bioburden release testing specifications alongside the standard-compliant stability validation thresholds (e.g., EN ISO 23640 / EN 23640 accelerated thermal protocols).
  * Rows 3.1, 3.2 & 3.3: Explicitly declare systemic compatibility, instrument or platform interoperability profiles (e.g., validation parameters for specialized automated analyzer equipment or manual configurations), and environmental risk insulation boundaries.
  * Row 8.7: Output the exact mathematical formula, calculation factor, or calibration algorithm supplied by the manufacturer to compute the patient's quantitative or qualitative analytical result.


Guidance for specific fields:
"s5.5.0": "Generate a markdown-formatted Essential Requirements Checklist (ERC) table with columns: No | Essential Requirement | Applies (Yes/No/NA) | Applicable Std /Procedure | Response. Inspect the source text to adapt the responses to the physical state and chemical nature of the device components. Audit and ensure compliance on these key operational vectors:\n- Row 1.1: Detail analytical performance stability and list all tested interfering or cross-reacting compounds or endogenous proteins declared in the instructions for use (IFU).\n- Row 1.2: State the specific primary containment strategy (e.g., fluid-sealed bottles or moisture-resistant vials) designed to eliminate leakage risks during transport and handling.\n- Rows 2.1 & 2.2: Verify whether biological active ingredients, animal-derived vectors, or hazardous chemical preservatives are utilized, outlining risk-mitigation packaging protocols.\n- Row 2.5 & 2.7: Detail the specific microbiological state or bioburden release testing specifications alongside the standard-compliant stability validation thresholds (e.g., EN ISO 23640 / EN 23640 accelerated thermal protocols).\n- Rows 3.1, 3.2 & 3.3: Explicitly declare systemic compatibility, instrument or platform interoperability profiles (e.g., validation parameters for specialized automated analyzer equipment or manual configurations), and environmental risk insulation boundaries.\n- Row 8.7: Output the exact mathematical formula, calculation factor, or calibration algorithm supplied by the manufacturer to compute the patient's quantitative or qualitative analytical result.",
"s5.5.1": "Provide a complete structural Device Design narrative along with a Kit Contents configuration table detailing the physical and chemical composition of the system. Extract and detail the exact chemical formulation matrix, concentrations, active ingredients, core buffers, surfactants, and preservatives for all reagents and reference standard/calibrator solutions. Incorporate the quantitative intermediate bulk control boundaries (such as target pH ranges or physical appearance metrics) and the commercial packaging presentation limits.",
"s5.5.2": "Provide a detailed operational narrative of the compounding and manufacturing pipeline, followed by a text-based process map using Mermaid.js flow diagram syntax. The diagram must accurately trace the step-by-step production flow from initial raw material selection, dispensing, and formulation compounding, through an in-process inspection validation node (featuring a loop back to blending on failure or progression on passing), to automated volumetric primary container dispensing/filling. Conclude the sequence at the final batch quality control verification gate and movement to temperature-controlled storage. Explicitly embed the exact analytical release parameters, tolerances, sensitivity boundaries, and performance testing metrics from the source material into the quality control node.",
"s5.5.3": "Provide an operational summary of downstream quality control actions, secondary packaging logic, and release protocols, followed by a text-based process map using Mermaid.js flow diagram syntax. The diagram must trace the terminal gates of the batch run: primary sorting, assigning serialization markers (extracting actual batch/lot identifiers, manufacturing dates, and expiration intervals from the file), secondary kit assembly (enclosing active components and printed technical instructions/IFU literature), Quality Assurance batch record review with administrative release authorization, and dispatch to logistics distribution networks.",
"s5.5.4": "Extract and format the exact legal corporate identity and complete physical industrial address of the certified manufacturing facility. Additionally, explicitly document the scientific traceability network, calibration baselines, or international reference standard materials used to anchor and validate the analytical measurement units of the assay system.",
"s1.1.1d": "Extract or calculate the claimed shelf life of the device in months. Output ONLY the duration as 'X months' (e.g., '18 months' or '24 months') with no other words or description.",
"s16_shelf.16.0a": "Provide a concise 5-6 lines description paragraph summarizing the accelerated stability studies. It MUST include the final conclusion of the stability test (e.g. shelf life claim validation). Do NOT include any tables, lists, markdown list markers, or bullet points — only a single continuous paragraph.",
"s17_inuse.17.0a": "Provide a concise 5-6 lines description paragraph summarizing the open vial / in-use stability studies. Do NOT include any tables, lists, markdown list markers, or bullet points — only a single continuous paragraph.",
"s18_shipping.18.0a": "Provide a concise 5-6 lines description paragraph summarizing the shipping / transport stability studies. Do NOT include any tables, lists, markdown list markers, or bullet points — only a single continuous paragraph."`
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

    const formatObjectToMarkdown = (obj: any, level = 0): string => {
      if (obj === null || obj === undefined) return "";
      if (typeof obj !== "object") {
        const str = String(obj);
        return str.includes("||") ? str.trim().replace(/\|\|\s*$/, "").replace(/\|\|/g, "\n|") : str;
      }
      if (Array.isArray(obj)) {
        return obj.map((item) => {
          if (typeof item === "object" && item !== null) {
            return formatObjectToMarkdown(item, level);
          }
          return `- ${item}`;
        }).join("\n");
      }
      return Object.entries(obj).map(([k, v]) => {
        const headingPrefix = "#".repeat(Math.min(6, level + 2));
        if (typeof v === "object" && v !== null) {
          return `${headingPrefix} ${k}\n${formatObjectToMarkdown(v, level + 1)}`;
        }
        const strVal = String(v);
        const cleanVal = strVal.includes("||") ? strVal.trim().replace(/\|\|\s*$/, "").replace(/\|\|/g, "\n|") : strVal;
        return `**${k}**: ${cleanVal}`;
      }).join("\n\n");
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
        rejected.push({ key, reason: "unknown sectionId.fieldId (use e.g. s1.1.1a not s1.1a)" });
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
