export type ParsedLine =
  | { kind: "table"; aspect: string; subject: string; predicate: string; note: string }
  | { kind: "kv"; key: string; value: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

export type ParsedBlock = {
  title: string;
  lines: ParsedLine[];
};

const BLOCK_HEADERS = [
  "SUBJECT DEVICE",
  "PREDICATE DEVICE",
  "SIDE-BY-SIDE COMPARISON",
  "SIMILARITIES",
  "DIFFERENCES",
  "SUBSTANTIAL EQUIVALENCE",
  "CONCLUSION",
] as const;

export function isStructuredRegulatoryContent(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (BLOCK_HEADERS.some((h) => t.includes(h))) return true;
  const pipeRows = t.split("\n").filter((l) => l.includes(" | ") && l.split(" | ").length >= 3);
  return pipeRows.length >= 2;
}

export function parseStructuredRegulatoryContent(value: string): ParsedBlock[] {
  const text = value.trim();
  if (!text) return [];

  const blocks: ParsedBlock[] = [];
  let currentTitle = "Overview";
  let currentLines: ParsedLine[] = [];

  const flush = () => {
    if (currentLines.length > 0) {
      blocks.push({ title: currentTitle, lines: [...currentLines] });
      currentLines = [];
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = BLOCK_HEADERS.find((h) => line.startsWith(h));
    if (header) {
      flush();
      currentTitle = line;
      continue;
    }

    if (line.startsWith("• ") || line.startsWith("- ")) {
      currentLines.push({ kind: "bullet", text: line.replace(/^[•-]\s+/, "") });
      continue;
    }

    const tableRow = parseComparisonTableRow(line);
    if (tableRow) {
      currentLines.push(tableRow);
      continue;
    }

    const kv = line.match(/^([^:]+):\s*(.+)$/);
    if (kv && kv[1].length < 60) {
      currentLines.push({ kind: "kv", key: kv[1].trim(), value: kv[2].trim() });
      continue;
    }

    currentLines.push({ kind: "text", text: line });
  }

  flush();
  return blocks.length > 0 ? blocks : [{ title: "Content", lines: [{ kind: "text", text: value }] }];
}

function parseComparisonTableRow(line: string): ParsedLine | null {
  if (!line.includes(" | ")) return null;
  const parts = line.split(" | ").map((p) => p.trim());
  if (parts.length < 3) return null;
  return {
    kind: "table",
    aspect: parts[0],
    subject: stripCellLabel(parts[1], "Subject"),
    predicate: stripCellLabel(parts[2], "Predicate"),
    note: parts[3] ?? "",
  };
}

function stripCellLabel(part: string, label: string): string {
  const re = new RegExp(`^${label}(\\s*\\([^)]*\\))?\\s*:\\s*`, "i");
  return part.replace(re, "").trim() || part;
}
