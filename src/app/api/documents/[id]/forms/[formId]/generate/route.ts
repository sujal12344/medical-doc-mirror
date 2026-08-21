import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { sectionsToPlain } from "@/lib/documentSections";
import { generateDocxFromTemplate, cleanPlaceholders } from "@/lib/docxTemplateHelper";
import { CDSCO_FORM_GROUPS } from "@/lib/frameworks/asia/india-forms";
import fs from "fs";
import path from "path";

const LOG = "[generate-dynamic]";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, formId } = await params;
    const formIdUpper = formId.toUpperCase();
    
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const group = CDSCO_FORM_GROUPS.find(g => g.forms.some(f => f.id === formIdUpper));
    const formConfig = group?.forms.find(f => f.id === formIdUpper);
    
    if (!formConfig) {
      return NextResponse.json({ error: `Configuration for form ${formIdUpper} not found.` }, { status: 404 });
    }

    const sections = sectionsToPlain(doc.sections);
    
    // Flatten all fields into a single placeholder map
    const placeholders: Record<string, string> = {};
    for (const sectionData of Object.values(sections)) {
      if (sectionData.fields) {
        for (const [fieldId, fieldValue] of Object.entries(sectionData.fields)) {
          if (fieldValue !== undefined && fieldValue !== null) {
             placeholders[fieldId] = String(fieldValue);
          }
        }
      }
    }

    // Add smart defaults
    const today = new Date();
    if (!placeholders.applicationDate) {
      placeholders.applicationDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    }
    if (!placeholders.applicationPlace) {
      placeholders.applicationPlace = placeholders.registeredOfficeAddress?.split(",")[0] || "Mumbai";
    }
    if (!placeholders.designatedPersonName) {
      placeholders.designatedPersonName = "[Authorized Signatory Name]";
    }
    if (!placeholders.designatedPersonDesignation) {
      placeholders.designatedPersonDesignation = "[Designation]";
    }

    // Handle nested specific CDSCO combinations gracefully
    placeholders.accreditationValidity = placeholders.accreditationIssueDate && placeholders.accreditationExpiryDate 
      ? `${placeholders.accreditationIssueDate} to ${placeholders.accreditationExpiryDate}` 
      : "";
    placeholders.feePaymentDetails = placeholders.feePaidDate && placeholders.feeAmount
      ? `Date: ${placeholders.feePaidDate}, Amount: ${placeholders.feeAmount}, Receipt: ${placeholders.feeReceiptOrChallanNumber || ""}`
      : "";
    
    // Standardize aliases used in older templates
    placeholders.incorporationNumber = placeholders.incorporationOrRegistrationNumber || "";
    placeholders.incorporationDate = placeholders.incorporationOrRegistrationDate || "";
    placeholders.telephoneNumber = placeholders.mobileNumber || "";
    placeholders.faxNumber = placeholders.mobileNumber || "";
    placeholders.slNo = "1";
    placeholders.standard = placeholders.applicableAccreditationStandards || "";
    placeholders.scope = placeholders.accreditationScopeSummary || "";

    const body = await _req.json().catch(() => ({}));
    const overrides = body.overrides || {};

    const cleanedPlaceholders = cleanPlaceholders(placeholders);

    // Apply any user-provided overrides from the preview modal
    for (const [key, val] of Object.entries(overrides)) {
      if (val !== undefined && val !== null) {
        cleanedPlaceholders[key] = String(val);
      }
    }

    // Create ZIP file containing all generated documents
    const zip = new JSZip();
    let generatedCount = 0;
    
    const safeFormId = formId.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    const templateDir = path.join(process.cwd(), "format", safeFormId);

    for (const template of formConfig.documents) {
      // In the legacy system, md1 templates were in `format/md1/template/`
      // while md4 was in `format/md-4/`. We will check both.
      const legacyDir = safeFormId.replace("-", ""); // e.g. md1
      const legacyTemplateDir = path.join(process.cwd(), "format", legacyDir, "template");
      
      let templatePath = path.join(templateDir, template.fileName);
      if (!fs.existsSync(templatePath)) {
         templatePath = path.join(legacyTemplateDir, template.fileName);
      }

      if (!fs.existsSync(templatePath)) {
        console.warn(`${LOG} Template not found: ${template.fileName} in both ${templateDir} and ${legacyTemplateDir}`);
        continue;
      }

      try {
        const buffer = generateDocxFromTemplate(templatePath, cleanedPlaceholders);
        const outputName = template.fileName.replace("_Template", "");
        zip.file(outputName, buffer);
        generatedCount++;
        console.log(`${LOG} Generated: ${outputName}`);
      } catch (error) {
        console.error(`${LOG} Error generating ${template.fileName}:`, error);
      }
    }

    if (generatedCount === 0) {
      return NextResponse.json({ error: "Failed to generate any templates. Please ensure templates exist on the server." }, { status: 500 });
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const filename = `${(placeholders.applicantName || formIdUpper).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}_Application_Package.zip`;

    console.log(`${LOG} Complete. Generated ${generatedCount}/${formConfig.documents.length} documents in ZIP: ${filename}`);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`${LOG} failed:`, error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
