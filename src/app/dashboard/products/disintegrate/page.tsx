"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type SectionItem = { index: number; title: string };
type ResultState = {
  sourceFile: string;
  zipFilename: string;
  sections: SectionItem[];
};

export default function DisintegratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ─────────────────────────────────────────────────────────
  function pickFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setError("Only .docx files are supported. Please upload a Word document.");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  }

  // ── Disintegrate → download ZIP ────────────────────────────────────────────
  async function handleDisintegrate() {
    if (!file) return;
    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/products/disintegrate", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || "Processing failed");
      }

      // Read section metadata from custom headers BEFORE consuming the body
      const sectionCount = Number(res.headers.get("X-Section-Count") || "0");
      const rawTitles = res.headers.get("X-Section-Titles") || "";
      const sections: SectionItem[] = rawTitles
        ? rawTitles.split("|||").map((t, i) => ({
            index: i + 1,
            title: decodeURIComponent(t).replace(/^\d+\.\s*/, ""),
          }))
        : Array.from({ length: sectionCount }, (_, i) => ({
            index: i + 1,
            title: `Section ${i + 1}`,
          }));

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const zipFilename = `${file.name.replace(/\.docx$/i, "")}_Disintegrated.zip`;
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setResult({ sourceFile: file.name, zipFilename, sections });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <Link
        href="/dashboard/products"
        className="text-sm text-muted hover:text-foreground transition mb-5 inline-block"
      >
        ← Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">DMF Disintegrator</h1>
        <p className="text-sm text-muted leading-relaxed">
          Upload a Device Master File (.docx) to automatically split it by its main section
          headings. Each section is saved as an individual HTML file and packaged into a ZIP archive.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) pickFile(f);
        }}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
          ${dragOver ? "border-accent bg-accent/5" : file ? "border-accent/40 bg-surface" : "border-border bg-surface hover:border-accent/50 hover:bg-surface2/50"}
          ${file ? "cursor-default" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) pickFile(e.target.files[0]);
            e.target.value = "";
          }}
        />

        {!file ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl mb-4">
              📄
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Drop your DMF .docx file here
            </p>
            <p className="text-xs text-muted">
              or <span className="text-accent underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-[10px] text-muted mt-3 opacity-70">
              Supports Word documents (.docx) using Heading 1 styles for section titles
            </p>
          </div>
        ) : (
          /* File selected */
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">
              📝
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {(file.size / 1024).toFixed(1)} KB · Word Document
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(""); }}
              className="text-xs text-muted hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-surface2"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Action button */}
      {file && !result && (
        <button
          type="button"
          onClick={handleDisintegrate}
          disabled={processing}
          className="mt-5 w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition"
        >
          {processing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Splitting sections &amp; building ZIP…
            </>
          ) : (
            <>
              <span className="text-base">⚡</span>
              Disintegrate &amp; Download ZIP
            </>
          )}
        </button>
      )}

      {/* Success result */}
      {result && (
        <div className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden">
          {/* Result header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/5 border-b border-emerald-500/10">
            <span className="text-xl">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                ZIP downloaded — {result.sections.length} section{result.sections.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted truncate mt-0.5">{result.zipFilename}</p>
            </div>
            <button
              type="button"
              onClick={handleDisintegrate}
              className="text-xs text-accent border border-accent/30 hover:bg-accent/5 transition px-3 py-1.5 rounded-lg font-medium shrink-0"
            >
              Re-download
            </button>
          </div>

          {/* Section list */}
          <div className="divide-y divide-border">
            {result.sections.map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="w-6 h-6 rounded-md bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {String(s.index).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted mt-0.5">
                    Section_{String(s.index).padStart(2, "0")}_{s.title.replace(/\s+/g, "_").slice(0, 40)}.docx
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Process another */}
          <div className="px-5 py-4 border-t border-border bg-surface2/50">
            <button
              type="button"
              onClick={() => { setFile(null); setResult(null); setError(""); }}
              className="text-sm text-accent hover:underline font-medium"
            >
              Process another document →
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      {!result && (
        <div className="mt-8 rounded-xl border border-border bg-surface2/30 p-5">
          <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
            How it works
          </p>
          <ol className="space-y-2.5 text-xs text-muted">
            {[
              ["📤", "Upload", "Drop your .docx DMF — any Word document with Heading 1 section titles"],
              ["🔍", "Parse", "Sections are detected using Word's Heading 1 style (e.g. \"EXECUTIVE SUMMARY\", \"ESSENTIAL PRINCIPLES\")"],
              ["✂️", "Split", "Each section is extracted into its own HTML file preserving tables, images and formatting"],
              ["📦", "ZIP", "All section files + a manifest are packaged into a single ZIP for download"],
            ].map(([icon, title, desc]) => (
              <li key={title as string} className="flex gap-2.5">
                <span className="text-base shrink-0">{icon}</span>
                <span>
                  <strong className="text-foreground">{title}:</strong> {desc}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
