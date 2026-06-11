import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { indexProductDocument, queryProductDocuments } from "@/lib/productVectorIndex";

// pdf-parse import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch (error) {
    console.error("PDF parse error:", error);
    return "";
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) return "";
    let docXmlText = await docXmlFile.async("string");

    // Replace paragraph endings with newlines to preserve spacing
    docXmlText = docXmlText.replace(/<\/w:p>/g, "\n");

    // Match all text elements
    const matches = docXmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return "";

    return matches
      .map((val) => val.replace(/<[^>]+>/g, ""))
      .join(" ");
  } catch (error) {
    console.error("Error extracting text from docx:", error);
    return "";
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, fieldId } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const product = await Product.findById(doc.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 1. Query the framework to get field label and hint for better prompt generation
    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }

    let fieldLabel = fieldId;
    let fieldHint = "";
    let sectionId = "";

    for (const sec of fw.sections) {
      const field = sec.fields.find((f) => f.id === fieldId);
      if (field) {
        fieldLabel = field.label;
        fieldHint = field.hint;
        sectionId = sec.id;
        break;
      }
    }

    if (!sectionId) {
      return NextResponse.json({ error: "Field not found in framework" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let combinedText = "";
    const uploadedFileNames: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      let extractedText = "";

      const nameLower = file.name.toLowerCase();
      if (file.type === "application/pdf" || nameLower.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(buffer);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        nameLower.endsWith(".docx")
      ) {
        extractedText = await extractTextFromDocx(buffer);
      } else if (file.type.startsWith("text/") || nameLower.match(/\.(txt|csv|xml|json|md)$/i)) {
        extractedText = buffer.toString("utf-8");
      } else {
        return NextResponse.json({ error: `Unsupported file type for ${file.name}. Upload PDF or DOCX.` }, { status: 400 });
      }

      if (extractedText.trim()) {
        const trimmedText = extractedText.slice(0, 150_000);
        combinedText += `\n--- Content from ${file.name} ---\n${trimmedText}\n`;
        uploadedFileNames.push(file.name);

        // Save file to the product's uploadedDocs list
        product.uploadedDocs.push({
          fileId: randomUUID(),
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.length,
          extractedText: trimmedText,
          uploadedAt: new Date(),
        });
      }
    }

    if (!combinedText.trim()) {
      return NextResponse.json({ error: "No text content could be extracted from these files." }, { status: 400 });
    }

    await product.save();

    let pineconePurpose = `field_upload_${fieldId}`;
    const stabilitySections = ["s14_stability", "s16_shelf", "s17_inuse", "s18_shipping"];
    const stabilityFields = ["15.0a", "16.0a", "17.0a", "18.0a"];

    if (sectionId === "s14_stability" || fieldId === "15.0a") pineconePurpose = "stability_overview";
    else if (sectionId === "s16_shelf" || fieldId === "16.0a") pineconePurpose = "claimed_shelf_life";
    else if (sectionId === "s17_inuse" || fieldId === "17.0a") pineconePurpose = "in_use_stability";
    else if (sectionId === "s18_shipping" || fieldId === "18.0a") pineconePurpose = "shipping_stability";

    // 2. Index the document into Pinecone under the product's namespace
    const productNamespaceId = product.vectorNamespaceId || String(product._id);
    let chunksIndexed = 0;
    let namespace = `product_${(user as Record<string, unknown>)._id}_${productNamespaceId}`;
    try {
      const indexed = await indexProductDocument(
        String((user as Record<string, unknown>)._id),
        combinedText,
        productNamespaceId,
        pineconePurpose
      );
      if (indexed) {
        chunksIndexed = indexed.chunksIndexed;
        namespace = indexed.namespace;
      }
    } catch (indexErr) {
      console.error("[field-upload] Pinecone indexing skipped or failed:", indexErr);
    }

    // 4. Query Pinecone database if configured
    let pineconeContext = "";
    try {
      const queryText = `${fieldLabel} ${fieldHint} ${product.name} formulation manufacturing QC procedure criteria`;
      console.log(`[field-upload] Querying Pinecone in namespace: ${namespace} with query: "${queryText}"`);
      const retrieved = await queryProductDocuments(
        String((user as Record<string, unknown>)._id),
        productNamespaceId,
        queryText,
        15
      );
      if (retrieved && retrieved.trim()) {
        pineconeContext = retrieved;
        console.log(`[field-upload] Successfully retrieved ${pineconeContext.length} chars of context from Pinecone.`);
      }
    } catch (queryErr) {
      console.warn("[field-upload] Pinecone context retrieval failed/skipped:", queryErr);
    }

    // Combine newly uploaded document text and Pinecone context so all information is available
    const docSourceContent = pineconeContext
      ? `--- Vector DB Matches (IFU & CoA Context) ---\n${pineconeContext}\n\n--- Newly Uploaded Document Content ---\n${combinedText}`
      : combinedText;

    // 5. Generate the targeted table or content using OpenAI
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const isStabilityField = stabilityFields.includes(fieldId) || stabilitySections.includes(sectionId);

    const fieldsToGenerate = fieldId === "5.0" ? ["5.0", "5.1", "5.2", "5.3", "5.4"] : [fieldId];
    const generatedValues: Record<string, string> = {};

    // Example Configuration Objects to pass along with your execution flow 
    // (Populate these dynamically from your database or user input for each unique device)
    const deviceConfig = {
      section5_0: {
        ercRowAudits: [
          "Row 1.1: Detail specific analytical performance characteristics and listing of tested interfering substances from the source documentation.",
          "Row 1.2: Detail the physical presentation of liquid/solid components to mitigate the risk of product leakage or chemical exposure during transport.",
          "Rows 2.1 & 2.2: Identify whether biological or hazardous substances are utilized, and explain the precise containment or risk mitigation measures implemented.",
          "Row 2.5 & 2.7: Detail the bioburden, sterility validation protocols, or microbiological state baseline along with stability recovery metrics matching the product specifications.",
          "Rows 3.1, 3.2 & 3.3: Clearly declare equipment interoperability boundaries (e.g., manual methods, semi-automated systems, or fully-automated analyzer applications).",
          "Row 8.7 (Mathematical Approach): Explicitly output the exact quantitative calculation formulas, calibration models, or mathematical logic used to compute patient analytical results."
        ]
      },
      section5_1: {
        structureGuidelines: [
          "Narrative explanation of the device's design, operational principles, and structural composition.",
          "Exact active chemical formulation, raw material components, buffers, stabilizers, or biological targets from the documentation.",
          "Intermediate bulk specifications (such as target pH ranges, visual appearance, or density thresholds) and final commercial configuration pack sizes.",
          "A structured Kit Contents Table mapping components, physical packaging format, and filling quantities."
        ]
      },
      section5_2: {
        processSteps: "Raw Material Blending/Compounding -> In-Process Inspection Decision Gate (with a loop back on failure, or progression on passing) -> Primary Container Dispensing/Filling -> Finished Product Quality Control Validation Gate -> Temperature-Controlled Finished Product Storage."
      },
      section5_3: {
        packagingSteps: "Primary Sorting & Batch/Lot Traceability Stamping (Lot number, Manufacturing date, Expiration date tracking) -> Secondary Kit Packaging (enclosing primary elements and required technical literature/Instructions for Use) -> Quality Assurance Batch Record Verification & Authorization -> Distribution Logistics."
      }
    };

    await Promise.all(
      fieldsToGenerate.map(async (targetFieldId) => {
        let targetPrompt = "";

        if (targetFieldId === "5.0") {
          targetPrompt = `You are an expert Regulatory Affairs and Quality Assurance (QA/RA) engineer specializing in In Vitro Diagnostic (IVD) medical devices.
Your task is to generate the Essential Requirements Checklist (ERC) table for section 5.0 of the IVD Technical File for the device specified in the source documentation.

The output must be a fully compliant markdown-formatted table with the exact columns:
No | Essential Requirement | Applies (Yes/No/NA) | Applicable Std /Procedure | Response

Audits/Corrections to perform (Extract device-specific metrics from the source documentation to replace generic templates):
${deviceConfig.section5_0.ercRowAudits.map(audit => `- ${audit}`).join("\n")}

Source text and reference context from uploaded documents:
${docSourceContent.slice(0, 120000)}

Output only the raw Markdown table. No code blocks, no conversational text.`;

        } else if (targetFieldId === "5.1") {
          targetPrompt = `You are an expert Regulatory Affairs and Quality Assurance (QA/RA) engineer specializing in In Vitro Diagnostic (IVD) medical devices.
Your task is to generate Section 5.1 Device Design for the medical device described in the attached documentation.

Structure the response to fulfill these requirements:
${deviceConfig.section5_1.structureGuidelines.map(guideline => `- ${guideline}`).join("\n")}

Source text and reference context from uploaded documents:
${docSourceContent.slice(0, 120000)}

Output only the raw Markdown content. No code blocks, no conversational text.`;

        } else if (targetFieldId === "5.2") {
          targetPrompt = `You are an expert Regulatory Affairs and Quality Assurance (QA/RA) engineer specializing in In Vitro Diagnostic (IVD) medical devices.
Your task is to generate Section 5.2 Manufacturing Process for the medical device described in the attached documentation.

Generate a comprehensive narrative description of the bulk manufacturing process, followed by PROCESS MAP 1 using Mermaid.js flow diagram syntax.

The flowchart logic must capture the physical process pipeline from:
${deviceConfig.section5_2.processSteps}

For the "Finished Product QC Release Gate" or final quality appraisal node, extract and embed the exact analytical acceptance criteria, performance specifications, tolerances, and stability thresholds directly from the source batch test records or Certificates of Analysis. Do not use placeholder criteria.

Source text and reference context from uploaded documents:
${docSourceContent.slice(0, 120000)}

Output only the raw Markdown content. No code blocks (except the mermaid fence for the diagram), no conversational text.`;

        } else if (targetFieldId === "5.3") {
          targetPrompt = `You are an expert Regulatory Affairs and Quality Assurance (QA/RA) engineer specializing in In Vitro Diagnostic (IVD) medical devices.
Your task is to generate Section 5.3 QC & Packaging Flow Chart for the medical device described in the attached documentation.

Generate a brief operational description of the packaging phase, followed by PROCESS MAP 2 (QC & Packaging Flow Chart) using Mermaid.js flow diagram syntax.

The flowchart logic must trace the secondary stage downstream milestones from:
${deviceConfig.section5_3.packagingSteps}

Extract specific lot markers, shelf life durations, and component enclosures from the source text to ground the map logic in the actual batch record.

Source text and reference context from uploaded documents:
${docSourceContent.slice(0, 120000)}

Output only the raw Markdown content. No code blocks (except the mermaid fence for the diagram), no conversational text.`;

        } else if (targetFieldId === "5.4") {
          targetPrompt = `You are an expert Regulatory Affairs and Quality Assurance (QA/RA) engineer specializing in In Vitro Diagnostic (IVD) medical devices.
Your task is to generate Section 5.4 Manufacturing Site for the device described in the attached documentation.

Please extract and format:
1. The legal manufacturing entity name and the complete physical industrial address.
2. The calibration traceability profile or international standard reference materials used to calibrate the testing metrics, if mentioned in the documentation.

Source text and reference context from uploaded documents:
${docSourceContent.slice(0, 120000)}

Output only the raw Markdown content. No code blocks, no conversational text.`;

        } else if (isStabilityField) {
          targetPrompt = `We uploaded stability study report(s) for field "${fieldLabel}" (${fieldId}).
Field description/hint: ${fieldHint}

Generate a comprehensive, professional stability report in Markdown format. The report MUST follow this standard structure, but adapt flexibly — not every report will have every section, and the data tables may differ between study types:

---

**Product Name:** [extract from document]  
**Lot No.:** [extract if present]  
**Mfg. Date:** [extract if present] | **Exp. Date:** [extract if present]  
**Testing Interval:** [extract if present]  
**Quantity Sampled:** [extract if present]

---

### 1. Objective and Purpose of Testing
[Extract and summarize the objective from the document. If not present, state the typical CDSCO objective for this stability type.]

### 2. Storage Conditions
[Extract storage temperature, humidity, light conditions from the document.]

### 3. Calendar / Testing Schedule
[If a testing calendar or schedule table is present, reproduce it as a Markdown table:
| S. No. | Testing Interval | Expected Date | Testing Date |
If not present, omit this section.]

### 4. Product Description
[Extract product name, intended use, description from the document.]

### 5. Kit Content
[If kit components / quantities are listed, reproduce as a Markdown table:
| Component | Quantity |
If not present, omit this section.]

### 6. Procedure
[Extract procedure details, wavelengths, temperature, reagent volumes, calculation formulas. Use bullet points and sub-tables as they appear in the document.]

### 7. Study Results
[Extract and reproduce the core stability data table. Use whatever columns are present in the document, for example:
| Time Point | Measurement / Absorbance | % Recovery vs Day 0 | Visual Appearance | Result |
The columns MUST match the actual data in the document — do not force a fixed structure.]

### 8. Conclusion
[Extract or summarize the conclusion from the document, including claimed stability duration, storage conditions, and compliance statement.]

---

CRITICAL RULES:
- Extract real values from the document wherever possible. Do NOT invent data.
- If a section has no data in the document, omit that section entirely — do not add placeholders.
- Keep original tables as Markdown pipe-tables.
- Do not wrap the response in \`\`\`markdown or any code block. Output raw Markdown directly.
- Do not add any conversational explanation before or after. Output ONLY the report.

Document Content:
${combinedText.slice(0, 100000)}`;

        } else {
          targetPrompt = `We uploaded a study report/raw data file for field "${fieldLabel}" (${fieldId}).
Field description/hint: ${fieldHint}

Please extract and generate the specific table or content required for this field from the document content below.

RULES:
- Return the data formatted as a Markdown table (using pipe-delimited rows: | Aspect | Subject | ... |).
- Include appropriate headers.
- Extract ONLY the relevant values matching this field. Do not include unrelated study results.
- If the document does not contain relevant data, generate an outline of the expected table based on CDSCO requirements and use placeholders or mock data (and clearly state so).
- Do not wrap the response in markdown blocks like \`\`\`markdown or \`\`\`json. Output the raw text of the table/content directly.
- Avoid introducing any conversational explanations or remarks. Just return the extracted table/data.

Document Content:
${combinedText.slice(0, 100000)}`;
        }

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a medical device regulatory affairs expert specializing in CDSCO Device Master File (DMF) requirements. Your job is to extract exact raw data from study reports and format it into professional regulatory tables or reports.`,
            },
            {
              role: "user",
              content: targetPrompt,
            },
          ],
          max_tokens: 3000,
          temperature: 0.1,
        });

        generatedValues[targetFieldId] = completion.choices[0]?.message?.content?.trim() || "";
      })
    );

    // 6. Update the field values in the document sections Map
    if (!doc.sections) {
      doc.sections = new Map();
    }

    const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
    currentSectionData.fields = {
      ...currentSectionData.fields,
      ...generatedValues,
    };

    // Recalculate completion percentage
    const secObj = fw.sections.find((s) => s.id === sectionId);
    if (secObj) {
      const totalFields = secObj.fields.length;
      const filledCount = secObj.fields.filter(
        (f) => {
          const val = generatedValues[f.id] !== undefined ? generatedValues[f.id] : currentSectionData.fields[f.id];
          return val?.trim();
        }
      ).length;
      currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
    }

    doc.sections.set(sectionId, currentSectionData);
    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      fileName: uploadedFileNames.join(", "),
      chunksIndexed,
      namespace,
      value: generatedValues[fieldId] || "",
    });

  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST field-upload failed:", error);
    return NextResponse.json({ error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}
