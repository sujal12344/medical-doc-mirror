"use client";

import { useState, useRef, useCallback } from "react";
import type { QmsSection } from "@/app/api/qms/disintegrate/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type ParseState = "idle" | "loading" | "done" | "error";
type DownloadState = "idle" | "loading" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function levelIndent(level: number): string {
  if (level <= 1) return "";
  if (level === 2) return "ml-4";
  return "ml-8";
}

function levelAccent(level: number): string {
  if (level <= 1) return "bg-[#1B4F8A]";
  if (level === 2) return "bg-[#2563EB]";
  return "bg-[#60A5FA]";
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  documentTitle,
}: {
  section: QmsSection;
  index: number;
  documentTitle: string;
}) {
  const [dlState, setDlState] = useState<DownloadState>("idle");

  async function downloadSection() {
    setDlState("loading");
    try {
      const res = await fetch("/api/qms/download-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionNumber: section.number,
          sectionTitle: section.title,
          content: section.content,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Download failed");
      }
      const blob = await res.blob();
      const filename =
        `${section.number ? section.number + "_" : ""}${section.title}`
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_\-\.]/g, "")
          .slice(0, 80) + ".docx";
      triggerDownload(blob, filename);
      setDlState("done");
      setTimeout(() => setDlState("idle"), 2500);
    } catch (e) {
      console.error(e);
      setDlState("error");
      setTimeout(() => setDlState("idle"), 3000);
    }
  }

  const preview =
    section.content.length > 220
      ? section.content.slice(0, 220).trimEnd() + "…"
      : section.content || "No body content.";

  const indent = levelIndent(section.level);
  const accent = levelAccent(section.level);

  return (
    <div
      className={`group relative bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--accent)]/30 ${indent}`}
    >
      {/* Left accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {section.number && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] border border-[#1B4F8A]/20">
                  {section.number}
                </span>
              )}
              <span className="text-[10px] font-medium text-muted">
                §{index + 1}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">
              {section.title}
            </h3>
          </div>

          <button
            id={`dl-section-${section.id}`}
            onClick={downloadSection}
            disabled={dlState === "loading"}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
              dlState === "done"
                ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                : dlState === "error"
                ? "bg-red-500/15 text-red-600 border border-red-400/30"
                : dlState === "loading"
                ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 opacity-70"
                : "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20"
            }`}
          >
            {dlState === "loading" ? (
              <>
                <span className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                Downloading…
              </>
            ) : dlState === "done" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Downloaded
              </>
            ) : dlState === "error" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Error
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Download .docx
              </>
            )}
          </button>
        </div>

        {/* Content preview */}
        {preview && (
          <p className="text-[11px] text-muted leading-relaxed line-clamp-3 mt-1">
            {preview}
          </p>
        )}

        {/* Word count badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted/70">
            {section.content.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  loading,
}: {
  onFile: (file: File) => void;
  loading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
        dragOver
          ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]"
          : "border-border bg-surface hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/3"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.doc"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />

      <div className="flex flex-col items-center gap-4">
        {loading ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <span className="w-7 h-7 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Processing document…</p>
              <p className="text-xs text-muted mt-1">Extracting, embedding, and generating ISO 13485 compliant procedures. This may take a minute.</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#1B4F8A]/10 border border-[#1B4F8A]/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#1B4F8A]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drop your QMS manual here
              </p>
              <p className="text-xs text-muted mt-1">
                Upload your QMS (.doc/.docx). We'll generate compliant procedures using AI.
              </p>
              <p className="text-[11px] text-[var(--accent)] mt-2 font-medium">
                Click or drag to upload
              </p>
            </div>
          </>
        )}
      </div>

      {/* Decorative grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px] rounded-2xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QmsDisintegratorPage() {
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [sections, setSections] = useState<QmsSection[]>([]);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [dlAllState, setDlAllState] = useState<DownloadState>("idle");
  const [search, setSearch] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setParseState("loading");
    setErrorMsg("");
    setSections([]);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/qms/disintegrate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Parsing failed");
      }

      setFileName(data.fileName || file.name);
      setSections(data.sections || []);
      setParseState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setParseState("error");
    }
  }, []);

  async function downloadAll() {
    if (sections.length === 0 || dlAllState === "loading") return;
    setDlAllState("loading");
    try {
      const res = await fetch("/api/qms/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, documentTitle: fileName.replace(/\.(docx?)/i, "") }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Download failed");
      }
      const blob = await res.blob();
      const safeTitle = fileName.replace(/\.(docx?)/i, "").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 60);
      triggerDownload(blob, `${safeTitle}_All_Sections.zip`);
      setDlAllState("done");
      setTimeout(() => setDlAllState("idle"), 3000);
    } catch (e) {
      console.error(e);
      setDlAllState("error");
      setTimeout(() => setDlAllState("idle"), 3000);
    }
  }

  const filtered = search.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.number.includes(search) ||
          s.content.toLowerCase().includes(search.toLowerCase())
      )
    : sections;

  const topLevelCount = sections.filter((s) => s.level <= 1).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* QMS badge */}
            <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/15 border border-[#1B4F8A]/30 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#1B4F8A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">QMS Disintegrator</h1>
              <p className="text-[10px] text-muted mt-0.5">Fifth Schedule · MDR 2017</p>
            </div>
          </div>

          {/* Actions — only show after parsing */}
          {parseState === "done" && sections.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sections…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 w-44"
                />
              </div>

              <button
                id="qms-upload-new"
                onClick={() => { setParseState("idle"); setSections([]); setSearch(""); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface2 transition"
              >
                Upload new
              </button>

              <button
                id="qms-download-all"
                onClick={downloadAll}
                disabled={dlAllState === "loading"}
                className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
                  dlAllState === "done"
                    ? "bg-emerald-500 text-white"
                    : dlAllState === "error"
                    ? "bg-red-500 text-white"
                    : "bg-[#1B4F8A] hover:bg-[#1a3d6b] text-white"
                } disabled:opacity-60`}
              >
                {dlAllState === "loading" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Zipping…
                  </>
                ) : dlAllState === "done" ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Downloaded!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All (.zip)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── IDLE: Upload Zone ──────────────────────────────────────────────── */}
        {(parseState === "idle" || parseState === "loading") && (
          <div className="max-w-2xl mx-auto">
            {/* Title block */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4F8A]/10 border border-[#1B4F8A]/20 text-[11px] font-semibold text-[#1B4F8A] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] animate-pulse" />
                QMS Document Disintegrator
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Upload your QMS document
              </h2>
              <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                Upload your existing QMS manual. We will extract its contents, store it securely, and use AI to generate complete ISO 13485 compliant procedures for: <strong>Control of the Quality Manual, Quality Policy, and Control of Documents</strong>.
              </p>
            </div>

            <UploadZone onFile={handleFile} loading={parseState === "loading"} />

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                {
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                  title: "AI Generation",
                  desc: "Generates fully compliant ISO 13485 procedures automatically",
                },
                {
                  icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
                  title: "Document Download",
                  desc: "Download each generated document as a styled .docx",
                },
                {
                  icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
                  title: "Bulk ZIP Export",
                  desc: "One click to download all documents in a ZIP",
                },
              ].map((f) => (
                <div key={f.title} className="text-center p-4 bg-surface border border-border rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-[#1B4F8A]/10 border border-[#1B4F8A]/15 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4.5 h-4.5 text-[#1B4F8A]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{f.title}</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────────── */}
        {parseState === "error" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-red-500/8 border border-red-400/30 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red-600 mb-1">Parsing failed</p>
              <p className="text-xs text-muted mb-4">{errorMsg}</p>
              <button
                onClick={() => setParseState("idle")}
                className="text-xs px-4 py-2 bg-foreground text-background rounded-lg font-semibold hover:opacity-80 transition"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── DONE: Section Grid ────────────────────────────────────────────── */}
        {parseState === "done" && sections.length > 0 && (
          <div>
            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {fileName || "Generated Documents"}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted">
                    <strong className="text-foreground">{sections.length}</strong> documents generated
                  </span>
                  {search && (
                    <>
                      <span className="text-muted/40">·</span>
                      <span className="text-xs text-[var(--accent)]">
                        {filtered.length} match{filtered.length !== 1 ? "es" : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile search */}
              <div className="sm:hidden relative flex-1 min-w-[140px]">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sections…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                />
              </div>
            </div>

            {/* Section list */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <p className="text-sm font-medium">No sections match "{search}"</p>
                <button onClick={() => setSearch("")} className="text-xs text-[var(--accent)] mt-2 hover:underline">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((section, i) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    index={sections.indexOf(section)}
                    documentTitle={fileName}
                  />
                ))}
              </div>
            )}

            {/* Bottom action */}
            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted">
                {sections.length} documents · Each document is exported as a standalone MDR 2017-formatted Word document
              </p>
              <button
                onClick={downloadAll}
                disabled={dlAllState === "loading"}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm ${
                  dlAllState === "done"
                    ? "bg-emerald-500 text-white"
                    : "bg-[#1B4F8A] hover:bg-[#1a3d6b] text-white"
                } disabled:opacity-60`}
              >
                {dlAllState === "loading" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Building ZIP…
                  </>
                ) : dlAllState === "done" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    All Downloaded!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All Documents as ZIP
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
