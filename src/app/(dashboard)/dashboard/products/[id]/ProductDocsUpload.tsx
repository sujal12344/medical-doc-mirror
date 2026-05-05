"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type DocItem = { fileId: string; originalName: string; charCount: number };

export default function ProductDocsUpload({ productId, initialDocs }: { productId: string; initialDocs: DocItem[] }) {
  const [docs, setDocs] = useState<(DocItem & { status?: string })[]>(initialDocs.map((d) => ({ ...d, status: "done" })));
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(initialDocs.length === 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    const placeholders = Array.from(files).map((f) => ({
      fileId: crypto.randomUUID(), originalName: f.name, charCount: 0, status: "uploading",
    }));
    setDocs((prev) => [...prev, ...placeholders]);

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));

    try {
      const res = await fetch(`/api/products/${productId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.files) {
        setDocs((prev) => {
          const done = prev.filter((p) => p.status !== "uploading");
          return [...done, ...data.files.map((f: DocItem) => ({ ...f, status: "done" }))];
        });
        router.refresh();
      } else {
        setDocs((prev) => prev.map((p) => p.status === "uploading" ? { ...p, status: "error" } : p));
      }
    } catch {
      setDocs((prev) => prev.map((p) => p.status === "uploading" ? { ...p, status: "error" } : p));
    }
    setUploading(false);
  }

  async function removeDoc(fileId: string) {
    try {
      await fetch(`/api/products/${productId}/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      setDocs((prev) => prev.filter((d) => d.fileId !== fileId));
      router.refresh();
    } catch { /* ignore */ }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  const doneCount = docs.filter((d) => d.status === "done").length;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface2 transition"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Product Documents</p>
            <p className="text-[11px] text-muted">{doneCount > 0 ? `${doneCount} document${doneCount !== 1 ? "s" : ""} uploaded — AI will auto-fill forms` : "Upload COA, IFU, SDS, clinical reports for auto-fill"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-semibold">{doneCount} docs</span>
          )}
          <svg className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-5 space-y-3 border-t border-border pt-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-border hover:border-[var(--accent)]/40 hover:bg-surface2"}`}
          >
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.csv,.xml,.json,.md,.doc,.docx" className="hidden"
              onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
            <svg className="mx-auto w-8 h-8 text-muted mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
            <p className="text-xs font-medium text-foreground">{uploading ? "Processing..." : "Drop files here or click to browse"}</p>
            <p className="text-[10px] text-muted mt-0.5">PDF, TXT, CSV, XML, JSON, MD</p>
          </div>

          {/* Files list */}
          {docs.length > 0 && (
            <div className="space-y-1.5">
              {docs.map((d) => (
                <div key={d.fileId} className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{d.originalName}</p>
                    <p className="text-[10px] text-muted">
                      {d.status === "uploading" && "Extracting text..."}
                      {d.status === "done" && `${d.charCount.toLocaleString()} chars extracted`}
                      {d.status === "error" && "Failed"}
                    </p>
                  </div>
                  {d.status === "uploading" && <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
                  {d.status === "done" && (
                    <button onClick={(e) => { e.stopPropagation(); removeDoc(d.fileId); }} className="text-[10px] text-muted hover:text-red-500 transition px-1" title="Remove">✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {doneCount > 0 && (
            <p className="text-[10px] text-[var(--accent)] font-medium">When you generate a regulatory form below, the AI will automatically extract and fill matching fields from these documents.</p>
          )}
        </div>
      )}
    </div>
  );
}
