import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 32;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\n+/g, "\n").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = i + CHUNK_SIZE;
    if (end < clean.length) {
      const next = clean.indexOf(" ", end);
      if (next !== -1 && next - end < 50) end = next;
    }
    chunks.push(clean.substring(i, end).trim());
    i = end - CHUNK_OVERLAP;
  }
  return chunks.filter(Boolean);
}

export function normalizeNamespaceProductId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  return safe || null;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.embeddings.create({
    model: process.env.PINECONE_EMBED_MODEL || "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export type IndexProductDocumentResult = {
  productNamespaceId: string;
  namespace: string;
  docId: string;
  chunksIndexed: number;
};

/** Upsert document chunks to product_${userId}_${productNamespaceId} (PINECONE_INDEX). */
export async function indexProductDocument(
  userId: string,
  documentText: string,
  suppliedNamespaceProductId: string | null,
  purpose = "autofill",
): Promise<IndexProductDocumentResult> {
  const indexName = process.env.PINECONE_INDEX;
  const pineconeKey = process.env.PINECONE_KEY;
  if (!indexName || !pineconeKey) {
    throw new Error("Pinecone not configured (PINECONE_INDEX / PINECONE_KEY)");
  }

  const chunks = chunkText(documentText);
  if (chunks.length === 0) {
    throw new Error("No indexable text after chunking");
  }

  const productNamespaceId =
    suppliedNamespaceProductId ?? `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const namespace = `product_${userId}_${productNamespaceId}`;
  const docId = `${productNamespaceId}_${Date.now()}`;

  const pc = new Pinecone({ apiKey: pineconeKey });
  const index = pc.index(indexName).namespace(namespace);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(batch);
    const vectors = batch.map((text, j) => ({
      id: `${docId}_chunk_${i + j}`,
      values: embeddings[j],
      metadata: { text, userId, productNamespaceId, purpose, docId },
    }));
    await index.upsert({ records: vectors });
  }

  console.log(`[productVectorIndex] Upserted ${chunks.length} vectors → ${namespace} (docId=${docId})`);

  return { productNamespaceId, namespace, docId, chunksIndexed: chunks.length };
}

/**
 * Query Pinecone for the top-k most relevant chunks matching `queryText`
 * in the given product namespace. Returns concatenated text of matches.
 *
 * @param purposeFilter - If provided, only returns vectors whose `purpose` metadata
 *   field matches this value (e.g. "autofill" for IFU-only data).
 */
export async function queryProductDocuments(
  userId: string,
  productNamespaceId: string,
  queryText: string,
  topK = 12,
  purposeFilter?: string,
): Promise<string> {
  const indexName = process.env.PINECONE_INDEX;
  const pineconeKey = process.env.PINECONE_KEY;
  if (!indexName || !pineconeKey) return "";

  try {
    const [queryEmbedding] = await embedBatch([queryText]);
    const namespace = `product_${userId}_${productNamespaceId}`;
    const pc = new Pinecone({ apiKey: pineconeKey });
    const index = pc.index(indexName).namespace(namespace);

    const queryOptions: Parameters<typeof index.query>[0] = {
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    };

    // Restrict to IFU/product-origin vectors when a purpose filter is given
    if (purposeFilter) {
      queryOptions.filter = { purpose: { $eq: purposeFilter } };
    }

    const result = await index.query(queryOptions);

    const chunks = (result.matches ?? [])
      .filter((m) => m.score && m.score > 0.35)
      .map((m) => (m.metadata as Record<string, unknown>)?.text as string)
      .filter(Boolean);

    return chunks.join("\n\n");
  } catch (err) {
    console.error("[queryProductDocuments] failed:", err);
    return "";
  }
}

