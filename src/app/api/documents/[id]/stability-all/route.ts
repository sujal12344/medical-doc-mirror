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
    2 Months → 05 March 2021
    3 Months → 04 April 2021
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
const VALUE_SHEET_RULES = `
VALUE SHEET EXTRACTION RULES (CRITICAL):

SOURCE PRIORITY:

1. Value Sheet document
2. Existing Stability Report
3. IFU / Package Insert

The Value Sheet is authoritative for:

- Parameter names
- Method names
- Units
- Target values
- Decimal precision

Preserve everything exactly.

Never abbreviate method names.

Never change units.

Never reorder analytes.

Never omit rows.

All weekly analytical tables must follow the same structure and analyte sequence as the Value Sheet.

The existing stability report should only be used to determine:

- Number of weeks
- Table numbering
- Overall report formatting

Not as the source for parameter definitions.
`;
// ─── Stability data generation rules ─────────────────────────────────────────

const STABILITY_DATA_RULES = `
IN-USE STABILITY TABLE GENERATION RULES (CRITICAL):

PRIMARY SOURCE:
Value Sheet document is the PRIMARY source for analytical tables and replicate values.

SECONDARY SOURCE:
Existing Stability Reports may be used only to understand formatting and week structure.

────────────────────────
TABLE STRUCTURE
────────────────────────

The analytical section must NOT be summarized into one table.

Generate separate tables for each available time point.

Examples:

If duration = 1 week:
- Day 0
- Week 1

If duration = 2 weeks:
- Day 0
- Week 1
- Week 2

If duration = 5 weeks:
Generate SIX independent tables:

Table 7.1 Day 0
Table 7.2 Week 1
Table 7.3 Week 2
Table 7.4 Week 3
Table 7.5 Week 4
Table 7.6 Week 5

Never combine all weeks into one table.

────────────────────────
COLUMN STRUCTURE
────────────────────────

Preserve columns exactly:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Do not remove columns.
Do not reorder columns.
Do not rename columns.
Do not merge rows.

────────────────────────
SOURCE OF PARAMETERS
────────────────────────

Extract from Value Sheet:

- Parameter
- Method
- Unit
- Target value

Preserve names and units exactly.

────────────────────────
REPLICATE VALUE RULES
────────────────────────

Replicate values must appear for every week.

Rep 1, Rep 2 and Rep 3 are mandatory.

Values should remain close to target values and remain within acceptable limits.

The values should exhibit realistic analytical variation.

Variation between weeks must be gradual.

No sudden jumps.

Replicate values should fluctuate naturally around target values.

Values should remain stable throughout the claimed period.

────────────────────────
NUMBER OF ROWS
────────────────────────

All analytes present in the Value Sheet must be included.

Do not omit analytes.

Maintain identical row order as the Value Sheet.

────────────────────────
FORMAT PRESERVATION
────────────────────────

Preserve:

- Method names
- Capitalization
- Units
- Decimal places
- Parameter order

exactly as found.

Do not convert tables to paragraphs.

Do not summarize.

Do not create average columns.

Do not create % recovery columns.

Do not create Result columns.

Only reproduce the analytical tables with Rep 1, Rep 2 and Rep 3 values.

────────────────────────
TIME POINT DETECTION
────────────────────────

Detect study duration automatically.

Generate only those week tables that exist.

Example:

Duration = 4 weeks

Generate:

Day 0
Week 1
Week 2
Week 3
Week 4

Duration = 3 weeks

Generate:

Day 0
Week 1
Week 2
Week 3

Duration is always 5 weeks, so you have to generate independent 5 tables

────────────────────────
ANALYTICAL PERFORMANCE

All replicate values should indicate that the product remains within specification.

No analyte should show unrealistic degradation.

The generated data should resemble actual QC measurements.
`;
const SHIPPING_STABILITY_DATA_RULES = `
SHIPPING STABILITY DATA GENERATION RULES (CRITICAL):

PRIMARY SOURCE:
Value Sheet document is the PRIMARY source for analytical tables and replicate values.

SECONDARY SOURCE:
Existing Shipping Stability Reports may be used only to understand formatting and study duration.

────────────────────────
TABLE STRUCTURE
────────────────────────

The analytical section is an extraction-and-generation task.

Never generate a single summary table containing:

- Control Activity
- % Recovery vs Day 0
- Visual Appearance
- Result

Instead generate separate analytical tables for each day.

Examples:

Duration = 3 days

Day 0
Day 1
Day 2
Day 3

Duration = 7 days

Day 0
Day 1
Day 2
Day 3
Day 4
Day 5
Day 6
Day 7

Never combine all days into one table.

────────────────────────
COLUMN STRUCTURE
────────────────────────

Preserve columns exactly:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Do not remove columns.

Do not rename columns.

Do not merge rows.

Do not reorder rows.

────────────────────────
SOURCE OF PARAMETERS
────────────────────────

Extract from Value Sheet:

- Parameter
- Method
- Unit
- Target value

Preserve names and units exactly.

────────────────────────
REPLICATE VALUE RULES
────────────────────────

Rep 1, Rep 2 and Rep 3 are mandatory for every analyte and every day.

Values should remain close to target values.

Values should demonstrate realistic analytical variation.

Variation between days should be gradual.

No sudden jumps.

No unrealistic degradation.

Values should fluctuate naturally around the target values.

All values should remain within acceptable limits throughout the shipping study.

────────────────────────
NUMBER OF ROWS
────────────────────────

Include all analytes present in the Value Sheet.

Do not omit analytes.

Maintain identical analyte order.

────────────────────────
FORMAT PRESERVATION
────────────────────────

Preserve:

- Method names
- Units
- Capitalization
- Decimal places
- Parameter order

exactly as found.

Do not summarize.

Do not create average columns.

Do not calculate % Recovery.

Do not create Result columns.

Do not create Visual Appearance columns.

────────────────────────
DAY DETECTION
────────────────────────

Determine shipping study duration automatically.

Generate only the day tables corresponding to the available duration.

Example:

Duration = 7 days

Generate:

Day 0
Day 1
Day 2
Day 3
Day 4
Day 5
Day 6
Day 7

Duration = 5 days

Generate:

Day 0
Day 1
Day 2
Day 3
Day 4
Day 5

Do not generate additional days.

────────────────────────
ANALYTICAL PERFORMANCE

The generated values should resemble actual QC measurements and demonstrate acceptable shipping stability.

The data should indicate that the product maintains performance throughout transportation conditions.
`;
const ACCELERATED_STABILITY_DATA_RULES = `
ACCELERATED STABILITY DATA GENERATION RULES (CRITICAL)

PRIMARY SOURCE:
Value Sheet document.

SECONDARY SOURCE:
Existing Accelerated Stability reports.

────────────────────────
BATCH REQUIREMENT

Generate three independent lots:

Lot 1
Lot 2
Lot 3

Each lot shall have its own complete stability study.

────────────────────────
TIME POINTS

Generate:

Day 0
Week 1
Week 2
Week 3
Week 4
Week 5

Generate separate tables.

Never combine weeks.

────────────────────────
TABLE FORMAT

Preserve exactly:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Do not create:

* Mean columns
* SD columns
* CV columns
* Recovery columns
* Result columns

────────────────────────
VALUE GENERATION

Replicate values must:

* stay close to target values;
* exhibit realistic analytical variation;
* vary gradually over time;
* remain within acceptable limits;
* differ slightly between lots.

Lot 1, Lot 2 and Lot 3 must have independent values.

Avoid identical replicate values between lots.

────────────────────────
ROW RULES

Include all analytes.

Preserve row order.

Preserve method names.

Preserve units.

Preserve decimal precision.

────────────────────────
OUTPUT STRUCTURE

Lot 1
Day 0 → Week 5

Lot 2
Day 0 → Week 5

Lot 3
Day 0 → Week 5

Total analytical tables:

3 lots × 6 time points = 18 tables.

All tables should resemble actual QC laboratory measurements and indicate acceptable accelerated stability performance.
`;


// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildInUsePrompt(docContent: string, procedureContext: string): string {
  const procSection = procedureContext.trim()
    ? `--- PROCEDURE CONTENT FROM VECTOR DATABASE ---\n${procedureContext}\n--- END PROCEDURE CONTENT ---`
    : "(No procedure retrieved from vector DB — extract from document content below)";

  return `${MASTER_RULES}

${PROCEDURE_EXTRACTION_RULES}
${VALUE_SHEET_RULES}
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

Use the Value Sheet document as the primary source.

Determine the stability duration from the report.

Generate one analytical table for every available time point.

Example:

Duration = 4 weeks

Table 7.1 Day 0
Table 7.2 Week 1
Table 7.3 Week 2
Table 7.4 Week 3
Table 7.5 Week 4

For each table reproduce:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Rules:

- Preserve parameter order from Value Sheet.
- Preserve method names exactly.
- Preserve units exactly.
- Preserve target values exactly.
- Replicate values must be present for every analyte.
- Replicate values should exhibit realistic week-to-week variation.
- Maintain decimal precision consistent with the Value Sheet.
- Do not calculate averages.
- Do not calculate % recovery.
- Do not add Result columns.
- Do not summarize into one table.
- Generate separate tables for each week.

If the duration is 1 week, generate Day 0 and Week 1 tables only.

If the duration is 4 weeks, generate Day 0 and Week 1–Week 4 tables.
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

${ACCELERATED_STABILITY_DATA_RULES}

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


### 4. Calendar For Accelerated Stability Testing

**Table 4.1 Calendar for Accelerated Stability Testing**

| S. No. | Testing Interval | Expected Date | Testing Date |
| ------ | ---------------- | ------------- | ------------ |

Generate rows:

* Day 0
* Week 1
* Week 2
* Week 3
* Week 4
* Week 5

Date calculation rules:

* Week 1 = Release Date + 7 days
* Week 2 = Release Date + 14 days
* Week 3 = Release Date + 21 days
* Week 4 = Release Date + 28 days
* Week 5 = Release Date + 35 days

Apply weekend adjustment.

Do not assign Sundays as testing dates.

If the calculated date falls on Sunday, move to the next working day.

Expected Date and Testing Date shall follow the same adjustment rules.


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

Use the Value Sheet document as the primary source.

Generate THREE independent lots.

Examples:

Lot 1

Lot 2

Lot 3

Each lot shall contain its own complete weekly stability study.

────────────────────────
LOT 1

Table 8.1 Day 0

Table 8.2 Week 1

Table 8.3 Week 2

Table 8.4 Week 3

Table 8.5 Week 4

Table 8.6 Week 5

────────────────────────
LOT 2

Table 8.7 Day 0

Table 8.8 Week 1

Table 8.9 Week 2

Table 8.10 Week 3

Table 8.11 Week 4

Table 8.12 Week 5

────────────────────────
LOT 3

Table 8.13 Day 0

Table 8.14 Week 1

Table 8.15 Week 2

Table 8.16 Week 3

Table 8.17 Week 4

Table 8.18 Week 5

────────────────────────
TABLE STRUCTURE

Every table shall preserve:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Preserve exactly:

* Parameter names
* Method names
* Units
* Decimal precision
* Row order

from the Value Sheet.

────────────────────────
REPLICATE VALUE RULES

Rep 1, Rep 2 and Rep 3 are mandatory.

Generate realistic laboratory variation.

Values should fluctuate naturally around the target values.

Week-to-week changes should be gradual.

Lot-to-lot values should also vary naturally.

Lot 1, Lot 2 and Lot 3 must not contain identical values.

All values should remain within acceptable limits.

Values should resemble actual QC measurements.

────────────────────────
LOT RULES

Generate:

Lot 1 → Day 0 to Week 5

Lot 2 → Day 0 to Week 5

Lot 3 → Day 0 to Week 5

All lots must contain the same analytes and structure.

Only replicate values should differ between lots.

────────────────────────
FORBIDDEN

Do NOT generate:

| Time Point | Measured Activity | % Recovery vs Day 0 | Result |

Do NOT calculate recovery percentages.

Do NOT create Result columns.

Do NOT summarize all weeks into one table.

Do NOT merge lots together.

Generate separate analytical tables for every week and every lot.


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

${SHIPPING_STABILITY_DATA_RULES}

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

Use the Value Sheet document as the primary source.

Determine the shipping stability duration automatically.

Generate one analytical table for every available day.

Example:

Duration = 7 days

Table 7.1 Day 0
Table 7.2 Day 1
Table 7.3 Day 2
Table 7.4 Day 3
Table 7.5 Day 4
Table 7.6 Day 5
Table 7.7 Day 6
Table 7.8 Day 7

For each table reproduce:

| S. No | Parameter | Method | Unit | Target | Rep 1 | Rep 2 | Rep 3 |

Rules:

- Preserve parameter order from the Value Sheet.
- Preserve method names exactly.
- Preserve units exactly.
- Preserve target values exactly.
- Preserve decimal precision exactly.
- Replicate values must be present for every analyte.
- Replicate values should exhibit realistic day-to-day analytical variation.
- Values should remain within specification throughout the shipping study.
- Variation should be gradual and random, similar to actual laboratory measurements.
- Do not calculate averages.
- Do not add % Recovery columns.
- Do not add Result columns.
- Do not add Visual Appearance columns.
- Do not summarize all days into one table.
- Generate separate tables for each day.

If the shipping study duration is 3 days, generate:

Table 7.1 Day 0
Table 7.2 Day 1
Table 7.3 Day 2
Table 7.4 Day 3

If the duration is 7 days, generate:

Table 7.1 Day 0
Table 7.2 Day 1
Table 7.3 Day 2
Table 7.4 Day 3
Table 7.5 Day 4
Table 7.6 Day 5
Table 7.7 Day 6
Table 7.8 Day 7

The number of rows in every table must exactly match the number of analytes present in the Value Sheet.

Do not omit analytes.

Do not reorder analytes.

Maintain identical structure across all day tables.

The generated analytical data should resemble actual QC measurements and indicate that the product maintains acceptable performance during shipping conditions.
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

    // ── Report type: 'inuse' | 'accelerated' | 'shipping' | 'all' (default) ──
    const reportType = (formData.get("type") as string | null) ?? "all";

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

    // ── Generate In-Use Stability ────────────────────────────────────────────
    if (reportType === "inuse" || reportType === "all") {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a Regulatory Affairs Specialist generating professional IVD stability study reports for CDSCO DMF submissions. Follow instructions precisely. Output raw Markdown only. CRITICAL: Generate ALL weekly tables completely. Do NOT stop mid-table or omit any time points. Each week must have its own complete table with all analyte rows.",
            },
            { role: "user", content: buildInUsePrompt(docSourceContent, procedureContext) },
          ],
          max_tokens: 16000,
          temperature: 0.1,
        });
        generatedReports["sr_inuse"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
      } catch (e) {
        console.error("[stability-all] In-Use generation failed:", e);
      }
    }

    // ── Generate Accelerated Stability (3 lots, each lot: Day 0 + Week 1–5) ──
    if (reportType === "accelerated" || reportType === "all") {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a Regulatory Affairs Specialist. Generate a professional Accelerated Stability Study Report for CDSCO DMF. Follow instructions exactly. Output raw Markdown only. CRITICAL: Generate ALL 3 lots completely. Each lot must have: Day 0, Week 1, Week 2, Week 3, Week 4, Week 5 — each as a separate complete table. Do NOT truncate. Do NOT stop early. Total = 18 tables (6 per lot × 3 lots).",
            },
            {
              role: "user",
              content: buildAcceleratedPrompt(docSourceContent, procedureContext, fileEntries[0]?.name ?? "uploaded document"),
            },
          ],
          max_tokens: 16384,
          temperature: 0.1,
        });
        generatedReports["sr_accelerated"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
      } catch (e) {
        console.error("[stability-all] Accelerated generation failed:", e);
      }
    }

    // ── Generate Shipping Stability (one table per day) ───────────────────────
    if (reportType === "shipping" || reportType === "all") {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a Regulatory Affairs Specialist. Generate a professional Shipping Stability Study Report for CDSCO DMF. Follow instructions exactly. Output raw Markdown only. CRITICAL: Generate ALL daily tables completely. Each day (Day 0 through Day 7) must have its own complete table with all analyte rows. Do NOT stop early.",
            },
            { role: "user", content: buildShippingPrompt(docSourceContent, procedureContext) },
          ],
          max_tokens: 16000,
          temperature: 0.1,
        });
        generatedReports["sr_shipping"] = recalculateTableRecoveries(completion.choices[0]?.message?.content?.trim() || "");
      } catch (e) {
        console.error("[stability-all] Shipping generation failed:", e);
      }
    }

    // ── Save reports to s_stability_reports section ───────────────────────────
    const reportTargets = [
      { sectionId: "s_stability_reports", fieldId: "sr_inuse" },
      { sectionId: "s_stability_reports", fieldId: "sr_accelerated" },
      { sectionId: "s_stability_reports", fieldId: "sr_shipping" },
    ];

    for (const t of reportTargets) {
      const content = generatedReports[t.fieldId];
      if (!content) continue; // Only save what was generated
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
    // Only generate summaries for the report type that was just generated
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

    generatedReports["inuse_desc"] = conciseInUse;
    generatedReports["shelf_desc"] = conciseShelfLife;
    generatedReports["shipping_desc"] = conciseShipping;

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
