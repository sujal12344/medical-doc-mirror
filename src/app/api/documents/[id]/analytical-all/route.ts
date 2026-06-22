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


function buildAnalyticalPrompt(targetContext: string): string {
  const targetSection = targetContext.trim()
    ? `

TARGET VALUES CONTEXT
(Use these exact target/reference values in the Target column of precision and accuracy tables)

${targetContext}

--- END TARGET VALUES ---
`
    : "";

  return `
You are a biostatistician and regulatory affairs specialist preparing Device Master File (DMF), Design Verification Reports, and Performance Evaluation Reports in accordance with CLSI guidelines, IVDR requirements, and CDSCO Device Master File requirements.

Your output must read like a professionally written scientific validation report. Avoid pointwise summaries and isolated numerical values.

==================================================
WRITING STYLE REQUIREMENTS
==================================================

Every section must follow the sequence:

Introduction and study rationale
→ Study design and methodology
→ Statistical approach
→ Presentation of results
→ Interpretation of findings
→ Regulatory conclusion

Write every section in continuous scientific paragraphs with smooth transitions.

Introduce every table with explanatory narrative text.

Immediately after every table generate a section titled:

Conclusion

Discuss analytical significance, variability, clinical relevance, and regulatory compliance.

Never output one-word conclusions such as:

Pass
Acceptable
Within limits

Instead provide scientific interpretations.

==================================================
TABLE FORMAT RULES
==================================================

ALL tables MUST be proper GitHub Flavored Markdown pipe tables.

Example structure:

| Day | Control Activity | % Recovery vs Day 0 | Visual Appearance | Result |
|---|---|---|---|---|
| 0 | ... | ... | ... | ... |
| 1 | ... | ... | ... | ... |

The example above illustrates formatting only.

Never reproduce example values.

Never output column-wise text or bullet lists instead of tables.

Every table must contain:

1. Header row
2. Separator row
3. Dynamically calculated rows

Values must always come from uploaded documents.

Never fabricate measurements.

==================================================
TARGET VALUES RULE
==================================================

${targetSection}

If target values are available:

Include a Target column.

Calculate:

Recovery (%) = (Mean / Target) × 100

Bias = Mean − Target

Percent Bias (%) = ((Mean − Target) / Target) × 100

==================================================
7.0 SUMMARY OF ANALYTICAL STUDY
==================================================

Generate a comprehensive scientific overview summarizing all analytical studies.

The summary must:

- Be written entirely in paragraph form.
- Avoid bullets or numbering.
- Synthesize precision, accuracy, sensitivity, specificity, linearity, and reproducibility findings.
- Discuss overall analytical performance and clinical significance.

==================================================
7.1 PRECISION TEST
==================================================

Write a detailed precision study following:

Introduction
Study Design
Statistical Approach
Results
Interpretation
Regulatory Conclusion

Include the following explanation:

"To evaluate the precision of the parameters, the variation among repeated measurements (Rep 1, Rep 2 and Rep 3) is analyzed. Precision reflects the closeness of agreement among replicate measurements and is commonly expressed using the mean, standard deviation (SD), and coefficient of variation (%CV). Lower %CV values indicate superior repeatability and analytical consistency."

If replicate measurements are available, calculate:

• Mean (x̄)
• Standard Deviation (SD)
• Coefficient of Variation (%CV)

Generate a Markdown table with columns:

| S. No | Parameter | Unit | Target | Mean (x̄) | Standard Deviation (SD) | Coefficient of Variation (%CV) |
|---|---|---|---|---|---|---|

Rules:

- Create one row for each analyte.
- Parameter names must come from uploaded documents.
- Calculate values dynamically.
- Never hard-code analytes or numbers.
- Use target values when available.

After the table generate:

Conclusion

Discuss:

- Repeatability
- Analytical precision
- Relative variability
- Compliance with CLSI recommendations
==================================================
7.1a BETWEEN-RUN PRECISION TEST
==================================================

Write a detailed Between-Run Precision study following:

Introduction
Study Design
Statistical Approach
Results
Interpretation
Regulatory Conclusion

Include the following explanation:

"Between-run precision assesses the variability or reproducibility of an assay across different analytical sessions. It evaluates the consistency of measurements obtained over multiple runs and provides an estimate of intermediate precision. Between-run precision is commonly expressed using the Grand Mean, Between-Run Standard Deviation (SDbetween), and Between-Run Coefficient of Variation (%CVbetween). Lower %CV values indicate superior reproducibility and demonstrate the stability of the analytical system across independent runs."

If measurements from multiple runs are available, calculate:

• Grand Mean

• Between-Run Standard Deviation (SDbetween)

• Between-Run Coefficient of Variation (%CVbetween)

Generate a GitHub Flavored Markdown table with columns:

| S. No | Parameter | Unit | Target | Grand Mean | Between-Run Standard Deviation | Between-Run Coefficient of Variation|
| ----- | --------- | ---- | ------ | ---------- | ------------------------------ | ------------------------------------|

Rules:

* Create one row for each analyte.
* Parameter names must come from uploaded documents.
* Calculate all values dynamically from measurements obtained across different runs.
* Use target values when available.
* Never hard-code analytes or numerical values.
* Never fabricate measurements.
* Use all available runs when calculating Grand Mean, SDbetween and %CVbetween.

Immediately after the table generate:

Conclusion

Discuss:

* Intermediate precision.
* Reproducibility between analytical runs.
* Day-to-day variability.
* Stability of assay performance.
* Relative variability among analytes.
* Compliance with CLSI recommendations.
* Analytical reliability and consistency.

Conclude with a regulatory interpretation describing whether the observed between-run variability demonstrates acceptable assay reproducibility and supports the intended analytical performance of the device.


==================================================
7.2 ACCURACY TEST
==================================================

Write a detailed scientific discussion.

Include:

"To assess the accuracy of the parameters, the closeness between experimentally measured values and assigned target values is evaluated. Accuracy is quantified using the mean (x̄), Bias, and Percent Bias (%Bias). Lower percent bias values indicate superior trueness and better agreement with reference values."

Calculate:

Mean (x̄)

Bias = Mean − Target

Percent Bias (%) = ((Mean − Target)/Target) ×100

Generate a Markdown table with columns:

| S. No | Parameter | Unit | Target | Mean (x̄) | Bias (x̄−Target) | Percent Bias (%Bias) |
|---|---|---|---|---|---|---|

Rules:

- Dynamically populate rows.
- Use actual values from uploaded data.
- Never copy examples.
- Never fabricate values.
- Calculate and display all numerical values (Mean, Bias, Percent Bias, and Target) in the Accuracy Table to exactly three decimal places (e.g. 0.005 instead of 0.00).

After the table generate:

Conclusion

Discuss:

- Trueness
- Systematic error
- Accuracy characteristics
- Clinical relevance

==================================================
7.3 LINEARITY TEST
==================================================

Write a complete linearity study.

Generate a Linearity table ONLY when:

- Multiple concentration levels exist, OR
- Replicate values are available.

Generate a Markdown table:

| S. No | Parameter | Unit | Target | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|---|---|

Rules:

- Populate rows dynamically.
- Use actual measurements.
- Never hard-code values.

If multiple concentration levels are present, additionally calculate:

• Slope
• Intercept
• Correlation coefficient (R)
• Coefficient of determination (R²)

Generate additional regression tables when supported by the data.

After every table generate:

Conclusion

Discuss:

- Linearity
- Proportionality
- Dynamic range
- Regression characteristics

If only a single concentration level exists, write descriptive narrative only.

==================================================
9.1 REPRODUCIBILITY
==================================================

Entire section must be narrative only.

DO NOT GENERATE TABLES.

Discuss:

- Day-to-day variability
- Runs
- Operators
- Lots
- Sites
- Instruments

Follow the standard scientific structure.

==================================================
10.0 ANALYTICAL SENSITIVITY OVERVIEW
==================================================

Write a detailed narrative.

Include:

"Analytical sensitivity measures how effectively a laboratory assay detects very small differences or changes in analyte concentration. A highly sensitive assay produces measurable responses even when minute quantities of analyte are present."

Include:

"In clinical validation and laboratory diagnostics, the Limit of Detection (LoD), also referred to as functional sensitivity, represents the lowest concentration of analyte that can be reliably detected with approximately 95% confidence."

According to CLSI EP17-A2:

LoD = LoB + 1.645 × SD

When true blank values are unavailable:

LoD / Functional Sensitivity = 1.645 × SD

Lower Detection Resolution:

SEM = SD / √n

Explain these concepts in paragraph form.

==================================================
10.1 ANALYTICAL SENSITIVITY STUDY
==================================================

Include:

"Analytical sensitivity describes the ability of the assay to detect very small changes in analyte concentration. In a laboratory system, this responsiveness is reflected by measurement noise and detection capability."

If replicate measurements are available, calculate:

• Grand Mean
• Standard Deviation (SD)
• Functional Sensitivity (1.645 × SD)
• Standard Error of Mean (SEM)

Generate a Markdown table:

| S. No | Parameter | Unit | Target | Grand Mean | Standard Deviation (SD) | LoD / Functional Sensitivity (1.645×SD) | Lower Detection Resolution (SEM) |
|---|---|---|---|---|---|---|---|

Rules:

- One row per analyte.
- Dynamically derive analytes from uploaded data.
- Never hard-code Albumin, ALT, or example values.
- Use only actual calculations.
- Never fabricate measurements.

After the table generate:

Conclusion

Discuss:

- Detection capability
- Functional sensitivity
- Measurement noise
- Lower detection limits
- Clinical significance

==================================================
11.0 ANALYTICAL SPECIFICITY OVERVIEW
==================================================

Write a detailed scientific discussion describing:

- Interfering substances
- Cross-reactivity
- Matrix effects
- Hemolysis
- Lipemia
- Icterus
- Bilirubin
- Drugs and metabolites

Discuss clinical significance and assay robustness.

==================================================
11.1 ANALYTICAL SPECIFICITY STUDY
==================================================

Generate a Markdown table only if interference data or cross-reactivity information are available.

Suggested columns:

Analytical Specificity Ratio = Target Value / Standard Deviation (SD)

|S. No|Parameter|Unit|Target|Standard Deviation (SD)|Analytical Specificity Ratio (Target/SD)|
|---|---|---|---|---|---|

Follow with:

Conclusion

==================================================
12.0 CONCLUSIONS
==================================================

Generate a formal regulatory conclusion.

Discuss:

- Precision
- Accuracy
- Linearity
- Sensitivity
- Specificity
- Reproducibility
- Reliability
- Clinical suitability

The conclusion must be written entirely in continuous scientific paragraphs.

==================================================
GLOBAL RULES
==================================================

Examples are provided solely to demonstrate table structure.

NEVER reproduce example analytes or numerical values.

All analytes, rows, measurements, and calculations must be dynamically derived from uploaded source documents.

Never fabricate measurements.

If data required for a calculation are unavailable, explain this scientifically instead of inventing values.

ALL tables MUST be valid GitHub Flavored Markdown tables containing:

- Header row
- Separator row
- Dynamically generated rows

Never output column-wise text or bullet lists in place of tables.

==================================================
OUTPUT JSON FORMAT
==================================================

Return a flat JSON object with exactly these keys:

{
  "7": "<Analytical Studies Overview paragraph>",
  "7.1": "<Precision study with markdown table>",
  "7.1a": "<Between-Run Precision study with markdown table>",
  "7.2": "<Accuracy study with markdown table>",
  "7.3": "<Linearity study with markdown table>",
  "9.1": "<Reproducibility narrative>",
  "10.0a": "<Analytical Sensitivity Overview narrative>",
  "10.1": "<Analytical Sensitivity Study with markdown table>",
  "11.0a": "<Analytical Specificity Overview narrative>",
  "11.1": "<Analytical Specificity Study with markdown table>"
}

Return ONLY valid JSON — no markdown fences, no preamble, no explanation.
`;
}

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
    const targetFile = formData.get("targetFile") as File | null;
    if (!files || files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

    // Extract target values text if a target file was provided
    let targetContext = "";
    if (targetFile) {
      const targetBuffer = Buffer.from(await targetFile.arrayBuffer());
      const targetLower = targetFile.name.toLowerCase();
      try {
        if (targetFile.type === "application/pdf" || targetLower.endsWith(".pdf")) {
          targetContext = await extractTextFromPDF(targetBuffer);
        } else if (
          targetFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          targetLower.endsWith(".docx")
        ) {
          targetContext = await extractTextFromDocx(targetBuffer);
        } else if (targetFile.type.startsWith("text/") || targetLower.match(/\.(txt|csv|xml|json|md)$/i)) {
          targetContext = targetBuffer.toString("utf-8");
        }
        targetContext = targetContext.slice(0, 30_000);
        console.log(`[analytical-all] Target file "${targetFile.name}" extracted, ${targetContext.length} chars`);
      } catch (e) {
        console.error("[analytical-all] Target file extraction failed:", e);
      }
    }

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
          content: `You are a Regulatory Affairs and QA/RA expert specializing in IVD medical devices and CDSCO Technical File / Device Master File (DMF) requirements. Follow instructions exactly and return ONLY a flat JSON structure.
You MUST return a JSON object with EXACTLY these keys mapping to Markdown content:
"7": Analytical Studies Overview
"7.1": Precision Study Table and Interpretation
"7.1a": Between-Run Precision Study Table
"7.2": Accuracy Study Table and Interpretation
"7.3": Linearity Study Table and Interpretation
"9.1": Reproducibility Summary
"10.0a": Analytical Sensitivity Overview
"10.1": Analytical Sensitivity Study Table and Interpretation
"11.0a":Analytical Specificity Overview
"11.1":Table 6: Analytical Specificity Study

Do NOT include any other keys. Do NOT nest the JSON.`,
        },
        {
          role: "user",
          content: `${buildAnalyticalPrompt(targetContext)}\n\nSOURCE CONTEXT:\n${docSourceContent.slice(0, 120000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    let generatedData: Record<string, string> = {};
    try {
      const parsedData = JSON.parse(rawJson);
      for (const [k, v] of Object.entries(parsedData)) {
        let cleanKey = k.trim();
        if (cleanKey === "11.0" || cleanKey === "11a" || cleanKey === "11.0a") {
          cleanKey = "11.0a";
        } else if (cleanKey === "11" || cleanKey === "11.1") {
          cleanKey = "11.1";
        } else if (cleanKey === "10.0" || cleanKey === "10.0a") {
          cleanKey = "10.0a";
        } else if (cleanKey === "10" || cleanKey === "10.1") {
          cleanKey = "10.1";
        } else if (cleanKey === "9" || cleanKey === "9.1") {
          cleanKey = "9.1";
        } else if (cleanKey === "7" || cleanKey === "7.0") {
          cleanKey = "7";
        }
        generatedData[cleanKey] = typeof v === "string" ? v : JSON.stringify(v);
      }
    } catch (err) {
      console.error("[analytical-all] JSON parse failed", rawJson);
      return NextResponse.json({ error: "OpenAI did not return valid JSON content structure" }, { status: 500 });
    }

    // Save fields into document sections Map
    if (!doc.sections) doc.sections = new Map();

    const fieldToSectionMapping: Record<string, string> = {
      "7": "s7",
      "7.1": "s7",
      "7.1a": "s7",
      "7.2": "s7",
      "7.3": "s7",
      "9.1": "s9",
      "10.0a": "s10_sensitivity",
      "10.1": "s10_sensitivity",
      "11.0a": "s11_specificity",
      "11.1": "s11_specificity"
    };

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
      return Object.entries(obj).map(([key, value]) => {
        const headingPrefix = "#".repeat(Math.min(6, level + 2));
        if (typeof value === "object" && value !== null) {
          return `${headingPrefix} ${key}\n${formatObjectToMarkdown(value, level + 1)}`;
        }
        const strVal = String(value);
        const cleanVal = strVal.includes("||") ? strVal.trim().replace(/\|\|\s*$/, "").replace(/\|\|/g, "\n|") : strVal;
        return `**${key}**: ${cleanVal}`;
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
