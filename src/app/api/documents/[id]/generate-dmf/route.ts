import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { FRAMEWORKS } from "@/lib/frameworks";

// ─── OOXML Helpers ────────────────────────────────────────────────────────────

/** Escape text for XML */
function x(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A single Word run of text */
function run(text: string, bold = false, sz = 18): string {
  const b = bold ? "<w:b/><w:bCs/>" : "";
  return `<w:r><w:rPr>${b}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
}

/** A paragraph containing one or more runs */
function para(content: string, spacing = 80): string {
  return `<w:p><w:pPr><w:spacing w:after="${spacing}"/></w:pPr>${content}</w:p>`;
}

/**
 * Convert Markdown text to Word XML paragraphs.
 * Handles: bold, bullet lists, numbered lists, Markdown tables,
 *          Mermaid flowcharts (rendered as step list), headings, line breaks.
 */
function mdToWordXml(md: string): string {
  if (!md) return para(run(""));

  // ── Pre-process: handle Mermaid blocks before line-by-line parsing ──────────
  md = md.replace(/```mermaid\s*\n([\s\S]*?)```/gi, (_match, body: string) => {
    const lines = body.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const nodes: Record<string, string> = {};
    const edges: { from: string, to: string, label: string }[] = [];
    
    const nodeDefRegex = /([a-zA-Z0-9_]+)(?:\[([^\]]+)\]|\{([^}]+)\}|\(([^)]+)\))/g;
    const edgeRegex = /([a-zA-Z0-9_]+)\s*-->\s*(?:\|([^|]+)\|\s*)?([a-zA-Z0-9_]+)/g;

    for (const l of lines) {
      if (/^(flowchart|graph)\s/i.test(l)) continue;

      let m;
      nodeDefRegex.lastIndex = 0;
      while ((m = nodeDefRegex.exec(l)) !== null) {
        const id = m[1];
        const label = m[2] || m[3] || m[4];
        if (label) nodes[id] = label.replace(/<br\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
      }

      edgeRegex.lastIndex = 0;
      while ((m = edgeRegex.exec(l)) !== null) {
        const from = m[1];
        const label = m[2] ? m[2].replace(/<br\/?>/gi, " ").replace(/<[^>]+>/g, "").trim() : "";
        const to = m[3];
        edges.push({ from, to, label });
      }
    }

    if (edges.length === 0) return "[Process Flow Chart — see portal]";

    const steps: { type: 'node' | 'edge'; label: string }[] = [];
    const visited = new Set<string>();

    for (const edge of edges) {
      if (!visited.has(edge.from)) {
        steps.push({ type: 'node', label: nodes[edge.from] || edge.from });
        visited.add(edge.from);
      }
      steps.push({ type: 'edge', label: edge.label });
      if (!visited.has(edge.to)) {
        steps.push({ type: 'node', label: nodes[edge.to] || edge.to });
        visited.add(edge.to);
      }
    }

    return steps.map(step => {
      if (step.type === 'node') {
        const textRuns = step.label.split("\n").map(line => 
          `<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${x(line)}</w:t></w:r>`
        ).join('<w:br/>');

        return `@@RAW_XML@@
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="6000" w:type="dxa"/>
    <w:jc w:val="center"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
      <w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>
      <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
      <w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>
    </w:tblBorders>
    <w:shd w:val="clear" w:color="auto" w:fill="F8F9FA"/>
  </w:tblPr>
  <w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="6000" w:type="dxa"/>
        <w:tcMar>
          <w:top w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>${textRuns}</w:p>
    </w:tc>
  </w:tr>
</w:tbl>
<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>
@@RAW_XML@@`;
      } else {
        if (step.label) {
          return `@@RAW_XML@@
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="20"/></w:pPr>
  <w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>↓</w:t></w:r>
</w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="60"/></w:pPr>
  <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">(${x(step.label)})</w:t></w:r>
</w:p>
@@RAW_XML@@`;
        } else {
          return `@@RAW_XML@@
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
  <w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>↓</w:t></w:r>
</w:p>
@@RAW_XML@@`;
        }
      }
    }).join("\n");
  });

  // Replace other fenced code blocks with plain preformatted text
  md = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code: string) => {
    return code.trim();
  });

  const lines = md.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Markdown headings ──────────────────────────────────────────────────
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const hText = hMatch[2];
      const szMap: Record<number, number> = { 1: 26, 2: 24, 3: 22, 4: 20 };
      const sz = szMap[level] || 20;
      result.push(`<w:p><w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
        <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>
          <w:t xml:space="preserve">${x(hText)}</w:t>
        </w:r>
      </w:p>`);
      i++;
      continue;
    }

    // ── Markdown table block ───────────────────────────────────────────────
    if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i + 1]?.trim().match(/^\|[\s|:-]+\|/)) {
      // Collect header + separator + body rows
      const headerCells = line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      i += 2; // skip separator
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        bodyRows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
        i++;
      }

      // Column count
      const cols = headerCells.length;
      const colWidth = Math.floor(8640 / cols); // distribute across 6 inches

      // Build table XML
      const gridCols = headerCells.map(() => `<w:gridCol w:w="${colWidth}"/>`).join("");
      const tblW = colWidth * cols;

      const buildTcXml = (cell: string, isHeader: boolean) => {
        const shade = isHeader ? `<w:shd w:val="clear" w:color="auto" w:fill="E6E6E6"/>` : "";
        const b = isHeader ? "<w:b/><w:bCs/>" : "";
        return `<w:tc>
          <w:tcPr>
            <w:tcW w:w="${colWidth}" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>
            </w:tcBorders>
            ${shade}
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:after="40"/></w:pPr>
            <w:r><w:rPr>${b}<w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
              <w:t xml:space="preserve">${x(cell)}</w:t>
            </w:r>
          </w:p>
        </w:tc>`;
      };

      const headerRowXml = `<w:tr>${headerCells.map(c => buildTcXml(c, true)).join("")}</w:tr>`;
      const bodyRowsXml = bodyRows.map(row =>
        `<w:tr>${row.map(c => buildTcXml(c, false)).join("")}</w:tr>`
      ).join("");

      result.push(`<w:tbl>
        <w:tblPr>
          <w:tblW w:w="${tblW}" w:type="dxa"/>
          <w:tblLayout w:type="fixed"/>
          <w:tblBorders>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          </w:tblBorders>
          <w:tblCellMar>
            <w:top w:w="60" w:type="dxa"/>
            <w:left w:w="100" w:type="dxa"/>
            <w:bottom w:w="60" w:type="dxa"/>
            <w:right w:w="100" w:type="dxa"/>
          </w:tblCellMar>
        </w:tblPr>
        <w:tblGrid>${gridCols}</w:tblGrid>
        ${headerRowXml}${bodyRowsXml}
      </w:tbl>`);
      continue;
    }

    // Bullet list item
    if (line.match(/^[-•*] /)) {
      const text = line.replace(/^[-•*] /, "");
      result.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
          <w:spacing w:after="40"/>
        </w:pPr>
        ${inlineRuns(text)}
      </w:p>`);
      i++;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const text = line.replace(/^\d+\. /, "");
      result.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>
          <w:spacing w:after="40"/>
        </w:pPr>
        ${inlineRuns(text)}
      </w:p>`);
      i++;
      continue;
    }

    // Raw XML injection (used for our mermaid boxes)
    if (line.trim() === "@@RAW_XML@@") {
      i++;
      const xmlLines = [];
      while (i < lines.length && lines[i].trim() !== "@@RAW_XML@@") {
        xmlLines.push(lines[i]);
        i++;
      }
      result.push(xmlLines.join("\n"));
      i++;
      continue;
    }

    // Empty line → spacer paragraph
    if (line.trim() === "") {
      result.push(`<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>`);
      i++;
      continue;
    }

    // Normal paragraph
    result.push(`<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${inlineRuns(line)}</w:p>`);
    i++;
  }

  return result.join("\n") || para(run(""));
}

/** Convert inline Markdown (bold) within a single line to Word runs */
function inlineRuns(text: string, sz = 18): string {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map(part => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return run(inner, true, sz);
    }
    return run(part, false, sz);
  }).join("");
}

// A4 page in twips: 11906 wide, margins 1080 each side → usable = 9746
const COL_LABEL = 3700;  // ~38%
const COL_CONTENT = 6046; // ~62%
const TOTAL_W = COL_LABEL + COL_CONTENT;

const BORDER = `<w:top w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:left w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:right w:val="single" w:sz="6" w:space="0" w:color="999999"/>`;

function tc(width: number, content: string, fill = "FFFFFF", bold = false): string {
  const shade = fill !== "FFFFFF" ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : "";
  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${width}" w:type="dxa"/>
      <w:tcBorders>${BORDER}</w:tcBorders>
      ${shade}
      <w:tcMar>
        <w:top w:w="70" w:type="dxa"/>
        <w:left w:w="110" w:type="dxa"/>
        <w:bottom w:w="70" w:type="dxa"/>
        <w:right w:w="110" w:type="dxa"/>
      </w:tcMar>
    </w:tcPr>
    ${content}
  </w:tc>`;
}

function dmfRow(label: string, content: string): string {
  const labelXml = `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${inlineRuns(label, 17)}</w:p>`;
  const contentXml = mdToWordXml(content);
  return `<w:tr>
    ${tc(COL_LABEL, labelXml, "F7F7F7")}
    ${tc(COL_CONTENT, contentXml)}
  </w:tr>`;
}

/**
 * Full-width row: label as shaded sub-heading spanning full width,
 * then content spanning full width. Use for all table-containing fields
 * so nested tables can use 100% of the page width without clipping.
 */
function fullWidthRow(label: string, content: string): string {
  const labelRow = `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:gridSpan w:val="2"/>
        <w:tcBorders>${BORDER}</w:tcBorders>
        <w:shd w:val="clear" w:color="auto" w:fill="F0F0F0"/>
        <w:tcMar>
          <w:top w:w="60" w:type="dxa"/>
          <w:left w:w="110" w:type="dxa"/>
          <w:bottom w:w="60" w:type="dxa"/>
          <w:right w:w="110" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:after="40"/></w:pPr>
        <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>
          <w:t xml:space="preserve">${x(label)}</w:t>
        </w:r>
      </w:p>
    </w:tc>
  </w:tr>`;

  const contentXml = mdToWordXml(content);
  const contentRow = `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:gridSpan w:val="2"/>
        <w:tcBorders>${BORDER}</w:tcBorders>
        <w:tcMar>
          <w:top w:w="70" w:type="dxa"/>
          <w:left w:w="110" w:type="dxa"/>
          <w:bottom w:w="70" w:type="dxa"/>
          <w:right w:w="110" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      ${contentXml}
    </w:tc>
  </w:tr>`;

  return labelRow + "\n" + contentRow;
}

function headingRow(num: string, title: string): string {
  const txt = `${num}  ${title}`.toUpperCase();
  const content = `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>
    <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
      <w:t xml:space="preserve">${x(txt)}</w:t>
    </w:r>
  </w:p>`;
  return `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:gridSpan w:val="2"/>
        <w:tcBorders>${BORDER}</w:tcBorders>
        <w:shd w:val="clear" w:color="auto" w:fill="E0E0E0"/>
        <w:tcMar>
          <w:top w:w="80" w:type="dxa"/>
          <w:left w:w="110" w:type="dxa"/>
          <w:bottom w:w="80" w:type="dxa"/>
          <w:right w:w="110" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      ${content}
    </w:tc>
  </w:tr>`;
}

function spacerRow(): string {
  return `<w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:gridSpan w:val="2"/>
        <w:tcBorders>
          <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        </w:tcBorders>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>
    </w:tc>
  </w:tr>`;
}

function wrapInMainTable(rowsXml: string): string {
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="12" w:space="0" w:color="333333"/>
        <w:left w:val="single" w:sz="12" w:space="0" w:color="333333"/>
        <w:bottom w:val="single" w:sz="12" w:space="0" w:color="333333"/>
        <w:right w:val="single" w:sz="12" w:space="0" w:color="333333"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="999999"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="999999"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="${COL_LABEL}"/>
      <w:gridCol w:w="${COL_CONTENT}"/>
    </w:tblGrid>
    ${rowsXml}
  </w:tbl>`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const product = await Product.findById((doc.contextPayload?.productId || doc.contextPayload?.productIds?.[0])).lean() as Record<string, unknown> | null;
    const fw = FRAMEWORKS.find(f => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const sections = doc.sections instanceof Map
      ? Object.fromEntries(doc.sections.entries())
      : doc.sections ?? {};

    function f(sid: string, fid: string): string {
      return (sections[sid]?.fields?.[fid] as string) || "";
    }

    const productName = (product?.name as string) || f("s1", "1.1a") || "N/A";
    const manufacturer = (product?.manufacturer as string) || "";
    const docTitle = doc.title || `DMF - ${productName}`;

    // ── LOGO PARSING ─────────────────────────────────────────────────────────
    const logoDataUrl = f("s20", "20.logo");
    let logoBase64 = "";
    let logoExt = "";
    if (logoDataUrl.startsWith("data:image/")) {
      const parts = logoDataUrl.split(",");
      if (parts.length === 2) {
        logoBase64 = parts[1];
        logoExt = parts[0].includes("image/jpeg") ? "jpeg" : "png";
      }
    }

    // ── DOCUMENT HEADER TABLE (INDO-MIM FORMAT) ──────────────────────────────
    const headerPreText = `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="4873"/><w:gridCol w:w="4873"/></w:tblGrid>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="4873" w:type="dxa"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>Restricted Circulation</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="4873" w:type="dxa"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>Format No. MK/QA/SOP/002/F-01 R-02</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>`;

    const docHeaderTable = `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="3900"/>
        <w:gridCol w:w="2923"/>
        <w:gridCol w:w="2923"/>
      </w:tblGrid>
      
      <!-- Row 1: Logo & Address -->
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          ${logoBase64 ? `
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
              <w:drawing>
                <wp:inline distT="0" distB="0" distL="0" distR="0">
                  <wp:extent cx="1600000" cy="500000"/>
                  <wp:effectExtent l="0" t="0" r="0" b="0"/>
                  <wp:docPr id="1" name="Logo"/>
                  <wp:cNvGraphicFramePr>
                    <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                  </wp:cNvGraphicFramePr>
                  <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                        <pic:nvPicPr>
                          <pic:cNvPr id="0" name="Logo"/>
                          <pic:cNvPicPr/>
                        </pic:nvPicPr>
                        <pic:blipFill>
                          <a:blip r:embed="rIdLogo"/>
                          <a:stretch><a:fillRect/></a:stretch>
                        </pic:blipFill>
                        <pic:spPr>
                          <a:xfrm>
                            <a:off x="0" y="0"/>
                            <a:ext cx="1600000" cy="500000"/>
                          </a:xfrm>
                          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                        </pic:spPr>
                      </pic:pic>
                    </a:graphicData>
                  </a:graphic>
                </wp:inline>
              </w:drawing>
            </w:r>
          </w:p>
          ` : `
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="666666"/></w:rPr><w:t>INDO-MIM</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="999999"/></w:rPr><w:t>COMPLEXITY SIMPLIFIED</w:t></w:r></w:p>
          `}
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5846" w:type="dxa"/><w:gridSpan w:val="2"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>INDO-MIM Limited</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>#45[P], Medical kit building, FF, KIADB Industrial Area,</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>Doddaballapur, Bengaluru Rural, Karnataka (India)-561203</w:t></w:r></w:p>
        </w:tc>
      </w:tr>

      <!-- Row 2: Doc Name & Doc No -->
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:vMerge w:val="restart"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>DOCUMENT NAME: </w:t></w:r><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">DEVICE MASTER FILE FOR ${x(productName.toUpperCase())}</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5846" w:type="dxa"/><w:gridSpan w:val="2"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>DOCUMENT NO.: MK/QA/DMF/057</w:t></w:r></w:p>
        </w:tc>
      </w:tr>

      <!-- Row 3: Rev No & Division -->
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:vMerge/></w:tcPr><w:p/></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2923" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>REVISION NO.: R-00</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2923" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>DIVISION: Medical Kit</w:t></w:r></w:p>
        </w:tc>
      </w:tr>

      <!-- Row 4: Effective Date & Review Date -->
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:vMerge/></w:tcPr><w:p/></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2923" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>EFFECTIVE DATE: 23/01/2026</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2923" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>NEXT REVIEW DATE: 22/01/2028</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:pPr><w:spacing w:after="240"/></w:pPr></w:p>`;

    // ── APPROVALS TABLE ──────────────────────────────────────────────────────
    const approvalsTable = `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="333333"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="2436"/>
        <w:gridCol w:w="4658"/>
        <w:gridCol w:w="2652"/>
      </w:tblGrid>
      <w:tr>
        ${[`<w:tc><w:tcPr><w:tcW w:w="${TOTAL_W}" w:type="dxa"/><w:gridSpan w:val="3"/><w:shd w:val="clear" w:color="auto" w:fill="E0E0E0"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
          <w:p><w:pPr><w:spacing w:after="60"/></w:pPr>
            <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/></w:rPr><w:t>APPROVALS:</w:t></w:r>
          </w:p>
        </w:tc>`]}
      </w:tr>
      <w:tr>
        ${["NAME","DESIGNATION / DEPARTMENT","SIGN / DATE"].map((h,i) => {
          const w = [2436,4658,2652][i];
          return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F7F7F7"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
            <w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/></w:rPr><w:t>${x(h)}</w:t></w:r></w:p>
          </w:tc>`;
        }).join("")}
      </w:tr>
      ${["PREPARED BY","REVIEWED BY","APPROVED BY"].map(role => `
        <w:tr>
          <w:tc><w:tcPr><w:tcW w:w="${TOTAL_W}" w:type="dxa"/><w:gridSpan w:val="3"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
            <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>${x(role)}</w:t></w:r></w:p>
          </w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:tcPr><w:tcW w:w="2436" w:type="dxa"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
            <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>
          </w:tc>
          <w:tc><w:tcPr><w:tcW w:w="4658" w:type="dxa"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
            <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>
          </w:tc>
          <w:tc><w:tcPr><w:tcW w:w="2652" w:type="dxa"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
            <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>
          </w:tc>
        </w:tr>`).join("")}
    </w:tbl>`;

    // ── MAIN DMF TABLE ROWS ──────────────────────────────────────────────────
    const dmfRows: string[] = [];

    // § 1.0 Executive Summary
    dmfRows.push(headingRow("1", "EXECUTIVE SUMMARY"));
    const s1Intro = [
      `Product name: ${f("s1", "1.1a")}`,
      f("s1", "1.1a1") ? `Brand: ${f("s1", "1.1a1")}` : "",
      f("s1", "1.1a2") ? `Model: ${f("s1", "1.1a2")}` : "",
      f("s1", "1.1b") ? `Intended use: ${f("s1", "1.1b")}` : "",
      f("s1", "1.1c") ? `Novel features: ${f("s1", "1.1c")}` : "",
      f("s1", "1.1e") ? `Risk class: ${f("s1", "1.1e")}` : "",
      f("s1", "1.1d") ? `Claimed shelf life: ${f("s1", "1.1d")}` : "",
    ].filter(Boolean).join("\n");
    dmfRows.push(dmfRow("1.1  Introductory descriptive information on the IVD medical device, intended use, risk Class, novel features (if any), claimed shelf life.", s1Intro));
    dmfRows.push(dmfRow("1.2  Regulatory status of the similar device in India.", f("s1", "1.2")));
    dmfRows.push(dmfRow("1.3  Domestic price of the IVD medical device.", f("s1", "1.3")));
    dmfRows.push(dmfRow("1.4  Marketing history of the IVD medical device.", f("s1", "1.4")));
    dmfRows.push(fullWidthRow("1.5  List of regulatory approvals or marketing clearance obtained.", f("s1", "1.5")));
    dmfRows.push(fullWidthRow("1.6  Status of pending request for market clearance.", f("s1", "1.6")));
    dmfRows.push(fullWidthRow("1.7(a)  Adverse events summary.", f("s1", "1.7a")));
    dmfRows.push(fullWidthRow("1.7(b)  Field Safety Corrective Action (FSCA).", f("s1", "1.7b")));
    dmfRows.push(dmfRow("1.7(b)(1)  Animal or human cells, tissues and/or derivatives.", f("s1", "1.7c")));
    dmfRows.push(dmfRow("1.7(b)(2)  Cells, tissues and/or derivatives of microbial recombinant origin.", f("s1", "1.7d")));
    dmfRows.push(spacerRow());

    // § 2.0 Description and Specification
    dmfRows.push(headingRow("2.0", "Description and Specification, Including Variants and Accessories"));
    dmfRows.push(dmfRow("2.1  Device Description — Intended Use / Indications for Use", f("s2", "2.0")));
    dmfRows.push(dmfRow("2.1(a)(1)  What is detected", f("s2", "2.1a")));
    dmfRows.push(dmfRow("2.1(a)(2)  Function (screening, monitoring, diagnostic)", f("s2", "2.1b")));
    dmfRows.push(dmfRow("2.1(a)(3)  Specific disorder, condition or risk factor", f("s2", "2.1c")));
    dmfRows.push(dmfRow("2.1(a)(4)  Automated or not", f("s2", "2.1d")));
    dmfRows.push(dmfRow("2.1(a)(5)  Qualitative or quantitative", f("s2", "2.1e")));
    dmfRows.push(dmfRow("2.1(a)(6)  Type of specimen required", f("s2", "2.1f")));
    dmfRows.push(dmfRow("2.1(a)(7)  Testing population", f("s2", "2.1g")));
    dmfRows.push(dmfRow("2.1(b)  Intended user (lay person or professional)", f("s2", "2.1h")));
    dmfRows.push(dmfRow("2.1(c)  Principle of the assay method", f("s2", "2.1i")));
    dmfRows.push(dmfRow("2.1(d)  Risk-based Class of the device", f("s2", "2.1_risk")));
    dmfRows.push(dmfRow("2.1(e)  Description of components (reagents, controls, calibrators)", f("s2", "2.1j")));
    dmfRows.push(dmfRow("2.1(f)  Specimen collection and transport materials", f("s2", "2.1k")));
    dmfRows.push(dmfRow("2.1(g)  For automated assays: assay characteristics / dedicated assays", f("s2", "2.1p")));
    dmfRows.push(dmfRow("2.1(h)  For automated assays: instrumentation characteristics", f("s2", "2.1l")));
    dmfRows.push(dmfRow("2.1(i)  Software to be used with the IVD medical device", f("s2", "2.1m")));
    dmfRows.push(dmfRow("2.1(j)  Configurations / variants", f("s2", "2.1n")));
    dmfRows.push(dmfRow("2.1(k)  Accessories intended to be used in combination", f("s2", "2.1o")));
    dmfRows.push(dmfRow("Reference to manufacturer's previous device generation(s) or similar devices", f("s2", "2.1s")));
    dmfRows.push(dmfRow("2.2  For a new IVD medical device: Clinical Performance", f("s2", "2.2")));
    dmfRows.push(dmfRow("2.3(i)  Adverse events on market", f("s2", "2.3")));
    dmfRows.push(dmfRow("2.3(ii)  External conformity certificates", f("s2", "2.5")));
    dmfRows.push(fullWidthRow("2.3(iii)  Comparative analysis / predicate device comparison", f("s2", "2.4")));
    dmfRows.push(spacerRow());

    // § 3.0 EP Checklist
    dmfRows.push(headingRow("3.0", "Essential Principles (EP) Checklist"));
    dmfRows.push(fullWidthRow("Essential Principles Checklist", f("s3", "3")));
    dmfRows.push(spacerRow());

    // § 4.0 Risk Analysis
    dmfRows.push(headingRow("4.0", "Risk Analysis and Control Summary"));
    dmfRows.push(fullWidthRow("4.0  Risk Management Report", f("s4", "4.upload")));
    dmfRows.push(dmfRow("4.0  Risk Management Summary", f("s4", "4.summary")));
    dmfRows.push(spacerRow());

    // § 5.0 Design and Manufacturing
    dmfRows.push(headingRow("5.0", "Design and Manufacturing Information"));
    dmfRows.push(fullWidthRow("5.1  Device Design", f("s5", "5.1")));
    dmfRows.push(fullWidthRow("5.2  Manufacturing Process", f("s5", "5.2")));
    dmfRows.push(fullWidthRow("5.3  QC Flow Chart", f("s5", "5.3")));
    dmfRows.push(fullWidthRow("5.4  Manufacturing Site", f("s5", "5.4")));
    dmfRows.push(spacerRow());

    // § 6.0 Validation
    dmfRows.push(headingRow("6.0", "Product Validation and Verification"));
    dmfRows.push(fullWidthRow("6.1  COA / Summary Information", f("s6", "6.1")));
    dmfRows.push(fullWidthRow("6.2  Detailed Information", f("s6", "6.2")));
    dmfRows.push(fullWidthRow("6.3  Validation Protocol", f("s6", "6.3")));
    dmfRows.push(fullWidthRow("6.4  Validation Results", f("s6", "6.4")));
    dmfRows.push(fullWidthRow("6.5  Validation Conclusion", f("s6", "6.5")));
    dmfRows.push(spacerRow());

    // § 7.0 Analytical Studies
    dmfRows.push(headingRow("7.0", "Analytical Studies"));
    dmfRows.push(dmfRow("7.0  Analytical Studies Overview", f("s7", "7")));
    dmfRows.push(fullWidthRow("7.A  Precision Table", f("s7", "7.1")));
    dmfRows.push(fullWidthRow("7.A  Between-Run Precision Table", f("s7", "7.1a")));
    dmfRows.push(fullWidthRow("7.B  Accuracy Table", f("s7", "7.2")));
    dmfRows.push(fullWidthRow("7.C  Linearity Table", f("s7", "7.3")));
    dmfRows.push(spacerRow());

    // § 8.0–18.0
    dmfRows.push(headingRow("8.0", "Specimen Type"));
    dmfRows.push(dmfRow("8.1  Specimen Type", f("s8", "8.1")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("9.0", "Analytical Performance Characteristics"));
    dmfRows.push(dmfRow("9.1  Accuracy of measurement", "Refer section 7.0 Analytical Studies (7.B Accuracy Table)"));
    dmfRows.push(dmfRow("9.2  Reproducibility", f("s9", "9.1")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("10.0", "Analytical Sensitivity"));
    dmfRows.push(dmfRow("10.0  Analytical Sensitivity Overview", f("s10_sensitivity", "10.0a")));
    dmfRows.push(fullWidthRow("10.1  Analytical Sensitivity Study Table", f("s10_sensitivity", "10.1")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("11.0", "Analytical Specificity"));
    dmfRows.push(dmfRow("11.0  Analytical Specificity Overview", f("s11_specificity", "11.0a")));
    dmfRows.push(fullWidthRow("11.1  Table: Analytical Specificity Study", f("s11_specificity", "11.1")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("12.0", "Metrological Traceability of Calibrator and Control Material Values"));
    dmfRows.push(fullWidthRow("12.0  Metrological Traceability Hierarchy", f("s12_traceability", "12.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("13.0", "Measuring Range of the Assay"));
    dmfRows.push(fullWidthRow("13.0  Table: Measuring Range", f("s13_measuring_range", "13.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("14.0", "Definition of Assay Cut-off"));
    dmfRows.push(fullWidthRow("14.0  Table: Assay Cut-off", f("s13_cutoff", "14.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("15.0", "Stability (Excluding Specimen Stability)"));
    dmfRows.push(dmfRow("15.0  Stability Studies Overview", f("s14_stability", "15.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("16.0", "Claimed Shelf Life"));
    dmfRows.push(dmfRow("16.0  Claimed Shelf Life Data", f("s16_shelf", "16.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("17.0", "In-Use Stability"));
    dmfRows.push(dmfRow("17.0  In-Use / On-Board Stability Data", f("s17_inuse", "17.0a")));
    dmfRows.push(spacerRow());

    dmfRows.push(headingRow("18.0", "Shipping Stability"));
    dmfRows.push(dmfRow("18.0  Shipping / Transport Stability Data", f("s18_shipping", "18.0a")));
    dmfRows.push(spacerRow());

    // § 19.0 Clinical Evidence
    dmfRows.push(headingRow("19.0", "Clinical Evidence"));
    dmfRows.push(dmfRow("19.0  Clinical Evidence", f("s19", "19")));
    dmfRows.push(spacerRow());

    // § 20.0 Labelling
    dmfRows.push(headingRow("20.0", "Labelling"));
    const lf = sections["s20"]?.fields || {};
    const labelContent = [
      lf["20.productName"] ? `Product Name: ${lf["20.productName"]}` : "",
      lf["20.packSize"] ? `Pack Size: ${lf["20.packSize"]}` : "",
      lf["20.batchNo"] ? `Batch No.: ${lf["20.batchNo"]}` : "",
      lf["20.deviceType"] ? `Device Type: ${lf["20.deviceType"]}` : "",
      lf["20.mfgDate"] ? `Mfg. Date: ${lf["20.mfgDate"]}` : "",
      lf["20.expDate"] ? `Exp. Date: ${lf["20.expDate"]}` : "",
      lf["20.storage"] ? `Storage: ${lf["20.storage"]}` : "",
      lf["20.mrp"] ? `MRP: ${lf["20.mrp"]}` : "",
      lf["20.manufacturer"] ? `Manufacturer: ${lf["20.manufacturer"]}` : "",
    ].filter(Boolean).join("\n");
    dmfRows.push(dmfRow("20.0  Labelling", labelContent || "Labels: (see attached label artwork)"));
    dmfRows.push(spacerRow());

    // § 21.0 Post-Market Surveillance
    dmfRows.push(headingRow("21.0", "Post Marketing Surveillance Data (Vigilance Reporting)"));
    dmfRows.push(dmfRow("21.0  Post Marketing Surveillance Data", f("s21", "21")));
    dmfRows.push(spacerRow());

    // § 22.0 IVD-Specific Information
    dmfRows.push(headingRow("22.0", "Information Required to be Submitted for the IVD Medical Device"));
    dmfRows.push(dmfRow("22.0  IVD-Specific Information", f("s22", "22")));

    // ── Assemble document.xml ────────────────────────────────────────────────
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
<w:body>

  <!-- Document Header -->
  ${headerPreText}
  ${docHeaderTable}

  <!-- Approvals -->
  ${approvalsTable.replace(/D9E1F2/g, "E0E0E0")}

  <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>

  <!-- Main DMF Table -->
  ${wrapInMainTable(dmfRows.join("\n"))}

  <!-- Required section end -->
  <w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="708" w:footer="708" w:gutter="0"/>
  </w:sectPr>

</w:body>
</w:document>`;

    // ── Assemble .docx via JSZip ─────────────────────────────────────────────
    const zip = new JSZip();

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
${logoBase64 ? `  <Default Extension="${logoExt}" ContentType="image/${logoExt}"/>` : ""}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`);

    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
${logoBase64 ? `  <Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${logoExt}"/>` : ""}
</Relationships>`);

    zip.file("word/document.xml", documentXml);
    if (logoBase64) {
      zip.file(`word/media/logo.${logoExt}`, logoBase64, { base64: true });
    }

    zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:ind w:left="360"/>
    </w:pPr>
  </w:style>
</w:styles>`);

    zip.file("word/numbering.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`);

    const docxBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const filename = `${docTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}_DMF.docx`;

    return new NextResponse(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("generate-dmf failed:", error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
