import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

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

/** Extract plain text from a DOCX XML fragment (reads <w:t> elements). */
function xmlToText(xml: string): string {
  const texts: string[] = [];
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) texts.push(m[1]);
  return texts.join("").trim();
}

/**
 * Split the content between <w:body> and </w:body> into top-level child
 * element strings using a depth-tracking scanner.
 * Handles <w:p>, <w:tbl>, <w:sdt>, <w:sectPr>, self-closing tags, and
 * XML comments without requiring an external XML parser.
 */
function extractBodyChildren(bodyContent: string): string[] {
  const children: string[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const len = bodyContent.length;

  while (i < len) {
    // Only care about '<' characters
    if (bodyContent[i] !== "<") { i++; continue; }

    // Skip XML / HTML comments
    if (bodyContent.slice(i, i + 4) === "<!--") {
      const end = bodyContent.indexOf("-->", i);
      i = end !== -1 ? end + 3 : i + 1;
      continue;
    }

    const tagEnd = bodyContent.indexOf(">", i);
    if (tagEnd === -1) break;

    const tag = bodyContent.slice(i, tagEnd + 1);
    const isClose = tag.startsWith("</");
    const isSelfClose = !isClose && tag.endsWith("/>"); // e.g. <w:bookmarkStart ... />

    if (!isClose && !isSelfClose) {
      // Opening tag
      if (depth === 0) start = i;
      depth++;
    } else if (isClose) {
      depth--;
      if (depth === 0) {
        const child = bodyContent.slice(start, tagEnd + 1).trim();
        if (child) children.push(child);
      }
    } else {
      // Self-closing at any depth — if at depth 0, treat as standalone child
      if (depth === 0) {
        const child = tag.trim();
        if (child) children.push(child);
      }
    }

    i = tagEnd + 1;
  }

  return children;
}

interface BodyChild {
  xml: string;
  isHeading1: boolean;
  isSectPr: boolean;
  title: string;
}

/**
 * Determine whether a paragraph XML is a top-level Heading 1 section split.
 *
 * A paragraph qualifies when ALL of the following are true:
 *  1. Its w:pStyle value is in the detected set of "outline level 0" style IDs
 *     OR it has an inline <w:outlineLvl w:val="0"/> in its own <w:pPr>
 *  2. Its ilvl (auto-number indent level) is 0 or absent, so numbered
 *     sub-headings like "11.1 Manufacturing Process" are NOT treated as splits
 */
function isTopLevelH1(xml: string, h1StyleIds: Set<string>): boolean {
  if (!xml.startsWith("<w:p")) return false;

  // Reject numbered sub-headings (ilvl ≥ 1)
  const ilvlMatch = xml.match(/<w:ilvl\s+w:val="(\d+)"/);
  if (ilvlMatch && parseInt(ilvlMatch[1], 10) >= 1) return false;

  // Check paragraph's own style name against the detected set
  const styleMatch = xml.match(/w:pStyle\s+w:val="([^"]+)"/);
  if (styleMatch && h1StyleIds.has(styleMatch[1])) return true;

  // Inline outline-level fallback: some tools write it directly in the paragraph
  if (/<w:outlineLvl\s+w:val="0"\s*\/?>/.test(xml)) return true;

  return false;
}

/**
 * Heuristic heading detector for documents that have no formal heading styles.
 *
 * A paragraph is treated as a section heading when it:
 *  - Contains text (non-empty)
 *  - Is short (≤ 120 characters) — long paragraphs are body text
 *  - Has ALL runs bold (<w:b/> or <w:b w:val="1"/>) — visual heading convention
 *  - Is not a list item (no <w:numPr>)
 *  - Does not have excessive indentation (not indented > 720 TWIPs / 0.5 inch)
 */
function isHeuristicHeading(xml: string): boolean {
  if (!xml.startsWith("<w:p")) return false;
  if (xml.includes("<w:numPr>")) return false;

  const indentM = xml.match(/<w:ind[^/]*w:left="(\d+)"/);
  if (indentM && parseInt(indentM[1], 10) > 720) return false;

  const text = xmlToText(xml);
  if (!text || text.length > 120) return false;

  // Bold can be set at paragraph level (pPr/rPr/b) or at run level (r/rPr/b).
  // Check paragraph-level rPr first — if bold is inherited by all runs from pPr,
  // individual runs may not repeat the <w:b/> element.
  const pPrM = xml.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/);
  const paraLevelBold = pPrM ? /<w:b(?:\s+w:val="(?:1|true)"|\s*\/)/.test(pPrM[0]) : false;

  const runs = [...xml.matchAll(/<w:r\b[^>]*?>([\s\S]*?)<\/w:r>/g)];
  if (runs.length === 0) return paraLevelBold; // no runs but para-level bold set
  const textRuns = runs.filter((r) => /<w:t[^>]*>[^\s]/.test(r[1]));
  if (textRuns.length === 0) return paraLevelBold;

  // A run explicitly unsets bold with <w:b w:val="0"/> or <w:b w:val="false"/>
  const runExplicitlyUnsetsBold = (runXml: string) =>
    /<w:b\s+w:val="(?:0|false)"/.test(runXml);

  // Count as bold if:
  //  - para-level bold AND no run explicitly unsets it, OR
  //  - every text run has its own <w:b/>
  if (paraLevelBold) {
    return textRuns.every((r) => !runExplicitlyUnsetsBold(r[1]));
  }
  return textRuns.every((r) => /<w:b(?:\s+w:val="(?:1|true)"|\s*\/)/.test(r[1]));
}

// ── Structural-heuristic helpers ─────────────────────────────────────────────

/**
 * Returns true when a body paragraph looks like a section number header.
 * Matches patterns like "1.6 Status of pending request..." or "3.0 ESSENTIAL".
 * Must NOT be a list item and must be ≤ 150 chars.
 */
function isNumberedSectionParagraph(xml: string): boolean {
  if (!xml.startsWith("<w:p")) return false;
  if (xml.includes("<w:numPr>")) return false;
  const text = xmlToText(xml).trim();
  if (!text || text.length > 150) return false;
  // Starts with  N  or  N.M  followed by whitespace + more text
  return /^\d+(\.\d+)?\s+\S/.test(text);
}


/**
 * Extract top-level <w:tc> cells from a row using depth tracking.
 * Same reason as extractTableRows: naive regex breaks on nested tables.
 */
function extractRowCells(rowXml: string): string[] {
  const cells: string[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const len = rowXml.length;

  while (i < len) {
    if (rowXml[i] !== "<") { i++; continue; }
    if (rowXml.slice(i, i + 4) === "<!--") {
      const end = rowXml.indexOf("-->", i);
      i = end !== -1 ? end + 3 : i + 1;
      continue;
    }
    const tagEnd = rowXml.indexOf(">", i);
    if (tagEnd === -1) break;
    const tag = rowXml.slice(i, tagEnd + 1);
    const isClose = tag.startsWith("</");
    const isSelfClose = !isClose && tag.endsWith("/>");
    const nameM = tag.match(/^<\/?(\w+:\w+)/);
    const name = nameM?.[1] ?? "";

    if (name === "w:tc") {
      if (!isClose && !isSelfClose) {
        if (depth === 0) start = i;
        depth++;
      } else if (isClose) {
        depth--;
        if (depth === 0) cells.push(rowXml.slice(start, tagEnd + 1));
      }
    }

    i = tagEnd + 1;
  }

  return cells;
}

/**
 * Returns true when a table row looks like a DATA TABLE header row
 * (i.e. the first cell contains "S. No", "S.No", "Sr. No", "No.", etc.)
 * Such tables contain tabular data, not section headings.
 */
function isDataTableHeaderRow(rowXml: string): boolean {
  const cells = extractRowCells(rowXml);
  if (cells.length === 0) return false;
  const c0 = xmlToText(cells[0]).trim().toLowerCase();
  return /^s\.?\s*r?\.?\s*no\.?$/.test(c0) || c0 === "no." || c0 === "no";
}

/**
 * Returns true when the row looks like a sub-table data column header.
 * Example: "Level | n | Mean | SD | %CV" or "Lot No. | Concentration | ..."
 * These appear as the SECOND row inside analyte sub-tables (after "2 Albumin" etc.)
 */
function isSubTableDataHeader(rowXml: string): boolean {
  const cells = extractRowCells(rowXml);
  if (cells.length < 3) return false; // Data headers have 3+ columns
  const c0 = xmlToText(cells[0]).trim();
  // First cell is alphabetic (e.g. "Level", "Lot No.", "Concentration") not a number
  return /^[a-zA-Z]/.test(c0) && !/^\d+(\.\d+)?$/.test(c0);
}

/**
 * Extract top-level <w:tr> rows from a table XML string using depth tracking
 * instead of a regex.  A naive regex like /<w:tr[\s\S]*?<\/w:tr>/ will
 * incorrectly match nested rows (from tables inside cells) because it stops
 * at the first </w:tr> it sees, producing broken partial-row XML.
 */
function extractTableRows(tableXml: string): string[] {
  const rows: string[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const len = tableXml.length;

  while (i < len) {
    if (tableXml[i] !== "<") { i++; continue; }
    if (tableXml.slice(i, i + 4) === "<!--") {
      const end = tableXml.indexOf("-->", i);
      i = end !== -1 ? end + 3 : i + 1;
      continue;
    }
    const tagEnd = tableXml.indexOf(">", i);
    if (tagEnd === -1) break;
    const tag = tableXml.slice(i, tagEnd + 1);
    const isClose = tag.startsWith("</");
    const isSelfClose = !isClose && tag.endsWith("/>");
    const nameM = tag.match(/^<\/?(\w+:\w+)/);
    const name = nameM?.[1] ?? "";

    if (name === "w:tr") {
      if (!isClose && !isSelfClose) {
        if (depth === 0) start = i;
        depth++;
      } else if (isClose) {
        depth--;
        if (depth === 0) rows.push(tableXml.slice(start, tagEnd + 1));
      }
      // self-closing <w:tr/> is a valid empty row
      if (isSelfClose && depth === 0) rows.push(tag);
    }

    i = tagEnd + 1;
  }

  return rows;
}

function splitTableAtSectionRows(tableXml: string): { sectionTitle: string | null; xml: string }[] {
  const rows = extractTableRows(tableXml);
  if (rows.length === 0) return [{ sectionTitle: null, xml: tableXml }];

  // Skip tables that are clearly data tables (first row has S.No header)
  if (rows.length > 0 && isDataTableHeaderRow(rows[0])) return [{ sectionTitle: null, xml: tableXml }];

  // Skip analyte sub-tables: first row = "N AnalyteName" (2 cells, short name),
  // second row = data column header like "Level | n | Mean | SD | %CV"
  if (rows.length >= 2 && isSubTableDataHeader(rows[1])) {
    return [{ sectionTitle: null, xml: tableXml }];
  }

  // Preserve table-level properties so each fragment is a valid table
  const tblPr = tableXml.match(/<w:tblPr\b[\s\S]*?<\/w:tblPr>/)?.[0] ?? "";
  const tblGrid = tableXml.match(/<w:tblGrid\b[\s\S]*?<\/w:tblGrid>/)?.[0] ?? "";
  const wrap = (rowsXml: string[]) => `<w:tbl>${tblPr}${tblGrid}${rowsXml.join("")}</w:tbl>`;

  const fragments: { sectionTitle: string | null; xml: string }[] = [];
  let curRows: string[] = [];
  let curTitle: string | null = null;

  for (const row of rows) {
    const cells = extractRowCells(row);

    // Only consider rows with 2–5 cells.
    // Wide rows (6+ cells) are analyte data rows, not section headings.
    if (cells.length >= 2 && cells.length <= 5) {
      const c0 = xmlToText(cells[0]).trim();
      const c1 = xmlToText(cells[1]).trim();

      // Cell 0 = bare section number: "1", "2", "3.0", "10.0" …
      // Cell 1 = section title with a length guard to avoid false positives:
      //   • Whole number in LARGE table (≥ 50 rows), title ends with ":" → ≥ 13 chars
      //     DMF structural sections often end with ":" ("Analytical Studies:",
      //     "Specimen type:", "Accuracy of measurement:") while analyte/item
      //     names never do ("Alkaline Phosphatase", "Bilirubin total", etc.)
      //   • Whole number in LARGE table, title does NOT end with ":" → ≥ 15 chars
      //     (guards against short analyte names like "Albumin" in stability tables;
      //      analyte sub-tables are also pre-filtered by isSubTableDataHeader)
      //   • Whole number in SMALL table (< 50 rows) → ≥ 9 chars
      //     (structural tables are small; short official section headers like
      //      "LABELLING" (9 chars) or "RISK ANALYSIS" must not be missed)
      //   • Decimal section number ("1.1", "5.2", "9.1") → ≥ 9 chars
      const isWholeNumber = /^\d+\.?0?\s*$/.test(c0);
      const isLargeTable = rows.length >= 50;
      const endsWithColon = c1.endsWith(":");
      const minTitleLen = isWholeNumber
        ? isLargeTable
          ? endsWithColon
            ? 13  // e.g. "Analytical Studies:" (19 chars)
            : 15  // guard against short analyte names in large data tables
          : 9     // small structural table: allow short section titles ("LABELLING" = 9 chars)
        : 9;      // decimal ("1.1", "5.2") can be short
      if (
        /^\d+(\.\d+)?\.?\s*$/.test(c0) &&   // \.? allows trailing dot: "6.", "20.", "22."
        c1.length >= minTitleLen &&
        c1.length <= 5000                     // allow long embedded-description cells
      ) {
        if (curRows.length > 0) fragments.push({ sectionTitle: curTitle, xml: wrap(curRows) });
        // Use first 120 chars of title so filenames stay reasonable
        curTitle = `${c0} ${c1.slice(0, 120)}`;
        curRows = [row];
        continue;
      }
    }
    curRows.push(row);
  }
  if (curRows.length > 0) fragments.push({ sectionTitle: curTitle, xml: wrap(curRows) });

  return fragments;
}

/**
 * Third-tier structural fallback used when neither heading styles nor the
 * bold-paragraph heuristic found any sections.
 *
 * Handles two common DMF anti-patterns:
 *  A. Body-level paragraphs that start with a section number
 *     e.g. "1.6 Status of pending request for market clearance"
 *  B. Tables whose rows begin with a section-number cell
 *     e.g.  | 3.0 | ESSENTIAL PRINCIPLES (EP) CHECKLIST |
 *           | 4.0 | RISK ANALYSIS AND CONTROL SUMMARY   |
 *
 * For case B, the table is split into sub-tables at each section-header row.
 * The TABLE FRAGMENT itself is marked as isHeading1 (no synthetic paragraph
 * is injected) so the output DOCX contains only original XML elements.
 */
function expandWithStructuralHeuristics(children: string[]): BodyChild[] {
  const expanded: BodyChild[] = [];

  for (const xml of children) {
    if (xml.startsWith("<w:sectPr")) {
      expanded.push({ xml, isHeading1: false, isSectPr: true, title: "" });
      continue;
    }

    if (xml.startsWith("<w:p")) {
      const boldH = isHeuristicHeading(xml);
      const numberedH = !boldH && isNumberedSectionParagraph(xml);
      const isH = boldH || numberedH;
      expanded.push({ xml, isHeading1: isH, isSectPr: false, title: isH ? xmlToText(xml) : "" });
      continue;
    }

    if (xml.startsWith("<w:tbl")) {
      const fragments = splitTableAtSectionRows(xml);
      if (fragments.length === 1 && !fragments[0].sectionTitle) {
        // No section boundaries found in this table — keep as-is
        expanded.push({ xml, isHeading1: false, isSectPr: false, title: "" });
      } else {
        for (const frag of fragments) {
          // Mark the TABLE FRAGMENT as the section boundary (isHeading1=true when
          // it has a title).  No synthetic <w:p> is injected — the output document
          // will contain only original-document XML elements.
          expanded.push({
            xml: frag.xml,
            isHeading1: !!frag.sectionTitle,
            isSectPr: false,
            title: frag.sectionTitle ?? "",
          });
        }
      }
      continue;
    }

    // Any other body element (sdt, etc.)
    expanded.push({ xml, isHeading1: false, isSectPr: false, title: "" });
  }

  return expanded;
}

/**
 * Post-process a classified child list so that decimal sub-sections (1.1, 5.2,
 * 9.1 …) are folded back into their parent top-level section instead of
 * generating a separate file each.
 *
 * Rules applied in order:
 *  1. Whole-number or X.0 title  →  top-level (new file)
 *  2. Bold paragraph BEFORE the first numbered section → top-level
 *  3. Bold paragraph AFTER a numbered section has started → fold as content
 *  4. Decimal X.Y (Y > 0) whose integer prefix matches the current top-level
 *     section → fold as content
 *  5. Decimal X.Y with a different integer prefix (orphan) → starts a new
 *     "group" file so its siblings are still consolidated (e.g. 6.1 + 6.2)
 */
function collapseSubSectionsIntoParents(children: BodyChild[]): BodyChild[] {
  function integerPrefix(title: string): number | null {
    const m = title.match(/^(\d+)[\s.]/);
    return m ? parseInt(m[1], 10) : null;
  }
  function isTopLevelTitle(title: string): boolean {
    // Plain integer with a space:   "1 Title", "21 Title"
    if (/^\d+\s/.test(title)) return true;
    // Integer + period + space:     "1. Title", "11. Title"  (CDSCO/ISO style)
    if (/^\d+\.\s/.test(title)) return true;
    // X.0 format:                   "3.0 Title", "11.0 Title"
    const m = title.match(/^(\d+)\.(\d+)\s/);
    if (!m) return false;
    return parseInt(m[2], 10) === 0;
  }

  const result: BodyChild[] = [];
  let seenNumbered = false;
  let currentTopLevelPrefix: number | null = null;

  for (const child of children) {
    if (!child.isHeading1) {
      result.push(child);
      continue;
    }

    const title = child.title;
    const hasNumPrefix = /^\d+[\s.]/.test(title);
    const topLevel = isTopLevelTitle(title);
    const intPfx = integerPrefix(title);

    if (!hasNumPrefix) {
      // Bold / non-numeric section marker
      // → top-level only when it precedes any numbered section
      if (!seenNumbered) {
        result.push(child);
      } else {
        result.push({ ...child, isHeading1: false });
      }
    } else if (topLevel) {
      seenNumbered = true;
      currentTopLevelPrefix = intPfx;
      result.push(child);
    } else {
      // Decimal sub-section X.Y  (Y > 0)
      seenNumbered = true;
      if (currentTopLevelPrefix !== null && intPfx === currentTopLevelPrefix) {
        // Sub-section of the current top-level → fold as content
        result.push({ ...child, isHeading1: false });
      } else {
        // Orphaned decimal (parent section "N" was never explicitly detected).
        // Make this decimal the "group leader" so its siblings consolidate here.
        currentTopLevelPrefix = intPfx;
        result.push(child);
      }
    }
  }

  return result;
}

function classifyChildren(children: string[], h1StyleIds: Set<string>): BodyChild[] {
  // Tier 1: formal heading-style detection
  const styleClassified = children.map((xml) => ({
    xml,
    isHeading1: isTopLevelH1(xml, h1StyleIds),
    isSectPr: xml.startsWith("<w:sectPr"),
    title: "",
  }));

  if (styleClassified.some((c) => c.isHeading1)) {
    const withTitles = styleClassified.map((c) => ({
      ...c,
      title: c.isHeading1 ? xmlToText(c.xml) : "",
    }));
    return collapseSubSectionsIntoParents(withTitles);
  }

  // Tier 2: bold short paragraph heuristic
  console.log("[disintegrate] No heading styles — trying bold-paragraph heuristic");
  const boldClassified = children.map((xml) => {
    const heading1 = isHeuristicHeading(xml);
    return { xml, isHeading1: heading1, isSectPr: xml.startsWith("<w:sectPr"), title: heading1 ? xmlToText(xml) : "" };
  });

  // If bold heuristic finds a reasonable number of sections, use it
  const boldCount = boldClassified.filter((c) => c.isHeading1).length;
  if (boldCount >= 3) return collapseSubSectionsIntoParents(boldClassified);

  // Tier 3: structural heuristics — numbered paragraphs + table-row section headers
  console.log("[disintegrate] Bold heuristic insufficient — trying structural section-number detection");
  return collapseSubSectionsIntoParents(expandWithStructuralHeuristics(children));
}

interface Section {
  index: number;
  title: string;
  children: BodyChild[];
}

function groupIntoSections(classified: BodyChild[], preambleChildren: BodyChild[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const child of classified) {
    if (child.isSectPr) continue; // handled separately

    if (child.isHeading1) {
      if (current) sections.push(current);
      current = { index: sections.length + 1, title: child.title, children: [child] };
    } else if (current) {
      current.children.push(child);
    }
    // content before the first Heading 1 is collected as a preamble section (see below)
  }
  if (current) sections.push(current);

  // If the document has a non-trivial preamble (cover page, TOC, etc.) add it as
  // section 00 so no content is silently dropped.
  if (preambleChildren.length > 0) {
    // Re-index existing sections
    sections.forEach((s) => s.index++);
    sections.unshift({ index: 1, title: "Preamble", children: preambleChildren });
  }

  return sections;
}

/**
 * Detect every style ID that represents "Heading 1 level" in this document.
 *
 * Returns a Set so callers can do O(1) lookup.  Detection uses three signals,
 * all applied together so that any document format is covered:
 *
 *  A. <w:outlineLvl w:val="0"/> in the style's own definition
 *     → the most reliable signal; Word, LibreOffice, Google Docs all write it
 *  B. <w:name w:val="heading 1"/> in the style definition
 *     → Word always uses the English canonical name internally even for
 *       localised UI labels ("Título 1", "Überschrift 1", etc.)
 *  C. basedOn chain that leads to any style already matched by A or B
 *     → catches custom styles that inherit from the built-in Heading 1
 *
 * The set always contains "Heading1" as a safe baseline.
 */
async function detectHeading1StyleIds(docxZip: JSZip): Promise<Set<string>> {
  const ids = new Set<string>(["Heading1"]);

  const stylesFile = docxZip.file("word/styles.xml");
  if (!stylesFile) return ids;

  const stylesXml = await stylesFile.async("string");

  interface StyleInfo { name: string; basedOn: string; outlineLvl: number }
  const styleMap = new Map<string, StyleInfo>();

  const styleRe = /<w:style\b[^>]*?w:styleId="([^"]+)"[^>]*?>([\s\S]*?)<\/w:style>/g;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(stylesXml)) !== null) {
    const styleId = m[1];
    const block = m[2];
    const nameM = block.match(/<w:name\s+w:val="([^"]+)"/);
    const basedM = block.match(/<w:basedOn\s+w:val="([^"]+)"/);
    const lvlM = block.match(/<w:outlineLvl\s+w:val="(\d+)"/);
    styleMap.set(styleId, {
      name: nameM ? nameM[1].toLowerCase() : "",
      basedOn: basedM ? basedM[1] : "",
      outlineLvl: lvlM ? parseInt(lvlM[1], 10) : -1,
    });
    // Signal A + B — direct detection
    if (lvlM?.[ 1] === "0" || (nameM && nameM[1].toLowerCase() === "heading 1")) {
      ids.add(styleId);
    }
  }

  // Signal C — basedOn chain
  function derivesFromKnown(styleId: string, visited = new Set<string>()): boolean {
    if (ids.has(styleId)) return true;
    if (visited.has(styleId)) return false;
    visited.add(styleId);
    const s = styleMap.get(styleId);
    return s?.basedOn ? derivesFromKnown(s.basedOn, visited) : false;
  }
  for (const [id] of styleMap) {
    if (derivesFromKnown(id)) ids.add(id);
  }

  console.log(`[disintegrate] Heading-1 style IDs detected: ${[...ids].join(", ")}`);
  return ids;
}

/**
 * Build a complete DOCX buffer for a single section by:
 *  1. Copying every file from the original ZIP except word/document.xml
 *  2. Replacing word/document.xml with a version that has only this section's body children
 */
async function buildSectionDocx(
  originalZip: JSZip,
  documentXml: string,
  section: Section,
  sectPrXml: string,
): Promise<Uint8Array> {
  const zip = new JSZip();

  // Copy all original files verbatim (styles, fonts, media, relationships, etc.)
  for (const [filePath, file] of Object.entries(originalZip.files)) {
    if (filePath === "word/document.xml") continue;
    if (file.dir) {
      zip.folder(filePath);
      continue;
    }
    const content = await file.async("uint8array");
    zip.file(filePath, content);
  }

  // Build the new document.xml
  // Preserve everything before <w:body> (XML declaration, namespaces, document element)
  const bodyOpen = documentXml.indexOf("<w:body>");
  const bodyClose = documentXml.lastIndexOf("</w:body>");
  const docHeader = documentXml.slice(0, bodyOpen + "<w:body>".length);
  const docFooter = documentXml.slice(bodyClose); // "</w:body></w:document>"

  // Strip inline section-break paragraphs (<w:p> elements whose only purpose is to
  // carry a <w:sectPr> for multi-section header/footer formatting in the original
  // document). In a standalone section file they act as rogue page breaks.
  const sectionBody = section.children
    .map((c) => {
      if (c.xml.startsWith("<w:p") && c.xml.includes("<w:sectPr")) {
        const text = xmlToText(c.xml);
        if (!text) return null; // empty section-break marker → drop entirely
        // Has real text: keep paragraph but strip the embedded <w:sectPr>
        return c.xml.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, "");
      }
      return c.xml;
    })
    .filter(Boolean)
    .join("\n");
  const newDocXml = `${docHeader}\n${sectionBody}\n${sectPrXml}\n${docFooter}`;

  zip.file("word/document.xml", newDocXml);

  const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return buf;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Load DOCX as ZIP ─────────────────────────────────────────────────────
    const originalZip = await JSZip.loadAsync(buffer);

    const docXmlFile = originalZip.file("word/document.xml");
    if (!docXmlFile)
      return NextResponse.json({ error: "Invalid DOCX: word/document.xml not found" }, { status: 400 });

    const documentXml = await docXmlFile.async("string");

    // ── Extract body children ────────────────────────────────────────────────
    const bodyStart = documentXml.indexOf("<w:body>") + "<w:body>".length;
    const bodyEnd = documentXml.lastIndexOf("</w:body>");
    if (bodyStart < 8 || bodyEnd === -1)
      return NextResponse.json({ error: "Could not locate document body" }, { status: 422 });

    const bodyContent = documentXml.slice(bodyStart, bodyEnd);
    const rawChildren = extractBodyChildren(bodyContent);

    // ── Detect heading style IDs ─────────────────────────────────────────────
    const h1StyleIds = await detectHeading1StyleIds(originalZip);

    // Diagnostic: log every unique pStyle value present in the document body
    // so we can see what styles the headings actually use when detection fails.
    const allPStyles = new Map<string, number>();
    const allOutlineLvls: string[] = [];
    for (const c of rawChildren) {
      const styleM = c.match(/w:pStyle\s+w:val="([^"]+)"/);
      if (styleM) allPStyles.set(styleM[1], (allPStyles.get(styleM[1]) ?? 0) + 1);
      const lvlM = c.match(/<w:outlineLvl\s+w:val="(\d+)"/);
      if (lvlM) allOutlineLvls.push(`${styleM?.[1] ?? "?"}=lvl${lvlM[1]}`);
    }
    console.log(
      `[disintegrate] Para styles in doc:`,
      [...allPStyles.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k}(${v})`).join(", "),
    );
    if (allOutlineLvls.length) console.log(`[disintegrate] Inline outlineLvl:`, allOutlineLvls.join(", "));

    const classified = classifyChildren(rawChildren, h1StyleIds);

    // Preserve section properties (page size, margins) for each output doc
    const sectPrChild = classified.find((c) => c.isSectPr);
    const sectPrXml = sectPrChild?.xml ?? "<w:sectPr/>";

    // Collect preamble (content before the first Heading 1): cover page, TOC, etc.
    // Only include it if it contains real text (not just bookmarks / empty paragraphs).
    const firstH1Idx = classified.findIndex((c) => c.isHeading1);
    const preambleChildren =
      firstH1Idx > 0
        ? classified
            .slice(0, firstH1Idx)
            .filter((c) => !c.isSectPr && xmlToText(c.xml).length > 0)
        : [];

    // ── Group into sections ───────────────────────────────────────────────────
    const sections = groupIntoSections(classified, preambleChildren);

    if (sections.length === 0)
      return NextResponse.json(
        {
          error:
            `No sections detected. Styles found in document: ${[...allPStyles.keys()].join(", ")}. ` +
            `Neither Word "Heading 1" styles nor bold short-paragraph heuristics found any headings. ` +
            `Open the document in Word and apply "Heading 1" style to each main section title.`,
        },
        { status: 422 },
      );

    console.log(`[disintegrate] "${file.name}" — h1 styles=[${[...h1StyleIds].join(",")}], ${sections.length} sections`);

    // ── Build output ZIP ──────────────────────────────────────────────────────
    const outputZip = new JSZip();

    // Manifest
    const manifest = [
      "DMF DISINTEGRATED SECTIONS",
      "===========================",
      `Source file : ${file.name}`,
      `Sections    : ${sections.length}`,
      `Style used  : Heading 1 (${[...h1StyleIds].join(", ")})`,
      `Generated   : ${new Date().toISOString()}`,
      "",
      ...sections.map((s) => `  ${String(s.index).padStart(2, "0")}. ${s.title}`),
    ].join("\n");

    outputZip.file("00_MANIFEST.txt", manifest);

    // One proper .docx per section
    for (const section of sections) {
      const num = String(section.index).padStart(2, "0");
      const safeName = sanitizeFilename(section.title);
      const filename = `Section_${num}_${safeName}.docx`;

      console.log(`[disintegrate]   Building ${filename} (${section.children.length} elements)`);
      const docxBuf = await buildSectionDocx(originalZip, documentXml, section, sectPrXml);
      outputZip.file(filename, docxBuf);
    }

    const zipBuf = await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 4 } });

    const baseName = sanitizeFilename(file.name.replace(/\.docx$/i, ""));
    const zipFilename = `${baseName}_Disintegrated.zip`;

    const titlesHeader = sections
      .map((s) => encodeURIComponent(`${String(s.index).padStart(2, "0")}. ${s.title}`))
      .join("|||");

    return new NextResponse(zipBuf.buffer as ArrayBuffer, {
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
    return NextResponse.json({ error: "Failed to process document. Ensure the file is a valid .docx." }, { status: 500 });
  }
}
