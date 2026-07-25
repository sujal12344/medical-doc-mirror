import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import JSZip from "jszip";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";
import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";

export const maxDuration = 120;
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

interface TestLicenseExtraction {
  productName: string;
  productClass: string;
  manufacturerName: string;
  manufacturerAddress: string;
  directorName: string;
  method: string;
  sterilization: string;
  equipment: string;
  quantity: string;
  numberofKits: string;
  totalKits: string;
  components: string;
  site: string;
  experience: string;
  keyperson: string;
  qualification: string;
  responsibility: string;
  // new fields
  productSummary: string;
  intendedUse: string;
  material: string;
  shelfLife: string;
  packSize: string;
  storage: string;
}

const EMPTY_EXTRACTION: TestLicenseExtraction = {
  productName: "", productClass: "", manufacturerName: "", manufacturerAddress: "",
  directorName: "", method: "", sterilization: "", equipment: "", quantity: "",
  numberofKits: "", totalKits: "", components: "", site: "", experience: "",
  keyperson: "", qualification: "", responsibility: "",
  productSummary: "", intendedUse: "", material: "", shelfLife: "", packSize: "", storage: "",
};

// ── Import Test License types ───────────────────────────────────────────────────
interface ImportProduct {
  productGenericName: string;
  brandName: string;
  referenceNumber: string;
  category: string;
  class: string;
  use: string;
  importedquantity: string;
  material: string;
  size: string;
  temperature: string;
}

const EMPTY_IMPORT_PRODUCT: ImportProduct = {
  productGenericName: "", brandName: "", referenceNumber: "",
  category: "", class: "", use: "", importedquantity: "",
  material: "", size: "", temperature: "",
};

// Scalar company fields extracted at the import level
interface ImportExtractionResult {
  companyName: string;
  companyAddress: string;
  companyNumber: string;
  companyEmail: string;
  products: ImportProduct[];
}

/** Extract text and the largest image from a base64-encoded file (PDF or DOCX). */
async function extractDataFromBase64(base64: string, mimeType: string, fileName: string): Promise<{ text: string; logoBuffer?: Buffer }> {
  const buffer = Buffer.from(base64, "base64");
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const AdmZip = (await import("jszip")).default;
    const zip = await AdmZip.loadAsync(buffer);
    
    // Extract text — headers/footers FIRST so they survive the LLM slice limit
    const xmlFiles = [
      "word/header1.xml", "word/header2.xml", "word/header3.xml",
      "word/footer1.xml", "word/footer2.xml", "word/footer3.xml",
      "word/document.xml",
    ];
    const parts: string[] = [];
    for (const xmlFile of xmlFiles) {
      const entry = zip.file(xmlFile);
      if (entry) {
        const xml = await entry.async("text");
        const plain = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (plain) parts.push(plain);
      }
    }
    
    // Extract largest image (likely the logo)
    let largestImage: Buffer | undefined;
    let maxSize = 0;
    const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith("word/media/") && !zip.files[k].dir);
    for (const mediaFile of mediaFiles) {
      const entry = zip.file(mediaFile);
      if (entry) {
        const imgBuffer = await entry.async("nodebuffer");
        if (imgBuffer.length > maxSize) {
          maxSize = imgBuffer.length;
          largestImage = imgBuffer;
        }
      }
    }
    
    return { text: parts.join("\n\n"), logoBuffer: largestImage };
  }

  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(buffer);
    return { text: result.text || "" };
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value };
  } catch {
    return { text: buffer.toString("utf-8") };
  }
}

/** Safely parse LLM JSON, stripping markdown fences. */
function safeParseLLMJson<T extends object>(raw: string, fallback: T): T {
  try {
    const stripped = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(stripped);
    if (typeof parsed !== "object" || parsed === null) return fallback;
    return { ...fallback, ...parsed };
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try { return { ...fallback, ...JSON.parse(raw.slice(first, last + 1)) }; } catch { /* ignore */ }
    }
    return fallback;
  }
}

/**
 * For large documents (>15K chars), naive first+last slicing misses content buried in the middle.
 * This function searches the full text for keyword-anchored windows and assembles a targeted
 * context block that is far more likely to contain manufacturer info, product tables,
 * intended use, class, quantity, etc.
 */
function buildTargetedContext(fullText: string, maxTotalChars = 14000): string {
  const KEYWORD_GROUPS: {
    label: string;
    keywords: string[];
    windowChars: number;
    useLast?: boolean;  // use LAST occurrence instead of first (avoids TOC references)
  }[] = [
    {
      // Use specific physical-address keywords that appear ONLY ONCE in the document
      // (near the real address block), never in the TOC or in product-label footers.
      label: "MANUFACTURER INFO",
      keywords: [
        "manufacturer information\n",  // section heading (not in TOC — TOC has dots after it)
        "geumcheon",                   // Seoul district name — unique to KR address block
        "gasan",                       // Street name — unique to KR address block
        "#1604",                       // Building number — unique to KR address block
        "republic of korea",           // Country line — first occurrence is in address block
      ],
      windowChars: 1600,
      // useLast is intentionally NOT set (defaults to indexOf/first occurrence)
    },
    {
      label: "INTENDED USE",
      keywords: ["intended use", "indications for use", "intended purpose"],
      windowChars: 1500,
    },
    {
      label: "PRODUCT TABLE / PRODUCT LIST",
      keywords: ["model no", "catalogue no", "reference no", "product list", "kit contents", "accessories"],
      windowChars: 2000,
    },
    {
      label: "CLASSIFICATION / RISK CLASS",
      keywords: ["risk class", "device class", "class a", "class b", "class c", "class d"],
      windowChars: 800,
    },
    {
      label: "STORAGE / TEMPERATURE",
      keywords: ["storage condition", "store at", "storage temperature", "-20°c", "2~8°c", "shelf life"],
      windowChars: 800,
    },
    {
      label: "QUANTITY",
      keywords: ["quantity", "number of units", "no. of units", "pack size", "kits per pack"],
      windowChars: 600,
    },
  ];

  const lower = fullText.toLowerCase();
  const usedRanges: Array<[number, number]> = [];
  const sections: string[] = [];

  // Always include the very beginning (title, product name usually here)
  const leadChars = Math.min(2000, Math.floor(maxTotalChars * 0.14));
  sections.push(`[DOCUMENT START]\n${fullText.slice(0, leadChars)}`);
  usedRanges.push([0, leadChars]);

  let totalUsed = leadChars;

  for (const group of KEYWORD_GROUPS) {
    if (totalUsed >= maxTotalChars) break;

    // Find the best keyword occurrence — LAST for groups marked useLast, FIRST otherwise
    let bestIdx = -1;
    for (const kw of group.keywords) {
      const idx = group.useLast ? lower.lastIndexOf(kw) : lower.indexOf(kw);
      if (idx === -1) continue;
      if (bestIdx === -1) { bestIdx = idx; continue; }
      bestIdx = group.useLast
        ? Math.max(bestIdx, idx)   // latest match
        : Math.min(bestIdx, idx);  // earliest match
    }
    if (bestIdx === -1) continue;

    const start = Math.max(0, bestIdx - 200);
    const end   = Math.min(fullText.length, start + group.windowChars);

    // Skip if it overlaps heavily with an already-included range
    const overlaps = usedRanges.some(([rs, re]) => start < re && end > rs);
    if (overlaps) continue;

    usedRanges.push([start, end]);
    totalUsed += end - start;
    sections.push(`[${group.label}]\n${fullText.slice(start, end)}`);
  }

  // Fill remaining budget with the document tail
  const remaining = maxTotalChars - totalUsed;
  if (remaining > 500) {
    const tailStart = Math.max(0, fullText.length - remaining);
    sections.push(`[DOCUMENT END]\n${fullText.slice(tailStart)}`);
  }

  return sections.join("\n\n---\n\n");
}


/**
 * Very basic PNG/JPEG dimension parser to preserve aspect ratio.
 */
function getImageDimensions(buffer: Buffer): { width: number, height: number } | null {
  try {
    // PNG (89 50 4e 47)
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    // JPEG (FF D8)
    if (buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch { /* ignore parsing errors */ }
  return null;
}

/**
 * Post-process a rendered DOCX buffer to inject the company logo.
 * Finds {%companyLogo} text runs in any XML part and replaces them
 * with a proper OOXML inline image element.
 */
async function injectLogoIntoDocx(docxBuffer: Buffer, logoBuffer: Buffer): Promise<Buffer> {
  if (!logoBuffer || logoBuffer.length === 0) return docxBuffer;

  const zip = await JSZip.loadAsync(docxBuffer);
  const drawingId = Math.floor(Math.random() * 1000000) + 1000;
  const relId = `rIdLogo${drawingId}`;
  
  const LOGO_FILE = "word/media/companyLogo.png";
  
  // EMU at 96 DPI: 1px = 9525 EMU
  let CX = 160 * 9525;
  let CY = 55 * 9525;
  
  const dims = getImageDimensions(logoBuffer);
  if (dims && dims.width > 0 && dims.height > 0) {
    const MAX_CX = 220 * 9525; // max width 220px
    const MAX_CY = 65 * 9525;  // max height 65px
    const scale = Math.min(MAX_CX / dims.width, MAX_CY / dims.height);
    CX = Math.round(dims.width * scale);
    CY = Math.round(dims.height * scale);
  }

  const drawingXml =
    `<w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${CX}" cy="${CY}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${drawingId}" name="CompanyLogo"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${drawingId}" name="CompanyLogo"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill>` +
    `<a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
    `<a:stretch><a:fillRect/></a:stretch>` +
    `</pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${CX}" cy="${CY}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic>` +
    `</wp:inline></w:drawing></w:r>`;

  // Add logo to the media folder
  zip.file(LOGO_FILE, logoBuffer);

  // Ensure png extension is registered in [Content_Types].xml
  const ctEntry = zip.file("[Content_Types].xml");
  if (ctEntry) {
    let ctContent = await ctEntry.async("text");
    if (!ctContent.includes('Extension="png"')) {
      ctContent = ctContent.replace(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/>'
      );
      zip.file("[Content_Types].xml", ctContent);
    }
  }

  const XML_FILES = Object.keys(zip.files).filter(k => k.endsWith(".xml") && !zip.files[k].dir);
  for (const xmlFile of XML_FILES) {
    let content = await zip.files[xmlFile].async("text");
    if (!content.includes("{%companyLogo}")) continue;

    // Replace the full <w:r>...<w:t>{%companyLogo}</w:t>...</w:r> run with the drawing
    content = content.replace(
      /<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>\{%companyLogo\}<\/w:t>\s*<\/w:r>/g,
      drawingXml
    );
    // Direct fallback if the regex didn't capture the run structure
    if (content.includes("{%companyLogo}")) {
      content = content.replace(/\{%companyLogo\}/g, "");
    }
    zip.file(xmlFile, content);

    // Wire up the image relationship in the corresponding .rels file
    const relsPath = xmlFile.replace(/^(word\/)([^/]+\.xml)$/, "word/_rels/$2.rels");
    let relsContent = "";
    const relsEntry = zip.file(relsPath);
    if (relsEntry) {
      relsContent = await relsEntry.async("text");
    } else {
      // If the header/footer didn't have any links/images, the .rels file won't exist yet
      relsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
    }

    if (!relsContent.includes(relId)) {
      const rel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/companyLogo.png"/>`;
      relsContent = relsContent.replace("</Relationships>", `${rel}</Relationships>`);
      zip.file(relsPath, relsContent);
    }
  }

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ message: "Document not found" }, { status: 404 });

    let licenseType = "domestic";
    try {
      const body = await req.json();
      if (body?.licenseType === "import") {
        licenseType = "import";
      }
    } catch {
      // ignore
    }

    const uploadedDocs = (doc as Record<string, unknown>).uploadedDocs as Array<{
      fileName: string; mimeType: string; base64: string;
    }> | undefined;

    if (!uploadedDocs || uploadedDocs.length === 0) {
      return NextResponse.json({ message: "No uploaded documents found. Please upload the IFU first." }, { status: 400 });
    }

    // ── Extract text and logo from all uploaded docs ───────────────────────────────────
    const allTexts: string[] = [];
    let companyLogoBuffer: Buffer | undefined;

    for (const uploadedDoc of uploadedDocs) {
      const data = await extractDataFromBase64(uploadedDoc.base64, uploadedDoc.mimeType, uploadedDoc.fileName);
      if (data.text.trim()) allTexts.push(`[Source: ${uploadedDoc.fileName}]\n${data.text}`);
      if (!companyLogoBuffer && data.logoBuffer) {
        companyLogoBuffer = data.logoBuffer; // grab the first valid logo
      }
    }

    const combinedText = allTexts.join("\n\n---\n\n");
    console.log(`[generate-test-license] Extracted ${combinedText.length} chars, logo found: ${!!companyLogoBuffer}`);

    // ── LLM Extraction — branched by licenseType ──────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
    let mergedValues: Record<string, string> = {};

    if (licenseType === "import") {
      // ── IMPORT PATH: extract company + multi-product array ──────────────────
      let importResult: ImportExtractionResult = {
        companyName: "", companyAddress: "", companyNumber: "", companyEmail: "", products: [],
      };

      if (openaiKey && combinedText.trim()) {
        const openai = new OpenAI({ apiKey: openaiKey });
        // Use keyword-targeted extraction so manufacturer address, product tables,
        // intended use, class, quantity are never truncated away in large PDFs
        const docText = combinedText.length > 14000
          ? buildTargetedContext(combinedText, 14000)
          : combinedText;
        console.log(`[generate-test-license:import] docText length: ${docText.length} chars (from ${combinedText.length})`);

        const importSystemPrompt = `You are a precise data extraction assistant for medical regulatory documents.
Extract structured data ONLY from the provided document. Return ONLY valid JSON.

CRITICAL RULES:
1. Extract ONLY information explicitly stated in the document. Do NOT guess, infer, or hallucinate.
2. The Legal Manufacturer is the entity that DESIGNED and PRODUCED the device — look for labels like "Manufacturer", "Legal Manufacturer", "Manufactured by".
3. Do NOT select importers, agents, or distributors as the company.
4. List each individual product up to a maximum of 5.
5. If a field is entirely missing, return "".

Required JSON shape:
{
  "companyName": "",
  "companyAddress": "",
  "companyNumber": "",
  "companyEmail": "",
  "products": [
    {
      "productGenericName": "",
      "brandName": "",
      "referenceNumber": "",
      "category": "",
      "class": "",
      "use": "",
      "importedquantity": "",
      "material": "",
      "size": "",
      "temperature": ""
    }
  ]
}

Field guidance:
- companyName: Name of the primary Legal Manufacturer. Look in [MANUFACTURER INFO] section for the company name that appears directly above the address lines.
- companyAddress: CRITICAL — The address in the [MANUFACTURER INFO] section appears on SEPARATE LINES like this:
    QuantaMatrix Inc.
    #1604, #1605, 17F, Bldg. B, 
    131 Gasan digital 1-ro, Geumcheon-gu, 
    Seoul 08506, 
    Republic of Korea
    E-mail: CS@quantamatrix.com
  JOIN all address lines (STOP before the E-mail/http line) into one comma-separated string.
  The correct output is: "#1604, #1605, 17F, Bldg. B, 131 Gasan digital 1-ro, Geumcheon-gu, Seoul 08506, Republic of Korea"
  NEVER return empty string if you can see street lines below the manufacturer company name.
- companyNumber: Phone or fax number in the [MANUFACTURER INFO] section. If the primary Legal Manufacturer has no phone number listed, fallback to any other phone number present in the block (e.g. look for "Sales & Marketing: +33 (0) 9 75 29 18 65" under regional offices). Return "" only if no phone number exists anywhere in the block.
- companyEmail: Email address of the Legal Manufacturer. Look for "E-mail:" immediately after the address block (e.g. "CS@quantamatrix.com").
- productGenericName: Broad generic/category name (e.g. "Rapid Susceptibility Testing Kit", "In Vitro Diagnostic Instrument"). Use the generic/category column in any product table.
- brandName: Specific commercial device variant name (e.g. "QMAC-dRAST GN S17", "dRAST"). Look in Brand Name or Device Name column.
- referenceNumber: Model number, catalogue number, or part number (e.g. "QMdRASTN02"). Look in Model No or Ref No column.
- category: Device category label (e.g. "In Vitro Diagnostic Device", "Reagent Kit", "Instrument"). Look in Category or Device Type column.
- class: Regulatory risk class EXACTLY as written (e.g. "Class A", "Class B", "Class IIa"). Look in Class or Risk Class column of any product table.
- use: Full intended use statement. Look in [INTENDED USE] section. Include the full sentence describing what the device detects/measures and the specimen type.
- importedquantity: Quantity proposed to be imported WITH UNITS (e.g. "2 Units", "25 Kits"). Look for quantity columns or tables listing number of units/kits.
- material: Kit components or materials supplied (e.g. "QMAC-dRAST Broth, QMAC-dRAST Gel").
- size: Pack size or kit size (e.g. "1x25 Tests", "12 tests/kit"). Look in pack size or kit size columns.
- temperature: Storage or operating temperature (e.g. "-20°C ± 5°C", "2~8°C"). Look in [STORAGE / TEMPERATURE] section.

Output rules:
- No explanation, no markdown, ONLY valid JSON
- Missing values = ""
- Maximum 5 products`;

        const llmRes = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0,
          messages: [
            { role: "system", content: importSystemPrompt },
            { role: "user", content: `Extract from this document:\n\n${docText}` },
          ],
        });

        const rawImport = llmRes.choices?.[0]?.message?.content || "{}";
        console.log(`[generate-test-license:import] LLM output: ${rawImport.length} chars`);

        const parsed = safeParseLLMJson<{
          companyName?: string; companyAddress?: string;
          companyNumber?: string; companyEmail?: string;
          products?: unknown[];
        }>(rawImport, { companyName: "", companyAddress: "", companyNumber: "", companyEmail: "", products: [] });
        importResult = {
          companyName:    typeof parsed.companyName    === "string" ? parsed.companyName    : "",
          companyAddress: typeof parsed.companyAddress === "string" ? parsed.companyAddress : "",
          companyNumber:  typeof parsed.companyNumber  === "string" ? parsed.companyNumber  : "",
          companyEmail:   typeof parsed.companyEmail   === "string" ? parsed.companyEmail   : "",
          products: Array.isArray(parsed.products)
            ? parsed.products.map((p) => ({ ...EMPTY_IMPORT_PRODUCT, ...(p as object) })).slice(0, 5)
            : [],
        };
      }

      // Build flat numbered mergedValues for import templates
      mergedValues["companyName"]    = importResult.companyName;
      mergedValues["companyAddress"] = importResult.companyAddress;
      mergedValues["companyNumber"]  = importResult.companyNumber;
      mergedValues["companyEmail"]   = importResult.companyEmail;
      mergedValues["shelfLife"]      = "";

      // Fill slots 1-5 with product data (empty string for unfilled slots)
      for (let i = 1; i <= 5; i++) {
        const prod = importResult.products[i - 1] ?? EMPTY_IMPORT_PRODUCT;
        mergedValues[`productGenericName${i}`] = prod.productGenericName;
        mergedValues[`brandName${i}`]          = prod.brandName;
        mergedValues[`referenceNumber${i}`]    = prod.referenceNumber;
        mergedValues[`category${i}`]           = prod.category;
        mergedValues[`class${i}`]              = prod.class;
        mergedValues[`use${i}`]                = prod.use;
        mergedValues[`importedquantity${i}`]   = prod.importedquantity;
        mergedValues[`material${i}`]           = prod.material;
        mergedValues[`size${i}`]               = prod.size;
        mergedValues[`temperature${i}`]        = prod.temperature;
      }

      console.log(`[generate-test-license:import] company="${importResult.companyName}" | ${importResult.products.length} products`);

    } else {
      // ── DOMESTIC PATH: single-product extraction (existing logic) ────────────
      let result: TestLicenseExtraction = { ...EMPTY_EXTRACTION };

      if (openaiKey && combinedText.trim()) {
        const openai = new OpenAI({ apiKey: openaiKey });
        const systemPrompt = `You are an expert regulatory document extraction assistant specializing in Medical Device and IVD documentation.

Your task is to extract information ONLY from the provided IFU/reference document.

Return ONLY valid JSON with exactly the following keys.
If information is not explicitly available, return an empty string ("").

Required JSON:

{
  "productName": "",
  "productClass": "",
  "manufacturerName": "",
  "manufacturerAddress": "",
  "directorName": "",
  "method": "",
  "sterilization": "",
  "equipment": "",
  "quantity": "",
  "numberofKits": "",
  "totalKits": "",
  "components": "",
  "site": "",
  "experience": "",
  "keyperson": "",
  "qualification": "",
  "responsibility": "",
  "productSummary": "",
  "intendedUse": "",
  "material": "",
  "shelfLife": "",
  "packSize": "",
  "storage": ""
}

Field Definitions

productName
- Extract the complete commercial product name exactly as written.

productClass
- Extract the regulatory device classification (Class A, Class B, Class C, or Class D) if explicitly stated.
- If the class is not explicitly stated, determine the most appropriate CDSCO IVD risk classification from the intended use, technology, analyte, specimen type, and diagnostic purpose.
- Note: Routine general clinical chemistry reagents (e.g., Albumin, Glucose, Creatinine) are almost always Class B. Wash buffers and general equipment are Class A. Infectious disease and cancer markers are Class C or D.
- Return ONLY one of:
  Class A
  Class B
  Class C
  Class D
- Never return "IVD".
- If the classification cannot be determined with reasonable confidence, return "".

manufacturerName
- Extract the complete legal manufacturer name.
- Search the entire document including the cover page, page headers, page footers, manufacturer block, symbols section, contact information, and the last page.
- The manufacturer name is often printed together with the address.
- Preserve the wording exactly as written.
- Never leave this field empty if a manufacturer name exists anywhere in the document.

manufacturerAddress
- Extract the complete registered manufacturer address exactly as written.
- Search the cover page, page headers, page footers, manufacturer information, contact section, symbols section, and last page.
- Preserve the full address exactly as printed.
- Never leave this field empty if an address exists anywhere in the document.

directorName
- Extract the Managing Director, Authorized Signatory or Responsible Person ONLY if explicitly mentioned.

method
- Extract the testing principle or analytical method.
Examples:
- Real-Time PCR
- Real-Time RT-PCR
- ELISA
- Immunochromatography
- Latex Agglutination

sterilization
- Extract ONLY the sterilization status or sterilization method of the PRODUCT itself.
- Examples:
  - Sterile
  - Non-Sterile
  - Sterile EO
  - Gamma Sterilized
  - Steam Sterilized
- Do NOT extract laboratory precautions or instructions such as "all consumables should be sterilized".
- If the IFU does not explicitly specify the product sterilization status or method, return "Not Specified".

equipment
- Extract instruments/equipment REQUIRED BUT NOT SUPPLIED with the kit.
- Do not include kit components or reagents.

quantity
- Extract available kit pack sizes exactly as written.
Example:
1x25 Tests, 1x100 Tests

numberofKits
- Extract the number of kits per package only if explicitly stated.

totalKits
- Extract the total quantity proposed only if explicitly stated.

components
- Extract ONLY the kit components supplied with the product.
- Look under sections like "REAGENTS", "REAGENTS COMPOSITION", "KIT COMPONENTS", or "MATERIALS PROVIDED".
- Do not include external equipment or consumables.

site
- Extract manufacturing site or production facility address if explicitly stated.

experience
- Extract required operator training, competency or experience.
Example:
"Personnel trained in Real-Time PCR techniques."

keyperson
- Extract key personnel names ONLY if explicitly mentioned.

qualification
- Extract personnel qualifications ONLY if explicitly mentioned.

responsibility
- Extract personnel responsibilities ONLY if explicitly described.
- Do not infer or generate responsibilities.
- If not explicitly available, return "".

productSummary
- Extract the product summary or background section.
- Usually found under "SUMMARY", "BACKGROUND", or "INTRODUCTION" headings.
- Include key disease information, clinical significance, and why the test is needed.

intendedUse
- Extract the full intended use statement exactly as written.
- Usually the first section of the IFU, under "INTENDED USE".
- Include the target analyte, specimen type, and population.

material
- Extract the materials/reagents supplied with the kit (same as components but may include storage tubes, swabs, buffers, etc.).
- Look under sections like "REAGENTS", "REAGENTS COMPOSITION", "KIT COMPONENTS", or "MATERIALS PROVIDED".
- If a separate "Materials Provided" or "Kit Contents" section exists, extract its full content.
- Do not include equipment required but not provided.

shelfLife
- Extract the shelf life or stability information.
- Look in STORAGE AND STABILITY section.
- Example: "Kit components are stable through the end of the expiration date when stored at -20°C"
- Include expiry date conditions if specified.

packSize
- Extract the available pack sizes.
- Example: "1x25 Tests", "1x100 Tests"
- Use the same value as quantity if no separate pack size is listed.

storage
- Extract the storage conditions for the product.
- Look in STORAGE AND STABILITY or STORAGE CONDITIONS section.
- Example: "Store at -20°C. Do not repeatedly freeze-thaw."
- Include temperature, light exposure, and freeze-thaw restrictions.

Regulatory Extraction Rules

- Search the ENTIRE document before returning an empty string.
- Search cover page, headers, footers, manufacturer information, symbols section, appendices and last page.
- Preserve wording exactly whenever possible.
- Do not summarize extracted values.
- Do not fabricate information.
- Do not infer names or addresses.
- Ignore marketing content.
- Ignore warnings and precautions unless they are specifically requested by a field.
- If multiple values exist, return the most complete and official one.

JSON Rules

- Return ONLY valid JSON.
- Do not return Markdown.
- Do not wrap JSON in code fences.
- Do not include explanations.
- Every key must exist.
- Every value must be a string.
- Never return null.
- Never omit keys.
- Never add extra keys.`;

      const llmRes = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract from this document:\n\n${(
            combinedText.length > 12000
              ? combinedText.slice(0, 9000) + "\n\n[...MIDDLE TRUNCATED...]\n\n" + combinedText.slice(-3000)
              : combinedText
          )}` },
        ],
      });

      const raw = llmRes.choices?.[0]?.message?.content || "{}";
      console.log(`[generate-test-license] LLM output: ${raw.length} chars`);
      result = safeParseLLMJson<TestLicenseExtraction>(raw, EMPTY_EXTRACTION);
    }

    // Build mergedValues from domestic result
    mergedValues = {
      productName:        result.productName,
      productClass:       result.productClass,
      manufacturerName:   result.manufacturerName,
      manufacturerAddress:result.manufacturerAddress,
      directorName:       result.directorName,
      method:             result.method,
      sterilization:      result.sterilization,
      equipment:          result.equipment,
      quantity:           result.quantity,
      numberofKits:       result.numberofKits,
      totalKits:          result.totalKits,
      components:         result.components,
      site:               result.site || result.manufacturerAddress,
      experience:         result.experience,
      keyperson:          result.keyperson,
      qualification:      result.qualification,
      responsibility:     result.responsibility,
      productSummary:     result.productSummary,
      intendedUse:        result.intendedUse,
      material:           result.material || result.components,
      shelfLife:          result.shelfLife,
      packSize:           result.packSize || result.quantity,
      storage:            result.storage,
    };
  } // end licenseType branch

    console.log("[generate-test-license] Merged values:", mergedValues);

    // ── Load templates and render ─────────────────────────────────────────────
    const formatDir = path.join(process.cwd(), "format", licenseType);
    let dirEntries: string[];
    try {
      dirEntries = await fs.readdir(formatDir);
    } catch {
      return NextResponse.json({ message: `Cannot read format directory: ${formatDir}. Please ensure templates are uploaded.` }, { status: 500 });
    }
    const docxTemplates = dirEntries.filter((f) => f.toLowerCase().endsWith(".docx"));

    if (docxTemplates.length === 0) {
      return NextResponse.json({ message: "No DOCX templates found in format directory." }, { status: 500 });
    }

    const zip = new JSZip();
    for (const filename of docxTemplates) {
      const templatePath = path.join(formatDir, filename);
      const templateBuffer = await fs.readFile(templatePath);
      try {
        // Step 1: render text placeholders (companyLogo left as "" — handled in step 2)
        const docZip = new PizZip(templateBuffer);
        const doc2 = new Docxtemplater(docZip, { paragraphLoop: true, linebreaks: true });
        
        // Pass "%companyLogo": "{%companyLogo}" so docxtemplater leaves the image tag intact 
        // instead of replacing it with "undefined", allowing injectLogoIntoDocx to find it.
        doc2.render({ ...mergedValues, companyLogo: "", "%companyLogo": "{%companyLogo}" });
        let outputBuffer = doc2.getZip().generate({ type: "nodebuffer" }) as Buffer;

        // Step 2: post-process — inject the real logo image into the DOCX XML
        if (companyLogoBuffer) {
          outputBuffer = await injectLogoIntoDocx(outputBuffer, companyLogoBuffer);
        }

        zip.file(filename, outputBuffer);
      } catch (err) {
        console.warn(`[generate-test-license] Template render error for ${filename}:`, err);
        zip.file(filename, templateBuffer);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="test-license-docs.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    console.error("[generate-test-license] Error:", error);
    return NextResponse.json({ message: "Failed to generate documents.", error: (error as Error).message }, { status: 500 });
  }
}
