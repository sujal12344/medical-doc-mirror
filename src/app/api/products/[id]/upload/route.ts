import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
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

function extractTextFromPlain(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";

    // ── JSON shortcut: { originalName, extractedText } ────────────────────────
    // Used when the caller already has the extracted text (e.g. autofill on new-product page).
    if (contentType.includes("application/json")) {
      const body = await req.json() as { originalName?: string; extractedText?: string };
      const originalName = (body.originalName || "document.pdf").trim();
      const extractedText = (body.extractedText || "").slice(0, 200_000);
      if (!extractedText) {
        return NextResponse.json({ error: "extractedText is required" }, { status: 400 });
      }
      const fileId = randomUUID();
      product.uploadedDocs.push({
        fileId,
        originalName,
        mimeType: "application/pdf",
        sizeBytes: Buffer.byteLength(extractedText, "utf8"),
        extractedText,
        uploadedAt: new Date(),
      });
      await product.save();
      console.log(`[upload] Saved doc "${originalName}" (${extractedText.length} chars) to product ${id} via JSON`);
      return NextResponse.json({
        uploaded: 1,
        files: [{ fileId, originalName, charCount: extractedText.length }],
        totalDocs: product.uploadedDocs.length,
      });
    }

    // ── Multipart: actual file uploads ────────────────────────────────────────
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results: { fileId: string; originalName: string; extractedText: string; charCount: number }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileId = randomUUID();

      let extractedText = "";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(buffer);
      } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|csv|xml|json|md)$/i)) {
        extractedText = extractTextFromPlain(buffer);
      }

      const trimmed = extractedText.slice(0, 200_000);

      product.uploadedDocs.push({
        fileId,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: buffer.length,
        extractedText: trimmed,
        uploadedAt: new Date(),
      });

      results.push({ fileId, originalName: file.name, extractedText: trimmed.slice(0, 200), charCount: trimmed.length });
    }

    await product.save();

    return NextResponse.json({
      uploaded: results.length,
      files: results,
      totalDocs: product.uploadedDocs.length,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/products/[id]/upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { fileId } = await req.json();
    await connectToDatabase();

    const product = await Product.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    product.uploadedDocs = product.uploadedDocs.filter((d: { fileId: string }) => d.fileId !== fileId);
    await product.save();

    return NextResponse.json({ ok: true, totalDocs: product.uploadedDocs.length });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
