import { NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs/promises";

// Node.js fix for pdfjs
(globalThis as any).DOMMatrix = class DOMMatrix { };
(globalThis as any).ImageData = class ImageData { };
(globalThis as any).Path2D = class Path2D { };

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url
).toString();

export async function GET() {
  try {
    const buffer = await fs.readFile("package.json");
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useWorkerFetch: false,
      useSystemFonts: true,
    } as any);
    await loadingTask.promise;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
