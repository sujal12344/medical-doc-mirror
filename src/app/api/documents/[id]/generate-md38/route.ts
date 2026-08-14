import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import path from "path";
import fs from "fs/promises";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid document id" }, { status: 400 });

    const templatePath = path.join(process.cwd(), "format", "md-38", "04_Official_Form_MD-38_Memorandum_to_Testing_Officer_Template.docx");
    
    const content = await fs.readFile(/*turbopackIgnore: true*/ templatePath);
    const pizZip = new PizZip(content);
    const docxtemplater = new Docxtemplater(pizZip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render with empty data (users will fill manually)
    docxtemplater.render({});
    const buf = docxtemplater.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="MD-38_Memorandum_to_Testing_Officer.docx"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md38] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
