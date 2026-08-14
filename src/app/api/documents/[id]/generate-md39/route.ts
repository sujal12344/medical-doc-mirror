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
      { name: "01_MD-39_Covering_Letter_Template.docx", path: path.join(process.cwd(), "format", "md-39", "01_MD-39_Covering_Letter_Template.docx") },
      { name: "02_Official_Form_MD-39_Template.docx", path: path.join(process.cwd(), "format", "md-39", "02_Official_Form_MD-39_Template.docx") },
      { name: "03_MD-39_Organisation_Chart_and_Key_Personnel_Template.docx", path: path.join(process.cwd(), "format", "md-39", "03_MD-39_Organisation_Chart_and_Key_Personnel_Template.docx") },
      { name: "04_MD-39_Technical_Staff_and_Person_In-Charge_List_Template.docx", path: path.join(process.cwd(), "format", "md-39", "04_MD-39_Technical_Staff_and_Person_In-Charge_List_Template.docx") },
      { name: "05_MD-39_Equipment_Apparatus_and_Instruments_List_Template.docx", path: path.join(process.cwd(), "format", "md-39", "05_MD-39_Equipment_Apparatus_and_Instruments_List_Template.docx") },
      { name: "06_MD-39_Contract_Activities_Statement_Template.docx", path: path.join(process.cwd(), "format", "md-39", "06_MD-39_Contract_Activities_Statement_Template.docx") },
      { name: "07_MD-39_Laboratory_QMS_Requirements_Template.docx", path: path.join(process.cwd(), "format", "md-39", "07_MD-39_Laboratory_QMS_Requirements_Template.docx") },
      { name: "08_MD-39_Training_Needs_and_Competence_Procedure_Template.docx", path: path.join(process.cwd(), "format", "md-39", "08_MD-39_Training_Needs_and_Competence_Procedure_Template.docx") },
      { name: "09_MD-39_Standard_and_Test_Method_Master_List_Template.docx", path: path.join(process.cwd(), "format", "md-39", "09_MD-39_Standard_and_Test_Method_Master_List_Template.docx") },
      { name: "10_MD-39_SOP_Master_List_Template.docx", path: path.join(process.cwd(), "format", "md-39", "10_MD-39_SOP_Master_List_Template.docx") }
    ];

    const zipArchive = new JSZip();
    let successCount = 0;

    for (const template of templates) {
      try {
        console.log("[generate-md39] Processing template:", template.name);
        const content = await fs.readFile(/*turbopackIgnore: true*/ template.path);
        console.log("[generate-md39] File loaded, size:", content.length);
        
        // Copy templates as-is without processing
        // Users will manually fill them in Word
        zipArchive.file(template.name, content);
        successCount++;
        console.log("[generate-md39] Successfully added:", template.name);
      } catch (err) {
        console.error("[generate-md39] Error processing template:", template.name, err);
        // Continue if one is missing, to return whatever is available
      }
    }

    console.log("[generate-md39] Total templates processed:", successCount, "out of", templates.length);

    if (successCount === 0) {
      return NextResponse.json({ error: "No templates could be processed" }, { status: 500 });
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.log("[generate-md39] ZIP buffer size:", zipBuffer.length);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-39_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md39] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
