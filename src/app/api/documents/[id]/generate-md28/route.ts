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
      { name: "01_MD-28_Cover_Letter_Template.docx", path: path.join(process.cwd(), "format", "md-28", "01_MD-28_Cover_Letter_Template.docx") },
      { name: "02_Official_Form_MD-28_Template.docx", path: path.join(process.cwd(), "format", "md-28", "02_Official_Form_MD-28_Template.docx") },
      { name: "03_MD-28_Fifth_Schedule_Compliance_Undertaking_Template.docx", path: path.join(process.cwd(), "format", "md-28", "03_MD-28_Fifth_Schedule_Compliance_Undertaking_Template.docx") },
      { name: "04_MD-28_Site_or_Plant_Master_File_Template.docx", path: path.join(process.cwd(), "format", "md-28", "04_MD-28_Site_or_Plant_Master_File_Template.docx") },
      { name: "05_MD-28_IVD_Device_Master_File_Template.docx", path: path.join(process.cwd(), "format", "md-28", "05_MD-28_IVD_Device_Master_File_Template.docx") },
      { name: "06_MD-28_Device_Data_and_Validation_Report_Template.docx", path: path.join(process.cwd(), "format", "md-28", "06_MD-28_Device_Data_and_Validation_Report_Template.docx") },
      { name: "07_MD-28_Risk_Management_Report_Template.docx", path: path.join(process.cwd(), "format", "md-28", "07_MD-28_Risk_Management_Report_Template.docx") },
      { name: "08_MD-28_Clinical_Performance_Evaluation_Data_Report_Template.docx", path: path.join(process.cwd(), "format", "md-28", "08_MD-28_Clinical_Performance_Evaluation_Data_Report_Template.docx") },
      { name: "09_MD-28_Regulatory_Status_and_Restrictions_Statement_Template.docx", path: path.join(process.cwd(), "format", "md-28", "09_MD-28_Regulatory_Status_and_Restrictions_Statement_Template.docx") },
      { name: "10_MD-28_Essential_Principles_Checklist_Template.docx", path: path.join(process.cwd(), "format", "md-28", "10_MD-28_Essential_Principles_Checklist_Template.docx") },
      { name: "11_MD-28_Product_Insert_Template.docx", path: path.join(process.cwd(), "format", "md-28", "11_MD-28_Product_Insert_Template.docx") },
      { name: "12_MD-28_Labelling_and_Pack_Size_Specification_Template.docx", path: path.join(process.cwd(), "format", "md-28", "12_MD-28_Labelling_and_Pack_Size_Specification_Template.docx") },
      { name: "13_MD-28_Stability_Study_Report_Template.docx", path: path.join(process.cwd(), "format", "md-28", "13_MD-28_Stability_Study_Report_Template.docx") },
      { name: "14_MD-28_Power_of_Attorney_Import_Only_Template.docx", path: path.join(process.cwd(), "format", "md-28", "14_MD-28_Power_of_Attorney_Import_Only_Template.docx") },
      { name: "15_MD-28_Authorised_Agent_Undertaking_Import_Only_Template.docx", path: path.join(process.cwd(), "format", "md-28", "15_MD-28_Authorised_Agent_Undertaking_Import_Only_Template.docx") },
      { name: "16_MD-28_to_FSC_Product_Correlation_Chart_Import_Only_Template.docx", path: path.join(process.cwd(), "format", "md-28", "16_MD-28_to_FSC_Product_Correlation_Chart_Import_Only_Template.docx") },
      { name: "17_MD-28_CPE_Waiver_Request_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-28", "17_MD-28_CPE_Waiver_Request_Conditional_Template.docx") }
    ];

    const zipArchive = new JSZip();
    let successCount = 0;

    for (const template of templates) {
      try {
        console.log("[generate-md28] Processing template:", template.name);
        const content = await fs.readFile(/*turbopackIgnore: true*/ template.path);
        console.log("[generate-md28] File loaded, size:", content.length);
        
        // Copy templates as-is without processing
        // Users will manually fill them in Word
        zipArchive.file(template.name, content);
        successCount++;
        console.log("[generate-md28] Successfully added:", template.name);
      } catch (err) {
        console.error("[generate-md28] Error processing template:", template.name, err);
        // Continue if one is missing, to return whatever is available
      }
    }

    console.log("[generate-md28] Total templates processed:", successCount, "out of", templates.length);

    if (successCount === 0) {
      return NextResponse.json({ error: "No templates could be processed" }, { status: 500 });
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.log("[generate-md28] ZIP buffer size:", zipBuffer.length);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-28_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md28] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
