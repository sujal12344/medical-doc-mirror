import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import JSZip from "jszip";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// Import from the implementation directly — pdf-parse/index.js runs a readFileSync
// self-test at module evaluation time which crashes Next.js during build page collection.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number; numrender: number; info: unknown; metadata: unknown; version: string }>;
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import dns from "dns";

// ─── Runtime config ────────────────────────────────────────────────────────────
export const maxDuration = 300;
export const runtime = "nodejs";

const CHUNK_SIZE_DEFAULT = 1500;
const CHUNK_OVERLAP_DEFAULT = 200;
const MAX_CHUNKS_DEFAULT = 100;
const EMBED_BATCH_DEFAULT = 32;
const MAX_UPLOAD_BYTES_DEFAULT = 100_000_000;
const PINECONE_TOPK_DEFAULT = 10;

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Shape returned by the product extraction LLM call. */
interface ProductExtraction {
  products: Array<{
    product: string;
    deviceName: string;
    brandName: string;
    modelNumber: string;
    category: string;
    class: string;
    use: string;
    quantity: string;
    material: string;
    shelfLife: string;
    size: string;
    temperature: string;
  }>;
}

/** Shape returned by the company extraction LLM call. */
interface CompanyExtraction {
  companyName: string;
  companyAddress: string;
  telephoneNumber: string;
  companyEmail: string;
}

type PineconeChunkMetadata = {
  companyId: string;
  uploadBatchId: string;
  pdfFileName: string;
  chunkIndex: number;
  text: string;
  source: string;
};

// ─── Utility helpers ────────────────────────────────────────────────────────────

/** Extract the first email address found in text. */
function regexExtractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].trim() : "";
}

/**
 * Search for a phone number near a given company name in the text.
 * Looks within ±5 lines of any line mentioning the company name.
 * Returns the first international or local phone pattern found.
 */
function regexExtractPhoneNearCompany(text: string, companyName: string): string {
  if (!companyName) return "";

  const lines = text.split(/\r?\n/);
  // Build a simple search token from the company name (first significant word)
  const nameTokens = companyName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());
  if (nameTokens.length === 0) return "";

  // Find lines that mention the company
  const companyLineIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (nameTokens.some((token) => lower.includes(token))) {
      companyLineIndices.push(i);
    }
  }

  // Search ±5 lines around each company mention for phone patterns
  const windowSize = 5;

  // Pass 1: Look for labelled phone numbers (Tel:, Phone:, etc.) or international (+) format
  const labelledPhoneRegex = /(?:Tel|Phone|Fax|Call|T\.|Ph\.)[:\s]+([+]?[\d][\d\s().\-]{7,18}\d)/gi;
  const internationalRegex = /\+[\d][\d\s().\-]{8,18}\d/g;

  for (const idx of companyLineIndices) {
    const start = Math.max(0, idx - windowSize);
    const end = Math.min(lines.length - 1, idx + windowSize);
    const windowText = lines.slice(start, end + 1).join(" ");

    // Try labelled first (most reliable)
    const labelledMatches = windowText.match(labelledPhoneRegex);
    if (labelledMatches) {
      for (const raw of labelledMatches) {
        const cleaned = raw.replace(/^(?:Tel|Phone|Fax|Call|T\.|Ph\.)[:\s]*/i, "").trim();
        const digitCount = (cleaned.match(/\d/g) || []).length;
        if (digitCount >= 8) return cleaned;
      }
    }

    // Try international format (+xx ...)
    const intlMatches = windowText.match(internationalRegex);
    if (intlMatches) {
      for (const raw of intlMatches) {
        const digitCount = (raw.match(/\d/g) || []).length;
        if (digitCount >= 10) return raw.trim();
      }
    }
  }

  return "";
}

/** Chunk a large string with overlap. Returns at most `maxChunks` slices. */
function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
  maxChunks: number
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const step = Math.max(1, chunkSize - overlap);
  for (let i = 0; i < normalized.length && chunks.length < maxChunks; i += step) {
    const slice = normalized.slice(i, i + chunkSize).trim();
    if (slice) chunks.push(slice);
  }
  return chunks;
}

/** Parse the LLM JSON response safely, stripping markdown fences if present. */
function safeParseLLMJson<T extends object>(raw: string, fallback: T): T {
  try {
    const stripped = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(stripped);
    if (typeof parsed !== "object" || parsed === null) return fallback;
    return { ...fallback, ...parsed };
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        const parsed = JSON.parse(raw.slice(first, last + 1));
        return { ...fallback, ...parsed };
      } catch {
        /* ignore */
      }
    }
    console.warn("[upload] Failed to parse LLM JSON, using fallback.");
    return fallback;
  }
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
      console.error(`[upload] ${label} failed (attempt ${attempt + 1}/${retries + 1}): ${msg}`);
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ─── Pinecone upsert (awaited) ─────────────────────────────────────────────────

/**
 * Chunks fullText, embeds via OpenAI, and upserts to Pinecone.
 * This is now AWAITED by the main handler so vectors are available for querying.
 */
async function pineconeUpsert(opts: {
  openai: OpenAI;
  pinecone: Pinecone;
  pineconeIndexName: string;
  indexHost: string;
  fullText: string;
  companyId: string;
  uploadBatchId: string;
  pdfFileName: string;
  uploadId: string;
  chunkSize: number;
  overlap: number;
  maxChunks: number;
  embedBatchSize: number;
  embeddingModel: string;
}): Promise<void> {
  const {
    openai,
    pinecone,
    pineconeIndexName,
    indexHost,
    fullText,
    companyId,
    uploadBatchId,
    pdfFileName,
    uploadId,
    chunkSize,
    overlap,
    maxChunks,
    embedBatchSize,
    embeddingModel,
  } = opts;

  const chunks = chunkText(fullText, chunkSize, overlap, maxChunks);
  if (chunks.length === 0) {
    console.warn(`[pinecone] No chunks for file: ${pdfFileName}`);
    return;
  }

  const index = pinecone.index(pineconeIndexName, indexHost);

  for (let start = 0; start < chunks.length; start += embedBatchSize) {
    const batch = chunks.slice(start, start + embedBatchSize);

    const embeddingRes = await withRetry("openai.embeddings.create", () =>
      openai.embeddings.create({ model: embeddingModel, input: batch })
    );

    const records = embeddingRes.data.map((item, idx) => {
      const chunkIndex = start + idx;
      const metadata: PineconeChunkMetadata = {
        companyId,
        uploadBatchId,
        pdfFileName,
        chunkIndex,
        text: batch[idx].slice(0, 1500),
        source: pdfFileName,
      };
      return {
        id: `${uploadId}-chunk-${chunkIndex}`,
        values: item.embedding,
        metadata,
      };
    });

    await withRetry("pinecone.upsert", () =>
      index.namespace(companyId).upsert({ records })
    );

    console.log(
      `[pinecone] Upserted batch ${start}–${start + batch.length - 1} for ${pdfFileName}`
    );
  }

  console.log(`[pinecone] ✅ Completed upsert for ${pdfFileName} (${chunks.length} chunks)`);
}

// ─── Pinecone query helper ──────────────────────────────────────────────────────

type PineconeChunkResult = { text: string; source: string };

/**
 * Embeds a natural-language query, searches Pinecone, and returns the
 * matched chunks with their source PDF filename, sorted by relevance score.
 */
async function queryPinecone(opts: {
  openai: OpenAI;
  pinecone: Pinecone;
  indexName: string;
  indexHost: string;
  namespace: string;
  query: string;
  topK: number;
  filter: Record<string, unknown>;
  embeddingModel: string;
}): Promise<PineconeChunkResult[]> {
  const { openai, pinecone, indexName, indexHost, namespace, query, topK, filter, embeddingModel } = opts;

  // Embed the query text
  const embRes = await withRetry("openai.embeddings.create (query)", () =>
    openai.embeddings.create({ model: embeddingModel, input: [query] })
  );
  const queryVector = embRes.data[0].embedding;

  // Search Pinecone
  const index = pinecone.index(indexName, indexHost);
  const results = await withRetry("pinecone.query", () =>
    index.namespace(namespace).query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata: true,
    })
  );

  // Return text + source sorted by relevance (highest score first)
  return (results.matches || [])
    .filter((m) => m.metadata && typeof (m.metadata as Record<string, unknown>).text === "string")
    .map((m) => {
      const meta = m.metadata as Record<string, string>;
      return { text: meta.text, source: meta.pdfFileName || meta.source || "unknown" };
    });
}

// ─── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const companyId = (token?.id || token?.sub) as string | undefined;

  if (!companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ── Environment ─────────────────────────────────────────────────────────────
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ message: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const pineconeApiKey = process.env.PINECONE_KEY;
  if (!pineconeApiKey) {
    return NextResponse.json(
      { message: "Missing PINECONE_KEY — required for RAG-based extraction." },
      { status: 500 }
    );
  }

  const pineconeIndexName = process.env.PINECONE_INDEX || "medical-docs";
  const embeddingModel = process.env.PINECONE_EMBED_MODEL || "text-embedding-3-small";
  const extractionModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const topK = Number(process.env.PINECONE_TOPK || PINECONE_TOPK_DEFAULT);

  const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || MAX_UPLOAD_BYTES_DEFAULT);
  const chunkSize = Number(process.env.CHUNK_SIZE || CHUNK_SIZE_DEFAULT);
  const overlap = Number(process.env.CHUNK_OVERLAP || CHUNK_OVERLAP_DEFAULT);
  const maxChunks = Number(process.env.MAX_CHUNKS || MAX_CHUNKS_DEFAULT);
  const embedBatchSize = Number(process.env.EMBED_BATCH_SIZE || EMBED_BATCH_DEFAULT);

  // ── Content-type guard ──────────────────────────────────────────────────────
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      {
        message:
          "Expected multipart/form-data. Use the /upload page (it sends FormData) instead of opening /api/upload directly.",
      },
      { status: 400 }
    );
  }

  // ── Parse files ─────────────────────────────────────────────────────────────
  const formData = await req.formData();
  const incomingFiles = formData.getAll("files");
  const legacySingle = formData.get("file");
  const files: File[] = [
    ...(incomingFiles.filter((f): f is File => f instanceof File) as File[]),
    ...(legacySingle instanceof File ? [legacySingle] : []),
  ];

  if (files.length === 0) {
    return NextResponse.json(
      { message: "Please upload at least one PDF file (field: files)" },
      { status: 400 }
    );
  }

  // ── Size guard ──────────────────────────────────────────────────────────────
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > maxUploadBytes) {
    return NextResponse.json(
      { message: `Total upload too large. Max ${maxUploadBytes} bytes across all PDFs.` },
      { status: 413 }
    );
  }

  // ── Validate all files are PDF ──────────────────────────────────────────────
  for (const f of files) {
    if (f.type && f.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are supported." }, { status: 400 });
    }
  }

  // ── Load templates + placeholders (once, before PDF loop) ──────────────────
  const formatDir = path.join(process.cwd(), "format");
  let dirEntries: string[];
  try {
    dirEntries = await fs.readdir(formatDir);
  } catch {
    return NextResponse.json({ message: `Cannot read format directory: ${formatDir}` }, { status: 500 });
  }
  const docxTemplates = dirEntries.filter((f) => f.toLowerCase().endsWith(".docx"));

  if (docxTemplates.length === 0) {
    return NextResponse.json(
      { message: `No DOCX templates found in ${formatDir}` },
      { status: 500 }
    );
  }

  const placeholdersJsonPath = path.join(process.cwd(), "placeholders.json");
  let placeholdersMap: Record<string, string[]>;
  try {
    const raw = await fs.readFile(placeholdersJsonPath, "utf-8");
    placeholdersMap = JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return NextResponse.json(
      { message: "Cannot read or parse placeholders.json." },
      { status: 500 }
    );
  }

  // ── Build the final flat tag list from placeholders.json ───────────────────
  const allTags = new Set<string>();
  for (const tagList of Object.values(placeholdersMap)) {
    for (const tag of tagList) {
      const bare = tag.replace(/^\{+/, "").replace(/\}+$/, "").trim();
      if (bare) allTags.add(bare);
    }
  }
  const placeholderTags = Array.from(allTags);

  if (placeholderTags.length === 0) {
    return NextResponse.json(
      { message: "No placeholders found in placeholders.json." },
      { status: 400 }
    );
  }

  // ── Shared clients ──────────────────────────────────────────────────────────
  // Prefer IPv4 to avoid flaky IPv6 DNS on some networks.
  dns.setDefaultResultOrder("ipv4first");

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const pinecone = new Pinecone({ apiKey: pineconeApiKey });

  const uploadBatchId = randomUUID();

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: Ingest all PDFs into Pinecone (awaited)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    // Describe index once for all upserts + queries
    const indexModel = await withRetry("pinecone.describeIndex", () =>
      pinecone.describeIndex(pineconeIndexName)
    );
    const indexHost = indexModel.host;

    // Collect full texts for regex email fallback later
    const pdfFullTexts: string[] = [];

    for (const pdfFile of files) {
      const pdfFileName = pdfFile.name || "uploaded.pdf";
      const uploadId = randomUUID();

      // ── Parse PDF ──────────────────────────────────────────────────────────
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
      let fullText: string;
      try {
        const parsed = await pdfParse(pdfBuffer);
        fullText = parsed.text || "";
      } catch (err) {
        console.error(`[upload] pdf-parse failed for ${pdfFileName}:`, err);
        return NextResponse.json(
          { message: `Failed to parse PDF: ${pdfFileName}` },
          { status: 400 }
        );
      }

      if (!fullText.trim()) {
        return NextResponse.json(
          { message: `No extractable text found in PDF: ${pdfFileName}` },
          { status: 400 }
        );
      }

      console.log(`[upload] Extracted ${fullText.length} chars from ${pdfFileName}`);
      pdfFullTexts.push(fullText);

      // ── Upsert to Pinecone (AWAITED — vectors must be ready before query) ─
      await pineconeUpsert({
        openai,
        pinecone,
        pineconeIndexName,
        indexHost,
        fullText,
        companyId,
        uploadBatchId,
        pdfFileName,
        uploadId,
        chunkSize,
        overlap,
        maxChunks,
        embedBatchSize,
        embeddingModel,
      });
    } // end per-PDF ingest loop

    console.log("[upload] Waiting 20 seconds for Pinecone eventual consistency index flush...");
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // ───────────────────────────────────────────────────────────────────────────
    // PHASE 2: RAG-based extraction (single pass across all uploaded PDFs)
    // ───────────────────────────────────────────────────────────────────────────

    const pineconeFilter = { uploadBatchId: { $eq: uploadBatchId } };

    // ── 2a. Query Pinecone for product context ────────────────────────────────
    const productQueryText =
      "medical device products, model numbers, brand names, risk classes, intended use, quantity permitted to be imported, product tables, materials, shelf life, sizes, and storage temperatures";

    let productChunks: PineconeChunkResult[] = [];
    let queryRetries = 0;
    while (productChunks.length === 0 && queryRetries < 6) {
      productChunks = await queryPinecone({
        openai,
        pinecone,
        indexName: pineconeIndexName,
        indexHost,
        namespace: companyId,
        query: productQueryText,
        topK: Math.max(topK, 50),
        filter: pineconeFilter,
        embeddingModel,
      });
      
      if (productChunks.length === 0) {
        console.log(`[upload] Pinecone index still syncing. Retrying query in 5 seconds (attempt ${queryRetries + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        queryRetries++;
      }
    }

    // ── 2b. Query Pinecone for product specification context ───────────────
    const specQueryText =
      "shelf life expiration storage temperature material composition risk class dimensions size quantity";

    const specChunks = await queryPinecone({
      openai,
      pinecone,
      indexName: pineconeIndexName,
      indexHost,
      namespace: companyId,
      query: specQueryText,
      topK: Math.max(topK, 60),
      filter: pineconeFilter,
      embeddingModel,
    });

    // ── 2b-ii. Dedicated query for Intended Use / Indications for Use ────────
    const intendedUseQueryText =
      "intended use indications for use clinical purpose device category product category medical application diagnosis therapy";

    const intendedUseChunks = await queryPinecone({
      openai,
      pinecone,
      indexName: pineconeIndexName,
      indexHost,
      namespace: companyId,
      query: intendedUseQueryText,
      topK: Math.max(topK, 40),
      filter: pineconeFilter,
      embeddingModel,
    });

    // ── 2b-iii. Dedicated query for instrument/system physical specs ──────────
    // The main analyser unit's dimensions and operating temperature often appear
    // in a separate "Specifications" or "Technical Specifications" table that is
    // NOT co-located with reagent kit specs and can be missed by the general query.
    const instrumentSpecQueryText =
      "instrument analyser system unit physical dimensions mm cm width depth height weight technical specifications operating temperature working environment dRAST microbiology";

    const instrumentSpecChunks = await queryPinecone({
      openai,
      pinecone,
      indexName: pineconeIndexName,
      indexHost,
      namespace: companyId,
      query: instrumentSpecQueryText,
      topK: Math.max(topK, 60),
      filter: pineconeFilter,
      embeddingModel,
    });

    // Merge all context chunks, deduplicate by text content
    const seenChunks = new Set<string>();
    const allProductChunks: PineconeChunkResult[] = [];
    for (const chunk of [...productChunks, ...specChunks, ...intendedUseChunks, ...instrumentSpecChunks]) {
      if (!seenChunks.has(chunk.text)) {
        seenChunks.add(chunk.text);
        allProductChunks.push(chunk);
      }
    }

    // Tag each chunk with its source PDF for LLM context
    const productContext = allProductChunks
      .map((c) => `[Source: ${c.source}]\n${c.text}`)
      .join("\n\n---\n\n");
    console.log(`[upload] Product context: ${productChunks.length} product + ${specChunks.length} spec + ${intendedUseChunks.length} intended-use + ${instrumentSpecChunks.length} instrument-spec chunks → ${allProductChunks.length} unique, ${productContext.length} chars`);

    // ── 2c. Query Pinecone for company context ────────────────────────────────
    const companyQueryText =
      "legal manufacturer company name, full registered address, telephone phone number, and contact email";

    const companyChunks = await queryPinecone({
      openai,
      pinecone,
      indexName: pineconeIndexName,
      indexHost,
      namespace: companyId,
      query: companyQueryText,
      topK: Math.max(topK, 30),
      filter: pineconeFilter,
      embeddingModel,
    });

    // Tag each chunk with its source PDF so the LLM can distinguish manufacturer vs importer
    const companyContext = companyChunks
      .map((c) => `[Source: ${c.source}]\n${c.text}`)
      .join("\n\n---\n\n");
    console.log(`[upload] Company context: ${companyChunks.length} chunks, ${companyContext.length} chars`);

    // ── 2d. LLM: Product extraction ──────────────────────────────────────────

    const productSystemPrompt = `You are a precise data extraction assistant for medical regulatory documents.
Extract structured product data ONLY from the provided context chunks. Return ONLY valid JSON.

CRITICAL RULES:
1. Extract ONLY information explicitly stated in the context. Do NOT guess, infer, or hallucinate.
2. The product and modelNumber must be a SELF-CONTAINED pair — the modelNumber must appear DIRECTLY alongside that product name in the same sentence, table row, or labelled field. Do NOT guess associations between them.
3. GLOBAL SPECIFICATIONS: If general specifications (like shelfLife, material, use, size, temperature, or class) are stated globally or generally in the document, you MUST apply those global values to ALL extracted products, even if they aren't explicitly paired in the text.
4. SYSTEM/EQUIPMENT SPECS: If the text describes specific conditions (like storage temperature) for "the system", "the equipment", or "the instrument", you MUST map those specific values exclusively to the main hardware/machine product, overriding any global kit/reagent temperatures.
5. If a field is entirely missing from the context (both specifically and globally), return "".
6. If you cannot find a confident pairing, return "" for both product and modelNumber.

Required JSON shape:
{
  "products": [
    {
      "product": "",
      "deviceName": "",
      "brandName": "",
      "modelNumber": "",
      "category": "",
      "class": "",
      "use": "",
      "quantity": "",
      "material": "",
      "shelfLife": "",
      "size": "",
      "temperature": ""
    }
  ]
}

Field guidance:
- product: the BROAD GENERIC NAME of the product — this is the category-level descriptor, NOT the specific model variant name. Look for the "Generic Name" column in regulatory tables. Examples: "QMAC-dRAST Gram Negative Kit", "Automated clinical microbiology system", "Reagent Kit for AST". NEVER use a specific device variant name like "QMAC-dRAST GN S17" here — that belongs in deviceName.
- deviceName: the specific commercial device variant name (e.g. "QMAC-dRAST GN S17", "QMAC-dRAST GP E19", "dRAST"). This is the product's specific model/variant title as it appears on the IFU header, label, or "Device Name" column.
- brandName: the SPECIFIC COMMERCIAL DEVICE VARIANT NAME that identifies this exact product version — e.g. "QMAC-dRAST GN S17", "QMAC-dRAST GP E19", "dRAST". Look for this in the "Brand Name", "Device Name", or "Trade Name" column, or on the IFU header/label. CRITICAL: Do NOT use the manufacturer company name (e.g. "QuantaMatrix Inc.") here — that is a company name, not a device variant name.
- modelNumber: exact text from the "Model No" or "Model No.(if any)" column, or the specific part/model number
- category: the product category or device type label (e.g. "In Vitro Diagnostic Device", "Reagent Kit", "Analyser", "Sterile Equipment"). Look for a "Category" column in product tables, or a category heading near the product name. Do NOT leave blank if category information exists anywhere in the context.
- class: regulatory or risk class (e.g. Class A, Class B, Class I, Class IIa)
- use: the FULL intended use / indications for use statement for this product. PRIORITY SOURCE: Look for a dedicated section titled "Intended Use", "Indications for Use", "Intended Purpose", or "Clinical Application" — these sections describe what the device is USED FOR clinically. If the document contains a single global intended use statement that applies to all products (e.g. the system + kits together), apply that same statement to ALL products. Do NOT leave this blank if an Intended Use section exists anywhere in the context.
- quantity: quantity permitted or requested (MUST include units, e.g. "30 Kits", "2 Units")
- material: material composition OR materials/reagents included or required (e.g. "syringe, sample tube")
- shelfLife: shelf life or expiration duration (e.g. "2 years", "24 months")
- size: physical dimensions or size of the product.
  * For REAGENT KITS: size/dimensions of the kit packaging or tube (e.g. "12 x 75 mm"), or leave "" if none.
  * For the main INSTRUMENT/ANALYSER (hardware unit with Class A or Class I): extract the physical footprint or body dimensions (W × D × H in mm or cm) from any "Technical Specifications", "Dimensions", or "Specifications" table. Example: "590 x 765 x 1090 mm". Do NOT leave blank if a Technical Specifications table with dimensions is present in the context.
- temperature: temperature value for this product — but the type differs by product:
  * For REAGENT KITS (Class B/IIa): this is the STORAGE temperature (e.g. "2~8°C").
  * For the main INSTRUMENT/ANALYSER (hardware unit, Class A/I): this is the OPERATING/WORKING/ENVIRONMENTAL temperature (e.g. "20~28°C"). Look in Technical Specifications tables under "Operating Temperature", "Working Temperature", or "Environmental Conditions". This is DIFFERENT from kit storage temperature and MUST NOT be left blank if a Technical Specifications table is present in the context.

Output rules:
- No explanation, no markdown, ONLY valid JSON
- Missing or uncertain values = ""
- List each explicitly paired product/model (up to 5)
- NEVER mix product names with unrelated model numbers`;

    const productLLMResponse = await withRetry("openai.chat (products)", () =>
      openai.chat.completions.create({
        model: extractionModel,
        temperature: 0,
        messages: [
          { role: "system", content: productSystemPrompt },
          { role: "user", content: `Extract product data from these context chunks:\n\n${productContext}` },
        ],
      })
    );

    const rawProductOutput = productLLMResponse.choices?.[0]?.message?.content || "{}";
    console.log(`[upload] Product LLM output: ${rawProductOutput.length} chars`);

    const emptyProduct = {
      product: "", deviceName: "", brandName: "", modelNumber: "",
      category: "", class: "", use: "", quantity: "",
      material: "", shelfLife: "", size: "", temperature: "",
    };
    const productResult = safeParseLLMJson<ProductExtraction>(rawProductOutput, { products: [] });
    const products = Array.isArray(productResult.products)
      ? productResult.products.map((p) => ({ ...emptyProduct, ...p }))
      : [];

    // ── 2e. LLM: Company extraction ──────────────────────────────────────────

    const companySystemPrompt = `You are a precise data extraction assistant for medical regulatory documents.
Extract the PRIMARY LEGAL MANUFACTURER's company details ONLY from the provided context chunks.
Return ONLY valid JSON.

Each context chunk is tagged with [Source: filename.pdf]. Use these tags to understand which document each piece of information comes from.

CRITICAL RULES FOR IDENTIFYING THE LEGAL MANUFACTURER:
1. The Legal Manufacturer is the entity that DESIGNED, ENGINEERED, and PRODUCED the medical device. This is typically the company whose name appears as the BRAND on the device packaging and in the User Manual (UM) or Instructions For Use (IFU).
2. Do NOT select importers, authorized agents, authorized representatives, local distributors, or regulatory consultants — even if their contact details appear more frequently or prominently in the documents.
3. If the device is manufactured abroad, the manufacturer will have a FOREIGN address (e.g., Korea, USA, Germany, Japan). Indian companies listed alongside foreign manufacturers are almost certainly the IMPORTER, not the manufacturer.
4. Look for labels like "Manufacturer", "Legal Manufacturer", "Manufactured by", or the CE mark manufacturer address. If these explicit labels are missing, you MAY infer the manufacturer if a foreign company is listed as the primary source of the devices (e.g. "Devices specified below from M/s [Company Name]").
5. Extract ONLY information explicitly stated or clearly implied in the context. Do NOT completely guess.
6. If a field is not explicitly mentioned or clearly implied in the context, return "".

Required JSON shape:
{
  "companyName": "",
  "companyAddress": "",
  "telephoneNumber": "",
  "companyEmail": ""
}

Field guidance:
- companyName: Name of the primary Legal Manufacturer (the one that MADE the device)
- companyAddress: The complete, contiguous address of the primary Legal Manufacturer ONLY
- telephoneNumber: The direct phone number for the primary Legal Manufacturer ONLY
- companyEmail: The contact email for the primary Legal Manufacturer ONLY

Output rules:
- No explanation, no markdown, ONLY valid JSON
- Missing or uncertain values = ""`;

    const companyLLMResponse = await withRetry("openai.chat (company)", () =>
      openai.chat.completions.create({
        model: extractionModel,
        temperature: 0,
        messages: [
          { role: "system", content: companySystemPrompt },
          { role: "user", content: `Extract the legal manufacturer's company information from these context chunks:\n\n${companyContext}` },
        ],
      })
    );

    const rawCompanyOutput = companyLLMResponse.choices?.[0]?.message?.content || "{}";
    console.log(`[upload] Company LLM output: ${rawCompanyOutput.length} chars`);

    const companyResult = safeParseLLMJson<CompanyExtraction>(rawCompanyOutput, {
      companyName: "", companyAddress: "", telephoneNumber: "", companyEmail: "",
    });

    // Regex email fallback: scan all full texts for an email if LLM missed it
    if (!companyResult.companyEmail) {
      for (const fullText of pdfFullTexts) {
        const regexEmail = regexExtractEmail(fullText);
        if (regexEmail) {
          companyResult.companyEmail = regexEmail;
          console.log(`[upload] Regex email fallback found: ${regexEmail}`);
          break;
        }
      }
    }

    // Regex phone fallback: search near the manufacturer name in full texts
    if (!companyResult.telephoneNumber && companyResult.companyName) {
      for (const fullText of pdfFullTexts) {
        const regexPhone = regexExtractPhoneNearCompany(fullText, companyResult.companyName);
        if (regexPhone) {
          companyResult.telephoneNumber = regexPhone;
          console.log(`[upload] Regex phone fallback found: ${regexPhone}`);
          break;
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PHASE 3: Populate mergedValues and productRegistry
    // ───────────────────────────────────────────────────────────────────────────

    const mergedValues: Record<string, string> = {};
    for (const tag of placeholderTags) mergedValues[tag] = "";

    // Scalar company fields
    mergedValues["ManufacturerCompanyName"]    = companyResult.companyName;
    mergedValues["ManufacturerCompanyAddress"] = companyResult.companyAddress;
    mergedValues["ManufacturerCompanyNumber"]  = companyResult.telephoneNumber;
    mergedValues["ManufacturerCompanyEmail"]   = companyResult.companyEmail;

    // Product registry — deduplicates by modelNumber
    type ProductEntry = {
      product: string; deviceName: string; brandName: string;
      modelNumber: string; category: string; class: string;
      use: string; quantity: string; material: string;
      shelfLife: string; size: string; temperature: string;
    };
    const productRegistry = new Map<string, ProductEntry>();

    for (const p of products) {
      const registryKey = p.modelNumber.trim() || `__no-model-${randomUUID()}`;
      const existing = productRegistry.get(registryKey);

      if (!existing) {
        productRegistry.set(registryKey, {
          product:     p.product,
          deviceName:  p.deviceName || p.product,
          brandName:   p.brandName,
          modelNumber: p.modelNumber,
          category:    p.category,
          class:       p.class,
          use:         p.use,
          quantity:    p.quantity,
          material:    p.material,
          shelfLife:   p.shelfLife,
          size:        p.size,
          temperature: p.temperature,
        });
      } else {
        // Fill in empty fields only — never replace existing values
        const mergeField = (existingVal: string, newVal: string) =>
          existingVal || newVal;

        productRegistry.set(registryKey, {
          ...existing,
          product:     mergeField(existing.product,     p.product),
          deviceName:  mergeField(existing.deviceName,  p.deviceName || p.product),
          brandName:   mergeField(existing.brandName,   p.brandName),
          category:    mergeField(existing.category,    p.category),
          class:       mergeField(existing.class,       p.class),
          use:         mergeField(existing.use,         p.use),
          quantity:    mergeField(existing.quantity,     p.quantity),
          material:    mergeField(existing.material,    p.material),
          shelfLife:   mergeField(existing.shelfLife,   p.shelfLife),
          size:        mergeField(existing.size,        p.size),
          temperature: mergeField(existing.temperature, p.temperature),
        });
      }
    }

    // ── Assign product registry to numbered slots ────────────────────────────
    const registryEntries = Array.from(productRegistry.values())
      .filter(e => e.modelNumber)
      .sort((a, b) => a.modelNumber.localeCompare(b.modelNumber))
      .slice(0, 5);

    console.log(`[upload] Product registry (${registryEntries.length} unique models):`,
      registryEntries.map(e => `${e.modelNumber} → ${e.product}`)
    );

    for (let i = 0; i < registryEntries.length; i++) {
      const n = i + 1;
      const e = registryEntries[i];
      mergedValues[`productGenericName${n}`] = e.product;
      // deviceName = generic product name (e.g. "QMAC-dRAST Gram Negative Kit")
      mergedValues[`deviceName${n}`]         = e.product;
      // brandName = specific device variant name (e.g. "QMAC-dRAST GN S17")
      // Always use e.deviceName directly — e.brandName is unreliable as the LLM
      // sometimes hallucinates the manufacturer company name into that field.
      mergedValues[`brandName${n}`]          = e.deviceName;
      mergedValues[`referenceNumber${n}`]    = e.modelNumber;
      mergedValues[`category${n}`]           = e.category;
      mergedValues[`class${n}`]              = e.class;
      mergedValues[`use${n}`]                = e.use;
      mergedValues[`importedquantity${n}`]   = e.quantity;
      mergedValues[`material${n}`]           = e.material;
      mergedValues[`size${n}`]               = e.size;
      mergedValues[`temperature${n}`]        = e.temperature;
    }

    // Scalar shelfLife — take from first product that has one
    for (const entry of productRegistry.values()) {
      if (entry.shelfLife && !mergedValues["shelfLife"]) {
        mergedValues["shelfLife"] = entry.shelfLife;
      }
    }

    // Ensure every placeholder tag has at least an empty string
    for (const tag of placeholderTags) {
      if (!(tag in mergedValues)) mergedValues[tag] = "";
    }

    console.log("[upload] Final merged values:", mergedValues);

    // ── DOCX rendering ──────────────────────────────────────────────────────
    const zip = new JSZip();
    for (const filename of docxTemplates) {
      const templatePath = path.join(formatDir, filename);
      const templateBuffer = await fs.readFile(templatePath);

      const docZip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      doc.render(mergedValues);
      const outputBuffer = doc.getZip().generate({ type: "nodebuffer" });
      zip.file(filename.replace(/\.docx$/i, "") + ".docx", outputBuffer);
    }

    // ── Return ZIP ──────────────────────────────────────────────────────────
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const downloadName = `${companyId}-generated-docs.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[upload] fatal error:", e);
    return NextResponse.json(
      {
        message: "Failed to generate DOCX ZIP.",
        error: message,
      },
      { status: 500 }
    );
  }
}