import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { Company } from "@/models/Company";
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

    const { resolvePlaceholders } = await import("@/lib/frameworks/resolvers");
    const { prefillData, products: fetchedProducts, techDocs, missingKeys } = await resolvePlaceholders(doc, (user as Record<string, unknown>)._id as string);

    const body = await _req.json().catch(() => ({}));
    const overrides = body.overrides || {};
    const ignoreMissing = body.ignoreMissing === true;

    // Intercept generation if significant fields are missing and the user hasn't chosen to ignore.
    // The frontend DynamicExtractionModal will analyze these keys and suggest the correct document (e.g. CIP, ISO, SMF).
    if (!ignoreMissing && missingKeys && missingKeys.length >= 3) {
      return NextResponse.json({ requiresUpload: true, missingKeys });
    }

    // Apply any user-provided overrides from the preview modal on top of prefillData
    for (const [key, val] of Object.entries(overrides)) {
      if (val !== undefined && val !== null) {
        prefillData[key] = String(val);
      }
    }

    const cleanedPlaceholders = cleanPlaceholders(prefillData);

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

            const dmfDoc = techDocs.find(d => 
              (d.frameworkId === "IN_DMF" || d.frameworkId === "IN_DMF_MD") && 
              String(d.contextPayload?.productId) === String(product._id)
            );
            
            const dmfFields: Record<string, string> = {};
            if (dmfDoc) {
              const dmfSections = sectionsToPlain(dmfDoc.sections);
              for (const sectionData of Object.values(dmfSections)) {
                if (sectionData.fields) {
                  for (const [fieldId, fieldValue] of Object.entries(sectionData.fields)) {
                    if (fieldValue !== undefined && fieldValue !== null) {
                       dmfFields[fieldId] = String(fieldValue);
                    }
                  }
                }
              }
            }

            const productSpecificPlaceholders = { 
              ...cleanedPlaceholders, 
              ...dmfFields,
              productId: product._id.toString(),
              productName: product.name 
            };
            
            const buffer = generateDocxFromTemplate(templatePath, productSpecificPlaceholders);
            const baseName = template.fileName.replace("_Template", "").replace(".docx", "");
            
            // Format the product name to be file-system safe
            const safeProductName = product.name ? product.name.replace(/[^a-zA-Z0-9_-]/g, "_") : `Product_${i + 1}`;
            const uniqueId = product.name ? `_${i + 1}` : "";
            const outputName = `${baseName}_${safeProductName}${uniqueId}.docx`;
            
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
    const filename = `${(cleanedPlaceholders.applicantName || formIdUpper).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}_Application_Package.zip`;

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
