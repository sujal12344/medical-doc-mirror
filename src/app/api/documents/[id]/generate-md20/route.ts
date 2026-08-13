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

    const body = await req.json().catch(() => ({}));
    const { docType } = body;
    
    if (!["form", "declaration", "prescription"].includes(docType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // Determine the template filename
    let templateFilename = "";
    if (docType === "form") {
      templateFilename = "MD-20.docx";
    } else if (docType === "declaration") {
      templateFilename = "MD-20_Supporting_01_Bona_Fide_Personal_Use_Declaration.docx";
    } else if (docType === "prescription") {
      templateFilename = "MD-20_Supporting_02_Registered_Medical_Practitioner_Prescription.docx";
    }

    const templatePath = path.join(process.cwd(), "format", "md-20", templateFilename);
    
    let content: Buffer;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      console.error("[generate-md20] Template not found at", templatePath);
      return NextResponse.json({ error: "Template file not found on server" }, { status: 500 });
    }

    const zip = new PizZip(content);
    const docxtemplater = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Pass an empty object for now as requested (no placeholders)
    docxtemplater.render({});
    const buf = docxtemplater.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="MD-20_${docType}.docx"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md20] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
