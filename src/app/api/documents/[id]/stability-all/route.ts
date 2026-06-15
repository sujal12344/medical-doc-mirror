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

// ─── Text extraction helpers ──────────────────────────────────────────────────

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

// Helper to recalculate stability table recoveries for mathematical precision
function recalculateTableRecoveries(markdown: string): string {
  if (!markdown) return markdown;

  const lines = markdown.split(/\r?\n/);
  const updatedLines: string[] = [];

  let inTable = false;
  let tableHeaders: string[] = [];
  let headerIndex = -1;
  let dividerIndex = -1;
  let rows: string[][] = [];
  let rawRows: string[] = [];

  const flushTable = () => {
    if (rows.length === 0) {
      if (headerIndex !== -1) updatedLines.push(lines[headerIndex]);
      if (dividerIndex !== -1) updatedLines.push(lines[dividerIndex]);
      tableHeaders = [];
      headerIndex = -1;
      dividerIndex = -1;
      return;
    }

    const cleanHeaders = tableHeaders.map(h => h.trim().toLowerCase());
    let valueColIdx = -1;
    let recoveryColIdx = -1;
    let resultColIdx = -1;
    let timeColIdx = -1;

    for (let i = 0; i < cleanHeaders.length; i++) {
      const h = cleanHeaders[i];
      if (h.includes("recovery")) {
        recoveryColIdx = i;
      } else if (h === "result") {
        resultColIdx = i;
      } else if (h.includes("activity") || h.includes("absorbance") || h.includes("measured") || h.includes("control") || h.includes("val")) {
        valueColIdx = i;
      } else if (h.includes("day") || h.includes("time") || h.includes("s. no") || h === "interval" || h.includes("point")) {
        timeColIdx = i;
      }
    }

    if (valueColIdx === -1 || recoveryColIdx === -1) {
      updatedLines.push(lines[headerIndex]);
      updatedLines.push(lines[dividerIndex]);
      for (const row of rawRows) {
        updatedLines.push(row);
      }
      rows = [];
      rawRows = [];
      headerIndex = -1;
      dividerIndex = -1;
      return;
    }

    let baselineVal: number | null = null;
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const timeValStr = (timeColIdx !== -1 ? row[timeColIdx] : "").trim().toLowerCase();
      if (timeValStr === "0" || timeValStr === "day 0" || timeValStr.startsWith("day 0") || timeValStr === "week 0" || timeValStr === "month 0" || r === 0) {
        const valStr = row[valueColIdx].trim();
        const match = valStr.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (match) {
          baselineVal = parseFloat(match[1]);
          break;
        }
      }
    }

    if (baselineVal === null || isNaN(baselineVal) || baselineVal === 0) {
      if (rows.length > 0) {
        const valStr = rows[0][valueColIdx].trim();
        const match = valStr.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (match) {
          baselineVal = parseFloat(match[1]);
        }
      }
    }

    const reconstructedRows: string[] = [];
    for (let r = 0; r < rows.length; r++) {
      const row = [...rows[r]];
      const valStr = row[valueColIdx].trim();
      const match = valStr.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (match && baselineVal && baselineVal !== 0) {
        const currentVal = parseFloat(match[1]);
        const recovery = (currentVal / baselineVal) * 100;
        row[recoveryColIdx] = ` ${recovery.toFixed(1)} `;
        if (resultColIdx !== -1) {
          row[resultColIdx] = recovery >= 90 ? " Pass " : " Fail ";
        }
      } else {
        if (r === 0) {
          row[recoveryColIdx] = " 100.0 ";
          if (resultColIdx !== -1) {
            row[resultColIdx] = " Pass ";
          }
        }
      }
      reconstructedRows.push(`|${row.join("|")}|`);
    }

    updatedLines.push(lines[headerIndex]);
    updatedLines.push(lines[dividerIndex]);
    for (const r of reconstructedRows) {
      updatedLines.push(r);
    }

    rows = [];
    rawRows = [];
    headerIndex = -1;
    dividerIndex = -1;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const isRow = line.trim().startsWith("|") && line.trim().endsWith("|");

    if (isRow) {
      const rawCells = line.trim().slice(1, -1).split("|");

      if (!inTable) {
        const nextLine = lines[idx + 1];
        if (nextLine && nextLine.trim().startsWith("|") && nextLine.trim().includes("-")) {
          inTable = true;
          tableHeaders = rawCells;
          headerIndex = idx;
          dividerIndex = idx + 1;
          idx++;
          continue;
        } else {
          updatedLines.push(line);
        }
      } else {
        rows.push(rawCells);
        rawRows.push(line);
      }
    } else {
      if (inTable) {
        flushTable();
        inTable = false;
      }
      updatedLines.push(line);
    }
  }

  if (inTable) {
    flushTable();
  }

  return updatedLines.join("\n");
}

// ─── Master Rules ─────────────────────────────────────────────────────────────

const MASTER_RULES = `
MASTER RULES — APPLY TO THIS REPORT

You are a Regulatory Affairs Specialist preparing Device Master File (DMF) documentation for an IVD medical device.

MANDATORY RULES:
1. Maintain EXACT section numbering as instructed.
2. Maintain EXACT table numbering as instructed.
3. Preserve section sequence exactly — do not reorder.
4. Output professional regulatory Markdown. No code fences. No preamble.
5. Never omit any section.
6. Use formal regulatory language.
7. Follow EN ISO 23640 requirements.
8. For PROCEDURE: copy exactly from IFU. Do NOT summarize, paraphrase, or generate.
9. For PRODUCT / KIT / STORAGE: extract from IFU.
10. For BATCH INFO (Lot, Mfg, Exp): extract from COA or uploaded documents.

DATE CALCULATION RULE:
- Release Date = Day 0 (inclusive).
- Do NOT count Sundays in weekly intervals.
- Example (Release Date = 04 January 2021, Monday):
    1 Week  → 11 January 2021
    2 Weeks → 18 January 2021
    3 Weeks → 25 January 2021
    4 Weeks → 01 February 2021
    Day 1   → 05 January 2021
    Day 7   → 11 January 2021
    1 Month → 03 February 2021  (add 1 calendar month, subtract 1 day)
    2 Months → 03 March 2021
    3 Months → 03 April 2021
- Expected Date: calculated per above rules.
- Testing Date: = Expected Date, unless it falls on Saturday → next Monday. Expected Date unchanged.

OUTPUT: Raw Markdown only. Output ONLY the complete report. Nothing else.
`;

// ─── PROCEDURE extraction rules (injected into every §6/§7 section) ──────────

const PROCEDURE_EXTRACTION_RULES = `
PROCEDURE EXTRACTION RULES (CRITICAL):

The Procedure section is an EXTRACTION task — NOT a generation task.

SOURCE PRIORITY: IFU → Product Insert → Package Insert.

EXTRACT ALL subsections exactly as found, including:
- Procedure introduction
- Manual Method (wavelength, temperature, cuvette, read instructions)
- Reagent volume table (Blank / Standard / Sample rows with volumes)
- Incubation time and reading instructions
- Calculation formula (e.g. Albumin (g/dL) = (A Sample / A Standard) × n)
- Calculation with Factor
- Calibration (copy exactly, including reference material traceability)
- Automatic Analyser Procedure (if present)
- Automatic Analyser Calculation
- Automatic Analyser Calculation with Factor

PRESERVATION RULES:
- Preserve ALL tables exactly: column names, row names, units, ordering.
- Preserve ALL formulas exactly: symbols, variable names, brackets, operators.
- Preserve ALL instrument settings: wavelength, temperature, incubation time, cuvette path, volumes.
- Do NOT merge rows. Do NOT remove rows. Do NOT convert tables to paragraphs.
- Do NOT rewrite or simplify formulas.
- Do NOT generate calibration content — extract it verbatim.
`;

// ─── Stability data generation rules ─────────────────────────────────────────

const STABILITY_DATA_RULES = `
STABILITY DATA GENERATION RULES:

Step 1 — Identify measurement type from documents (Absorbance, Activity U/L, OD, Concentration, Signal).
Step 2 — Determine Day 0 baseline: use actual document value if present; otherwise generate a realistic baseline consistent with the assay (e.g. 0.45–0.85 for Absorbance; 80–140 U/L for enzymatic assays).
Step 3 — Generate a monotonic, gradual decline profile. No sudden drops. No increases.
Step 4 — Calculate % Recovery mathematically: (Current ÷ Day 0) × 100, rounded to 1 decimal place.
Step 5 — Determine Result: Pass if Recovery ≥ 90%; Fail otherwise.
Step 6 — Verify every row satisfies the recovery formula before output.

CRITICAL: Do NOT hardcode 100%, 98%, 96% etc. Values must be derived from the generated measurement numbers. Every table cell must be mathematically consistent.

EXAMPLE STABILITY TABLE:
| Day | Control Activity | % Recovery vs Day 0 | Visual Appearance | Result |
|---|---|---|---|---|
| 0 | 3.1 g/dL | 100.0 | Clear | Pass |
| 1 | 3.0 g/dL | 96.8 | Clear | Pass |
| 2 | 2.9 g/dL | 93.5 | Clear | Pass |
| 3 | 2.8 g/dL | 90.3 | Clear | Pass |
| 4 | 2.7 g/dL | 87.1 | Slightly Pale | Pass |
| 5 | 2.6 g/dL | 83.9 | Slightly Pale | Pass |
| 6 | 2.5 g/dL | 80.6 | Slightly Pale | Pass |
| 7 | 2.4 g/dL | 77.4 | Slightly Pale | Pass |
`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildInUsePrompt(docContent: string, procedureContext: string): string {
  const procSection = procedureContext.trim()
    ? `--- PROCEDURE CONTENT FROM VECTOR DATABASE ---\n${procedureContext}\n--- END PROCEDURE CONTENT ---`
    : "(No procedure retrieved from vector DB — extract from document content below)";

  return `${MASTER_RULES}

${PROCEDURE_EXTRACTION_RULES}

${STABILITY_DATA_RULES}

---

Generate a complete **In-Use Stability Study Report** in this EXACT order:

---

**Name of the Product:** [Extract from IFU/COA]
**Lot No.:** [Extract from COA] &emsp; **Mfg.:** [Extract from COA] &emsp; **Exp.:** [Extract from COA] &emsp; **Testing Interval:** 1 Week
**Quantity Sampled:** 10 Nos &emsp; **Test Date:** As Per Calendar

---

### 1. Objective and Purpose of Testing

Write a formal paragraph:
- Purpose of In-Use Stability testing per EN ISO 23640.
- The study confirms the product maintains physical, chemical, and biological properties after opening and during use.
- Reference the testing protocol: storage at 2–8°C (or as per IFU), weekly intervals for 4 weeks.

---

### 2. Storage Conditions

Extract storage conditions exactly from IFU (temperature range, light protection, freeze prohibition).

---

### 3. Calendar for In Use Stability Testing

**Table 3.1 Calendar for In Use Stability Testing**

| S. No. | Testing Interval | Expected Date | Testing Date |
|--------|-----------------|---------------|--------------|

Generate rows: Day 0, 1 Week, 2 Weeks, 3 Weeks, 4 Weeks.
Calculate all dates from Release Date. Apply DATE CALCULATION RULE and weekend adjustment.

---

### 4. Product Description

**Product Name:** [From IFU]
**Intended Use:** [Copy intended use statement verbatim from IFU]

---

### 5. Kit Content

**Table 5.1 Kit Content**

| Component | Quantity |
|-----------|----------|

Extract all components and quantities from IFU.

---

### 6. Procedure

${procSection}

Using the PROCEDURE EXTRACTION RULES above, reproduce the complete procedure from the IFU exactly. Include all subsections, tables, formulas, instrument settings, and calibration instructions verbatim.

---

### 7. In Use Stability Study

**Table 7.1 In Use Stability Study**

| Time Point | Absorbance / Activity | % Recovery vs Day 0 | Visual Appearance | Result |
|------------|-----------------------|---------------------|-------------------|--------|

Using STABILITY DATA GENERATION RULES: generate rows for Day 0, Week 1, Week 2, Week 3, Week 4.
Visual appearance may progress gradually from "Clear" to "Slightly Pale" in later weeks.

---

### 8. Conclusion

Write a formal regulatory conclusion:
- Product remains stable for the claimed open-vial period.
- % recovery remained within ±10% acceptance criteria throughout.
- State the final claimed in-use stability period and storage conditions.

---

### 9. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Analyzed By | | | [Final testing date] |
| Checked By | | | [Final testing date] |
| Approved By | | | [Final testing date] |

---

DOCUMENT CONTENT:
${docContent.slice(0, 85000)}
`;
}

function buildAcceleratedPrompt(docContent: string, procedureContext: string, fileLabel: string): string {
  const procSection = procedureContext.trim()
    ? `--- PROCEDURE CONTENT FROM VECTOR DATABASE ---\n${procedureContext}\n--- END PROCEDURE CONTENT ---`
    : "(No procedure retrieved from vector DB — extract from document content below)";

  return `${MASTER_RULES}

${PROCEDURE_EXTRACTION_RULES}

${STABILITY_DATA_RULES}

---

Generate a complete **Accelerated Stability Study Report** for: ${fileLabel}

Use this EXACT section order:

---

**Name of the Product:** [Extract from IFU/COA]
**Lot No.:** [Extract from COA] &emsp; **Mfg.:** [Extract from COA] &emsp; **Exp.:** [Extract from COA] &emsp; **Testing Interval:** 1 Month
**Quantity Sampled:** 10 Nos &emsp; **Test Date:** As Per Calendar

---

### 1. Objective and Purpose of Testing

Write a formal paragraph:
- Purpose of accelerated stability testing per EN ISO 23640.
- Study conducted at 37°C ± 2°C to simulate real-time aging using the Arrhenius equation.
- Objective: confirm performance within claimed shelf life.

---

### 2. Study Protocol

State:
- Storage Temperature: 37°C ± 2°C, protected from light.
- Explain Arrhenius-based accelerated aging approach and its relationship to real-time shelf life projection.
- Reference EN ISO 23640.

---

### 3. Storage Conditions

State normal storage conditions from IFU AND accelerated study conditions (37°C ± 2°C, light-protected).

---

### 4. Calendar For Stability Testing

**Table 4.1 Calendar for Accelerated Stability Testing**

| S. No. | Testing Interval | Expected Date | Testing Date |
|--------|-----------------|---------------|--------------|

Rows: Day 0, 1 Month, 2 Months, 3 Months.
Month calculation: Release Date + 1 calendar month − 1 day. Apply weekend adjustment. Do NOT count Sundays.

---

### 5. Product Description

**Product Name:** [From IFU]
**Intended Use:** [Copy intended use verbatim from IFU]

---

### 6. Kit Content

**Table 6.1 Kit Content**

| Component | Quantity |
|-----------|----------|

Extract from IFU.

---

### 7. Procedure

${procSection}

Using PROCEDURE EXTRACTION RULES, reproduce the complete procedure from IFU exactly — all subsections, tables, formulas, calibration instructions.

---

### 8. Accelerated Stability Study

**Table 8.1 Accelerated Stability Study**

| Time Point | Measured Activity | % Recovery vs Day 0 | Result |
|------------|------------------|---------------------|--------|

Using STABILITY DATA GENERATION RULES: rows for Day 0, 1 Month, 2 Months, 3 Months.
Monthly decline: typically 1%–3% per month. All recoveries must be ≥ 90%.

---

### 9. Conclusion

Write a formal conclusion:
- Arrhenius projection confirms real-time shelf life claim.
- Claimed shelf life per COA: [extract from documents].
- All parameters within acceptance criteria.

---

### 10. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Analyzed By | | | [3 Month test date] |
| Checked By | | | [3 Month test date] |
| Approved By | | | [3 Month test date] |

---

DOCUMENT CONTENT:
${docContent.slice(0, 85000)}
`;
}

function buildShippingPrompt(docContent: string, procedureContext: string): string {
  const procSection = procedureContext.trim()
    ? `--- PROCEDURE CONTENT FROM VECTOR DATABASE ---\n${procedureContext}\n--- END PROCEDURE CONTENT ---`
    : "(No procedure retrieved from vector DB — extract from document content below)";

  return `${MASTER_RULES}

${PROCEDURE_EXTRACTION_RULES}

${STABILITY_DATA_RULES}

---

Generate a complete **Shipping Stability Study Report** in this EXACT order:

---

**Name of the Product:** [Extract from IFU/COA]
**Lot No.:** [Extract from COA] &emsp; **Mfg.:** [Extract from COA] &emsp; **Exp.:** [Extract from COA] &emsp; **Testing Interval:** Daily (7 days)
**Quantity Sampled:** 10 Nos &emsp; **Test Date:** As Per Calendar

---

### 1. Objective and Purpose of Testing

Write a formal paragraph:
- Purpose of shipping stability per EN ISO 23640 and CLSI EP25-A.
- Study simulates transportation conditions (temperature excursions, vibration, physical stress).
- Include transportation simulation rationale and supply chain suitability.

---

### 2. Storage Conditions

Extract normal storage from IFU. Also state shipping simulation conditions (ambient up to 37°C, humidity, simulated transport).

---

### 3. Calendar For Stability Testing

**Table 3.1 Calendar For Stability Testing**

| S. No. | Testing Interval | Expected Date | Testing Date |
|--------|-----------------|---------------|--------------|

Rows: Day 0, Day 1, Day 2, Day 3, Day 4, Day 5, Day 6, Day 7.
Calculate from Release Date. Apply weekend adjustment. Do NOT skip Saturdays in daily count — only adjust Testing Date for weekends.

---

### 4. Product Description

**Product Name:** [From IFU]
**Intended Use:** [Copy intended use verbatim from IFU]

---

### 5. Kit Content

**Table 5.1 Kit Content**

| Component | Quantity |
|-----------|----------|

Extract from IFU.

---

### 6. Procedure

${procSection}

Using PROCEDURE EXTRACTION RULES, reproduce the complete procedure from IFU exactly — all subsections, tables, formulas, calibration instructions.

---

### 7. Shipping Stability Study Data

**Table 7.1 Shipping Stability Study Data**

| Day | Control Activity | % Recovery vs Day 0 | Visual Appearance | Result |
|-----|-----------------|---------------------|-------------------|--------|

Using STABILITY DATA GENERATION RULES: rows for Day 0 through Day 7.
Visual appearance: "Clear" → "Slightly Pale" toward Day 5–7. No precipitation. All results Pass (if recoveries ≥ 90%).

---

### 8. Conclusion

Write a formal conclusion:
- Product stable under simulated shipping conditions for 7 days.
- Suitable for domestic and international transportation.
- Elevated temperature simulation results confirm product integrity.

---

### 9. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Analyzed By | | | [Day 7 testing date] |
| Checked By | | | [Day 7 testing date] |
| Approved By | | | [Day 7 testing date] |

---

DOCUMENT CONTENT:
${docContent.slice(0, 85000)}
`;
}

function buildOverviewPrompt(
  inuse: string,
  accelerated: string,
  shipping: string
): string {
  return `You are a Regulatory Affairs Specialist. Write a concise, formal Stability Studies Overview for Section 14.0 of a CDSCO Device Master File (DMF).

Include:
1. Brief description of each study (In-Use, Accelerated, Shipping).
2. Standards applied (EN ISO 23640, CLSI EP25-A).
3. Storage conditions per study.
4. One-sentence conclusion per study.
Use formal regulatory language. Output raw Markdown paragraphs only — max 400 words. No code fences.

IN-USE REPORT SUMMARY:
${inuse.slice(0, 2000)}

ACCELERATED REPORT SUMMARY:
${accelerated.slice(0, 2000)}

SHIPPING REPORT SUMMARY:
${shipping.slice(0, 2000)}
`;
}

// ─── DMF auto-fill map ────────────────────────────────────────────────────────

const DMF_AUTOFILL: { sectionId: string; fieldId: string; sourceFieldId: string }[] = [
  { sectionId: "s17_inuse", fieldId: "17.0a", sourceFieldId: "sr_inuse" },
  { sectionId: "s16_shelf", fieldId: "16.0a", sourceFieldId: "sr_accelerated" },
  { sectionId: "s18_shipping", fieldId: "18.0a", sourceFieldId: "sr_shipping" },
];

// ─── Route Handler ────────────────────────────────────────────────────────────

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

    // ── Extract text per file ─────────────────────────────────────────────────
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

    // ── Index all uploaded content to Pinecone ────────────────────────────────
    for (const purpose of ["in_use_stability", "accelerated_stability", "shipping_stability"]) {
      try {
        await indexProductDocument(userId, combinedText, productNamespaceId, purpose);
      } catch (e) {
        console.error(`[stability-all] Pinecone index (${purpose}) failed:`, e);
      }
    }

    // ── Fetch procedure from vector DB ────────────────────────────────────────
    const PROCEDURE_QUERY =
      "analytical procedure manual method calculation calibration automatic analyser wavelength temperature reagent volume incubation";
    let procedureContext = await queryProductDocuments(userId, productNamespaceId, PROCEDURE_QUERY, 14);
    // Fall back to scanning the combined text for procedure section
    if (!procedureContext.trim()) {
      const match = combinedText.match(/PROCEDURE[\s\S]{0,15000}/i);
      procedureContext = match ? match[0].slice(0, 8000) : "";
    }

    // ── Fetch stability context from vector DB ────────────────────────────────
    const STABILITY_QUERY = `${product.name} stability studies shelf life in-use stability thermal stress accelerated aging Arrhenius shipping transport conditions real-time stability`;
    let stabilityVectorContext = "";
    try {
      stabilityVectorContext = await queryProductDocuments(userId, productNamespaceId, STABILITY_QUERY, 15);
    } catch (e) {
      console.warn("[stability-all] Stability vector context retrieval failed:", e);
    }

    const docSourceContent = stabilityVectorContext.trim()
      ? `--- Vector DB Matches (IFU & Product Context) ---\n${stabilityVectorContext}\n\n--- Newly Uploaded Document Content ---\n${combinedText}`
      : combinedText;

    if (!doc.sections) doc.sections = new Map();

    const generatedReports: Record<string, string> = {};

    // ── Generate In-Use Stability (single, combined docs) ────────────────────
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Regulatory Affairs Specialist generating professional IVD stability study reports for CDSCO DMF submissions. Follow instructions precisely. Output raw Markdown only.",
          },
          { role: "user", content: buildInUsePrompt(docSourceContent, procedureContext) },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });
      generatedReports["sr_inuse"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
    } catch (e) {
      console.error("[stability-all] In-Use generation failed:", e);
    }

    // ── Generate Accelerated Stability — one report per file if multiple ──────
    if (fileEntries.length > 1) {
      // Multiple files → separate accelerated report for each
      const accelReports: string[] = [];
      for (const entry of fileEntries) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a Regulatory Affairs Specialist. Generate a professional Accelerated Stability Study Report for CDSCO DMF. Follow instructions exactly. Output raw Markdown only.",
              },
              {
                role: "user",
                content: buildAcceleratedPrompt(entry.text, procedureContext, entry.name),
              },
            ],
            max_tokens: 4000,
            temperature: 0.1,
          });
          const rawReport = completion.choices[0]?.message?.content?.trim() || "";
          accelReports.push(recalculateTableRecoveries(rawReport));
        } catch (e) {
          console.error(`[stability-all] Accelerated (${entry.name}) failed:`, e);
        }
      }
      // Store first report in sr_accelerated; append extras with separators
      generatedReports["sr_accelerated"] =
        accelReports.length > 1
          ? accelReports.map((r, i) => `## Accelerated Report ${i + 1} — ${fileEntries[i]?.name ?? ""}\n\n${r}`).join("\n\n---\n\n")
          : (accelReports[0] ?? "");
    } else {
      // Single file
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a Regulatory Affairs Specialist. Generate a professional Accelerated Stability Study Report for CDSCO DMF. Follow instructions exactly. Output raw Markdown only.",
            },
            {
              role: "user",
              content: buildAcceleratedPrompt(docSourceContent, procedureContext, fileEntries[0]?.name ?? "uploaded document"),
            },
          ],
          max_tokens: 4000,
          temperature: 0.1,
        });
        generatedReports["sr_accelerated"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
      } catch (e) {
        console.error("[stability-all] Accelerated generation failed:", e);
      }
    }

    // ── Generate Shipping Stability (single, combined docs) ───────────────────
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Regulatory Affairs Specialist. Generate a professional Shipping Stability Study Report for CDSCO DMF. Follow instructions exactly. Output raw Markdown only.",
          },
          { role: "user", content: buildShippingPrompt(docSourceContent, procedureContext) },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });
      generatedReports["sr_shipping"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
    } catch (e) {
      console.error("[stability-all] Shipping generation failed:", e);
    }

    // ── Save reports to s_stability_reports section ───────────────────────────
    const reportTargets = [
      { sectionId: "s_stability_reports", fieldId: "sr_inuse" },
      { sectionId: "s_stability_reports", fieldId: "sr_accelerated" },
      { sectionId: "s_stability_reports", fieldId: "sr_shipping" },
    ];

    for (const t of reportTargets) {
      const content = generatedReports[t.fieldId];
      if (!content) continue;
      const sd = doc.sections.get(t.sectionId) || { fields: {}, completionPct: 0 };
      sd.fields = { ...sd.fields, [t.fieldId]: content };
      const secObj = fw.sections.find((s) => s.id === t.sectionId);
      if (secObj) {
        const filled = secObj.fields.filter((f) => (sd.fields[f.id] || "").trim()).length;
        sd.completionPct = Math.round((filled / secObj.fields.length) * 100);
      }
      doc.sections.set(t.sectionId, sd);
    }

    // ── Generate concise 5-6 line descriptions (no tables) and extract shelf life months ──
    let conciseInUse = "";
    let conciseShelfLife = "";
    let conciseShipping = "";
    let shelfLifeMonths = "";

    try {
      const summaryPrompt = `
Analyze the following generated stability study reports.

1. Generate a concise 5-6 line paragraph description for Section 17.0 (In-Use Stability). It must contain NO tables, NO markdown list markers, and NO bullet/pointwise list elements — only a clean, continuous technical narrative paragraph.
2. Generate a concise 5-6 line paragraph description for Section 16.0 (Claimed Shelf Life). It MUST contain the final conclusion of the stability test (affirming whether the accelerated stability study validates the claimed shelf life). It must contain NO tables, NO markdown list markers, and NO bullet/pointwise list elements — only a clean, continuous technical narrative paragraph.
3. Generate a concise 5-6 line paragraph description for Section 18.0 (Shipping Stability). It must contain NO tables, NO markdown list markers, and NO bullet/pointwise list elements — only a clean, continuous technical narrative paragraph.
4. Extract or determine the claimed shelf life duration in months from the accelerated stability report or normal shelf life claims. Output ONLY the duration as "X months" (e.g. "18 months" or "24 months") with no other words or text.

Your output must be a flat JSON object with keys:
"inuse_desc": "5-6 lines description",
"shelf_desc": "5-6 lines description including conclusion",
"shipping_desc": "5-6 lines description",
"shelf_months": "X months"

---
IN-USE REPORT:
${generatedReports["sr_inuse"] || ""}

ACCELERATED REPORT:
${generatedReports["sr_accelerated"] || ""}

SHIPPING REPORT:
${generatedReports["sr_shipping"] || ""}
`;

      const summaryRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a Regulatory Affairs Specialist. Help write clean summary paragraphs and extract shelf life." },
          { role: "user", content: summaryPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const summaryObj = JSON.parse(summaryRes.choices[0]?.message?.content || "{}");
      conciseInUse = summaryObj.inuse_desc || "";
      conciseShelfLife = summaryObj.shelf_desc || "";
      conciseShipping = summaryObj.shipping_desc || "";
      shelfLifeMonths = summaryObj.shelf_months || "";
    } catch (sumErr) {
      console.error("[stability-all] Summarization failed:", sumErr);
    }

    // Save concise descriptions to s16_shelf, s17_inuse, s18_shipping and shelfLifeMonths to s1 (Claimed Shelf Life 1.1d)
    if (conciseInUse) {
      const sd = doc.sections.get("s17_inuse") || { fields: {}, completionPct: 100 };
      sd.fields = { ...sd.fields, "17.0a": conciseInUse };
      sd.completionPct = 100;
      doc.sections.set("s17_inuse", sd);
    }
    if (conciseShelfLife) {
      const sd = doc.sections.get("s16_shelf") || { fields: {}, completionPct: 100 };
      sd.fields = { ...sd.fields, "16.0a": conciseShelfLife };
      sd.completionPct = 100;
      doc.sections.set("s16_shelf", sd);
    }
    if (conciseShipping) {
      const sd = doc.sections.get("s18_shipping") || { fields: {}, completionPct: 100 };
      sd.fields = { ...sd.fields, "18.0a": conciseShipping };
      sd.completionPct = 100;
      doc.sections.set("s18_shipping", sd);
    }
    if (shelfLifeMonths) {
      const sd = doc.sections.get("s1") || { fields: {}, completionPct: 0 };
      sd.fields = { ...sd.fields, "1.1d": shelfLifeMonths };
      const secObj = fw.sections.find((s) => s.id === "s1");
      if (secObj) {
        const filled = secObj.fields.filter((f) => String(sd.fields[f.id] || "").trim()).length;
        sd.completionPct = Math.round((filled / secObj.fields.length) * 100);
      }
      doc.sections.set("s1", sd);
    }

    // ── Generate overview for s14_stability ───────────────────────────────────
    try {
      const ov = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a Regulatory Affairs Specialist. Write concise formal regulatory text for DMF submissions.",
          },
          {
            role: "user",
            content: buildOverviewPrompt(
              generatedReports["sr_inuse"] || "",
              generatedReports["sr_accelerated"] || "",
              generatedReports["sr_shipping"] || ""
            ),
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });
      const overview = ov.choices[0]?.message?.content?.trim() || "";
      if (overview) {
        const sd = doc.sections.get("s14_stability") || { fields: {}, completionPct: 0 };
        sd.fields = { ...sd.fields, "15.0a": overview };
        sd.completionPct = 100;
        doc.sections.set("s14_stability", sd);
        generatedReports["overview"] = overview;
      }
    } catch (e) {
      console.error("[stability-all] Overview generation failed:", e);
    }

    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      filesUploaded: fileEntries.map((f) => f.name).join(", "),
      reportsGenerated: ["sr_inuse", "sr_accelerated", "sr_shipping"].filter(
        (k) => !!generatedReports[k]
      ).length,
      acceleratedCount: fileEntries.length > 1 ? fileEntries.length : 1,
      overviewGenerated: !!generatedReports["overview"],
      results: generatedReports,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST stability-all failed:", error);
    return NextResponse.json(
      { error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
