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


/**
 * Pre-process text: detect alternating Action / Responsibility lines
 * (when AI forgets pipe format) and convert to Markdown pipe table.
 */
function normalizeTableBlocks(text: string): string {
  const ROLE_PATTERN = /^(M\.R\.|MR|Factory Manager|QA Manager|Concerned User|Manager QA|QA|MD|MR\/ FM|MR\/FM|MR\/ FM\/QM|MR\/FM\/QM|Concerned Personnel|Computer User|QM|FM|Document Controller|Department Author|IT Department)[^\n]{0,40}$/i;

  const lines = text.split(/\n/);
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "Action" && lines[i + 1]?.trim() === "Responsibility") {
      i += 2;
      const tableLines: string[] = [];
      tableLines.push("| Action | Responsibility |");
      tableLines.push("|--------|----------------|")
;
      while (i < lines.length) {
        const action = lines[i]?.trim();
        const resp = lines[i + 1]?.trim();

        if (!action) { i++; break; }
        if (!resp || (!ROLE_PATTERN.test(resp) && resp.endsWith(":"))) break;

        tableLines.push(`| ${action} | ${resp} |`);
        i += 2;

        while (i < lines.length && !lines[i]?.trim()) i++;
      }
      result.push(...tableLines);
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

/** Convert plain text into a sequence of Word XML paragraphs (and tables) */
function textToWordXml(text: string): string {
  if (!text) return wPara(wRun(""));

  text = normalizeTableBlocks(text);

  const lines = text.split(/\n/);
  const parts: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  function flushTable() {
    if (!inTable) return;
    if (tableRows.length > 0) {
      const maxCols = Math.max(...tableRows.map(r => r.length));
      
      // 5000 pct = 100%. For 2 columns: 75% (3750) and 25% (1250).
      const colWidths = maxCols === 2
        ? [3750, 1250]
        : Array(maxCols).fill(Math.floor(5000 / maxCols));

      const xmlRows = tableRows.map((row, i) => {
        const isHeader = i === 0;
        const headerFill = isHeader ? "F0F0F0" : "auto"; // Reverted to light gray/plain to match original
        const cells = row.map((cellText, ci) => {
          const colW = colWidths[ci] ?? colWidths[colWidths.length - 1];
          return `<w:tc>
            <w:tcPr>
              <w:tcW w:w="${colW}" w:type="pct"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              </w:tcBorders>
              <w:shd w:val="clear" w:color="auto" w:fill="${headerFill}"/>
              <w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
            </w:tcPr>
            <w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr>${isHeader ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${xmlEsc(cellText)}</w:t></w:r></w:p>
          </w:tc>`;
        }).join("");
        return `<w:tr>${cells}</w:tr>`;
      }).join("");

      // Note: gridCol uses absolute twips usually, but w:type="pct" on tcW overrides it when tblLayout is fixed and tblW is pct.
      // We can omit tblGrid or put dummy values since pct dictates the width.
      
      parts.push(`<w:tbl>
        <w:tblPr>
          <w:tblW w:w="5000" w:type="pct"/>
          <w:tblLayout w:type="fixed"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="999999"/>
            <w:left w:val="single" w:sz="6" w:space="0" w:color="999999"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="999999"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="999999"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          </w:tblBorders>
        </w:tblPr>
        ${xmlRows}
      </w:tbl>
      <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`);
    }
    inTable = false;
    tableRows = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.match(/^\|[-:|\s]+\|$/)) {
        continue;
      }
      inTable = true;
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

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
  
  flushTable();

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
