import { createCanvas } from "@napi-rs/canvas";
import { OpenAI } from "openai";
import { getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

export type DocumentExtractMethod = "pdf-text" | "ocr-vision";

export type DocumentExtractResult = {
  text: string;
  method: DocumentExtractMethod;
  pageCount: number;
  charCount: number;
  ocrPages?: number;
};

const MIN_TOTAL_CHARS = Number(process.env.PDF_MIN_TEXT_CHARS ?? 200);
const MIN_CHARS_PER_PAGE = Number(process.env.PDF_MIN_CHARS_PER_PAGE ?? 80);
/** Multi-page IFUs with only letterhead text (e.g. 400 chars / 3 pages) still need OCR */
const MIN_TOTAL_MULTI_PAGE = Number(process.env.PDF_MIN_TEXT_MULTI_PAGE ?? 2500);
const MIN_CHARS_PER_PAGE_MULTI = Number(process.env.PDF_MIN_CHARS_PER_PAGE_MULTI ?? 250);
const OCR_MAX_PAGES = Number(process.env.OCR_MAX_PAGES ?? 12);
const OCR_SCALE = Number(process.env.OCR_RENDER_SCALE ?? 1.25);
/** Longest side of rendered page — keeps Vision payloads small (avoids 3MB+ PNGs) */
const OCR_MAX_EDGE = Number(process.env.OCR_MAX_EDGE ?? 1568);
const OCR_MAX_BYTES = Number(process.env.OCR_MAX_IMAGE_BYTES ?? 3_500_000);

function isOcrEnabled(): boolean {
  if (process.env.PDF_OCR_ENABLED === "false") return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Heuristic: scanned PDFs yield very little selectable text from pdf-parse */
export function needsOcrFallback(text: string, pageCount: number): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const pages = Math.max(pageCount, 1);
  const charsPerPage = trimmed.length / pages;

  if (trimmed.length < MIN_TOTAL_CHARS) return true;
  if (charsPerPage < MIN_CHARS_PER_PAGE) return true;

  // 3-page IFU with ~400 chars is almost always letterhead only — body is in images
  if (pages >= 2 && trimmed.length < MIN_TOTAL_MULTI_PAGE) return true;
  if (pages >= 2 && charsPerPage < MIN_CHARS_PER_PAGE_MULTI) return true;

  return false;
}

async function parsePdfWithPdfJs(buffer: Buffer): Promise<{ pdf: PDFDocumentProxy; pageCount: number }> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  return { pdf, pageCount: pdf.numPages };
}

async function extractPdfTextLayer(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // pdf-parse is reliable for text-layer PDFs; pdfjs used for page count + OCR render
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as string)).default as (
    buf: Buffer,
  ) => Promise<{ text: string; numpages: number }>;
  const result = await pdfParse(buffer);
  return { text: result.text ?? "", pageCount: result.numpages ?? 0 };
}

type OcrCanvas = {
  encode?: (format: string, quality?: number) => Promise<Uint8Array>;
  toBuffer?: (mime: string, quality?: number) => Buffer;
};

function resolveRenderScale(page: PDFPageProxy, requestedScale: number): number {
  const base = page.getViewport({ scale: 1 });
  const maxDim = Math.max(base.width, base.height);
  const cap = maxDim > 0 ? OCR_MAX_EDGE / maxDim : requestedScale;
  return Math.min(requestedScale, cap);
}

async function renderPageForOcr(
  page: PDFPageProxy,
  requestedScale: number,
): Promise<{ buffer: Buffer; mime: string; width: number; height: number }> {
  const scale = resolveRenderScale(page, requestedScale);
  const viewport = page.getViewport({ scale });
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);

  const canvas = createCanvas(width, height);
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
  }).promise;

  const el = canvas as unknown as OcrCanvas;

  // Prefer async encode (current @napi-rs/canvas); fallback to toBuffer
  if (typeof el.encode === "function") {
    try {
      const bytes = await el.encode("webp", 82);
      return { buffer: Buffer.from(bytes), mime: "image/webp", width, height };
    } catch (webpErr) {
      console.warn(
        "[documentExtract] OCR: WebP encode failed, retrying JPEG:",
        webpErr instanceof Error ? webpErr.message : String(webpErr),
      );
      const bytes = await el.encode("jpeg", 82);
      return { buffer: Buffer.from(bytes), mime: "image/jpeg", width, height };
    }
  }
  if (typeof el.toBuffer === "function") {
    const buf = el.toBuffer("image/jpeg", 85);
    return { buffer: buf, mime: "image/jpeg", width, height };
  }

  throw new Error("Canvas encode/toBuffer not available");
}

async function renderPageWithRetries(
  page: PDFPageProxy,
  requestedScale: number,
): Promise<{ buffer: Buffer; mime: string; width: number; height: number }> {
  const scales = [requestedScale, Math.min(requestedScale, 1), Math.min(requestedScale, 0.75)];
  let lastError: unknown;

  for (const scale of scales) {
    try {
      return await renderPageForOcr(page, scale);
    } catch (err) {
      lastError = err;
      console.warn(
        `[documentExtract] OCR: render retry at scale ${scale} failed:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function ocrPageWithVision(
  openai: OpenAI,
  image: Buffer,
  mime: string,
  pageNum: number,
  totalPages: number,
): Promise<string> {
  if (image.length > OCR_MAX_BYTES) {
    throw new Error(
      `Page ${pageNum} image too large (${(image.length / 1e6).toFixed(1)}MB). Lower OCR_RENDER_SCALE or OCR_MAX_EDGE.`,
    );
  }

  const model = process.env.OPENAI_OCR_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base64 = image.toString("base64");
  const detail = image.length > 1_500_000 ? "low" : "auto";

  const completion = await openai.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are OCR for a medical device IFU/brochure (India MDR / CDSCO).
Extract ALL visible text from page ${pageNum} of ${totalPages}.
Rules:
- Output plain text only (no markdown fences).
- Preserve headings, bullet lists, and table rows as lines.
- Include intended use, indications, specimen type, performance claims, and manufacturer details if visible.
- Do not summarize or skip small print.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`,
              detail,
            },
          },
        ],
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

async function extractPdfWithVisionOcr(buffer: Buffer, pageCountHint: number): Promise<{ text: string; ocrPages: number }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { pdf, pageCount } = await parsePdfWithPdfJs(buffer);
  const pages = Math.min(pageCount || pageCountHint || 1, OCR_MAX_PAGES);

  console.log(`[documentExtract] OCR: rendering ${pages}/${pageCount} pages (scale ${OCR_SCALE})`);

  const parts: string[] = [];
  const failedPages: string[] = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const page = await pdf.getPage(p);
      const { buffer, mime, width, height } = await renderPageWithRetries(page, OCR_SCALE);
      console.log(
        `[documentExtract] OCR: page ${p} → ${width}x${height} ${mime} ${(buffer.length / 1024).toFixed(0)}KB`,
      );
      const pageText = await ocrPageWithVision(openai, buffer, mime, p, pageCount);
      if (pageText) {
        parts.push(`--- Page ${p} ---\n${pageText}`);
      }
    } catch (pageErr) {
      const msg = pageErr instanceof Error ? pageErr.message : String(pageErr);
      console.error(`[documentExtract] OCR: page ${p} failed:`, msg);
      failedPages.push(`${p}: ${msg}`);
    }
  }

  await pdf.destroy();
  if (failedPages.length > 0) {
    console.warn(`[documentExtract] OCR skipped ${failedPages.length} page(s): ${failedPages.join(" | ")}`);
  }
  if (parts.length === 0 && failedPages.length > 0) {
    throw new Error(`OCR failed on all pages: ${failedPages.join(" | ")}`);
  }
  return { text: parts.join("\n\n"), ocrPages: pages };
}

/**
 * Step 1: pdf-parse text layer
 * Step 2: if sparse → render pages + OpenAI Vision OCR
 */
export async function extractDocumentText(
  buffer: Buffer,
  fileName: string,
): Promise<DocumentExtractResult> {
  const lower = fileName.toLowerCase();

  // Support direct image OCR using Vision
  if (lower.match(/\.(png|jpg|jpeg|webp)$/)) {
    console.log("[documentExtract] Image detected, running Vision OCR directly");
    const openai = new OpenAI();
    const mime = `image/${lower.split('.').pop()?.replace('jpg', 'jpeg')}`;
    
    if (buffer.length > OCR_MAX_BYTES) {
      throw new Error(`Image too large (${(buffer.length / 1e6).toFixed(1)}MB).`);
    }

    const text = await ocrPageWithVision(openai, buffer, mime, 1, 1);
    return {
      text,
      method: "ocr-vision",
      pageCount: 1,
      charCount: text.length,
      ocrPages: 1,
    };
  }

  if (!lower.endsWith(".pdf")) {
    const text = buffer.toString("utf-8");
    return {
      text,
      method: "pdf-text",
      pageCount: 1,
      charCount: text.length,
    };
  }

  const { text: layerText, pageCount } = await extractPdfTextLayer(buffer);
  const trimmed = layerText.trim();

  console.log(
    `[documentExtract] PDF text layer: ${pageCount} pages, ${trimmed.length} chars` +
      (trimmed ? ` | preview: "${trimmed.slice(0, 120).replace(/\n/g, " ")}"` : ""),
  );

  if (!needsOcrFallback(trimmed, pageCount) || !isOcrEnabled()) {
    if (needsOcrFallback(trimmed, pageCount) && !isOcrEnabled()) {
      console.warn("[documentExtract] Sparse PDF text but OCR disabled (set OPENAI_API_KEY / PDF_OCR_ENABLED)");
    }
    return {
      text: layerText,
      method: "pdf-text",
      pageCount,
      charCount: layerText.length,
    };
  }

  console.log("[documentExtract] Sparse text detected → running Vision OCR fallback");
  const { text: ocrText, ocrPages } = await extractPdfWithVisionOcr(buffer, pageCount);
  const merged = [trimmed, ocrText].filter(Boolean).join("\n\n");

  console.log(
    `[documentExtract] OCR complete: ${ocrPages} pages → ${merged.length} chars` +
      ` | preview: "${merged.slice(0, 120).replace(/\n/g, " ")}"`,
  );

  return {
    text: merged,
    method: "ocr-vision",
    pageCount,
    charCount: merged.length,
    ocrPages,
  };
}
