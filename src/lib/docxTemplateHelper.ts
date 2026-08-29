import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";

export type PlaceholderMap = Record<string, any>;

export type TemplateConfig = {
  file: string;
  output: string;
  placeholders: PlaceholderMap;
};

/**
 * Generate a DOCX file from a template by replacing placeholders
 */
export function generateDocxFromTemplate(
  templatePath: string,
  placeholders: PlaceholderMap
): Buffer {
  // Read template file
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  // Create docxtemplater instance
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Render the document with data (new API)
  doc.render(placeholders);

  // Generate buffer
  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buffer;
}

/**
 * Extract all placeholders from a DOCX template
 * Useful for debugging or validating templates
 */
export function extractPlaceholdersFromTemplate(templatePath: string): string[] {
  try {
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Get all tags/placeholders
    const tags = doc.getFullText().match(/\{[^}]+\}/g) || [];
    return [...new Set(tags)]; // Remove duplicates
  } catch (error) {
    console.error("Error extracting placeholders:", error);
    return [];
  }
}

/**
 * Validate that all required placeholders are provided
 */
export function validatePlaceholders(
  required: string[],
  provided: PlaceholderMap
): { valid: boolean; missing: string[] } {
  const missing = required.filter((placeholder) => {
    const key = placeholder.replace(/\{\{|\}\}/g, "");
    return !(key in provided);
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Clean placeholder values (remove null, undefined, etc.)
 */
export function cleanPlaceholders(placeholders: PlaceholderMap): PlaceholderMap {
  const cleaned: PlaceholderMap = {};
  
  for (const [key, value] of Object.entries(placeholders)) {
    // Convert null/undefined to empty string
    if (value === null || value === undefined) {
      cleaned[key] = "";
      continue;
    }

    // Convert arrays to bullet lists
    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) => `• ${item}`).join("\n");
      continue;
    }

    // Convert objects to key-value pairs
    if (typeof value === "object") {
      cleaned[key] = Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      continue;
    }

    // Keep strings and numbers as-is
    cleaned[key] = String(value);
  }

  return cleaned;
}
