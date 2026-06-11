import "@/lib/polyfill-pdf";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { indexProductDocument } from "@/lib/productVectorIndex";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// pdf-parse import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

/** Sub-fields populated when the master label-upload field is processed */
const LABEL_UPLOAD_FIELD_IDS = ["20.upload", "8.upload"] as const;
const LABEL_SIBLING_FIELDS = [
  "logo", "productName", "packSize", "batchNo",
  "deviceType", "mfgDate", "expDate", "storage", "mrp", "manufacturer",
] as const;


async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch (error) {
    console.error("PDF parse error:", error);
    return "";
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) return "";
    let docXmlText = await docXmlFile.async("string");

    // Replace paragraph endings with newlines to preserve spacing
    docXmlText = docXmlText.replace(/<\/w:p>/g, "\n");

    // Match all text elements
    const matches = docXmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return "";

    return matches
      .map((val) => val.replace(/<[^>]+>/g, ""))
      .join(" ");
  } catch (error) {
    console.error("Error extracting text from docx:", error);
    return "";
  }
}

/**
 * Use GPT-4o Vision to OCR an image file and return extracted text.
 */
async function ocrImageWithVision(openai: OpenAI, buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an OCR assistant. Extract ALL visible text from this medical device product label image. Include every word, number, symbol, date, and regulatory mark you can see. Output only the raw extracted text with no commentary.`,
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("[field-upload] Vision OCR failed:", err);
    return "";
  }
}

/**
 * Crops a bounding box from an image buffer using @napi-rs/canvas.
 * Coordinates in box are normalized [ymin, xmin, ymax, xmax] from 0 to 1000.
 */
async function cropImageBuffer(
  buffer: Buffer,
  box: [number, number, number, number]
): Promise<Buffer> {
  const [ymin, xmin, ymax, xmax] = box;
  const img = await loadImage(buffer);

  const imgWidth = img.width;
  const imgHeight = img.height;

  // Calculate box edges in pixel coordinates
  const sx = Math.max(0, Math.min(imgWidth - 1, (xmin / 1000) * imgWidth));
  const sy = Math.max(0, Math.min(imgHeight - 1, (ymin / 1000) * imgHeight));
  const ex = Math.max(0, Math.min(imgWidth, (xmax / 1000) * imgWidth));
  const ey = Math.max(0, Math.min(imgHeight, (ymax / 1000) * imgHeight));

  const sw = Math.ceil(ex - sx);
  const sh = Math.ceil(ey - sy);

  if (sw <= 0 || sh <= 0) {
    throw new Error(`Invalid crop dimensions: width=${sw}, height=${sh}`);
  }

  const canvas = createCanvas(sw, sh);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const canvasEl = canvas as any;
  if (typeof canvasEl.toBuffer === "function") {
    return canvasEl.toBuffer("image/png");
  } else if (typeof canvasEl.encode === "function") {
    const bytes = await canvasEl.encode("png");
    return Buffer.from(bytes);
  } else {
    throw new Error("Canvas does not support toBuffer or encode");
  }
}

/**
 * Renders a specific page of a PDF object to a PNG image buffer using pdfjs-dist and canvas.
 */
async function renderPdfPage(pdf: any, pageNum: number): Promise<{ buffer: Buffer; mime: string }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.25 });
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);

  const canvas = createCanvas(width, height);
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
  }).promise;

  const canvasEl = canvas as any;
  if (typeof canvasEl.toBuffer === "function") {
    return { buffer: canvasEl.toBuffer("image/png"), mime: "image/png" };
  } else if (typeof canvasEl.encode === "function") {
    const bytes = await canvasEl.encode("png");
    return { buffer: Buffer.from(bytes), mime: "image/png" };
  }
  throw new Error("Canvas rendering not supported");
}

/**
 * For the master label-upload field, use GPT-4o Vision to extract structured
 * label sub-fields from the uploaded image and return them as a JSON map.
 */
async function extractLabelFieldsFromImage(
  openai: OpenAI,
  buffer: Buffer,
  mimeType: string,
): Promise<{
  fields: Record<string, string>;
  logoBox: [number, number, number, number] | null;
  symbolBoxes: {
    lot: [number, number, number, number] | null;
    device: [number, number, number, number] | null;
    mfg: [number, number, number, number] | null;
    exp: [number, number, number, number] | null;
    storage: [number, number, number, number] | null;
  };
}> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a medical device label OCR expert. Analyse this product label image precisely and return ONLY valid JSON (no markdown, no explanation) with exactly these keys:

{
  "logo": "<full company/brand name as printed on the logo — e.g. Q-LineBiotech>",
  "logo_box": [ymin, xmin, ymax, xmax],
  "productName": "<exact product name — e.g. Q-Line® Albumin>",
  "packSize": "<pack size / kit configuration — e.g. 2 x 50 mL>",
  "batchNo": "<LOT or Batch number — e.g. ALB-2101-001>",
  "lot_box": [ymin, xmin, ymax, xmax],
  "deviceType": "<device type text or symbol — e.g. IVD or In Vitro Diagnostic Medical Device>",
  "device_box": [ymin, xmin, ymax, xmax],
  "mfgDate": "<manufacturing date from the hourglass-filled symbol — e.g. July.2021>",
  "mfg_box": [ymin, xmin, ymax, xmax],
  "expDate": "<expiry date from the hourglass symbol — e.g. July.2023>",
  "exp_box": [ymin, xmin, ymax, xmax],
  "storage": "<storage conditions — e.g. Store at 15-30°C>",
  "storage_box": [ymin, xmin, ymax, xmax],
  "mrp": "<MRP or price as shown — e.g. XXXX-(Incl of taxes)>",
  "manufacturer": "<full manufacturer name and address as a single string>"
}

For "logo_box" and the other symbol box keys ("lot_box", "device_box", "mfg_box", "exp_box", "storage_box"), locate the respective graphical symbol or icon on the label/packaging (e.g. the thermometer graphic for storage_box, the factory/hourglass symbols for mfg_box/exp_box, the LOT outline box for lot_box, the IVD/MD logo for device_box, the company logo for logo_box) and return their bounding box coordinates normalized to a 0-1000 scale: [ymin, xmin, ymax, xmax] (where ymin is top, xmin is left, ymax is bottom, xmax is right, relative to the image borders).
If any symbol is not visible or present, return null for that box key. If a text field is not visible, return an empty string "".`,
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });
    const raw = response.choices[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    
    const logoBox = Array.isArray(parsed.logo_box) && parsed.logo_box.length === 4 ? parsed.logo_box : null;
    const lotBox = Array.isArray(parsed.lot_box) && parsed.lot_box.length === 4 ? parsed.lot_box : null;
    const deviceBox = Array.isArray(parsed.device_box) && parsed.device_box.length === 4 ? parsed.device_box : null;
    const mfgBox = Array.isArray(parsed.mfg_box) && parsed.mfg_box.length === 4 ? parsed.mfg_box : null;
    const expBox = Array.isArray(parsed.exp_box) && parsed.exp_box.length === 4 ? parsed.exp_box : null;
    const storageBox = Array.isArray(parsed.storage_box) && parsed.storage_box.length === 4 ? parsed.storage_box : null;

    const fields: Record<string, string> = {};
    const boxKeys = ["logo_box", "lot_box", "device_box", "mfg_box", "exp_box", "storage_box"];
    for (const key of Object.keys(parsed)) {
      if (!boxKeys.includes(key)) {
        fields[key] = String(parsed[key] ?? "");
      }
    }
    return {
      fields,
      logoBox,
      symbolBoxes: {
        lot: lotBox,
        device: deviceBox,
        mfg: mfgBox,
        exp: expBox,
        storage: storageBox,
      }
    };
  } catch (err) {
    console.error("[field-upload] Label field extraction failed:", err);
    return {
      fields: {},
      logoBox: null,
      symbolBoxes: { lot: null, device: null, mfg: null, exp: null, storage: null }
    };
  }
}


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, fieldId } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const product = await Product.findById(doc.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 1. Query the framework to get field label and hint for better prompt generation
    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }

    let fieldLabel = fieldId;
    let fieldHint = "";
    let sectionId = "";

    for (const sec of fw.sections) {
      const field = sec.fields.find((f) => f.id === fieldId);
      if (field) {
        fieldLabel = field.label;
        fieldHint = field.hint;
        sectionId = sec.id;
        break;
      }
    }

    if (!sectionId) {
      return NextResponse.json({ error: "Field not found in framework" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const isLabelMaster = (LABEL_UPLOAD_FIELD_IDS as readonly string[]).includes(fieldId);
    if (isLabelMaster) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const nameLower = file.name.toLowerCase();
      
      const isImage = file.type.startsWith("image/") || nameLower.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i) !== null;
      const isPdf = file.type === "application/pdf" || nameLower.endsWith(".pdf");
      const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || nameLower.endsWith(".docx");
      
      if (isDocx) {
        console.log(`[field-upload] Master label upload (DOCX) detected for field ${fieldId}`);
        const zip = await JSZip.loadAsync(buffer);
        
        let headerText = "";
        const headerXmlFile = zip.file("word/header1.xml");
        if (headerXmlFile) {
          const xml = await headerXmlFile.async("string");
          const tMatch = xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          headerText = tMatch.map(t => t.replace(/<[^>]+>/g, "")).join(" | ");
        }
        
        let bodyText = "";
        const docXmlFile = zip.file("word/document.xml");
        if (docXmlFile) {
          const xml = await docXmlFile.async("string");
          const tMatch = xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          bodyText = tMatch.map(t => t.replace(/<[^>]+>/g, "")).join(" ");
        }
        
        const combinedDocxText = `Header Section:\n${headerText}\n\nBody Section:\n${bodyText}`;
        
        let logoBase64 = "";
        const headerRelsFile = zip.file("word/_rels/header1.xml.rels");
        if (headerRelsFile) {
          const xml = await headerRelsFile.async("string");
          const imgMatch = xml.match(/<Relationship\b[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/image"[^>]*Target="([^"]+)"/);
          if (imgMatch) {
            const target = imgMatch[1];
            const imgFile = zip.file(`word/${target}`);
            if (imgFile) {
              const imgBuffer = await imgFile.async("nodebuffer");
              const ext = target.split(".").pop() || "png";
              logoBase64 = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${imgBuffer.toString("base64")}`;
            }
          }
        }
        
        let artworkBase64 = "";
        const docRelsFile = zip.file("word/_rels/document.xml.rels");
        if (docRelsFile) {
          const xml = await docRelsFile.async("string");
          const imgMatches = [...xml.matchAll(/<Relationship\b[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/image"[^>]*Target="([^"]+)"/g)];
          if (imgMatches.length > 0) {
            const target = imgMatches[0][1];
            const imgFile = zip.file(`word/${target}`);
            if (imgFile) {
              const imgBuffer = await imgFile.async("nodebuffer");
              const ext = target.split(".").pop() || "png";
              artworkBase64 = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${imgBuffer.toString("base64")}`;
            }
          }
        }
        
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an expert medical device regulatory assistant. Extract label fields from the provided document text. Return JSON format only.",
            },
            {
              role: "user",
              content: `Extract structured label details from the document text. Look at both Header and Body sections. Return exactly these JSON keys:
{
  "logo": "<full company/brand name - e.g. Q-LineBiotech>",
  "productName": "<product name - e.g. Q-Line® Albumin>",
  "packSize": "<pack size - e.g. 2 x 50 mL>",
  "batchNo": "<LOT/Batch number if present>",
  "deviceType": "<device type - e.g. IVD or In Vitro Diagnostic Medical Device>",
  "mfgDate": "<manufacturing date if present>",
  "expDate": "<expiry date if present>",
  "storage": "<storage conditions if present>",
  "mrp": "<maximum retail price if present>",
  "manufacturer": "<full manufacturer name and address>"
}
If a field is not present, use "". Do not fabricate values.

Document Text:
${combinedDocxText}`,
            },
          ],
        });
        
        const raw = response.choices[0]?.message?.content?.trim() || "{}";
        const parsed = JSON.parse(raw);
        console.log("[field-upload] DOCX parsed metadata:", parsed);
        
        const sectionPrefix = fieldId.split(".")[0];
        const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
        let updatedFields = { ...currentSectionData.fields };
        const upserted: string[] = [];
        
        for (const siblingKey of LABEL_SIBLING_FIELDS) {
          const siblingFieldId = `${sectionPrefix}.${siblingKey}`;
          if (siblingKey === "logo") {
            const val = logoBase64 || parsed.logo || "";
            if (val.trim()) {
              updatedFields[siblingFieldId] = val.trim();
              upserted.push(siblingFieldId);
            }
          } else {
            const val = parsed[siblingKey];
            if (val && typeof val === "string" && val.trim()) {
              updatedFields[siblingFieldId] = val.trim();
              upserted.push(siblingFieldId);
            }
          }
        }
        
        const summaryLines = LABEL_SIBLING_FIELDS
          .filter(k => parsed[k]?.trim())
          .map(k => `**${k.charAt(0).toUpperCase() + k.slice(1)}:** ${parsed[k]?.trim()}`);
          
        let summaryValue = summaryLines.length > 0
          ? `## Label OCR Summary\n\n${summaryLines.join("\n")}`
          : "Label details extracted — no metadata fields found.";
          
        if (artworkBase64) {
          summaryValue += `\n\n### Label Artwork\n![Label Artwork](${artworkBase64})`;
        }
        
        updatedFields[fieldId] = summaryValue;
        upserted.push(fieldId);
        
        const secObj = fw.sections.find((s) => s.id === sectionId);
        if (secObj) {
          const totalFields = secObj.fields.length;
          const filledCount = secObj.fields.filter(f => updatedFields[f.id]?.trim()).length;
          currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
        }
        
        currentSectionData.fields = updatedFields;
        doc.sections.set(sectionId, currentSectionData);
        doc.markModified("sections");
        await product.save();
        await doc.save();
        
        return NextResponse.json({
          success: true,
          fileName: file.name,
          chunksIndexed: 0,
          namespace: "",
          value: summaryValue,
          logoText: parsed.logo || "",
          accept: ".pdf,.docx,.png,.jpg,.jpeg,.webp"
        });
      } else if (isImage || isPdf) {
        let aggregatedFields: Record<string, string> = {};
        let finalLogoValue = "";
        let finalLogoBox: [number, number, number, number] | null = null;
        let finalLabelImageDataUri = "";
        let finalActiveMime = file.type || "image/png";

        if (isPdf) {
          try {
            console.log(`[field-upload] Loading PDF to process all pages...`);
            const data = new Uint8Array(buffer);
            const pdf = await getDocument({
              data,
              useSystemFonts: true,
              disableFontFace: true,
            }).promise;
            
            const totalPages = pdf.numPages;
            console.log(`[field-upload] PDF loaded: ${totalPages} page(s).`);
            
            // Loop through pages up to 5 pages
            const pagesToProcess = Math.min(totalPages, 5);
            
            for (let i = 1; i <= pagesToProcess; i++) {
              console.log(`[field-upload] Rendering and processing PDF page ${i} of ${pagesToProcess}...`);
              const pageRendered = await renderPdfPage(pdf, i);
              const pageBuffer = pageRendered.buffer;
              const pageMime = pageRendered.mime;
              
              if (i === 1) {
                finalActiveMime = pageMime;
                finalLabelImageDataUri = `data:${pageMime};base64,${pageBuffer.toString("base64")}`;
              }
              
              const openaiForVision = new OpenAI({ apiKey: env.OPENAI_API_KEY });
              const { fields: pageExtracted, logoBox: pageLogoBox } = await extractLabelFieldsFromImage(openaiForVision, pageBuffer, pageMime);
              console.log(`[field-upload] Page ${i} extracted fields:`, pageExtracted, "logoBox:", pageLogoBox);
              
              // Merge non-empty fields
              for (const key of LABEL_SIBLING_FIELDS) {
                const val = pageExtracted[key];
                if (val && typeof val === "string" && val.trim() && !aggregatedFields[key]) {
                  aggregatedFields[key] = val.trim();
                }
              }
              
              // Keep the first logo box we successfully crop
              if (pageLogoBox && !finalLogoValue) {
                try {
                  console.log(`[field-upload] Cropping logo from page ${i} using box:`, pageLogoBox);
                  const croppedBuffer = await cropImageBuffer(pageBuffer, pageLogoBox);
                  finalLogoValue = `data:image/png;base64,${croppedBuffer.toString("base64")}`;
                  finalLogoBox = pageLogoBox;
                  console.log(`[field-upload] Logo successfully cropped from page ${i}. Base64 length: ${finalLogoValue.length}`);
                } catch (cropErr) {
                  console.error(`[field-upload] Logo cropping failed on page ${i}:`, cropErr);
                }
              }
            }
            
            await pdf.destroy();
          } catch (pdfErr) {
            console.error(`[field-upload] PDF processing failed:`, pdfErr);
            return NextResponse.json({ error: "Failed to render PDF pages for label analysis." }, { status: 500 });
          }
        } else {
          // It's a standard image
          const openaiForVision = new OpenAI({ apiKey: env.OPENAI_API_KEY });
          const { fields: pageExtracted, logoBox: pageLogoBox } = await extractLabelFieldsFromImage(openaiForVision, buffer, finalActiveMime);
          aggregatedFields = pageExtracted;
          finalLabelImageDataUri = `data:${finalActiveMime};base64,${buffer.toString("base64")}`;
          
          if (pageLogoBox) {
            try {
              console.log(`[field-upload] Cropping logo using box:`, pageLogoBox);
              const croppedBuffer = await cropImageBuffer(buffer, pageLogoBox);
              finalLogoValue = `data:image/png;base64,${croppedBuffer.toString("base64")}`;
              finalLogoBox = pageLogoBox;
            } catch (cropErr) {
              console.error(`[field-upload] Logo cropping failed:`, cropErr);
            }
          }
        }

        const sectionPrefix = fieldId.split(".")[0];
        const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
        let updatedFields = { ...currentSectionData.fields };
        const upserted: string[] = [];
        
        for (const siblingKey of LABEL_SIBLING_FIELDS) {
          const siblingFieldId = `${sectionPrefix}.${siblingKey}`;
          if (siblingKey === "logo") {
            const existingLogo = currentSectionData.fields[siblingFieldId] || "";
            if (existingLogo.trim() && existingLogo.startsWith("data:image/")) {
              console.log(`[field-upload] Logo already exists for ${siblingFieldId}, keeping existing logo.`);
              continue;
            }
            const logoVal = finalLogoValue || aggregatedFields.logo || "";
            if (logoVal.trim()) {
              updatedFields[siblingFieldId] = logoVal.trim();
              upserted.push(siblingFieldId);
            }
          } else {
            const val = aggregatedFields[siblingKey];
            if (val && typeof val === "string" && val.trim()) {
              updatedFields[siblingFieldId] = val.trim();
              upserted.push(siblingFieldId);
            }
          }
        }
        
        const logoText = aggregatedFields.logo || "";
        const summaryLines = LABEL_SIBLING_FIELDS
          .filter(k => aggregatedFields[k]?.trim())
          .map(k => `**${k.charAt(0).toUpperCase() + k.slice(1)}:** ${aggregatedFields[k]?.trim()}`);
          
        const summaryValue = summaryLines.length > 0
          ? `## Label OCR Summary\n\n${summaryLines.join("\n")}\n\n### Label Artwork\n![Label Artwork](${finalLabelImageDataUri})`
          : `Label image uploaded — no text could be extracted.\n\n### Label Artwork\n![Label Artwork](${finalLabelImageDataUri})`;
          
        updatedFields[fieldId] = summaryValue;
        upserted.push(fieldId);
        
        const secObj = fw.sections.find((s) => s.id === sectionId);
        if (secObj) {
          const totalFields = secObj.fields.length;
          const filledCount = secObj.fields.filter(f => updatedFields[f.id]?.trim()).length;
          currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
        }
        
        currentSectionData.fields = updatedFields;
        doc.sections.set(sectionId, currentSectionData);
        doc.markModified("sections");
        await product.save();
        await doc.save();
        
        console.log(`[field-upload] Label upsert complete — ${upserted.length} fields updated:`, upserted);
        
        return NextResponse.json({
          success: true,
          fileName: file.name,
          chunksIndexed: 0,
          namespace: "",
          value: summaryValue,
          logoText,
          accept: ".pdf,.docx,.png,.jpg,.jpeg,.webp"
        });
      } else {
        return NextResponse.json({ error: "Unsupported label file format. Upload an image, PDF, or DOCX." }, { status: 400 });
      }
    }

    const isSymbolsUpload = fieldId === "20.symbols_upload" || fieldId === "8.symbols_upload";
    if (isSymbolsUpload) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const nameLower = file.name.toLowerCase();
      
      const isImage = file.type.startsWith("image/") || nameLower.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i) !== null;
      const isPdf = file.type === "application/pdf" || nameLower.endsWith(".pdf");
      
      if (!isImage && !isPdf) {
        return NextResponse.json({ error: "Unsupported symbols file format. Upload an image or PDF." }, { status: 400 });
      }

      let finalSymbolLot = "";
      let finalSymbolDevice = "";
      let finalSymbolMfg = "";
      let finalSymbolExp = "";
      let finalSymbolStorage = "";

      if (isPdf) {
        try {
          console.log(`[field-upload] Loading symbols PDF...`);
          const data = new Uint8Array(buffer);
          const pdf = await getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true,
          }).promise;
          
          const totalPages = pdf.numPages;
          const pagesToProcess = Math.min(totalPages, 5);
          
          for (let i = 1; i <= pagesToProcess; i++) {
            const pageRendered = await renderPdfPage(pdf, i);
            const pageBuffer = pageRendered.buffer;
            const pageMime = pageRendered.mime;
            
            const openaiForVision = new OpenAI({ apiKey: env.OPENAI_API_KEY });
            const { symbolBoxes } = await extractLabelFieldsFromImage(openaiForVision, pageBuffer, pageMime);
            
            if (symbolBoxes.lot && !finalSymbolLot) {
              const cropped = await cropImageBuffer(pageBuffer, symbolBoxes.lot);
              finalSymbolLot = `data:image/png;base64,${cropped.toString("base64")}`;
            }
            if (symbolBoxes.device && !finalSymbolDevice) {
              const cropped = await cropImageBuffer(pageBuffer, symbolBoxes.device);
              finalSymbolDevice = `data:image/png;base64,${cropped.toString("base64")}`;
            }
            if (symbolBoxes.mfg && !finalSymbolMfg) {
              const cropped = await cropImageBuffer(pageBuffer, symbolBoxes.mfg);
              finalSymbolMfg = `data:image/png;base64,${cropped.toString("base64")}`;
            }
            if (symbolBoxes.exp && !finalSymbolExp) {
              const cropped = await cropImageBuffer(pageBuffer, symbolBoxes.exp);
              finalSymbolExp = `data:image/png;base64,${cropped.toString("base64")}`;
            }
            if (symbolBoxes.storage && !finalSymbolStorage) {
              const cropped = await cropImageBuffer(pageBuffer, symbolBoxes.storage);
              finalSymbolStorage = `data:image/png;base64,${cropped.toString("base64")}`;
            }
          }
          await pdf.destroy();
        } catch (pdfErr) {
          console.error(`[field-upload] PDF symbols cropping failed:`, pdfErr);
          return NextResponse.json({ error: "Failed to render PDF pages for symbols cropping." }, { status: 500 });
        }
      } else {
        const openaiForVision = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const { symbolBoxes } = await extractLabelFieldsFromImage(openaiForVision, buffer, file.type || "image/png");
        
        if (symbolBoxes.lot) {
          const cropped = await cropImageBuffer(buffer, symbolBoxes.lot);
          finalSymbolLot = `data:image/png;base64,${cropped.toString("base64")}`;
        }
        if (symbolBoxes.device) {
          const cropped = await cropImageBuffer(buffer, symbolBoxes.device);
          finalSymbolDevice = `data:image/png;base64,${cropped.toString("base64")}`;
        }
        if (symbolBoxes.mfg) {
          const cropped = await cropImageBuffer(buffer, symbolBoxes.mfg);
          finalSymbolMfg = `data:image/png;base64,${cropped.toString("base64")}`;
        }
        if (symbolBoxes.exp) {
          const cropped = await cropImageBuffer(buffer, symbolBoxes.exp);
          finalSymbolExp = `data:image/png;base64,${cropped.toString("base64")}`;
        }
        if (symbolBoxes.storage) {
          const cropped = await cropImageBuffer(buffer, symbolBoxes.storage);
          finalSymbolStorage = `data:image/png;base64,${cropped.toString("base64")}`;
        }
      }

      const sectionPrefix = fieldId.split(".")[0];
      const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
      let updatedFields = { ...currentSectionData.fields };
      const upserted: string[] = [];

      const symbolMappings = [
        { key: "symbol_lot", val: finalSymbolLot, name: "LOT Symbol" },
        { key: "symbol_device", val: finalSymbolDevice, name: "Device Symbol" },
        { key: "symbol_mfg", val: finalSymbolMfg, name: "Mfg Date Symbol" },
        { key: "symbol_exp", val: finalSymbolExp, name: "Exp Date Symbol" },
        { key: "symbol_storage", val: finalSymbolStorage, name: "Storage Symbol" }
      ];

      const croppedNames: string[] = [];
      for (const mapping of symbolMappings) {
        const siblingFieldId = `${sectionPrefix}.${mapping.key}`;
        if (mapping.val) {
          updatedFields[siblingFieldId] = mapping.val;
          upserted.push(siblingFieldId);
          croppedNames.push(mapping.name);
        }
      }

      const summaryValue = croppedNames.length > 0
        ? `Symbols sheet uploaded. Successfully cropped symbols:\n${croppedNames.map(n => `- ${n}`).join("\n")}`
        : "Symbols sheet uploaded, but no standard symbol graphics were detected or cropped.";

      updatedFields[fieldId] = summaryValue;
      upserted.push(fieldId);

      const secObj = fw.sections.find((s) => s.id === sectionId);
      if (secObj) {
        const totalFields = secObj.fields.length;
        const filledCount = secObj.fields.filter(f => updatedFields[f.id]?.trim()).length;
        currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
      }
      
      currentSectionData.fields = updatedFields;
      doc.sections.set(sectionId, currentSectionData);
      doc.markModified("sections");
      await product.save();
      await doc.save();

      console.log(`[field-upload] Symbols cropping complete — ${upserted.length} fields updated.`);
      return NextResponse.json({
        success: true,
        fileName: file.name,
        chunksIndexed: 0,
        namespace: "",
        value: summaryValue,
        accept: ".pdf,.png,.jpg,.jpeg,.webp"
      });
    }

    const isIfuUpload = fieldId === "20.ifu" || fieldId === "8.ifu";
    if (isIfuUpload) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const nameLower = file.name.toLowerCase();
      
      let extractedText = "";
      const isImage = file.type.startsWith("image/") || nameLower.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i) !== null;
      const isPdf = file.type === "application/pdf" || nameLower.endsWith(".pdf");
      const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || nameLower.endsWith(".docx");

      if (isDocx) {
        console.log(`[field-upload] IFU upload (DOCX) detected`);
        extractedText = await extractTextFromDocx(buffer);
      } else if (isPdf) {
        console.log(`[field-upload] IFU upload (PDF) detected`);
        extractedText = await extractTextFromPDF(buffer);
      } else if (isImage) {
        console.log(`[field-upload] IFU upload (Image) detected, running vision OCR...`);
        const openaiForVision = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        extractedText = await ocrImageWithVision(openaiForVision, buffer, file.type || "image/png");
      } else {
        return NextResponse.json({ error: "Unsupported IFU file format. Upload a PDF, DOCX, or Image." }, { status: 400 });
      }

      if (!extractedText.trim()) {
        return NextResponse.json({ error: "No text could be extracted from the uploaded IFU file." }, { status: 400 });
      }

      const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
      let updatedFields = { ...currentSectionData.fields };
      
      updatedFields[fieldId] = extractedText.trim();
      
      const secObj = fw.sections.find((s) => s.id === sectionId);
      if (secObj) {
        const totalFields = secObj.fields.length;
        const filledCount = secObj.fields.filter(f => updatedFields[f.id]?.trim()).length;
        currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
      }
      
      currentSectionData.fields = updatedFields;
      doc.sections.set(sectionId, currentSectionData);
      doc.markModified("sections");
      await product.save();
      await doc.save();

      console.log(`[field-upload] IFU upload complete.`);
      return NextResponse.json({
        success: true,
        fileName: file.name,
        chunksIndexed: 0,
        namespace: "",
        value: extractedText.trim(),
        accept: ".pdf,.docx,.png,.jpg,.jpeg,.webp"
      });
    }

    let combinedText = "";
    const uploadedFileNames: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      let extractedText = "";

      const nameLower = file.name.toLowerCase();
      const isImage = file.type.startsWith("image/") ||
        nameLower.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i) !== null;

      if (file.type === "application/pdf" || nameLower.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(buffer);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        nameLower.endsWith(".docx")
      ) {
        extractedText = await extractTextFromDocx(buffer);
      } else if (file.type.startsWith("text/") || nameLower.match(/\.(txt|csv|xml|json|md)$/i)) {
        extractedText = buffer.toString("utf-8");
      } else if (isImage) {
        // ── Image: use GPT-4o Vision OCR ──────────────────────────────────────
        const imageMime = file.type || "image/png";

        // ── Logo field: store raw base64 data URI (rendered as <img> in UI) ──
        const isLogoField = fieldId.endsWith(".logo");
        if (isLogoField) {
          console.log(`[field-upload] Logo field ${fieldId} — storing as base64 image data URI`);
          const base64 = buffer.toString("base64");
          const dataUri = `data:${imageMime};base64,${base64}`;

          const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
          currentSectionData.fields = { ...currentSectionData.fields, [fieldId]: dataUri };

          const secObj = fw.sections.find((s) => s.id === sectionId);
          if (secObj) {
            const filled = secObj.fields.filter(f => currentSectionData.fields[f.id]?.trim()).length;
            currentSectionData.completionPct = Math.round((filled / secObj.fields.length) * 100);
          }

          doc.sections.set(sectionId, currentSectionData);
          doc.markModified("sections");
          await product.save();
          await doc.save();

          return NextResponse.json({ success: true, fileName: file.name, chunksIndexed: 0, namespace: "", value: dataUri });
        }



        // Non-master image field: just OCR and return text
        extractedText = await ocrImageWithVision(new OpenAI({ apiKey: env.OPENAI_API_KEY }), buffer, imageMime);
      } else {
        return NextResponse.json({ error: `Unsupported file type for ${file.name}. Upload PDF, DOCX, or an image (PNG, JPG, WEBP).` }, { status: 400 });
      }

      if (extractedText.trim()) {
        const trimmedText = extractedText.slice(0, 150_000);
        combinedText += `\n--- Content from ${file.name} ---\n${trimmedText}\n`;
        uploadedFileNames.push(file.name);

        // Save file to the product's uploadedDocs list
        product.uploadedDocs.push({
          fileId: randomUUID(),
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.length,
          extractedText: trimmedText,
          uploadedAt: new Date(),
        });
      }
    }

    if (!combinedText.trim()) {
      return NextResponse.json({ error: "No text content could be extracted from these files." }, { status: 400 });
    }

    await product.save();

    let pineconePurpose = `field_upload_${fieldId}`;
    const stabilitySections = ["s14_stability", "s16_shelf", "s17_inuse", "s18_shipping"];
    const stabilityFields = ["15.0a", "16.0a", "17.0a", "18.0a"];

    if (sectionId === "s14_stability" || fieldId === "15.0a") pineconePurpose = "stability_overview";
    else if (sectionId === "s16_shelf" || fieldId === "16.0a") pineconePurpose = "claimed_shelf_life";
    else if (sectionId === "s17_inuse" || fieldId === "17.0a") pineconePurpose = "in_use_stability";
    else if (sectionId === "s18_shipping" || fieldId === "18.0a") pineconePurpose = "shipping_stability";

    // 2. Index the document into Pinecone under the product's namespace
    const productNamespaceId = product.vectorNamespaceId || String(product._id);
    let chunksIndexed = 0;
    let namespace = `product_${(user as Record<string, unknown>)._id}_${productNamespaceId}`;
    try {
      const indexed = await indexProductDocument(
        String((user as Record<string, unknown>)._id),
        combinedText,
        productNamespaceId,
        pineconePurpose
      );
      if (indexed) {
        chunksIndexed = indexed.chunksIndexed;
        namespace = indexed.namespace;
      }
    } catch (indexErr) {
      console.error("[field-upload] Pinecone indexing skipped or failed:", indexErr);
    }

    // 4. Generate the targeted table or content using OpenAI
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const isStabilityField = stabilityFields.includes(fieldId) || stabilitySections.includes(sectionId);

    let promptText = `We uploaded a study report/raw data file for field "${fieldLabel}" (${fieldId}).
Field description/hint: ${fieldHint}

Please extract and generate the specific table or content required for this field from the document content below.

RULES:
- Return the data formatted as a Markdown table (using pipe-delimited rows: | Aspect | Subject | ... |).
- Include appropriate headers.
- Extract ONLY the relevant values matching this field. Do not include unrelated study results.
- CRITICAL: If the document does not contain relevant data for this field, state clearly what information is missing. Do NOT generate mock data, placeholder text, or fabricated values.
- Do not wrap the response in markdown blocks like \`\`\`markdown or \`\`\`json. Output the raw text of the table/content directly.
- Avoid introducing any conversational explanations or remarks. Just return the extracted table/data.

Document Content:
${combinedText.slice(0, 100000)}`;

    if (isStabilityField) {
      promptText = `We uploaded stability study report(s) for field "${fieldLabel}" (${fieldId}).
Field description/hint: ${fieldHint}

Generate a comprehensive, professional stability report in Markdown format. The report MUST follow this standard structure, but adapt flexibly — not every report will have every section, and the data tables may differ between study types:

---

**Product Name:** [extract from document]  
**Lot No.:** [extract if present]  
**Mfg. Date:** [extract if present] | **Exp. Date:** [extract if present]  
**Testing Interval:** [extract if present]  
**Quantity Sampled:** [extract if present]

---

### 1. Objective and Purpose of Testing
[Extract and summarize the objective from the document. If not present, state the typical CDSCO objective for this stability type.]

### 2. Storage Conditions
[Extract storage temperature, humidity, light conditions from the document.]

### 3. Calendar / Testing Schedule
[If a testing calendar or schedule table is present, reproduce it as a Markdown table:
| S. No. | Testing Interval | Expected Date | Testing Date |
If not present, omit this section.]

### 4. Product Description
[Extract product name, intended use, description from the document.]

### 5. Kit Content
[If kit components / quantities are listed, reproduce as a Markdown table:
| Component | Quantity |
If not present, omit this section.]

### 6. Procedure
[Extract procedure details, wavelengths, temperature, reagent volumes, calculation formulas. Use bullet points and sub-tables as they appear in the document.]

### 7. Study Results
[Extract and reproduce the core stability data table. Use whatever columns are present in the document, for example:
| Time Point | Measurement / Absorbance | % Recovery vs Day 0 | Visual Appearance | Result |
The columns MUST match the actual data in the document — do not force a fixed structure.]

### 8. Conclusion
[Extract or summarize the conclusion from the document, including claimed stability duration, storage conditions, and compliance statement.]

---

CRITICAL RULES:
- Extract real values from the document wherever possible. Do NOT invent data.
- If a section has no data in the document, omit that section entirely — do not add placeholders.
- Keep original tables as Markdown pipe-tables.
- Do not wrap the response in \`\`\`markdown or any code block. Output raw Markdown directly.
- Do not add any conversational explanation before or after. Output ONLY the report.

Document Content:
${combinedText.slice(0, 100000)}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical device regulatory affairs expert specializing in CDSCO Device Master File (DMF) requirements. Your job is to extract exact raw data from study reports and format it into professional regulatory tables or reports.`,
        },
        {
          role: "user",
          content: promptText,
        },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    });

    const generatedTable = completion.choices[0]?.message?.content?.trim() || "";

    // 5. Update the field value in the document sections Map
    if (!doc.sections) {
      doc.sections = new Map();
    }

    const currentSectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
    currentSectionData.fields = {
      ...currentSectionData.fields,
      [fieldId]: generatedTable,
    };

    // Recalculate completion percentage
    const secObj = fw.sections.find((s) => s.id === sectionId);
    if (secObj) {
      const totalFields = secObj.fields.length;
      const filledCount = secObj.fields.filter(
        (f) => (f.id === fieldId ? generatedTable : currentSectionData.fields[f.id])?.trim()
      ).length;
      currentSectionData.completionPct = Math.round((filledCount / totalFields) * 100);
    }

    doc.sections.set(sectionId, currentSectionData);
    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      fileName: uploadedFileNames.join(", "),
      chunksIndexed,
      namespace,
      value: generatedTable,
    });

  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST field-upload failed:", error);
    return NextResponse.json({ error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}
