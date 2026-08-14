import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import JSZip from "jszip";
import path from "path";
import fs from "fs/promises";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid document id" }, { status: 400 });

    const templates = [
      { name: "01_Official_Form_MD-41_Template.docx", path: path.join(process.cwd(), "format", "md-41", "01_Official_Form_MD-41_Template.docx") },
      { name: "02_MD-41_Good_Distribution_Compliance_Self-Certificate_Template.docx", path: path.join(process.cwd(), "format", "md-41", "02_MD-41_Good_Distribution_Compliance_Self-Certificate_Template.docx") },
      { name: "03_MD-41_Other_Activities_at_Premises_Statement_Template.docx", path: path.join(process.cwd(), "format", "md-41", "03_MD-41_Other_Activities_at_Premises_Statement_Template.docx") },
      { name: "04_MD-41_Storage_Requirements_Compliance_Undertaking_Template.docx", path: path.join(process.cwd(), "format", "md-41", "04_MD-41_Storage_Requirements_Compliance_Undertaking_Template.docx") }
    ];

    const zipArchive = new JSZip();
    let successCount = 0;

    for (const template of templates) {
      try {
        console.log("[generate-md41] Processing template:", template.name);
        const content = await fs.readFile(/*turbopackIgnore: true*/ template.path);
        console.log("[generate-md41] File loaded, size:", content.length);
        
        // Copy templates as-is without processing
        // Users will manually fill them in Word
        zipArchive.file(template.name, content);
        successCount++;
        console.log("[generate-md41] Successfully added:", template.name);
      } catch (err) {
        console.error("[generate-md41] Error processing template:", template.name, err);
        // Continue if one is missing, to return whatever is available
      }
    }

    console.log("[generate-md41] Total templates processed:", successCount, "out of", templates.length);

    if (successCount === 0) {
      return NextResponse.json({ error: "No templates could be processed" }, { status: 500 });
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.log("[generate-md41] ZIP buffer size:", zipBuffer.length);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-41_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md41] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
