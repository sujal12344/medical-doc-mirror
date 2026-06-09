"use client";

import { useMemo, useState } from "react";
import {
  isStructuredRegulatoryContent,
  parseStructuredRegulatoryContent,
  type ParsedBlock,
  type ParsedLine,
} from "@/lib/structuredFieldContent";

type Props = {
  fieldId: string;
  label: string;
  hint: string;
  textarea?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export function RegulatoryFieldEditor({ fieldId, label, hint, textarea, value, onChange }: Props) {
  const structured = useMemo(
    () => (value.trim() && isStructuredRegulatoryContent(value) ? parseStructuredRegulatoryContent(value) : null),
    [value],
  );
  const [view, setView] = useState<"structured" | "edit">("structured");
  const filled = value.trim().length > 0;
  const showStructured = structured && structured.length > 0 && view === "structured";

  const rows = textarea ? Math.min(24, Math.max(5, value.split("\n").length + 1)) : undefined;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-surface2/80 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted border border-border">
              {fieldId}
            </span>
            {filled ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                Filled
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-400">
                Empty
              </span>
            )}
          </div>
          {hint ? <p className="mt-1 text-xs text-muted leading-relaxed">{hint}</p> : null}
        </div>
        {structured ? (
          <div className="flex rounded-lg border border-border p-0.5 text-[10px] font-medium shrink-0">
            <button
              type="button"
              onClick={() => setView("structured")}
              className={`rounded-md px-2.5 py-1 transition ${view === "structured" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              Structured
            </button>
            <button
              type="button"
              onClick={() => setView("edit")}
              className={`rounded-md px-2.5 py-1 transition ${view === "edit" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              Edit text
            </button>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {showStructured ? (
          <StructuredBlocksView blocks={structured} />
        ) : textarea ? (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-y min-h-[120px]"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        )}
      </div>
    </div>
  );
}

function StructuredBlocksView({ blocks }: { blocks: ParsedBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <section key={`${block.title}-${i}`} className="rounded-lg border border-border bg-surface2/50 overflow-hidden">
          <header className="border-b border-border bg-surface2 px-3 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {block.title}
            </h4>
          </header>
          <div className="p-3 space-y-3">
            {block.lines.some((l) => l.kind === "table") ? (
              <ComparisonTable lines={block.lines.filter((l) => l.kind === "table")} />
            ) : null}
            <NonTableLines lines={block.lines.filter((l) => l.kind !== "table")} />
          </div>
        </section>
      ))}
    </div>
  );
}

function ComparisonTable({ lines }: { lines: Extract<ParsedLine, { kind: "table" }>[] }) {
  if (!lines.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface2">
            <th className="px-3 py-2 font-semibold text-muted">Aspect</th>
            <th className="px-3 py-2 font-semibold text-foreground">Subject (your product)</th>
            <th className="px-3 py-2 font-semibold text-foreground">Predicate (CDSCO)</th>
            <th className="px-3 py-2 font-semibold text-muted">Assessment</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 align-top">
              <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{row.aspect}</td>
              <td className="px-3 py-2.5 text-foreground leading-relaxed">{row.subject || "—"}</td>
              <td className="px-3 py-2.5 text-foreground leading-relaxed">{row.predicate || "—"}</td>
              <td className="px-3 py-2.5 text-muted">{row.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NonTableLines({ lines }: { lines: ParsedLine[] }) {
  const groups: ParsedLine[][] = [];
  let bulletRun: ParsedLine[] = [];

  const flushBullets = () => {
    if (bulletRun.length) {
      groups.push(bulletRun);
      bulletRun = [];
    }
  };

  for (const line of lines) {
    if (line.kind === "bullet") {
      bulletRun.push(line);
    } else {
      flushBullets();
      groups.push([line]);
    }
  }
  flushBullets();

  return (
    <>
      {groups.map((group, i) =>
        group[0]?.kind === "bullet" ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {group.map((line, j) => (
              <li key={j} className="text-xs text-foreground leading-relaxed">
                {(line as Extract<ParsedLine, { kind: "bullet" }>).text}
              </li>
            ))}
          </ul>
        ) : (
          <LineView key={i} line={group[0]} />
        ),
      )}
    </>
  );
}

function LineView({ line }: { line: ParsedLine }) {
  if (line.kind === "kv") {
    return (
      <dl className="grid gap-1 sm:grid-cols-[minmax(7rem,10rem)_1fr] text-xs">
        <dt className="font-medium text-muted">{line.key}</dt>
        <dd className="text-foreground leading-relaxed">{line.value}</dd>
      </dl>
    );
  }
  if (line.kind === "text") {
    return <p className="text-xs text-foreground leading-relaxed">{line.text}</p>;
  }
  return null;
}
