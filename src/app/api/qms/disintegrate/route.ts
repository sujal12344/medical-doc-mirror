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
Generate a **Quality Manual Section** for **Management Responsibility**.

Use ONLY the retrieved Quality Manual sections as the source of organization-specific information.
Expand the retrieved content into a detailed Management Responsibility section compliant with ISO 13485:2016, Medical Device Rules (India), and CDSCO requirements.

Never invent company-specific information.
Do not explain anything. Return ONLY the completed document.

────────────────────────────────────
IMPORTANT FORMATTING RULE
────────────────────────────────────

Do NOT use Markdown tables anywhere in this document.
Do NOT include a title block, Document Control block, Purpose, Scope, References, or Flowcharts unless they are explicitly present in the retrieved text.

Write the document as plain numbered paragraphs matching exactly the standard ISO 13485 numbering for Clause 5 (e.g. 5.0, 5.1, 5.4.1, 5.5, 5.5.1).

Example Format:
5.0 Management Responsibility:
  Management Commitment:
  ...
  Customer Focus:
  ...
  Quality Policy:
  ...
5.4.1 [Quality Planning content]
5.5 Responsibility, Authority and Communication:
5.5.1 Responsibility and Authority:
  ...
  Management Representative:
  ...
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
Documents and Records
Cross-referred Procedures
Abbreviations used
FMT EFT
MR/FMT QC/FMT
QM QC Dept FM MD M.R.
Laboratory Quality Management Systems are reviewed once a year
Changes in the documents are initiated by the users
handwritten changes to the laboratory QMS documents
Photocopies of the revised issue
access to documents maintained in computers is restricted
protect data and documents in computers from virus attacks
`,
    specific: `
Generate a **Quality System Procedure** for **Control of Documents** following the EXACT format and structure used in the retrieved Quality Manual.

Use ONLY information found in the retrieved Quality Manual sections.
Do NOT invent abbreviations, format codes, document numbers, or personnel names that are not in the retrieved content.
Do not explain anything. Return ONLY the completed document.

════════════════════════════════════
FORMATTING INSTRUCTIONS
════════════════════════════════════

The document must be written with these exact section headers (DO NOT use markdown hashes like # or ###, and DO NOT use numbers like 1., 2.):

Purpose:
Write 1-2 sentences describing the purpose. Use exact language from the retrieved content if available.

Scope:
Write 1-2 sentences describing the scope. Use exact language from the retrieved content if available.

Authority and Responsibility:
Write 1-2 sentences. Use exact language from the retrieved content if available.

Procedure Steps:
CRITICAL: The source document splits the procedure steps into multiple sections (e.g., "Procedure Steps:", followed by several "Procedure Steps contd.:"). You MUST recreate this EXACT format. Create a separate Markdown pipe table for EACH section, separated by the "Procedure Steps contd.:" text.
Do NOT write Action and Responsibility on separate lines. The ONLY acceptable format is a pipe table.

Format exactly like this:

Procedure Steps:

| Action | Responsibility |
|--------|----------------|
| [Steps from first page] | [exact role] |

Procedure Steps contd.:

| Action | Responsibility |
|--------|----------------|
| [Steps from second page] | [exact role] |

(Continue creating "Procedure Steps contd.:" tables until ALL steps from the source are included).
Every row MUST be on a SINGLE line starting with | and ending with |.

Cross-referred Procedures:
MANDATORY: You MUST output exactly the following text for this section, with no changes:
Nil

Documents and Records:
MANDATORY: You MUST output exactly the following text for this section, line by line, with no changes:
MR/FMT/01 - Master List of Quality System Documents
MR/FMT/02 - Distribution List
MR/FMT/03 – Amendment Sheet
MR/FMT/04 - List of External Documents

Abbreviations used:
MANDATORY: You MUST output exactly the following text for this section, line by line, with no changes:
M.R. - Management Representative
QC - Quality Control
QM- Quality Manager
Dept. – Department
FM – Factory manager
MD – Managing Director
`
  },
  {
    title: "Quality Policy",
    query: `
ISO 13485 Clause 5.3
Quality Policy
Management Commitment
Establishment of Quality Policy
Maintenance of Quality Policy
Communication of Quality Policy
Quality Objectives
Cross-referred Procedures
Documents and Records
Abbreviations used
`,
    specific: `
Generate a **Quality Policy** document following the EXACT format and structure used in the retrieved Quality Manual.

Use ONLY information found in the retrieved Quality Manual sections.
Do not explain anything. Return ONLY the completed document.

════════════════════════════════════
FORMATTING INSTRUCTIONS
════════════════════════════════════

The document must be written with EXACTLY these section headers (DO NOT use markdown hashes like # or ###, and DO NOT use numbers like 1., 2.):

Quality Policy
Extract and copy the exact Quality Policy statement verbatim from the source document. Include all commitments, mission statements, and compliance pledges.

Organizational Quality Objectives
Extract and copy the exact list of Quality Objectives verbatim from the source document (e.g. Zero manufacturing defects, training days, etc.). Do not invent objectives.

Director
Leave this exactly as "Director" at the bottom of the document to represent the signature block. Do not add any extra text or names unless explicitly stated in the source.
`
  },
  {
    title: "Control of Quality Records",

    query: `
ISO 13485 Clause 4.2.5
Control of Records
Documentation Requirements
Quality Records
Record Identification
Record Storage
Record Protection
Record Retrieval
Record Retention
Record Disposition
Electronic Records
Record Backup
Record Numbering
Quality Record List
External Records
Retention Period
`,

    specific: `
Generate a Level-II Quality System Procedure titled:

CONTROL OF QUALITY RECORDS

The purpose of this task is NOT to create a new SOP.

The purpose is to generate a procedure that matches the organization's existing Quality System Procedure format as derived from its Quality Manual.

The retrieved Quality Manual is the PRIMARY SOURCE OF TRUTH.

The generated procedure must look like it was written by the same organization that wrote the Quality Manual.

---------------------------------------------------
SOURCE OF INFORMATION
---------------------------------------------------

Use ONLY information present in the retrieved Quality Manual.

If additional explanation is required, expand ONLY enough to connect the existing statements.

Never introduce new company practices.

Never introduce new departments.

Never introduce new responsibilities.

Never introduce new document numbering systems.

Never introduce new retention periods.

Never introduce new workflows.

Never introduce ISO examples that are not supported by the Quality Manual.

If information is not available,
leave that section concise instead of inventing content.

---------------------------------------------------
STYLE
---------------------------------------------------

The document MUST resemble an existing Quality System Procedure.

Write short procedural statements.

Avoid long descriptive paragraphs.

Avoid consultant-style writing.

Avoid textbook explanations.

Write exactly like a controlled QMS procedure.

Each procedural step should usually be one or two sentences.

---------------------------------------------------
DOCUMENT STRUCTURE
---------------------------------------------------

The document SHALL contain ONLY the following sections.

DOCUMENT HEADER

Generate the header exactly in this format.

| Field | Value |
|-------|-------|
| Company | Retrieved from QMS |
| Document No. | Retrieved from QMS |
| ISO Clause | Retrieved from QMS |
| Level | II |
| Document Title | Control of Quality Records |
| Revision No. | Retrieved |
| Revision Date | Retrieved |
| Issue Date | Retrieved |
| Approved By | Retrieved |
| Issued By | Retrieved |

---------------------------------------------------

1 Purpose

Write only one concise paragraph.

Do not create bullet points.

---------------------------------------------------

2 Scope

Write only one concise paragraph.

---------------------------------------------------

3 Authority and Responsibility

Write only one concise paragraph describing:

• Approval authority

• Issuing authority

• Implementation responsibility

Do not create matrices.

---------------------------------------------------

4 Procedure Steps

This section MUST resemble the original document.

Generate the procedure as numbered clauses.

Example

4.1

4.2

4.3

4.4

etc.

DO NOT convert each clause into a separate heading.

Instead use the following format.

| Action | Responsibility |

4.1 Statement...

4.2 Statement...

4.3 Statement...

4.4 Statement...

The Action column should contain the procedural clause.

The Responsibility column should contain ONLY the responsible role.

Do NOT write explanations underneath.

Do NOT create additional subsections.

Do NOT add examples.

Maintain exactly the same style as a QMS Procedure.

---------------------------------------------------

5 Cross Referred Procedures

Keep this section short.

Use only retrieved procedures.

---------------------------------------------------

6 Documents and Records

List only the records mentioned in the Quality Manual.

Do not invent forms.

---------------------------------------------------

7 Abbreviations

List only abbreviations appearing in the retrieved QMS.

---------------------------------------------------

STRICT RULES

The generated document should look like an existing company SOP.

Do NOT modernize it.

Do NOT improve it.

Do NOT elaborate unnecessarily.

Do NOT generate additional sections.

Do NOT generate ISO guidance.

Do NOT create new responsibilities.

Do NOT create new workflows.

Do NOT create new numbering systems.

Do NOT create examples.

If a sentence already exists in the QMS, preserve its wording as much as possible while adapting it into procedure format.

The final output should closely resemble the company's existing Level-II procedure rather than a newly written SOP.`
  },
  {
    title: "Internal Audit",

    query: `
ISO 13485 Clause 8.2.4
Internal Audit
Audit Programme
Audit Schedule
Audit Planning
Audit Criteria
Audit Scope
Audit Frequency
Audit Team
Lead Auditor
Auditor Independence
Audit Checklist
Audit Execution
Audit Evidence
Audit Findings
Audit Observation
Nonconformity
Major Nonconformity
Minor Nonconformity
Opportunity for Improvement
Audit Report
Corrective Action
CAPA
Follow-up Audit
Audit Closure
Audit Records
Management Review
Quality Management System Audit
Process Audit
Product Audit
Supplier Audit
Audit Competence
Audit Training
Audit Records
Audit Planning
Audit Responsibilities
`,

    specific: `Generate a complete Level-II Quality System Procedure (QSP) titled:

{{DOCUMENT_NAME}}

The document shall be generated by transforming the retrieved Quality Manual into a standalone Quality System Procedure.

The retrieved Quality Manual is the ONLY source of organization-specific information.

=========================================================
OBJECTIVE
=========================================================

Transform the retrieved Quality Manual clauses into a Quality System Procedure.

Preserve:

• terminology
• writing style
• responsibilities
• numbering
• references
• document hierarchy

Expand only where required to make the procedure complete.

Do not invent company-specific information.

=========================================================
DOCUMENT STRUCTURE
=========================================================

Generate the document using the exact structure below.

---------------------------------------------------------

1. Purpose

Write one concise procedural paragraph describing the purpose of the procedure.

---------------------------------------------------------

2. Scope

Write one concise procedural paragraph describing the applicability of the procedure.

---------------------------------------------------------

3. Authority and Responsibility

Write one concise procedural paragraph describing:

- approval authority
- implementation responsibility
- applicable functions

Use ONLY information available in the retrieved Quality Manual.

---------------------------------------------------------

4. Procedure Steps

Generate this section exactly in the following style.

Create a Markdown table with TWO columns.

| Action | Responsibility |
|---------|----------------|

Each row represents one procedural step.

The Action column shall contain numbered procedural clauses.

Example structure only:

| Action | Responsibility |
|---------|----------------|
| 4.1 Procedure step... | Responsible Function |
| 4.2 Procedure step... | Responsible Function |
| 4.3 Procedure step... | Responsible Function |
| 4.4 Procedure step... | Responsible Function |

Do NOT generate paragraphs outside this table.

Do NOT merge multiple actions into one row.

Generate as many rows as required based on the retrieved Quality Manual.

Use only responsibilities found or clearly implied in the retrieved QMS.

If the retrieved QMS references specific forms, records or document numbers, include them.

Otherwise do not invent them.

---------------------------------------------------------

5. Cross-referred Procedures

Generate a numbered list or table containing ONLY procedures referenced in the retrieved Quality Manual.

If none are referenced, state "Nil".

---------------------------------------------------------

6. Documents and Records

Generate a numbered list or Markdown table of all documents, forms and records referenced in the retrieved Quality Manual for this procedure.

Do not invent document numbers.

Do not invent form names.

---------------------------------------------------------

7. Abbreviations Used

Generate a numbered list or Markdown table of abbreviations used in the procedure.

Only include abbreviations appearing in the retrieved Quality Manual.

=========================================================
WRITING STYLE
=========================================================

The generated document must resemble an existing company Quality System Procedure.

Write concise procedural statements.

Avoid long explanations.

Avoid ISO guidance.

Avoid consultant language.

Avoid textbook style.

Do not explain why something is done.

Simply state what shall be done.

=========================================================
STRICT RULES
=========================================================

• Do not create additional sections.

• Do not add examples.

• Do not invent departments.

• Do not invent responsibilities.

• Do not invent document numbers.

• Do not invent forms.

• Do not invent review frequencies.

• Do not invent retention periods.

• Do not invent approval hierarchies.

• Preserve wording from the retrieved Quality Manual wherever possible.

• Expand only enough to convert the Quality Manual into a complete Level-II procedure.

• The final document should appear to have been written by the same organization that authored the Quality Manual.

Return ONLY the completed procedure in Markdown.
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
