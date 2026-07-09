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

    // ── LLM Extraction ────────────────────────────────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
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

    // ── Build mergedValues from result ────────────────────────────────────────
    const mergedValues: Record<string, string> = {
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
      // new fields
      productSummary:     result.productSummary,
      intendedUse:        result.intendedUse,
      material:           result.material || result.components,
      shelfLife:          result.shelfLife,
      packSize:           result.packSize || result.quantity,
      storage:            result.storage,
    };

    console.log("[generate-test-license] Merged values:", mergedValues);

    // ── Load templates and render ─────────────────────────────────────────────
    const formatDir = path.join(process.cwd(), "format");
    let dirEntries: string[];
    try {
      dirEntries = await fs.readdir(formatDir);
    } catch {
      return NextResponse.json({ message: `Cannot read format directory: ${formatDir}` }, { status: 500 });
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
