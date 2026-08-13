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
      { name: "01_MD-22_Cover_Letter_Template.docx", path: path.join(process.cwd(), "format", "md-22", "01_MD-22_Cover_Letter_Template.docx") },
      { name: "02_Official_Form_MD-22_Template.docx", path: path.join(process.cwd(), "format", "md-22", "02_Official_Form_MD-22_Template.docx") },
      { name: "03_MD-22_Device_Classification_Justification_Template.docx", path: path.join(process.cwd(), "format", "md-22", "03_MD-22_Device_Classification_Justification_Template.docx") },
      { name: "04_MD-22_Design_Analysis_Report_Template.docx", path: path.join(process.cwd(), "format", "md-22", "04_MD-22_Design_Analysis_Report_Template.docx") },
      { name: "05_MD-22_Sponsor_Principal_Investigator_Agreement_Template.docx", path: path.join(process.cwd(), "format", "md-22", "05_MD-22_Sponsor_Principal_Investigator_Agreement_Template.docx") },
      { name: "06_MD-22_AE_SAE_Reporting_Forms_Template.docx", path: path.join(process.cwd(), "format", "md-22", "06_MD-22_AE_SAE_Reporting_Forms_Template.docx") },
      { name: "07_MD-22_Investigator_Brochure_Template.docx", path: path.join(process.cwd(), "format", "md-22", "07_MD-22_Investigator_Brochure_Template.docx") },
      { name: "08_MD-22_Clinical_Investigation_Plan_Template.docx", path: path.join(process.cwd(), "format", "md-22", "08_MD-22_Clinical_Investigation_Plan_Template.docx") },
      { name: "09_MD-22_Case_Report_Form_Template.docx", path: path.join(process.cwd(), "format", "md-22", "09_MD-22_Case_Report_Form_Template.docx") },
      { name: "10_MD-22_Patient_Information_and_Informed_Consent_Template.docx", path: path.join(process.cwd(), "format", "md-22", "10_MD-22_Patient_Information_and_Informed_Consent_Template.docx") },
      { name: "11_MD-22_Investigator_Undertaking_Template.docx", path: path.join(process.cwd(), "format", "md-22", "11_MD-22_Investigator_Undertaking_Template.docx") }
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
        console.error("[generate-md22] Template not found at", template.path);
        // Continue if one is missing, to return whatever is available
      }
    }

    const zipBuffer = await zipArchive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="MD-22_Documents.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[generate-md22] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
