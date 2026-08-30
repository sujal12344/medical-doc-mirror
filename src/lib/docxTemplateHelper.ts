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
    nullGetter(part) {
      if (!part.module) {
        return toUnicodeBold(part.value);
      }
      if (part.module === "rawxml") {
        return "";
      }
      return "";
    }
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
    const key = placeholder.replace(/^\{+/, "").replace(/\}+$/, "");
    return !(key in provided);
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Convert a string to Unicode Bold characters to simulate bold text without XML injection.
 */
function toUnicodeBold(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // Mathematical sans-serif bold
  const boldChars = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵";
  
  // Use Array.from to correctly handle surrogate pairs of unicode characters
  const boldArray = Array.from(boldChars);
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const idx = chars.indexOf(str[i]);
    if (idx !== -1) {
      result += boldArray[idx];
    } else {
      result += str[i];
    }
  }
  return `[${result}]`;
}

/**
 * Clean placeholder values (remove null, undefined, etc.)
 */
export function cleanPlaceholders(placeholders: PlaceholderMap): PlaceholderMap {
  const cleaned: PlaceholderMap = {};
  
  for (const [key, value] of Object.entries(placeholders)) {
    // Convert null/undefined/empty string to placeholder format {key} in Unicode BOLD
    if (value === null || value === undefined || value === "" || value === "undefined" || value === "null") {
      cleaned[key] = toUnicodeBold(key);
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
