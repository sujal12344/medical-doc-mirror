import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import path from "path";
import fs from "fs/promises";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid document id" }, { status: 400 });

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const md11Fields = (doc as Record<string, any>).sections?.["md-11"]?.fields || {};

    // ── Build merged values ─────────────────────────────────────────────
    const mergedValues = {
      manufacturerName: md11Fields.manufacturerName || "",
      productName: md11Fields.productName || "",
      intendedUse: md11Fields.intendedUse || "",
      productClass: md11Fields.productClass || "",
      
      manufacturerAddress: md11Fields.manufacturerAddress || "",
      applicationNumber: md11Fields.applicationNumber || "",
      applicationDate: md11Fields.applicationDate || "",
      videNumber: md11Fields.videNumber || "",
      videDate: md11Fields.videDate || "",
      inspectionDate: md11Fields.inspectionDate || "",
      shelfLife: md11Fields.shelfLife || "",
    };

    console.log("[generate-md11] Rendering template with values:", mergedValues);

    // ── Load template and render ─────────────────────────────────────────
    const templatePath = path.join(process.cwd(), "format", "md-11", "Inspection book.docx");
    
    let content: Buffer;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      console.error("[generate-md11] Template not found at", templatePath);
      return NextResponse.json({ error: "Template file not found on server" }, { status: 500 });
    }

    const zip = new PizZip(content);
    const docxtemplater = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    docxtemplater.render(mergedValues);
    const buf = docxtemplater.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="MD-11_Inspection_Book.docx"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md11] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
