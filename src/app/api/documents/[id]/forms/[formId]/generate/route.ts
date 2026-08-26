import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
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

    const productIds: string[] = doc.contextPayload?.productIds || [];
    
    // Fetch products from DB to get their names and details for the Annexure
    const fetchedProducts = productIds.length > 0 
      ? await Product.find({ _id: { $in: productIds } }).lean() 
      : [];

    // Inject array for the Annexure table loop
    cleanedPlaceholders.annexureProducts = fetchedProducts.map((p: any, i: number) => ({
      sn: i + 1,
      genericName: p.name || "N/A",
      modelNo: p.modelNo || "N/A",
      intendedUse: p.intendedUse || "N/A",
      deviceClass: p.classification || "N/A",
      material: p.material || "N/A",
      dimension: p.dimension || "N/A",
      shelfLife: p.shelfLife || "N/A",
      sterile: p.sterile ? "Sterile" : "Non-sterile",
      brandName: p.brandName || "N/A"
    }));

    // For preview fallback if it's missing
    if (cleanedPlaceholders.annexureProducts.length === 0) {
      cleanedPlaceholders.annexureProducts = [{
        sn: 1, genericName: "Sample Product", modelNo: "-", intendedUse: "-",
        deviceClass: "A", material: "-", dimension: "-", shelfLife: "-", sterile: "-", brandName: "-"
      }];
    }

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
        if (template.source === 'DMF') {
          // Generate one copy PER product using the actual product name
          for (let i = 0; i < fetchedProducts.length; i++) {
            const product = fetchedProducts[i] as any;
            
            // Evaluate condition rule if it exists
            if (template.conditionRule) {
               try {
                 // Create a safe context for evaluation
                 const context = { product };
                 // eslint-disable-next-line no-new-func
                 const conditionFn = new Function('context', `return ${template.conditionRule};`);
                 const isMatch = conditionFn(context);
                 if (!isMatch) {
                    console.log(`${LOG} Skipping ${template.fileName} for product ${product.name} due to conditionRule`);
                    continue;
                 }
               } catch (e) {
                 console.error(`${LOG} Error evaluating conditionRule for ${template.fileName}:`, e);
               }
            }

            const productSpecificPlaceholders = { 
              ...cleanedPlaceholders, 
              productId: product._id.toString(),
              productName: product.name 
            };
            
            const buffer = generateDocxFromTemplate(templatePath, productSpecificPlaceholders);
            const baseName = template.fileName.replace("_Template", "").replace(".docx", "");
            
            // Format the product name to be file-system safe
            const safeProductName = product.name ? product.name.replace(/[^a-zA-Z0-9_-]/g, "_") : `Product_${i + 1}`;
            const outputName = `${baseName}_${safeProductName}.docx`;
            
            zip.file(outputName, buffer);
            generatedCount++;
            console.log(`${LOG} Generated (Duplicated): ${outputName}`);
          }
          
          // Fallback if no products were selected
          if (fetchedProducts.length === 0) {
             const buffer = generateDocxFromTemplate(templatePath, cleanedPlaceholders);
             const baseName = template.fileName.replace("_Template", "").replace(".docx", "");
             const outputName = `${baseName}_Default.docx`;
             zip.file(outputName, buffer);
             generatedCount++;
          }
        } else {
          // Generate a single copy (e.g. for PMF, FORM, LEGAL)
          const buffer = generateDocxFromTemplate(templatePath, cleanedPlaceholders);
          const outputName = template.fileName.replace("_Template", "");
          zip.file(outputName, buffer);
          generatedCount++;
          console.log(`${LOG} Generated: ${outputName}`);
        }
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
