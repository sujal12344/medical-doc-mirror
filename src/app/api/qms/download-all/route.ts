import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAuth } from "@/lib/auth";
import type { QmsSection } from "../disintegrate/route";

export const runtime = "nodejs";
export const maxDuration = 120;

// ─── OOXML helpers (identical to download-section) ─────────────────────────────

function xmlEsc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wRun(text: string, bold = false, sz = 18): string {
  const b = bold ? "<w:b/><w:bCs/>" : "";
  return `<w:r><w:rPr>${b}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
}

function wPara(content: string, after = 80): string {
  return `<w:p><w:pPr><w:spacing w:after="${after}"/></w:pPr>${content}</w:p>`;
}

function textToWordXml(text: string): string {
  if (!text) return wPara(wRun(""));

  const lines = text.split(/\n/);
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      parts.push(`<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>`);
      continue;
    }

    if (/^[-•*] /.test(trimmed)) {
      const content = trimmed.replace(/^[-•*] /, "");
      parts.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
          <w:spacing w:after="40"/>
        </w:pPr>
        ${wRun(content)}
      </w:p>`);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      parts.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>
          <w:spacing w:after="40"/>
        </w:pPr>
        ${wRun(content)}
      </w:p>`);
      continue;
    }

    parts.push(wPara(wRun(trimmed)));
  }

  return parts.join("\n") || wPara(wRun(""));
}

const PAGE_TOTAL_W = 9746;
const COL_BORDER = `<w:top w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:left w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:right w:val="single" w:sz="6" w:space="0" w:color="999999"/>`;

function buildSectionXml(section: QmsSection): string {
  const heading = section.number
    ? `${section.number}  ${section.title}`.toUpperCase()
    : section.title.toUpperCase();

  const headingRow = `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${PAGE_TOTAL_W}" w:type="dxa"/>
        <w:tcBorders>${COL_BORDER}</w:tcBorders>
        <w:shd w:val="clear" w:color="auto" w:fill="1B4F8A"/>
        <w:tcMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:after="40"/></w:pPr>
        <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/></w:rPr>
          <w:t xml:space="preserve">${xmlEsc(heading)}</w:t>
        </w:r>
      </w:p>
    </w:tc>
  </w:tr>`;

  const contentRow = `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${PAGE_TOTAL_W}" w:type="dxa"/>
        <w:tcBorders>${COL_BORDER}</w:tcBorders>
        <w:tcMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      ${textToWordXml(section.content)}
    </w:tc>
  </w:tr>`;

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="${PAGE_TOTAL_W}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="12" w:space="0" w:color="1B4F8A"/>
        <w:left w:val="single" w:sz="12" w:space="0" w:color="1B4F8A"/>
        <w:bottom w:val="single" w:sz="12" w:space="0" w:color="1B4F8A"/>
        <w:right w:val="single" w:sz="12" w:space="0" w:color="1B4F8A"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="${PAGE_TOTAL_W}"/></w:tblGrid>
    ${headingRow}
    ${contentRow}
  </w:tbl>
  <w:p><w:pPr><w:spacing w:after="240"/></w:pPr></w:p>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>
      <w:sz w:val="18"/><w:szCs w:val="18"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360"/></w:pPr>
  </w:style>
</w:styles>`;

const NUMBERING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/><w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/><w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

function makeRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;
}

function makeContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;
}

function buildDocxForSection(section: QmsSection): Promise<Buffer> {
  const headerStrip = `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/><w:color w:val="1B4F8A"/></w:rPr>
      <w:t>QMS as per Fifth Schedule — MDR 2017</w:t>
    </w:r>
  </w:p>
  <w:p><w:pPr><w:spacing w:after="200"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="1B4F8A"/></w:pBdr></w:pPr></w:p>`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  mc:Ignorable="w14">
<w:body>
  ${headerStrip}
  ${buildSectionXml(section)}
  <w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="708" w:footer="708" w:gutter="0"/>
  </w:sectPr>
</w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", makeContentTypes());
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/_rels/document.xml.rels", makeRelationships());
  zip.file("word/document.xml", docXml);
  zip.file("word/styles.xml", STYLES_XML);
  zip.file("word/numbering.xml", NUMBERING_XML);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function safeFilename(num: string, title: string): string {
  return `${num ? num + "_" : ""}${title}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-\.]/g, "")
    .slice(0, 80);
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = (await req.json()) as { sections?: QmsSection[]; documentTitle?: string };
    const { sections = [], documentTitle = "QMS_MDR2017" } = body;

    if (sections.length === 0) {
      return NextResponse.json({ error: "No sections provided" }, { status: 400 });
    }

    const outerZip = new JSZip();

    await Promise.all(
      sections.map(async (section) => {
        const docxBuf = await buildDocxForSection(section);
        const filename = safeFilename(section.number, section.title) + ".docx";
        outerZip.file(filename, docxBuf);
      })
    );

    const zipBuf = await outerZip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const safeTitle = documentTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 60);
    const zipFilename = `${safeTitle}_Sections.zip`;

    return new NextResponse(zipBuf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download failed";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[qms/download-all]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
