import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";

import { extractDocumentText } from "@/lib/documentExtract";

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

    try {
      const result = await extractDocumentText(buffer, file.name);
      extractedText = result.text;
    } catch (e) {
      console.error("[chat-upload] Extraction error:", e);
      return NextResponse.json({ error: "Unsupported file type or extraction failed. Upload PDF, Image, or text files." }, { status: 400 });
    }

    const trimmed = extractedText.slice(0, 200_000);

    const product = await Product.findById((doc.contextPayload?.productId || doc.contextPayload?.productIds?.[0]));
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
