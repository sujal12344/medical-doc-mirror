import { NextResponse } from "next/server";
import JSZip from "jszip";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { FRAMEWORKS } from "@/lib/frameworks";

// ─── OOXML Helpers ────────────────────────────────────────────────────────────

function x(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function run(text: string, bold = false, sz = 18): string {
  const b = bold ? "<w:b/><w:bCs/>" : "";
  return `<w:r><w:rPr>${b}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
}

function para(content: string, spacing = 80): string {
  return `<w:p><w:pPr><w:spacing w:after="${spacing}"/></w:pPr>${content}</w:p>`;
}

function mdToWordXml(md: string): string {
  if (!md) return para(run(""));

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

  md = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code: string) => {
    return code.trim();
  });

  const lines = md.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

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

    if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i + 1]?.trim().match(/^\|[\s|:-]+\|/)) {
      const headerCells = line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        bodyRows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
        i++;
      }

      const cols = headerCells.length;
      const colWidth = Math.floor(8640 / cols);
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

    if (line.trim() === "") {
      result.push(`<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>`);
      i++;
      continue;
    }

    result.push(`<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${inlineRuns(line)}</w:p>`);
    i++;
  }

  return result.join("\n") || para(run(""));
}

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

const COL_LABEL = 3700;
const COL_CONTENT = 6046;
const TOTAL_W = COL_LABEL + COL_CONTENT;

const BORDER = `<w:top w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:left w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="999999"/>
  <w:right w:val="single" w:sz="6" w:space="0" w:color="999999"/>`;

function tc(width: number, content: string, fill = "FFFFFF"): string {
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

// ─── Route Handler ────────────────────────────────────────────────────────────

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

    const productName = (product?.name as string) || f("s1", "1.1") || "N/A";
    const docTitle = doc.title || `PMF - ${productName}`;

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
      
      <!-- Row 1: Logo Placeholder & Address -->
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="666666"/></w:rPr><w:t>INDO-MIM</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="999999"/></w:rPr><w:t>COMPLEXITY SIMPLIFIED</w:t></w:r></w:p>
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
          <w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>DOCUMENT NAME: </w:t></w:r><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">PLANT MASTER FILE FOR ${x(productName.toUpperCase())}</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5846" w:type="dxa"/><w:gridSpan w:val="2"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>
          <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>DOCUMENT NO.: MK/QA/PMF/058</w:t></w:r></w:p>
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
        <w:tc><w:tcPr><w:tcW w:w="${TOTAL_W}" w:type="dxa"/><w:gridSpan w:val="3"/><w:shd w:val="clear" w:color="auto" w:fill="E0E0E0"/><w:tcBorders>${BORDER}</w:tcBorders></w:tcPr>
          <w:p><w:pPr><w:spacing w:after="60"/></w:pPr>
            <w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/></w:rPr><w:t>APPROVALS:</w:t></w:r>
          </w:p>
        </w:tc>
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

    // ── DYNAMIC PMF TABLE ROWS ────────────────────────────────────────────────
    const pmfRows: string[] = [];

    for (const sec of fw.sections) {
      // Add section heading
      const cleanHeadingNum = sec.title.split(" ")[0] || "";
      const cleanHeadingTitle = sec.title.replace(/^\d+(\.\d+)?\s+/, "");
      pmfRows.push(headingRow(cleanHeadingNum, cleanHeadingTitle));

      for (const field of sec.fields) {
        const val = f(sec.id, field.id);
        const labelText = `${field.id}  ${field.label}`;
        
        // Render as full-width row if it contains list indicators, table columns, or code blocks
        const isFullWidth = field.textarea || val.includes("|") || val.includes("-->") || val.includes("\n-") || val.includes("\n*");
        if (isFullWidth) {
          pmfRows.push(fullWidthRow(labelText, val));
        } else {
          pmfRows.push(dmfRow(labelText, val));
        }
      }
      pmfRows.push(spacerRow());
    }

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
  ${approvalsTable}

  <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>

  <!-- Main PMF Table -->
  ${wrapInMainTable(pmfRows.join("\n"))}

  <w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="708" w:footer="708" w:gutter="0"/>
  </w:sectPr>

</w:body>
</w:document>`;

    const zip = new JSZip();

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
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
</Relationships>`);

    zip.file("word/document.xml", documentXml);

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
    const filename = `${docTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}_PMF.docx`;

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
    console.error("generate-pmf failed:", error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
