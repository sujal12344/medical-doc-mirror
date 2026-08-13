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
      { name: "01_Cover_Letter_MD24.docx", path: path.join(process.cwd(), "format", "md-24", "01_Cover_Letter_MD24.docx") },
      { name: "02_Form_MD24_with_Annexure.docx", path: path.join(process.cwd(), "format", "md-24", "02_Form_MD24_with_Annexure.docx") },
      { name: "03_IVD_Device_Description_IFU_and_Labels.docx", path: path.join(process.cwd(), "format", "md-24", "03_IVD_Device_Description_IFU_and_Labels.docx") },
      { name: "04_In_House_Performance_Evaluation_Report.docx", path: path.join(process.cwd(), "format", "md-24", "04_In_House_Performance_Evaluation_Report.docx") },
      { name: "05_Clinical_Performance_Evaluation_Plan.docx", path: path.join(process.cwd(), "format", "md-24", "05_Clinical_Performance_Evaluation_Plan.docx") },
      { name: "06_Case_Report_Form.docx", path: path.join(process.cwd(), "format", "md-24", "06_Case_Report_Form.docx") },
      { name: "07_Investigator_Undertaking.docx", path: path.join(process.cwd(), "format", "md-24", "07_Investigator_Undertaking.docx") },
      { name: "08_Device_Conformity_and_Safety_Undertaking.docx", path: path.join(process.cwd(), "format", "md-24", "08_Device_Conformity_and_Safety_Undertaking.docx") }
    ];

    const zipArchive = new JSZip();
    let successCount = 0;

    for (const template of templates) {
      try {
        console.log("[generate-md24] Processing template:", template.name);
        const content = await fs.readFile(/*turbopackIgnore: true*/ template.path);
        console.log("[generate-md24] File loaded, size:", content.length);
        
        // Since templates have placeholder syntax issues, just copy them as-is
        // Users will manually fill them in Word
        zipArchive.file(template.name, content);
        successCount++;
        console.log("[generate-md24] Successfully added:", template.name);
      } catch (err) {
        console.error("[generate-md24] Error processing template:", template.name, err);
        // Continue if one is missing, to return whatever is available
      }
    }

    console.log("[generate-md24] Total templates processed:", successCount, "out of", templates.length);

    if (successCount === 0) {
      return NextResponse.json({ error: "No templates could be processed" }, { status: 500 });
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.log("[generate-md24] ZIP buffer size:", zipBuffer.length);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-24_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md24] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
