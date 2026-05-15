import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

// Load environment variables (adjust path if needed)
dotenv.config({ path: path.join(process.cwd(), ".env") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_KEY! });

// Config
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX2!; // Change to your actual index name
const NAMESPACE = "regulatory-knowledge-india";
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  // Clean up excessive whitespace
  const cleanText = text.replace(/\n+/g, "\n").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  
  let i = 0;
  while (i < cleanText.length) {
    let end = i + chunkSize;
    // Try not to cut off in the middle of a word/sentence if possible
    if (end < cleanText.length) {
      const nextSpace = cleanText.indexOf(" ", end);
      if (nextSpace !== -1 && nextSpace - end < 50) {
        end = nextSpace;
      }
    }
    
    chunks.push(cleanText.substring(i, end).trim());
    i = end - overlap;
  }
  return chunks;
}

async function main() {
  try {
    const pdfPath = path.join(process.cwd(), "src", "guidelines", "MDR2017.pdf");
    console.log(`[1/5] Reading PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF file not found. Ensure src/guidelines/MDR2017.pdf exists.");
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const fullText = pdfData.text;
    console.log(`[2/5] Extracted ${fullText.length} characters from PDF.`);

    console.log(`[3/5] Chunking text (Size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP})...`);
    const chunks = chunkText(fullText, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`      Created ${chunks.length} chunks.`);

    const index = pc.index(PINECONE_INDEX_NAME);
    const ns = index.namespace(NAMESPACE);

    console.log(`[4/5] Generating embeddings and upserting in batches to namespace: '${NAMESPACE}'...`);
    
    const BATCH_SIZE = 100;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      console.log(`      Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`);
      
      // Generate embeddings
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batchChunks,
      });

      // Prepare vectors
      const vectors = batchChunks.map((chunk, j) => ({
        id: `mdr2017-chunk-${i + j}`,
        values: embeddingResponse.data[j].embedding,
        metadata: {
          source: "MDR_2017_India",
          text: chunk, // Store the text directly in metadata for RAG retrieval
        },
      }));

      // Upsert to Pinecone
      await ns.upsert({ records: vectors });
    }

    console.log("[5/5] Success! Knowledge seeded to Pinecone.");

  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

main();
