import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";

// Import from the implementation directly — pdf-parse/index.js runs a readFileSync
// self-test at module evaluation time which crashes Next.js during build page collection.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch {
    return "";
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      extractedText = await extractTextFromPDF(buffer);
    } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|csv|xml|json|md)$/i)) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload PDF or text files." }, { status: 400 });
    }

    const trimmed = extractedText.slice(0, 200_000);

    const product = await Product.findById(doc.productId);
    if (product) {
      product.uploadedDocs.push({
        fileId: randomUUID(),
        originalName: file.name,
        mimeType: file.type || "application/pdf",
        sizeBytes: buffer.length,
        extractedText: trimmed,
        uploadedAt: new Date(),
      });
      await product.save();
    }

    return NextResponse.json({
      fileName: file.name,
      charCount: trimmed.length,
      preview: trimmed.slice(0, 300),
      extractedText: trimmed,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST chat-upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
