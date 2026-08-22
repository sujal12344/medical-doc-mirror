/**
 * CDSCO Ingest Utility
 * Downloads PDF -> extracts text -> chunks -> embeds -> upserts to Pinecone
 */
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_KEY! });

const PINECONE_INDEX   = process.env.PINECONE_INDEX2!;
const EMBED_MODEL      = process.env.PINECONE_EMBED_MODEL!;
const CHUNK_SIZE       = parseInt(process.env.CHUNK_SIZE!, 10);
const CHUNK_OVERLAP    = parseInt(process.env.CHUNK_OVERLAP!, 10);
const EMBED_BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE!, 10);

export interface IngestResult {
  status: "indexed" | "skipped" | "error";
  chunksIndexed: number;
  pineconeIds: string[];
  error?: string;
}

// Text chunking 
function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + size, words.length);
    let chunk = words.slice(start, end).join(" ");
    if (chunk.length > 6000) chunk = chunk.slice(0, 6000); // Prevent 8192 token limit error on malformed PDFs
    chunks.push(chunk);
    if (end >= words.length) break;
    start += size - overlap;
  }
  return chunks.filter((c) => c.trim().length > 50);
}

// Embedding 
async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch });
    embeddings.push(...res.data.map((d) => d.embedding));
  }
  return embeddings;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Pinecone upsert Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function upsertToPinecone(
  docId: string,
  chunks: string[],
  embeddings: number[][],
  metadata: Record<string, string>
): Promise<string[]> {
  const index = pinecone.index(PINECONE_INDEX);
  const vectors = chunks.map((text, i) => ({
    id: `${docId}:${i}`,
    values: embeddings[i],
    metadata: { ...metadata, chunkIndex: String(i), text: text.slice(0, 1000) },
  }));

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await index.upsert({ records: vectors.slice(i, i + 100) });
  }
  return vectors.map((v) => v.id);
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main ingest function Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function ingestPdfBytes(
  docId: string,
  bytes: Uint8Array,
  metadata: { title: string; sourceUrl: string; pageUrl: string }
): Promise<IngestResult> {
  try {
    // Extract text from PDF
    const buffer = Buffer.from(bytes);
    let rawText = "";
    try {
      const parsed = await pdfParse(buffer);
      rawText = parsed.text || "";
    } catch {
      // If PDF is image-only, index a stub
      rawText = `Title: ${metadata.title}\nSource: ${metadata.sourceUrl}\nNote: PDF may be image-only Ã¢â‚¬â€ indexed by metadata.`;
    }

    if (!rawText.trim()) {
      rawText = `Title: ${metadata.title}\nSource: ${metadata.sourceUrl}\nNote: No extractable text found.`;
    }

    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      return { status: "skipped", chunksIndexed: 0, pineconeIds: [] };
    }

    const embeddings = await embedTexts(chunks);
    const pineconeIds = await upsertToPinecone(docId, chunks, embeddings, {
      title: metadata.title,
      sourceUrl: metadata.sourceUrl,
      pageUrl: metadata.pageUrl,
      dataCategory: "cdsco_portal",
      indexedAt: new Date().toISOString(),
    });

    return { status: "indexed", chunksIndexed: chunks.length, pineconeIds };
  } catch (err) {
    return { status: "error", chunksIndexed: 0, pineconeIds: [], error: String(err) };
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Query Pinecone for RAG Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function queryCdscoKnowledge(
  query: string,
  topK = 8
): Promise<Array<{ text: string; title: string; sourceUrl: string; score: number }>> {
  const embedRes = await openai.embeddings.create({ model: EMBED_MODEL, input: [query] });
  const queryVector = embedRes.data[0].embedding;

  const index = pinecone.index(PINECONE_INDEX);
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter: { dataCategory: { $eq: "cdsco_portal" } },
  });

  return (results.matches || []).map((m) => ({
    text: String(m.metadata?.text || ""),
    title: String(m.metadata?.title || ""),
    sourceUrl: String(m.metadata?.sourceUrl || ""),
    score: m.score || 0,
  }));
}


