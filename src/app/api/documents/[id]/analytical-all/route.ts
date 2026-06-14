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
You are a biostatistician and regulatory affairs specialist preparing Device Master File (DMF) technical documentation, Design Verification Reports, or Performance Evaluation Reports in accordance with CLSI guidelines, IVDR technical documentation, and CDSCO Device Master File requirements.

Your output must read like a professionally written, continuous scientific validation report. Avoid presenting content as pointwise summaries, extracted bullet points, or isolated data metrics (e.g. Mean = 3.08).

WRITING STYLE & STRUCTURE RULES:
- Write every section in continuous narrative form with detailed explanations and smooth transitions between paragraphs.
- The flow of every section must follow:
  Introduction and study rationale -> Study design and methodology -> Statistical approach -> Presentation of results -> Interpretation of findings -> Regulatory conclusion.
- Introduce every table with explanatory narrative text, and follow every table with a dedicated section titled "Interpretation of Results" or "Key Findings" detailing clinical relevance, compliance, relative variability, precision, and accuracy.
- Generate conclusions explaining the analytical significance of the findings rather than simple "Pass" or "Acceptable" statements.

TABLE GENERATION RULES:
- Generate tables dynamically based on available replicate measurements.
- Calculate and output appropriate statistical parameters: Mean, Grand Mean, Standard Deviation (SD), Standard Error of Mean (SEM), Coefficient of Variation (%CV), Recovery (%), Bias, Percent Bias, Detection Rate, Limit of Detection (LoD), Functional Sensitivity, Analytical Specificity Ratio, Signal-to-Noise Ratio, Slope, Intercept, Correlation Coefficient, and R² where applicable.
- Do not fabricate numerical values. Perform calculations based on actual raw measurements or sample runs present in the source files.

LINEARITY RULES:
- Generate a Linearity table ONLY when multiple concentration levels are available.
- If only a single concentration level exists, do not output a linearity table or regression parameters. Instead, write a detailed narrative discussion describing the analytical measuring range and available evidence.
- If multiple concentration levels are present, perform regression analysis (reporting slope, intercept, correlation coefficient, R²) and generate appropriate tables and interpretation.

REPRODUCIBILITY RULES:
- The Reproducibility section must ALWAYS be written as descriptive, continuous text.
- Do NOT generate tables for reproducibility.
- Discuss variability between runs, days, operators, lots, instruments, and sites using complete paragraphs.

---

# 7.0 Summary of Analytical Study
Generate a comprehensive narrative describing the analytical performance evaluation of the device. Establish the intended analytical purpose, principle of measurement, and device classification. Outline the specific performance characteristics evaluated, the overall analytical performance, the analytical range and detection capability, and summarize the validation studies performed. Avoid bulleted lists.

# 7.1 Precision Test
Write a complete precision study in continuous paragraph form following the standard flow (Introduction -> Design/Methodology -> Statistical approach -> Results -> Interpretation -> Regulatory conclusion).
If replicate measurements are available, calculate and present a dynamically structured precision table (including Mean, SD, %CV, and acceptance criteria). Do not output isolated values.
Immediately follow the table with an "Interpretation of Results" section discussing analytical significance, relative variability, precision characteristics, and compliance with quality requirements.

# 7.2 Accuracy Test
Write a complete accuracy study in continuous paragraph form following the standard flow.
If target values and measured values are available, calculate and present a dynamically structured accuracy table (including Mean, Recovery %, Bias %, and acceptance criteria).
Immediately follow the table with an "Interpretation of Results" section discussing trueness, accuracy characteristics, and clinical relevance.

# 7.3 Linearity Test
Write a complete linearity study in continuous paragraph form following the standard flow.
Generate a linearity table and regression parameters (slope, intercept, correlation coefficient, and R²) ONLY if multiple concentration levels are present in the source data.
If only a single concentration level is present, do not output a table or regression parameters; write a descriptive narrative of the analytical measuring range instead.
Immediately follow any table with an "Interpretation of Results" section.

# 8.1 Specimen Type
Generate a detailed narrative describing specimen validation. Discuss specimen matrices evaluated, collection requirements, preparation, storage, transport, stability, freeze-thaw limitations, and anticoagulants. Generate specimen comparison tables only if supported by the available information.

# 9.1 Reproducibility
Generate a detailed narrative discussion describing intermediate precision and reproducibility. 
DO NOT generate any tables for this section. The entire section must be written as descriptive, continuous text.
Discuss variability associated with different days, runs, operators, lots, sites, and instruments in complete paragraphs.

# 10.0a Analytical Sensitivity Overview
Generate a detailed narrative discussing analytical sensitivity, limit studies, and detection capability. Explain the objective, sample matrix, analyte, preparation, concentrations, testing strategy, and how Limit of Blank (LoB), Limit of Detection (LoD), and Limit of Quantitation (LoQ) were established. Do not generate tables in this section.

# 10.1 Analytical Sensitivity Study
Generate a table only if concentration-level sensitivity data and replicate data are available. Include columns for concentration level, replicates tested/detected, detection rate, mean response, and result. Follow with a detailed narrative interpretation and conclusions. If data is unavailable, provide descriptive text only.

# 11.0 Analytical Specificity Overview
Generate a complete analytical specificity section written in narrative form. Describe interfering substances evaluated, cross-reactivity studies, endogenous/exogenous interference, matrix effects (hemolysis, lipemia, icterus, bilirubin, drugs, etc.), results, and clinical significance.

# 11.1 Analytical Specificity Study
Generate an analytical specificity table if interference or cross-reactivity data are available. Include columns for interfering/cross-reacting substance, concentration tested, bias or cross-reactivity %, and result. Follow with a detailed interpretation of specificity performance.

# 12.0 Conclusions
Generate a detailed, formal regulatory conclusion explaining what the calculated results demonstrate regarding the overall precision, accuracy, linearity, detection capability, specificity, reliability, reproducibility, and clinical suitability of the assay for its intended use.
`;;

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
