import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { FRAMEWORKS } from "@/lib/frameworks";
import { sectionsToPlain } from "@/lib/documentSections";
import { generateDocxFromTemplate, cleanPlaceholders, type PlaceholderMap } from "@/lib/docxTemplateHelper";
import fs from "fs";
import path from "path";

const LOG = "[generate-md1]";

/**
 * MD-1 document generation route
 * Generates multiple DOCX files from templates, filling placeholders with extracted data
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const sections = sectionsToPlain(doc.sections);

    console.log(`${LOG} start`, {
      documentId: id,
      frameworkId: doc.frameworkId,
      framework: fw.documentType,
      sectionsAvailable: Object.keys(sections),
    });

    // Debug: Log section fields
    for (const [sectionId, sectionData] of Object.entries(sections)) {
      console.log(`${LOG} Section ${sectionId}:`, {
        fieldCount: Object.keys(sectionData.fields || {}).length,
        fields: Object.keys(sectionData.fields || {}),
      });
    }

    // Helper to get field value with fallback
    function f(sid: string, fid: string, fallback = ""): string {
      const value = (sections[sid]?.fields?.[fid] as string) || fallback;
      if (!value && !fallback) {
        console.log(`${LOG} Missing field: ${sid}.${fid}`);
      }
      return value;
    }

    // Get current date as default
    const today = new Date();
    const defaultDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const defaultPlace = f("s1", "registeredOfficeAddress", "").split(",")[0] || "Mumbai";
    
    // Smart helper for common s5 fields
    const s5 = (fid: string): string => {
      switch(fid) {
        case "applicationDate": return f("s5", fid, defaultDate);
        case "applicationPlace": return f("s5", fid, defaultPlace);
        case "designatedPersonName": return f("s5", fid, "[Authorized Signatory Name]");
        case "designatedPersonDesignation": return f("s5", fid, "[Designation]");
        default: return f("s5", fid);
      }
    };

    // Template directory
    const templateDir = path.join(process.cwd(), "format", "md1", "template");

    // Define template configurations dynamically
    // NOTE: Templates use {camelCase} placeholders matching field IDs
    const templates: Array<{ file: string; output: string; placeholders: PlaceholderMap }> = [
      {
        file: "01_MD-1_Covering_Letter_Template.docx",
        output: "01_MD-1_Covering_Letter.docx",
        placeholders: cleanPlaceholders({
          applicationDate: s5("applicationDate"),
          applicantName: f("s1", "applicantName"),
          bodyConstitution: f("s1", "bodyConstitution"),
          registeredOfficeAddress: f("s1", "registeredOfficeAddress"),
          accreditationBody: f("s2", "accreditationBody"),
          accreditationCertificateNumber: f("s2", "accreditationCertificateNumber"),
          accreditedStandards: f("s2", "applicableAccreditationStandards"),
          feePaymentDetails: `Date: ${f("s3", "feePaidDate")}, Amount: ${f("s3", "feeAmount")}, Receipt: ${f("s3", "feeReceiptOrChallanNumber")}`,
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
          applicationPlace: s5("applicationPlace"),
          telephoneNumber: f("s1", "mobileNumber"),
          emailAddress: f("s1", "emailAddress"),
        }),
      },
      {
        file: "02_MD-1_Constitution_Details_Template.docx",
        output: "02_MD-1_Constitution_Details.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          bodyConstitution: f("s1", "bodyConstitution"),
          incorporationNumber: f("s1", "incorporationOrRegistrationNumber"),
          incorporationDate: f("s1", "incorporationOrRegistrationDate"),
          registeringAuthority: f("s1", "registeringAuthority"),
          registeredOfficeAddress: f("s1", "registeredOfficeAddress"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
        }),
      },
      {
        file: "03_MD-1_Organisation_Audit_Business_Profile_Template.docx",
        output: "03_MD-1_Organisation_Audit_Business_Profile.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
      {
        file: "04_MD-1_SOP_Master_List_Template(1).docx",
        output: "04_MD-1_SOP_Master_List.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
      {
        file: "05_MD-1_Technical_Personnel_and_Outside_Experts_List_Template.docx",
        output: "05_MD-1_Technical_Personnel_and_Outside_Experts_List.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
      {
        file: "06_MD-1_Independence_and_Conflict_of_Interest_Undertaking_Template.docx",
        output: "06_MD-1_Independence_and_Conflict_of_Interest_Undertaking.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
      {
        file: "07_Official_Form_MD-1_Template.docx",
        output: "07_Official_Form_MD-1.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          bodyConstitution: f("s1", "bodyConstitution"),
          registeredOfficeAddress: f("s1", "registeredOfficeAddress"),
          telephoneNumber: f("s1", "mobileNumber"),
          mobileNumber: f("s1", "mobileNumber"),
          faxNumber: f("s1", "mobileNumber"),
          emailAddress: f("s1", "emailAddress"),
          accreditationBody: f("s2", "accreditationBody"),
          accreditationCertificateNumber: f("s2", "accreditationCertificateNumber"),
          accreditationValidity: `${f("s2", "accreditationIssueDate")} to ${f("s2", "accreditationExpiryDate")}`,
          accreditationScope: f("s2", "accreditationScopeSummary"),
          slNo: "1",
          standard: f("s2", "applicableAccreditationStandards"),
          scope: f("s2", "accreditationScopeSummary"),
          feePaidDate: f("s3", "feePaidDate"),
          feeAmount: f("s3", "feeAmount"),
          feeReferenceNumber: f("s3", "feeReceiptOrChallanNumber"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
      {
        file: "08_Quality_Manual_of_the_Organisation_Template.docx",
        output: "08_Quality_Manual_of_the_Organisation.docx",
        placeholders: cleanPlaceholders({
          applicantName: f("s1", "applicantName"),
          recordControlAndRetentionSummary: f("s4", "recordControlAndRetentionSummary", "[Record control and retention processes to be documented]"),
          complaintsAndAppealsProcessSummary: f("s4", "complaintsAndAppealsProcessSummary", "[Complaints and appeals handling process to be documented]"),
          internalAuditProcessSummary: f("s4", "internalAuditProcessSummary", "[Internal audit process to be documented]"),
          managementReviewProcessSummary: f("s4", "managementReviewProcessSummary", "[Management review process to be documented]"),
          correctiveActionProcessSummary: f("s4", "correctiveActionProcessSummary", "[Corrective action process to be documented]"),
          changeControlProcessSummary: f("s4", "changeControlProcessSummary", "[Change control process to be documented]"),
          applicationPlace: s5("applicationPlace"),
          applicationDate: s5("applicationDate"),
          designatedPersonName: s5("designatedPersonName"),
          designatedPersonDesignation: s5("designatedPersonDesignation"),
        }),
      },
    ];

    // Create ZIP file containing all generated documents
    const zip = new JSZip();
    let generatedCount = 0;

    for (const template of templates) {
      const templatePath = path.join(templateDir, template.file);

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.warn(`${LOG} Template not found: ${template.file}`);
        continue;
      }

      try {
        // Debug: Log first template's data
        if (generatedCount === 0) {
          console.log(`${LOG} Sample data for ${template.output}:`, JSON.stringify(template.placeholders, null, 2));
          
          // Extract and log actual placeholders from template
          const { extractPlaceholdersFromTemplate } = await import("@/lib/docxTemplateHelper");
          const templatePlaceholders = extractPlaceholdersFromTemplate(templatePath);
          console.log(`${LOG} Placeholders found in template ${template.file}:`, templatePlaceholders);
        }

        // Generate document from template
        const buffer = generateDocxFromTemplate(templatePath, template.placeholders);

        // Add to ZIP
        zip.file(template.output, buffer);
        generatedCount++;
        console.log(`${LOG} Generated: ${template.output}`);
      } catch (error) {
        console.error(`${LOG} Error generating ${template.file}:`, error);
        // Continue with other templates even if one fails
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const filename = `${f("s1", "applicantName").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "MD-1"}_Application_Package.zip`;

    console.log(`${LOG} Complete. Generated ${generatedCount}/${templates.length} documents in ZIP: ${filename}`);

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
