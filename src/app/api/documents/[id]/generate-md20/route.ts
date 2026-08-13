import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import JSZip from "jszip";
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

    const templates = [
      { name: "MD-20.docx", path: path.join(process.cwd(), "format", "md-20", "MD-20.docx") },
      { name: "MD-20_Supporting_01_Bona_Fide_Personal_Use_Declaration.docx", path: path.join(process.cwd(), "format", "md-20", "MD-20_Supporting_01_Bona_Fide_Personal_Use_Declaration.docx") },
      { name: "MD-20_Supporting_02_Registered_Medical_Practitioner_Prescription.docx", path: path.join(process.cwd(), "format", "md-20", "MD-20_Supporting_02_Registered_Medical_Practitioner_Prescription.docx") }
    ];

    const zipArchive = new JSZip();

    for (const template of templates) {
      try {
        const content = await fs.readFile(template.path);
        const pizZip = new PizZip(content);
        const docxtemplater = new Docxtemplater(pizZip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Pass an empty object for now as requested (no placeholders)
        docxtemplater.render({});
        const buf = docxtemplater.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
        
        zipArchive.file(template.name, buf);
      } catch (err) {
        console.error("[generate-md20] Template not found at", template.path);
        // Continue if one is missing, to return whatever is available
      }
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-20_Documents.zip"`,
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
