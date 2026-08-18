import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import JSZip from "jszip";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import path from "path";
import fs from "fs/promises";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid document id" }, { status: 400 });

    const formatDir = path.join(process.cwd(), "format", "md-8");
    const files = await fs.readdir(formatDir);
    const docxFiles = files.filter(f => f.endsWith(".docx"));

    const zipArchive = new JSZip();

    for (const file of docxFiles) {
      try {
        const filePath = path.join(formatDir, file);
        const content = await fs.readFile(/*turbopackIgnore: true*/ filePath);
        const pizZip = new PizZip(content);
        const docxtemplater = new Docxtemplater(pizZip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        docxtemplater.render({});
        const buf = docxtemplater.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
        
        zipArchive.file(file, buf);
      } catch (err) {
        console.error(`[generate-md8] Error processing template ${file}:`, err);
      }
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-8_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`[generate-md8] Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
