"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidChart } from "./MermaidChart";

type Props = {
  fieldId: string;
  label: string;
  hint: string;
  textarea?: boolean;
  value: string;
  onChange: (value: string) => void;
  allowUpload?: boolean;
  documentId?: string;
};

export function RegulatoryFieldEditor({ fieldId, label, hint, textarea, value, onChange, allowUpload, documentId }: Props) {
  const [view, setView] = useState<"structured" | "edit">("structured");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");

  const formatObjectToMarkdown = (obj: any, level = 0): string => {
    if (obj === null || obj === undefined) return "";
    if (typeof obj !== "object") return String(obj);
    if (Array.isArray(obj)) {
      return obj.map((item) => {
        if (typeof item === "object" && item !== null) {
          return formatObjectToMarkdown(item, level);
        }
        return `- ${item}`;
      }).join("\n");
    }
    return Object.entries(obj).map(([key, val]) => {
      const headingPrefix = "#".repeat(Math.min(6, level + 2));
      if (typeof val === "object" && val !== null) {
        return `${headingPrefix} ${key}\n${formatObjectToMarkdown(val, level + 1)}`;
      }
      return `**${key}**: ${val}`;
    }).join("\n\n");
  };

  const safeValue = typeof value === "string" 
    ? (value === "[object Object]" ? "" : value) 
    : formatObjectToMarkdown(value);
  const hasContent = safeValue.trim().length > 0;

  const handleFieldFileUpload = async (files: FileList | File[]) => {
    if (!documentId || !files.length) return;
    setUploading(true);
    setUploadError("");
    setFileName(Array.from(files).map((f) => f.name).join(", "));

    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("file", file);
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/fields/${fieldId}/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onChange(data.value);
        setView("edit");
      } else {
        setUploadError(data.error || "Failed to process the uploaded file.");
      }
    } catch {
      setUploadError("Network error: failed to connect to upload service.");
    } finally {
      setUploading(false);
    }
  };
  const filled = safeValue.trim().length > 0;
  const showStructured = hasContent && view === "structured";

  const rows = textarea ? Math.min(24, Math.max(5, safeValue.split("\n").length + 1)) : undefined;

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
        <div className="flex gap-2">
          {filled && (
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([value], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${label.replace(/\s+/g, "_")}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-surface2 hover:text-foreground transition shadow-sm"
            >
              Download
            </button>
          )}
          {hasContent ? (
            <div className="flex rounded-lg border border-border p-0.5 text-[10px] font-medium shrink-0">
              <button
                type="button"
                onClick={() => setView("structured")}
                className={`rounded-md px-2.5 py-1 transition ${view === "structured" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
              >
                Preview
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
      </div>

      <div className="p-4">
        {showStructured ? (
          <div className="rounded-lg border border-border bg-surface2/50 p-4 overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-2.5 text-foreground" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-3 mb-1.5 text-foreground" {...props} />,
                p: ({ node, ...props }) => <p className="text-xs text-foreground leading-relaxed mb-3 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-xs text-foreground" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-xs text-foreground" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-4 border border-border rounded-lg">
                    <table className="w-full text-left text-xs" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-surface2" {...props} />,
                th: ({ node, ...props }) => <th className="px-3 py-2 font-semibold text-foreground border-b border-border/60" {...props} />,
                td: ({ node, ...props }) => <td className="px-3 py-2 text-foreground border-b border-border/60 align-top" {...props} />,
                tr: ({ node, ...props }) => <tr className="last:border-0" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-muted" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-4 border-border/50" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const match = /language-mermaid/.exec(className || "");
                  if (match) {
                    return <MermaidChart chartCode={String(children).replace(/\n$/, "")} />;
                  }
                  return <code className={className} {...props}>{children}</code>;
                }
              }}
            >
              {safeValue}
            </ReactMarkdown>
          </div>
        ) : textarea ? (
          <textarea
            rows={rows}
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-y min-h-[120px]"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        ) : (
          <input
            type="text"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        )}

        {allowUpload && documentId && (
          <div className="mt-3 rounded-lg border border-dashed border-border bg-surface2/30 hover:border-accent/40 p-4 transition-all flex flex-col items-center justify-center text-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className={`w-4 h-4 text-accent ${uploading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {uploading ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                )}
              </svg>
              {uploading ? (
                <span className="text-foreground font-semibold">Generating table from study report...</span>
              ) : fileName ? (
                <span>Uploaded: <strong className="text-foreground">{fileName}</strong></span>
              ) : (
                <span>Need to populate this table? Upload validation report, risk management, or stability raw data (.docx, .pdf)</span>
              )}
            </div>
            {!uploading && (
              <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 border border-border hover:bg-surface2 text-[11px] font-semibold text-foreground rounded-lg transition shadow-sm mt-1">
                Upload Files (.docx, .pdf)
                <input
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFieldFileUpload(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
