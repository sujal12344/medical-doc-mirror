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
      { name: "01_MD-26_Cover_Letter_Template.docx", path: path.join(process.cwd(), "format", "md-26", "01_MD-26_Cover_Letter_Template.docx") },
      { name: "02_Official_Form_MD-26_Template.docx", path: path.join(process.cwd(), "format", "md-26", "02_Official_Form_MD-26_Template.docx") },
      { name: "03_MD-26_Device_Classification_Justification_Template.docx", path: path.join(process.cwd(), "format", "md-26", "03_MD-26_Device_Classification_Justification_Template.docx") },
      { name: "04_MD-26_Design_Analysis_and_VV_Report_Template.docx", path: path.join(process.cwd(), "format", "md-26", "04_MD-26_Design_Analysis_and_VV_Report_Template.docx") },
      { name: "05_MD-26_Essential_Principles_Checklist_Template.docx", path: path.join(process.cwd(), "format", "md-26", "05_MD-26_Essential_Principles_Checklist_Template.docx") },
      { name: "06_MD-26_Risk_Management_Report_Template.docx", path: path.join(process.cwd(), "format", "md-26", "06_MD-26_Risk_Management_Report_Template.docx") },
      { name: "07_MD-26_Proposed_IFU_Template.docx", path: path.join(process.cwd(), "format", "md-26", "07_MD-26_Proposed_IFU_Template.docx") },
      { name: "08_MD-26_Proposed_Labelling_Specification_Template.docx", path: path.join(process.cwd(), "format", "md-26", "08_MD-26_Proposed_Labelling_Specification_Template.docx") },
      { name: "09_MD-26_Clinical_Investigation_Report_Template.docx", path: path.join(process.cwd(), "format", "md-26", "09_MD-26_Clinical_Investigation_Report_Template.docx") },
      { name: "10_MD-26_Stability_Study_Report_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "10_MD-26_Stability_Study_Report_Conditional_Template.docx") },
      { name: "11_MD-26_Biocompatibility_and_Animal_Performance_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "11_MD-26_Biocompatibility_and_Animal_Performance_Conditional_Template.docx") },
      { name: "12_MD-26_Regulatory_Market_PMS_and_Indian_Population_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "12_MD-26_Regulatory_Market_PMS_and_Indian_Population_Conditional_Template.docx") },
      { name: "13_MD-26_Clinical_Investigation_Waiver_Request_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "13_MD-26_Clinical_Investigation_Waiver_Request_Conditional_Template.docx") },
      { name: "14_MD-26_Post_Marketing_Clinical_Investigation_Undertaking_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "14_MD-26_Post_Marketing_Clinical_Investigation_Undertaking_Conditional_Template.docx") },
      { name: "15_MD-26_Drug_Device_Combination_Data_Conditional_Template.docx", path: path.join(process.cwd(), "format", "md-26", "15_MD-26_Drug_Device_Combination_Data_Conditional_Template.docx") }
    ];

    const zipArchive = new JSZip();
    let successCount = 0;

    for (const template of templates) {
      try {
        console.log("[generate-md26] Processing template:", template.name);
        const content = await fs.readFile(/*turbopackIgnore: true*/ template.path);
        console.log("[generate-md26] File loaded, size:", content.length);
        
        // Copy templates as-is without processing
        // Users will manually fill them in Word
        zipArchive.file(template.name, content);
        successCount++;
        console.log("[generate-md26] Successfully added:", template.name);
      } catch (err) {
        console.error("[generate-md26] Error processing template:", template.name, err);
        // Continue if one is missing, to return whatever is available
      }
    }

    console.log("[generate-md26] Total templates processed:", successCount, "out of", templates.length);

    if (successCount === 0) {
      return NextResponse.json({ error: "No templates could be processed" }, { status: 500 });
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.log("[generate-md26] ZIP buffer size:", zipBuffer.length);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-26_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md26] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
