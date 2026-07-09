import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireAuth } from "@/lib/auth";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

export interface QmsSection {
  id: string;
  number: string;
  title: string;
  content: string;
  level: number;
}

// ─── Constants & Prompts ────────────────────────────────────────────────────────

const MASTER_PROMPT = `You are an ISO 13485:2016 and Medical Device Rules (MDR 2017, India) Quality Management System documentation expert with extensive experience in preparing regulatory documentation for medical device manufacturers.

You have been provided with relevant extracted sections from the organization's Quality Manual (retrieved from a vector database).

Your task is to generate a complete standalone Quality Management System document for the requested section.

==========================
INPUT
==========================

Document to Generate:
{{DOCUMENT_NAME}}

Relevant QMS Manual Content:
{{RETRIEVED_QMS_CONTENT}}

Additional Company Information (if available):
{{COMPANY_INFORMATION}}

==========================
OBJECTIVE
==========================

Generate a professional regulatory document that is fully aligned with:
• ISO 13485:2016
• Medical Device Rules (India)
• CDSCO expectations
• Good Documentation Practices (GDP)

The generated document must remain fully consistent with the supplied Quality Manual.
Never contradict the Quality Manual.
Expand the supplied information into a complete document suitable for regulatory submission.
Do NOT merely copy the Quality Manual.
Use the Quality Manual only as the source of organization-specific information and expand it into detailed procedures, responsibilities, workflow, controls, records, approvals and document management practices.
If some procedural information is not explicitly present in the Quality Manual, generate it using ISO 13485 best practices while keeping it consistent with the supplied content.
Do NOT invent company-specific names, departments, addresses, document numbers, revision numbers or personnel unless provided.

==========================
GENERAL REQUIREMENTS
==========================

The document should include wherever applicable:
Purpose, Scope, References, Definitions, Abbreviations, Responsibilities, Procedure, Detailed workflow, Document control, Revision control, Distribution, Records, Retention, Forms, Related Documents, Appendices

The writing style should be formal, regulatory, audit-ready and suitable for ISO certification.
Avoid generic AI language.
Avoid repeating identical paragraphs.
Write in complete procedural language.

==========================
STRICT RULES
==========================

Use ONLY organization-specific information found in the Quality Manual.
Expand procedures using ISO 13485 requirements.
Do not fabricate company processes.
Do not mention that information was retrieved from a vector database.
Do not explain your reasoning.
Return only the completed document.
Output in clean Markdown.
Follow exactly the formatting instructions given in the user prompt for each document.`;

const PROMPTS = [
  {
    title: "Management Responsibility",
    query: `
ISO 13485 Clause 5
Management Responsibility
5.1 Management Commitment
5.2 Customer Focus
5.3 Quality Policy
5.4 Quality Planning
5.5 Responsibility Authority Communication
5.5.1 Responsibility and Authority
5.5.2 Management Representative
5.5.3 Internal Communication
5.6 Management Review
Quality Objectives
Management Review Committee
Customer Satisfaction
Resource Planning
Management Commitment
`,
    specific: `
Generate a complete **Level-II Quality System Procedure (QSP)** titled **Management Responsibility**.

Use ONLY the retrieved Quality Manual sections as the source of organization-specific information.

Expand the retrieved content into a detailed Management Responsibility procedure compliant with ISO 13485:2016, Medical Device Rules (India), CDSCO requirements and Good Documentation Practices (GDP).

Do NOT merely copy the Quality Manual. Expand it into an audit-ready procedure.

Never invent company-specific information.

If information is missing, expand it only using ISO 13485 best practices while remaining fully consistent with the Quality Manual.

Do not explain anything. Return ONLY the completed procedure.

────────────────────────────────────
IMPORTANT FORMATTING RULE
────────────────────────────────────

Do NOT use Markdown tables anywhere in this document.
Write every section as plain numbered paragraphs and prose only.
Do NOT output any pipe characters ( | ) or table syntax.
Use continuous written paragraphs for all content.

────────────────────────────────────
DOCUMENT FORMAT
────────────────────────────────────

# Management Responsibility

**Document Title:** Management Responsibility
**Document Type:** Quality System Procedure
**Level:** II
**ISO Clause:** 5
**Document Number:** (use retrieved value if available)
**Revision No.:** (use retrieved value if available)

────────────────────────────────────

## 1 Purpose

Write 2–3 paragraphs describing the purpose of this procedure. Cover: establishing management responsibilities, implementing and maintaining the QMS, and continual improvement. Use formal regulatory language.

────────────────────────────────────

## 2 Scope

Write 1–2 paragraphs describing the applicability of this procedure across the organization. Include: Top Management, Management Representative, Department Heads, Quality Assurance, Production, Regulatory, and all employees.

────────────────────────────────────

## 3 References

List references as numbered items:

3.1 ISO 13485:2016 – Clause 5 Management Responsibility
3.2 Medical Device Rules 2017 (India)
3.3 CDSCO Guidelines
3.4 Quality Manual (retrieved sections)
3.5 Good Documentation Practices (GDP)

────────────────────────────────────

## 4 Definitions

Write each definition as a numbered paragraph:

4.1 **Top Management:** ...
4.2 **Management Representative:** ...
4.3 **Quality Policy:** ...
4.4 **Quality Objective:** ...
4.5 **Management Review:** ...
4.6 **Customer Focus:** ...
4.7 **Continual Improvement:** ...
4.8 **Process Approach:** ...

────────────────────────────────────

## 5 Responsibilities

Write responsibilities as numbered paragraphs per role:

5.1 **Managing Director:** ...
5.2 **Top Management:** ...
5.3 **Management Representative:** ...
5.4 **Department Heads:** ...
5.5 **Quality Assurance:** ...
5.6 **All Employees:** ...

────────────────────────────────────

## 6 Procedure

Write each subsection as numbered paragraphs with full procedural prose. Do NOT use tables or bullet points.

### 6.1 Management Commitment

Expand into 3–4 paragraphs covering: commitment to QMS, regulatory compliance, customer requirements, resource allocation, and continual improvement.

### 6.2 Customer Focus

Expand into 3–4 paragraphs covering: identification of customer requirements, monitoring customer satisfaction, regulatory compliance, feedback mechanisms, and complaint monitoring.

### 6.3 Quality Policy

Expand into 3–4 paragraphs covering: establishment of the quality policy, communication across the organization, display at relevant locations, employee awareness, periodic review, and continual suitability.

### 6.4 Quality Objectives

Expand into 3–4 paragraphs covering: establishment of measurable quality objectives at relevant functions and levels, monitoring, departmental objectives, and periodic review.

### 6.5 Quality Management System Planning

Expand into 3–4 paragraphs covering: planning activities, process approach, risk consideration, resource planning, change management, and maintaining QMS integrity during changes.

### 6.6 Responsibility and Authority

Expand into 3–4 paragraphs covering: organizational structure, defined authority, job responsibilities, and communication of responsibilities across all levels.

### 6.7 Management Representative

Expand into 3–4 paragraphs covering: appointment, responsibilities for establishing and maintaining the QMS, reporting to Top Management, regulatory liaison, promoting awareness, and monitoring effectiveness.

### 6.8 Internal Communication

Expand into 3–4 paragraphs covering: communication channels, scheduled meetings, circulars, email communications, quality meetings, and feedback mechanisms.

### 6.9 Management Review

Expand into 4–5 paragraphs covering: purpose of the review, frequency (minimum annually), review inputs, review outputs, agenda, action items, follow-up, and records maintained.

────────────────────────────────────

## 7 Management Review Inputs

Write as a numbered list of paragraphs:

7.1 Quality Policy – ...
7.2 Quality Objectives – ...
7.3 Internal Audit Results – ...
7.4 Customer Complaints – ...
7.5 Customer Feedback – ...
7.6 CAPA Status – ...
7.7 Supplier Performance – ...
7.8 Process Performance and Product Conformity – ...
7.9 Resource Needs – ...
7.10 Regulatory Changes – ...
7.11 Risk Management Updates – ...
7.12 Follow-up Actions from Previous Reviews – ...

────────────────────────────────────

## 8 Management Review Outputs

Write as a numbered list of paragraphs:

8.1 Improvement Actions – ...
8.2 Resource Allocation – ...
8.3 Quality Policy Revision – ...
8.4 Quality Objective Revision – ...
8.5 CAPA Decisions – ...
8.6 Training Requirements – ...
8.7 Regulatory Compliance Actions – ...

────────────────────────────────────

## 9 Records

Write as numbered items:

9.1 Management Review Minutes of Meetings – Retained by Management Representative for minimum 5 years.
9.2 Attendance Register – Retained by QA.
9.3 Action Tracker – Maintained by Management Representative.
9.4 Quality Objectives Record – Retained by QA Manager.
9.5 Quality Policy – Maintained by Management Representative.
9.6 Management Reports – Retained by Top Management.

────────────────────────────────────

## 10 Abbreviations

Write as numbered items:

10.1 MR – Management Representative
10.2 QMS – Quality Management System
10.3 QA – Quality Assurance
10.4 CAPA – Corrective Action and Preventive Action
10.5 SOP – Standard Operating Procedure
10.6 QSP – Quality System Procedure
10.7 MD – Managing Director

────────────────────────────────────

## 11 Flowchart

Management Commitment
↓
Quality Policy
↓
Quality Objectives
↓
Resource Planning
↓
Implementation
↓
Internal Communication
↓
Management Review
↓
Continual Improvement
`
  },
  {
    title: "Control of Documents",
    query: `
ISO 13485 Clause 4.2
Documentation Requirements
4.2.4 Control of Documents
4.2.5 Control of Records
Control of Quality Manual
Document numbering
Document approval
Document review
Controlled Copy
Master Copy
Distribution List
Revision Control
Amendment Sheet
Obsolete Documents
External Documents
Electronic Documents
Backup
Security
Document Retention
`,
    specific: `
Generate a complete **Level-II Quality System Procedure (QSP)** titled **Control of Documents**.

The document must be written exactly in the style of an ISO 13485 medical device Quality Management System document and should resemble a real SOP used during CDSCO, ISO 13485 and MDR audits.

Use ONLY the retrieved QMS Manual information as the source of organization-specific information.

Expand the content using ISO 13485:2016 best practices wherever necessary while remaining fully consistent with the Quality Manual.

Never invent company-specific information. Do not explain anything. Return ONLY the completed procedure.

════════════════════════════════════
CRITICAL FORMATTING INSTRUCTION
════════════════════════════════════

This document will be converted directly to Microsoft Word.

The PROCEDURE STEPS section (Section 4) MUST be formatted as a SINGLE continuous two-column Markdown table with Action and Responsibility columns.

The table rows must be numbered exactly like this example:

| Action | Responsibility |
|--------|----------------|
| **4.1** All internal documents of the QMS are identified with unique document numbers as described below: | M.R. |
| 4.1.1 Quality Manual – QM/Section number | M.R. |
| 4.1.2 Quality System Procedures – QSP/Clause number/serial no. | M.R. |
| 4.1.3 Standard Operating Procedures – Dept./SOP/serial number | M.R. |
| 4.1.4 Work Instructions – Dept./WI/serial number | M.R. |
| 4.1.5 Formats (Hard Copies) – Dept./FMT/serial number | M.R. |
| 4.1.6 Formats (Computerized) – Dept./EFT/serial number | M.R. |
| **4.2** Preparation of documents | Department Author / M.R. |
| 4.2.1 Author prepares draft document using approved template | Department Author |
| 4.2.2 Draft submitted to QA for review | QA Manager |
| **4.3** Review of documents | QA Manager |
| 4.3.1 QA Manager reviews draft for accuracy and compliance | QA Manager |
| 4.3.2 Comments returned to author for revision if required | QA Manager |
| **4.4** Approval of documents | Management Representative |
| 4.4.1 Reviewed document submitted to MR for approval | QA Manager |
| 4.4.2 MR signs and dates the document upon approval | M.R. |
| **4.5** Issuance and Distribution | Document Controller |
| ... continue with all remaining procedure steps ... | ... |

IMPORTANT: Continue the single procedure table through ALL steps (document numbering, preparation, review, approval, issuance, controlled copies, master copy, uncontrolled copies, revision, amendment, obsolete documents, external documents, electronic documents, security, backup, document retention, annual review). Use the same numbered hierarchy (4.x, 4.x.x) throughout.

Do NOT break the procedure into separate subsection headings. Keep it as ONE continuous table.

════════════════════════════════════
DOCUMENT STRUCTURE
════════════════════════════════════

Output the document in the following order:

---

**Document Title:** Control of Documents
**Document Type:** Quality System Procedure | Level II
**ISO Clause:** 4.2.4
**Document Number:** (use retrieved value if available)
**Revision No.:** (use retrieved value if available)

---

**1. Purpose:**

Write 2–3 sentences. The purpose of this procedure is to detail the process for control of documents required by the Quality Management System.

---

**2. Scope:**

Write 2–3 sentences. The scope covers all documents of the Quality Management System including documents pertaining to the Laboratory Quality Management System and documents of external origin.

---

**3. Authority and Responsibility:**

Write 2–3 sentences. The Management Representative is the authority to review and approve this procedure. The procedure is issued by the M.R. and implemented by all personnel.

---

**4. Procedure Steps:**

Now output the SINGLE continuous Markdown table covering ALL procedure steps with numbered hierarchy as shown in the example above. The table must include at minimum the following major numbered steps with their sub-steps:

4.1 Document Identification and Numbering (with sub-steps 4.1.1 to 4.1.6+ covering QM, QSP, SOP, WI, Formats hard copy, Formats computerized, Lab documents)
4.2 Preparation of Documents
4.3 Review of Documents
4.4 Approval of Documents
4.5 Issuance and Distribution
4.6 Master Copy Control
4.7 Controlled Copies
4.8 Uncontrolled / Information Copies
4.9 Revision of Documents
4.10 Amendment Sheet
4.11 Obsolete Documents
4.12 External Documents
4.13 Electronic Documents
4.14 Security and Access Control
4.15 Backup
4.16 Document Retention
4.17 Annual Review

Each major step (4.x) should have multiple detailed sub-steps (4.x.x). Assign the correct Responsibility for each row. Make the table comprehensive and audit-ready.
`
  }
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function parseDocxSections(buffer: Buffer): Promise<QmsSection[]> {
  // Convert docx to HTML to preserve structure (tables, lists, paragraphs)
  const htmlResult = await mammoth.convertToHtml({ buffer });
  let html = htmlResult.value;

  // Pre-process HTML to ensure block elements create newlines in plain text
  html = html.replace(/<(h[1-6]|p|li|tr|div|table)[^>]*>/gi, "\n<$1>");
  html = html.replace(/<\/(h[1-6]|p|li|tr|div|table)>/gi, "</$1>\n");
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // Strip all HTML tags
  let text = html.replace(/<[^>]+>/g, " ");

  // Decode basic HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Clean up whitespace: replace multiple spaces/tabs with single space,
  // but keep newlines intact.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  // Numbered-section regex: matches "4.1", "4.1.2", "Clause 4", "Section 4.1", "5.0" etc.
  const numPrefixRe =
    /^(?:(?:Clause|Section|Part|Chapter|Article)\s+)?(\d+(?:\.\d+)*)[\s.\-–:)]+(.+)/i;

  const sections: QmsSection[] = [];
  let currentSection: QmsSection | null = null;
  const contentLines: string[] = [];

  function flushSection() {
    if (!currentSection) return;
    currentSection.content = contentLines.join("\n").trim();
    if (currentSection.content || currentSection.title) {
      sections.push({ ...currentSection });
    }
    contentLines.length = 0;
  }

  for (const line of lines) {
    const numMatch = numPrefixRe.exec(line);

    if (numMatch && numMatch[2].trim().length < 150) {
      const number = numMatch[1];
      const rest = numMatch[2].trim();
      const dotDepth = number.split(".").length;

      const isLikelyHeading = dotDepth <= 4;

      if (isLikelyHeading) {
        flushSection();
        currentSection = {
          id: `s_${sections.length + 1}`,
          number,
          title: rest,
          content: "",
          level: dotDepth,
        };
        continue;
      }
    }

    if (!currentSection) {
      currentSection = {
        id: "s_preamble",
        number: "",
        title: "Preamble / Introduction",
        content: "",
        level: 1,
      };
    }
    contentLines.push(line);
  }
  flushSection();

  return sections.map((s, i) => ({ ...s, id: `s_${i + 1}` }));
}

/** Exponential-backoff retry wrapper. */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[qms/disintegrate] ${label} failed (attempt ${attempt + 1}/${retries + 1}): ${msg}`
      );
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ─── Main Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (await requireAuth()) as any;
    const companyId: string = user._id ? user._id.toString() : "unknown_company";

    // Prepare company information for the prompt
    const companyInfo = `Company Name: ${user.companyName || "N/A"}
Address: ${user.companyAddress || "N/A"}
Email: ${user.companyEmail || "N/A"}
Telephone: ${user.telephoneNumber || "N/A"}`.trim();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".docx") && !ext.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Only .docx / .doc files are supported" },
        { status: 400 }
      );
    }

    // ── 1. Parse Document ──────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const sections = await parseDocxSections(buffer);

    if (sections.length === 0) {
      return NextResponse.json(
        {
          error:
            "No sections could be detected. Make sure the document has headings or numbered clauses.",
        },
        { status: 422 }
      );
    }

    // ── 2. Initialize Pinecone and OpenAI ──────────────────────────────────────
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");

    const pineconeApiKey = process.env.PINECONE_KEY;
    if (!pineconeApiKey) throw new Error("Missing PINECONE_KEY");

    const pineconeIndexName = process.env.PINECONE_INDEX || "medical-docs";
    const embeddingModel = process.env.PINECONE_EMBED_MODEL || "text-embedding-3-small";
    const generationModel = process.env.OPENAI_MODEL || "gpt-4o";

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });

    const indexModel = await withRetry("pinecone.describeIndex", () =>
      pinecone.describeIndex(pineconeIndexName)
    );
    const indexHost = indexModel.host;
    const index = pinecone.index(pineconeIndexName, indexHost);

    // Unique batch ID isolates this upload from all other RAG data
    const qmsBatchId = randomUUID();

    // ── 3. Embed & Upsert Sections into Pinecone ───────────────────────────────
    const embedBatchSize = 32;
    for (let start = 0; start < sections.length; start += embedBatchSize) {
      const batch = sections.slice(start, start + embedBatchSize);
      const textsToEmbed = batch.map((s) =>
        `${s.number} ${s.title}\n\n${s.content}`.trim()
      );

      const embeddingRes = await withRetry("openai.embeddings.create", () =>
        openai.embeddings.create({ model: embeddingModel, input: textsToEmbed })
      );

      const records = embeddingRes.data.map((item, idx) => {
        const section = batch[idx];
        return {
          id: `qms-${qmsBatchId}-sec-${section.id}`,
          values: item.embedding,
          metadata: {
            companyId,
            qmsBatchId,
            docType: "qms-manual",
            sectionId: section.id,
            number: section.number,
            title: section.title,
            text: textsToEmbed[idx].slice(0, 30000), // Pinecone metadata safety limit
          },
        };
      });

      await withRetry("pinecone.upsert", () =>
        index.namespace(companyId).upsert({ records })
      );
    }

    // Wait for Pinecone eventual consistency before querying
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // ── 4. RAG Query + Generate 3 ISO 13485 Documents ─────────────────────────
    const generatedDocs: QmsSection[] = [];

    for (let i = 0; i < PROMPTS.length; i++) {
      const docDef = PROMPTS[i];

      // Embed the retrieval query
      const embRes = await withRetry(`openai.embeddings.create (query ${i})`, () =>
        openai.embeddings.create({ model: embeddingModel, input: [docDef.query] })
      );
      const queryVector = embRes.data[0].embedding;

      // Retrieve relevant chunks from Pinecone
      const results = await withRetry(`pinecone.query (query ${i})`, () =>
        index.namespace(companyId).query({
          vector: queryVector,
          topK: 15,
          filter: { qmsBatchId: { $eq: qmsBatchId } },
          includeMetadata: true,
        })
      );

      const retrievedContext = (results.matches || [])
        .map((m) => (m.metadata?.text as string) || "")
        .join("\n\n---\n\n");

      // Build the final system prompt by injecting retrieved content
      const systemPrompt = MASTER_PROMPT
        .replace("{{DOCUMENT_NAME}}", docDef.title)
        .replace("{{RETRIEVED_QMS_CONTENT}}", retrievedContext)
        .replace("{{COMPANY_INFORMATION}}", companyInfo);

      // Generate the document via OpenAI
      const llmResponse = await withRetry(`openai.chat (${docDef.title})`, () =>
        openai.chat.completions.create({
          model: generationModel,
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: docDef.specific },
          ],
        })
      );

      const generatedContent = llmResponse.choices?.[0]?.message?.content || "";

      generatedDocs.push({
        id: `gen-${i + 1}`,
        number: "",
        title: docDef.title,
        content: generatedContent,
        level: 1,
      });
    }

    return NextResponse.json({
      fileName: `Generated QMS Documents (from ${file.name})`,
      sectionCount: generatedDocs.length,
      sections: generatedDocs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Disintegration failed";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[qms/disintegrate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
