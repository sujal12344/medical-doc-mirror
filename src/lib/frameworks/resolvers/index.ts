import { Company } from "@/models/Company";
import { Product } from "@/models/Product";
import { RegulatoryDocument } from "@/models/Document";
import { sectionsToPlain } from "@/lib/documentSections";
import { ResolverContext, ResolverFn } from "./types";

import { coiResolvers } from "./coi-resolvers";
import { productResolvers } from "./product-resolvers";
import { clinicalResolvers } from "./clinical-resolvers";
import { defaultResolvers } from "./default-resolvers";

/**
 * Global Registry of Placeholder Resolvers
 * Composed of smaller, domain-specific resolver modules to maintain readability.
 */
export const GLOBAL_RESOLVERS: Record<string, ResolverFn> = {
  ...coiResolvers,
  ...productResolvers,
  ...clinicalResolvers,
  ...defaultResolvers,
};

/**
 * Iterates through requested placeholders, attempts to resolve them using GLOBAL_RESOLVERS,
 * and falls back to manually entered values in the document sections or tech docs.
 */
export async function resolvePlaceholders(
  doc: any,
  userId: string
): Promise<{ prefillData: Record<string, any>; products: any[]; techDocs: any[] }> {
  const prefillData: Record<string, any> = {};
  
  // 1. Fetch related data models
  const company = await Company.findById(userId).lean();
  const coi = company?.coiData || {};
  
  let products: any[] = [];
  let techDocs: any[] = [];
  
  if (doc.contextPayload?.productIds?.length) {
    const productIds = doc.contextPayload.productIds;
    products = await Product.find({ _id: { $in: productIds }, userId }).lean();
    techDocs = await RegulatoryDocument.find({
      userId,
      frameworkId: { $in: ["IN_DMF", "IN_DMF_MD", "IN_PMF"] },
      "contextPayload.productId": { $in: productIds }
    }).lean();
  }

  const ctx: ResolverContext = { coi, products, techDocs, doc, userId };

  // Determine Form ID and load required placeholders
  const formIdMatch = doc.frameworkId?.match(/MD[-_]?\d+/i) || doc.type?.match(/MD[-_]?\d+/i);
  let formId = formIdMatch ? formIdMatch[0].toLowerCase() : null;
  if (formId) {
     formId = formId.replace(/md[-_]?/, 'md-');
  }
  
  let requiredKeys: string[] = [];
  let templatesMapping: Record<string, string[]> = {};
  
  if (formId) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const placeholdersPath = path.join(process.cwd(), "format", formId, "placeholders.json");
      console.log(`[DataResolver] Looking for templates in: ${placeholdersPath}`);
      if (fs.existsSync(placeholdersPath)) {
        const data = JSON.parse(fs.readFileSync(placeholdersPath, "utf-8"));
        if (data.placeholders && Array.isArray(data.placeholders)) {
          requiredKeys = data.placeholders;
        }
        if (data.templates) {
          templatesMapping = data.templates;
        }
      } else {
        console.log(`[DataResolver] File not found: ${placeholdersPath}`);
      }
    } catch (e) {
      console.log(`[DataResolver] Error loading placeholders:`, e);
    }
  } else {
    console.log(`[DataResolver] Could not determine formId from frameworkId: ${doc.frameworkId}`);
  }

  const filledSummary: { Field: string; Source: string; Value: string }[] = [];

  const addFilledLog = (key: string, source: string, val: any) => {
    const isArray = Array.isArray(val);
    const displayVal = isArray ? `[Array of ${val.length} items]` : String(val).substring(0, 45) + (String(val).length > 45 ? '...' : '');
    filledSummary.push({ Field: key, Source: source, Value: displayVal });
  };

  // 2. Resolve using the global registry first
  for (const [key, resolver] of Object.entries(GLOBAL_RESOLVERS)) {
    try {
      const val = resolver(ctx);
      if (val !== undefined && val !== null && val !== '') {
        prefillData[key] = val;
        
        let source = "System Default";
        if (key in coiResolvers) source = "COI Profile";
        else if (key in productResolvers) source = "Products DB";
        else if (key in clinicalResolvers) source = "Clinical Models";
        
        // Detect hardcoded fallbacks
        if (source === "System Default" && (val === "Mumbai" || val === "1")) {
            source = "Hardcoded Fallback";
        }
        
        addFilledLog(key, source, val);
      }
    } catch (err) {
      // Silently continue
    }
  }

  // 3. Fallback to extracting from Tech Docs (PMF/DMF) for scalar strings
  for (const tDoc of techDocs) {
    const sourceName = `Tech Doc (${tDoc.frameworkId})`;
    const tSections = sectionsToPlain(tDoc.sections);
    for (const sectionData of Object.values(tSections)) {
      if (sectionData.fields) {
        for (const [fieldId, fieldValue] of Object.entries(sectionData.fields)) {
          if (fieldValue !== undefined && fieldValue !== null && !prefillData[fieldId]) {
            prefillData[fieldId] = String(fieldValue);
            addFilledLog(fieldId, sourceName, fieldValue);
          }
        }
      }
    }
  }

  // 4. Fallback to manually entered fields on the current document
  const docSections = sectionsToPlain(doc.sections || {});
  for (const sectionData of Object.values(docSections)) {
    if (sectionData.fields) {
      for (const [k, v] of Object.entries(sectionData.fields)) {
        if (v !== undefined && v !== null && v !== '') {
          prefillData[k] = String(v);
          // Only log it if it wasn't already logged by a tech doc fallback or it explicitly overrides
          const existing = filledSummary.find(s => s.Field === k);
          if (existing) {
             existing.Source = "Manual Form Input";
             existing.Value = String(v).substring(0, 45) + (String(v).length > 45 ? '...' : '');
          } else {
             addFilledLog(k, "Manual Form Input", v);
          }
        }
      }
    }
  }

  // Handle derived fallbacks
  if (!prefillData.manufacturingSiteAddress && prefillData.registeredOfficeAddress) {
    prefillData.manufacturingSiteAddress = prefillData.registeredOfficeAddress;
    addFilledLog("manufacturingSiteAddress", "Derived from Registered Address", prefillData.registeredOfficeAddress);
  }
  
  // Legacy aliases
  if (prefillData.incorporationOrRegistrationNumber && !prefillData.incorporationNumber) {
    prefillData.incorporationNumber = prefillData.incorporationOrRegistrationNumber;
    addFilledLog("incorporationNumber", "Legacy Alias", prefillData.incorporationOrRegistrationNumber);
  }

  // Robust custom ASCII table generator to avoid Windows unicode alignment issues
  const printCleanTable = (data: Record<string, any>[]) => {
    if (data.length === 0) return;
    const cols = Object.keys(data[0]);
    const colWidths = cols.map(col => {
      return Math.max(col.length, ...data.map(row => String(row[col]).length));
    });
    
    const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    
    console.log(separator);
    console.log('|' + cols.map((col, i) => ' ' + col.padEnd(colWidths[i]) + ' ').join('|') + '|');
    console.log(separator);
    
    data.forEach(row => {
      console.log('|' + cols.map((col, i) => ' ' + String(row[col] || '').padEnd(colWidths[i]) + ' ').join('|') + '|');
    });
    console.log(separator);
  };

  // Generate Beautiful Output
  console.log(`\n========================================================================================`);
  console.log(`[${formId ? formId.toUpperCase() : 'UNKNOWN FORM'} Data Resolution Summary] - Doc ID: ${doc._id}`);
  console.log(`========================================================================================`);
  
  if (Object.keys(templatesMapping).length > 0) {
    const filledKeysSet = new Set(Object.keys(prefillData));
    
    for (const [templateName, templateKeys] of Object.entries(templatesMapping)) {
      console.log(`\n📄 Document: ${templateName}`);
      console.log(`----------------------------------------------------------------------------------------`);
      
      const filledInTemplate = filledSummary.filter(s => templateKeys.includes(s.Field));
      const missingInTemplate = templateKeys.filter(k => !filledKeysSet.has(k));
      
      if (filledInTemplate.length > 0) {
        console.log(`✅ FILLED (${filledInTemplate.length}/${templateKeys.length})`);
        printCleanTable(filledInTemplate);
      } else {
        console.log(`⚠️ NO FIELDS WERE AUTOMATICALLY FILLED FOR THIS DOCUMENT.`);
      }
      
      if (missingInTemplate.length > 0) {
        console.log(`❌ MISSING (${missingInTemplate.length}) - Will appear as raw {tags}`);
        const missingGrid = [];
        for (let i = 0; i < missingInTemplate.length; i += 3) {
           missingGrid.push({
             "Col 1": missingInTemplate[i] || "",
             "Col 2": missingInTemplate[i+1] || "",
             "Col 3": missingInTemplate[i+2] || ""
           });
        }
        printCleanTable(missingGrid);
      } else {
        console.log(`🎉 ALL REQUIRED FIELDS RESOLVED!`);
      }
    }
  } else if (filledSummary.length > 0) {
    console.log(`✅ FILLED FIELDS (${filledSummary.length})`);
    printCleanTable(filledSummary);
    
    if (requiredKeys.length > 0) {
      const filledKeysSet = new Set(Object.keys(prefillData));
      const missingKeys = requiredKeys.filter(k => !filledKeysSet.has(k));
      if (missingKeys.length > 0) {
        console.log(`\n❌ MISSING FIELDS (${missingKeys.length})`);
        const missingGrid = [];
        for (let i = 0; i < missingKeys.length; i += 3) {
           missingGrid.push({
             "Col 1": missingKeys[i] || "",
             "Col 2": missingKeys[i+1] || "",
             "Col 3": missingKeys[i+2] || ""
           });
        }
        printCleanTable(missingGrid);
      }
    }
  } else {
    console.log(`⚠️ NO FIELDS WERE AUTOMATICALLY FILLED.`);
    console.log(`ℹ️ No templates found for this form, so missing fields could not be calculated.`);
  }

  console.log(`========================================================================================\n`);

  return { prefillData, products, techDocs };
}
