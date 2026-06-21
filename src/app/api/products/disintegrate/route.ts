import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

// mammoth runs only in Node – dynamic import keeps the edge runtime happy if needed
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth") as typeof import("mammoth");

// ── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60)
    .trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Wraps a section's HTML in a Word-compatible HTML envelope (.doc format).
 * Saving this content with a .doc extension produces a file that opens
 * natively in Microsoft Word and LibreOffice Writer.
 */
function wrapAsWordDoc(title: string, body: string): string {
  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="Microsoft Word 15" />
  <meta name="Originator" content="Microsoft Word 15" />
  <title>${escaped}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Normal</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* Page layout */
    @page {
      size: A4;
      margin: 2.54cm 2.54cm 2.54cm 2.54cm;
    }
    body   { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;
             color: #000000; }
    h1     { font-size: 13pt; font-weight: bold; color: #003366;
             border-bottom: 1.5pt solid #003366; padding-bottom: 4pt;
             margin-top: 18pt; margin-bottom: 8pt; }
    h2     { font-size: 12pt; font-weight: bold; color: #1a1a2e;
             margin-top: 14pt; margin-bottom: 6pt; }
    h3     { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
    p      { margin: 4pt 0; }
    table  { border-collapse: collapse; width: 100%; margin: 10pt 0;
             mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td, th { border: 0.75pt solid #999999; padding: 5pt 8pt;
             font-size: 10pt; vertical-align: top; }
    th     { background-color: #dce6f1; font-weight: bold; }
    tr:nth-child(even) td { background-color: #f2f7fc; }
    ul, ol { margin: 4pt 0 4pt 20pt; }
    li     { margin: 2pt 0; }
    strong { font-weight: bold; }
    em     { font-style: italic; }
    sup    { font-size: 8pt; vertical-align: super; }
    sub    { font-size: 8pt; vertical-align: sub; }
    a      { color: #003366; text-decoration: underline; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx files are supported" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert DOCX → HTML (images embedded as base64 data-URIs)
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(
          (image: { read: (enc: string) => Promise<string>; contentType: string }) =>
            image.read("base64").then((b64: string) => ({
              src: `data:${image.contentType};base64,${b64}`,
            })),
        ),
      },
    );

    const fullHtml: string = result.value;

    // ── Split by <h1> ───────────────────────────────────────────────────────
    // split() with a capturing group keeps the delimiters in the array:
    //   ["preamble", "<h1>Title A</h1>", "content A", "<h1>Title B</h1>", "content B", …]
    const parts = fullHtml.split(/(<h1>[\s\S]*?<\/h1>)/i);

    type Section = { index: number; title: string; htmlBody: string };
    const sections: Section[] = [];
    let idx = 0;

    for (let i = 0; i < parts.length; i++) {
      if (/^<h1>/i.test(parts[i])) {
        const h1Html = parts[i];
        const contentHtml = i + 1 < parts.length ? parts[i + 1] : "";
        const title = stripHtml(h1Html) || `Section ${idx + 1}`;
        sections.push({ index: ++idx, title, htmlBody: h1Html + contentHtml });
        i++; // skip the consumed content chunk
      }
    }

    if (sections.length === 0) {
      return NextResponse.json(
        {
          error:
            'No Heading 1 sections detected in this document. Make sure the DMF uses Word "Heading 1" styles for major sections.',
        },
        { status: 422 },
      );
    }

    // ── Build ZIP ───────────────────────────────────────────────────────────
    const zip = new JSZip();
    const baseName = file.name.replace(/\.docx$/i, "");

    // Manifest
    const manifest = [
      `DMF DISINTEGRATED SECTIONS`,
      `===========================`,
      `Source file : ${file.name}`,
      `Sections    : ${sections.length}`,
      `Generated   : ${new Date().toISOString()}`,
      ``,
      ...sections.map((s) => `  ${String(s.index).padStart(2, "0")}. ${s.title}`),
    ].join("\n");

    zip.file("00_MANIFEST.txt", manifest);

    for (const section of sections) {
      const num = String(section.index).padStart(2, "0");
      const safeName = sanitizeFilename(section.title);
      const filename = `Section_${num}_${safeName}.doc`;
      zip.file(filename, wrapAsWordDoc(section.title, section.htmlBody));
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipFilename = `${sanitizeFilename(baseName)}_Disintegrated.zip`;

    // Pass section titles back to the client via a custom header
    // (pipe-delimited, URI-encoded so special chars survive)
    const titlesHeader = sections
      .map((s) => encodeURIComponent(`${String(s.index).padStart(2, "0")}. ${s.title}`))
      .join("|||");

    console.log(
      `[disintegrate] "${file.name}" → ${sections.length} sections, ZIP ${(zipBuffer.length / 1024).toFixed(1)} KB`,
    );

    return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "X-Section-Count": String(sections.length),
        "X-Section-Titles": titlesHeader,
      },
    });
  } catch (error) {
    console.error("[disintegrate] Error:", error);
    return NextResponse.json(
      { error: "Failed to process document. Ensure the file is a valid .docx." },
      { status: 500 },
    );
  }
}
