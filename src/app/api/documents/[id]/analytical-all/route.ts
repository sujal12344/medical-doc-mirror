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

// pdf-parse helper
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    return (await pdfParse(buffer)).text || "";
  } catch (e) {
    console.error("PDF parse error:", e);
    return "";
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = zip.file("word/document.xml");
    if (!docXml) return "";
    let xml = await docXml.async("string");
    xml = xml.replace(/<\/w:p>/g, "\n");
    const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return "";
    return matches.map((v) => v.replace(/<[^>]+>/g, "")).join(" ");
  } catch (e) {
    console.error("Docx extract error:", e);
    return "";
  }
}

const ANALYTICAL_PROMPT = `
Generate a complete Analytical Performance section for the medical device suitable for inclusion in a Device Master File (DMF), Technical Documentation, Performance Evaluation Report, Design Verification Report, IVDR Technical File, or CDSCO dossier.

Use only the information available in the provided context and generate regulatory-grade narratives and tables. The final output should read like a professionally written technical document and not like pointwise notes or extracted bullets.

GENERAL REQUIREMENTS

* Identify and use information regarding the device name, device type, device class, intended use, principle of operation, specimen type, analytical range, calibration, quality control, performance characteristics, validation studies, and batch testing information from the provided context.

* Write complete paragraphs with proper transitions and explanations. Avoid bullet points unless they are required inside tables.

* Maintain the exact section numbering specified below.

* Use the most detailed and reliable information available in the source documents.

* Prefer actual experimental data over summary statements.

* Perform calculations whenever sufficient data is available.

* Generate statistically meaningful tables only when supported by the available information.

* Do not fabricate values, sample sizes, concentrations, statistical parameters, acceptance criteria, conclusions, or study designs.

* If insufficient information exists for a table, provide a narrative explanation instead.

* Tables must be professional, internally consistent, and suitable for direct inclusion into a Device Master File.

---

# 7.0 Summary of Analytical Study

Generate a comprehensive narrative describing the analytical performance evaluation of the device.

The section should explain:

* Intended analytical purpose.
* Principle of measurement.
* Device classification.
* Performance characteristics evaluated.
* Overall analytical performance.
* Analytical range and detection capability.
* Summary of validation studies performed.

Do not generate a table for this section unless an analytical performance summary table exists in the source documents.

---

# 7.1 Precision Test

Generate a complete precision study in paragraph form.

Include:

* Design verification summary.
* Description of item under test.
* Study objective.
* Study design.
* Sample preparation.
* Test methodology.
* Equipment and materials used.
* Statistical approach.
* Results.
* Interpretation.
* Conclusion.

If replicate measurements are available, calculate and generate appropriate precision tables.

Possible table contents may include:

* Sample level
* Mean concentration
* Standard deviation
* Coefficient of variation (%CV)
* Acceptance criteria
* Result

If replicate measurements are unavailable, provide only narrative discussion.

---

# 7.2 Accuracy Test

Generate a complete accuracy study in paragraph form.

Include:

* Design verification summary.
* Study objective.
* Reference method or comparator.
* Test methodology.
* Statistical evaluation.
* Recovery analysis.
* Bias assessment.
* Results.
* Interpretation.
* Conclusion.

Whenever target values and measured values are available, calculate and generate appropriate accuracy tables.

Possible table contents may include:

* Sample level
* Reference value
* Measured value
* Recovery (%)
* Bias (%)
* Acceptance criteria
* Result

Perform calculations whenever sufficient data exists.

If numerical data are unavailable, generate only descriptive text.

---

# 7.3 Linearity Test

Generate a complete linearity study in paragraph form.

Include:

* Study objective.
* Study design.
* Sample preparation.
* Dilution strategy.
* Concentration levels evaluated.
* Statistical methodology.
* Regression analysis.
* Results.
* Interpretation.
* Conclusion.

Generate a linearity table ONLY if multiple concentration levels are present in the source data.

The table should be based on actual data and may include:

* Target concentration
* Replicate measurements
* Mean measured value
* Recovery percentage

Generate regression parameters such as slope, intercept, correlation coefficient, and R² only when sufficient concentration levels exist.

If only one concentration level is available, do not create a linearity table and instead provide a narrative explanation describing the available evidence and analytical measuring range.

---

# 8.1 Specimen Type

Generate a detailed narrative describing specimen validation.

Include:

* Specimen matrices evaluated.
* Sample collection requirements.
* Sample preparation.
* Storage conditions.
* Transport requirements.
* Stability information.
* Freeze-thaw limitations.
* Anticoagulants evaluated.
* Matrix comparison studies.
* Measurement procedures.
* Statistical evaluation.
* Results and conclusions.

Generate specimen comparison tables only if supported by the available information.

---

# 9.1 Reproducibility

Generate a detailed narrative discussion describing intermediate precision and reproducibility.

Discuss variability associated with:

* Different days.
* Different runs.
* Different operators.
* Different lots.
* Different sites.
* Different instruments.

Describe study design, number of tests, sample panels, statistical approach, results, interpretation, and conclusions.

Do not generate any tables for this section.

The entire section should be written as descriptive text.

---

# 10.0a Analytical Sensitivity Overview

Generate a detailed narrative discussing analytical sensitivity.

Describe:

* Study objective.
* Sample matrix.
* Analyte or measurand.
* Sample preparation.
* Concentration levels.
* Replicate testing strategy.
* Statistical methodology.
* Detection capability.
* Limit of Blank (LoB).
* Limit of Detection (LoD).
* Limit of Quantitation (LoQ).
* Interpretation and conclusion.

Explain how these parameters were established using the available evidence.

Do not generate tables in this section.

---

# 10.1 Analytical Sensitivity Study

Generate a table only if concentration-level sensitivity data and replicate data are available.

Use actual study information.

Possible table columns include:

* Concentration level
* Replicates tested
* Replicates detected
* Detection rate
* Mean response
* Result

Accompany the table with detailed narrative interpretation and conclusions.

If concentration-level data are unavailable, provide descriptive text only.

---

# 11.0 Analytical Specificity Overview

Generate a complete analytical specificity section written in narrative form.

Describe:

* Study objective.
* Interfering substances evaluated.
* Cross-reactivity studies.
* Endogenous interference.
* Exogenous interference.
* Matrix effects.
* Hemolysis.
* Lipemia.
* Icterus.
* Bilirubin interference.
* Drug interference.
* Other potentially interfering compounds.
* Statistical evaluation.
* Results.
* Interpretation.
* Conclusion.

Explain the effect of each interfering substance and discuss whether clinically significant interference was observed.

---

# 11.1 Analytical Specificity Study

Generate an analytical specificity table whenever interference or cross-reactivity data are available.

Use only actual values present in the source documents.

Possible columns may include:

* Interfering substance
* Concentration tested
* Observed bias
* Acceptance criteria
* Result

or

* Cross-reacting substance
* Concentration tested
* Cross-reactivity (%)
* Result

or any other table structure that best represents the available data.

After the table, provide detailed discussion and interpretation.

---

OUTPUT REQUIREMENTS

The output must resemble a professionally authored regulatory document rather than extracted notes.

Write complete paragraphs and explanatory text.

Generate tables dynamically according to the available information instead of forcing predefined tables.

Perform calculations whenever sufficient data exists.

Do not create unsupported tables.

Do not fabricate numerical values.

Use scientific and regulatory language suitable for CDSCO, IVDR, ISO 13485, ISO 14971, CLSI guidelines, and Device Master File submissions.

The final document should be ready for direct inclusion into a medical device regulatory dossier.
`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const product = await Product.findById(doc.productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    if (!files || files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

    type FileEntry = { name: string; text: string };
    const fileEntries: FileEntry[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      let extractedText = "";
      const lower = file.name.toLowerCase();

      if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(buffer);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        lower.endsWith(".docx")
      ) {
        extractedText = await extractTextFromDocx(buffer);
      } else if (file.type.startsWith("text/") || lower.match(/\.(txt|csv|xml|json|md)$/i)) {
        extractedText = buffer.toString("utf-8");
      } else continue;

      if (extractedText.trim()) {
        const trimmed = extractedText.slice(0, 100_000);
        fileEntries.push({ name: file.name, text: trimmed });
        product.uploadedDocs.push({
          fileId: randomUUID(),
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.length,
          extractedText: trimmed,
          uploadedAt: new Date(),
        });
      }
    }

    if (fileEntries.length === 0)
      return NextResponse.json({ error: "No text could be extracted from uploaded files." }, { status: 400 });

    await product.save();

    if (!env.OPENAI_API_KEY)
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const productNamespaceId = product.vectorNamespaceId || String(product._id);
    const userId = String((user as Record<string, unknown>)._id);
    const combinedText = fileEntries.map((f) => `--- ${f.name} ---\n${f.text}`).join("\n\n");

    // Index all uploaded content to Pinecone for future RAG searches
    for (const purpose of ["analytical_precision", "analytical_accuracy", "analytical_linearity"]) {
      try {
        await indexProductDocument(userId, combinedText, productNamespaceId, purpose);
      } catch (e) {
        console.error(`[analytical-all] Pinecone index (${purpose}) failed:`, e);
      }
    }

    // Query product IFU / vector chunks for extra context
    const vectorQueryText = `${product.name} analytical studies precision repeatability accuracy method comparison linearity limit of detection specimen stability`;
    let vectorContext = "";
    try {
      vectorContext = await queryProductDocuments(userId, productNamespaceId, vectorQueryText, 15);
    } catch (e) {
      console.warn("[analytical-all] Vector context retrieval failed:", e);
    }

    const docSourceContent = vectorContext.trim()
      ? `--- Vector DB Matches (IFU & Product Context) ---\n${vectorContext}\n\n--- Newly Uploaded Document Content ---\n${combinedText}`
      : combinedText;

    // Call OpenAI to generate all 8 fields in a single structured JSON response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Regulatory Affairs and QA/RA expert specializing in IVD medical devices and CDSCO Technical File / Device Master File (DMF) requirements. Follow instructions exactly and return only a flat JSON structure.",
        },
        {
          role: "user",
          content: `${ANALYTICAL_PROMPT}\n\nSOURCE CONTEXT:\n${docSourceContent.slice(0, 120000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    let generatedData: Record<string, string> = {};
    try {
      generatedData = JSON.parse(rawJson);
    } catch (err) {
      console.error("[analytical-all] JSON parse failed", rawJson);
      return NextResponse.json({ error: "OpenAI did not return valid JSON content structure" }, { status: 500 });
    }

    // Save fields into document sections Map
    if (!doc.sections) doc.sections = new Map();

    const fieldToSectionMapping: Record<string, string> = {
      "7": "s7",
      "7.1": "s7",
      "7.2": "s7",
      "7.3": "s7",
      "8.1": "s8",
      "9.1": "s9",
      "10.0a": "s10_sensitivity",
      "10.1": "s10_sensitivity",
    };

    const formatObjectToMarkdown = (obj: any, level = 0): string => {
      if (obj === null || obj === undefined) return "";
      if (typeof obj !== "object") return String(obj);
      if (Array.isArray(obj)) {
        return obj.map((item) => {
          if (typeof item === "object" && item !== null) {
            return formatObjectToMarkdown(item, level);
          }
          return `- ${item}`;
        }).join("\n");
      }
      return Object.entries(obj).map(([key, value]) => {
        const headingPrefix = "#".repeat(Math.min(6, level + 2));
        if (typeof value === "object" && value !== null) {
          return `${headingPrefix} ${key}\n${formatObjectToMarkdown(value, level + 1)}`;
        }
        return `**${key}**: ${value}`;
      }).join("\n\n");
    };

    // Update each affected section
    const affectedSections = new Set<string>();
    for (const [fieldId, val] of Object.entries(generatedData)) {
      const sectionId = fieldToSectionMapping[fieldId];
      if (!sectionId) continue;
      affectedSections.add(sectionId);

      const sectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
      sectionData.fields = {
        ...sectionData.fields,
        [fieldId]: formatObjectToMarkdown(val),
      };
      doc.sections.set(sectionId, sectionData);
    }

    // Recalculate completion metrics for the affected sections
    for (const sectionId of affectedSections) {
      const sectionData = doc.sections.get(sectionId);
      const secObj = fw.sections.find((s) => s.id === sectionId);
      if (sectionData && secObj) {
        const total = secObj.fields.length;
        const filled = secObj.fields.filter((f) => String(sectionData.fields[f.id] || "").trim()).length;
        sectionData.completionPct = Math.round((filled / total) * 100);
        doc.sections.set(sectionId, sectionData);
      }
    }

    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      filesUploaded: fileEntries.map((f) => f.name).join(", "),
      results: generatedData,
    });

  } catch (error) {
    if ((error as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST analytical-all failed:", error);
    return NextResponse.json(
      { error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
