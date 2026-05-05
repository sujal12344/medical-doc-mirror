"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Pipeline stage definitions ────────────────────────────────────────────────
type LogLevel = "info" | "success" | "warn" | "step";

interface LogLine {
  id: number;
  level: LogLevel;
  text: string;
}

const PIPELINE_STAGES: { delayMs: number; level: LogLevel; text: string }[] = [
  { delayMs: 0,     level: "step",    text: "Parsing uploaded PDF files..." },
  { delayMs: 1200,  level: "info",    text: "Chunking text (chunk_size=1500, overlap=200)..." },
  { delayMs: 2800,  level: "info",    text: "Generating embeddings via OpenAI text-embedding-3-small..." },
  { delayMs: 5500,  level: "info",    text: "Upserting vectors to Pinecone index..." },
  { delayMs: 14000, level: "warn",    text: "Waiting 20 s for Pinecone index consistency flush..." },
  { delayMs: 34000, level: "step",    text: "Running RAG query: product tables & model numbers..." },
  { delayMs: 37000, level: "step",    text: "Running RAG query: shelf life, materials & specs..." },
  { delayMs: 39500, level: "step",    text: "Running RAG query: Intended Use / Indications for Use..." },
  { delayMs: 42000, level: "step",    text: "Running RAG query: instrument dimensions & operating temp..." },
  { delayMs: 44500, level: "step",    text: "Running RAG query: legal manufacturer details..." },
  { delayMs: 47000, level: "info",    text: "Deduplicating & merging context chunks..." },
  { delayMs: 48500, level: "step",    text: "LLM extraction — product registry (GPT-4o-mini, temp=0)..." },
  { delayMs: 58000, level: "step",    text: "LLM extraction — company & manufacturer details..." },
  { delayMs: 68000, level: "info",    text: "Sorting product registry by model number..." },
  { delayMs: 69500, level: "info",    text: "Mapping fields to DOCX placeholder slots..." },
  { delayMs: 71000, level: "step",    text: "Rendering DOCX templates via docxtemplater..." },
  { delayMs: 74000, level: "info",    text: "Packaging output files into ZIP archive..." },
  { delayMs: 76000, level: "success", text: "All documents generated — preparing download..." },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "ready" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("outputs.zip");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logIdRef = useRef(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "uploading" || status === "processing";

  // Auto-scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      timerRefs.current.forEach(clearTimeout);
    };
  }, [downloadUrl]);

  const acceptedTypes = useMemo(() => ["application/pdf"], []);

  function addLog(level: LogLevel, text: string) {
    const id = ++logIdRef.current;
    setLogs((prev) => [...prev, { id, level, text }]);
  }

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  function startPipelineLogs() {
    clearTimers();
    setLogs([]);
    PIPELINE_STAGES.forEach(({ delayMs, level, text }) => {
      const t = setTimeout(() => addLog(level, text), delayMs);
      timerRefs.current.push(t);
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(e.target.files ?? []);
    setError("");
    setLogs([]);
    clearTimers();
    setDownloadUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (nextFiles.length === 0) {
      setFiles([]);
      setStatus("idle");
      return;
    }

    const invalid = nextFiles.find(
      (f) => f.type && !acceptedTypes.includes(f.type)
    );
    if (invalid) {
      setFiles([]);
      setStatus("error");
      setError("Please upload PDF files only.");
      return;
    }

    setFiles(nextFiles);
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus("error");
      setError("Please select at least one PDF first.");
      return;
    }

    setStatus("uploading");
    setError("");
    startPipelineLogs();

    try {
      const formData = new FormData();
      for (const f of files) {
        formData.append("files", f);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        clearTimers();
        let message = "Upload failed.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {
          // ignore
        }
        setStatus("error");
        setError(message);
        addLog("warn", `Error: ${message}`);
        return;
      }

      setStatus("processing");
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || "outputs.zip";
      setDownloadFilename(filename);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      clearTimers();
      setLogs((prev) => [
        ...prev.filter((l) => l.text !== "All documents generated — preparing download..."),
        { id: ++logIdRef.current, level: "success", text: "✓ ZIP ready — click Download below." },
      ]);
      setStatus("ready");
    } catch (e: unknown) {
      clearTimers();
      const msg = e instanceof Error ? e.message : "Unexpected error.";
      setStatus("error");
      setError(msg);
      addLog("warn", `Error: ${msg}`);
    }
  };

  // ── Log colours ──────────────────────────────────────────────────────────────
  const levelStyle: Record<LogLevel, string> = {
    info:    "text-slate-400",
    step:    "text-sky-400",
    warn:    "text-amber-400",
    success: "text-emerald-400",
  };

  const levelPrefix: Record<LogLevel, string> = {
    info:    "  »",
    step:    "▶",
    warn:    "⚠",
    success: "✓",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Upload PDFs</h1>
      <p className="text-slate-600 mb-8">
        Upload one or more medical regulatory PDFs. We will generate the filled
        DOCX documents and return them as a ZIP.
      </p>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        {/* File input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Upload PDF files
          </label>
          <div className="relative group">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              disabled={isBusy}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              isBusy 
                ? "bg-slate-50 border-slate-200 opacity-60" 
                : files.length > 0 
                  ? "bg-[var(--accent)]/5 border-[var(--accent)]/30" 
                  : "bg-slate-50 hover:bg-slate-100 border-slate-300 hover:border-[var(--accent)]/50"
            }`}>
              <div className={`p-3 rounded-full transition-colors ${files.length > 0 ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-white shadow-sm text-slate-400 group-hover:text-[var(--accent)]"}`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {files.length > 0 ? `${files.length} file(s) selected` : "Click or drag PDFs here"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {files.length > 0 ? "Click to change selection" : "Up to 100MB total"}
                </p>
              </div>
            </div>
          </div>

          {/* File list preview */}
          {files.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 4.5a4.125 4.125 0 102.338 7.524l2.007 2.006a.75.75 0 101.06-1.06l-2.006-2.007a4.125 4.125 0 00-3.399-6.463z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                    <p className="text-[11px] text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isBusy}
          className="w-full px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBusy ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {status === "uploading" ? "Uploading & indexing..." : "Extracting & generating..."}
            </>
          ) : (
            "Generate DOCX ZIP"
          )}
        </button>

        {/* ── Terminal-style progress log ─────────────────────────────────── */}
        {logs.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-slate-400 font-mono tracking-wide">
                pipeline — MedDocs AI
              </span>
              {isBusy && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-sky-400 font-mono">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  running
                </span>
              )}
              {status === "ready" && (
                <span className="ml-auto text-xs text-emerald-400 font-mono">done</span>
              )}
            </div>

            {/* Log body */}
            <div className="bg-slate-950 px-4 py-3 h-52 overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5">
              <div className="text-slate-500 mb-1">$ medDocs-ai pipeline start</div>
              {logs.map((line) => (
                <div
                  key={line.id}
                  className={`flex gap-2 ${levelStyle[line.level]}`}
                  style={{ animation: "fadeInUp 0.25s ease both" }}
                >
                  <span className="select-none opacity-70 w-4 shrink-0">
                    {levelPrefix[line.level]}
                  </span>
                  <span>{line.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Download */}
        {downloadUrl && status === "ready" && (
          <a
            href={downloadUrl}
            download={downloadFilename}
            className="block w-full text-center px-8 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-xl shadow-sm transition-all"
          >
            ⬇ Download ZIP
          </a>
        )}
      </div>

      {/* Fade-in keyframe */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
