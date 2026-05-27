import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

// Need these mock objects in Node.js
globalThis.DOMMatrix = class DOMMatrix { };
globalThis.ImageData = class ImageData { };
globalThis.Path2D = class Path2D { };

async function run() {
  try {
    const buffer = fs.readFileSync("package.json");
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    await loadingTask.promise;
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
