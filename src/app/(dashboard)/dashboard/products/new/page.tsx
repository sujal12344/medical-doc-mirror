"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGION_GROUPS } from "@/lib/frameworks";

type UploadedFile = { fileId: string; originalName: string; charCount: number; status: "done" | "uploading" | "error" };

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", manufacturer: "", description: "", deviceClass: "B" as const, deviceType: "ivd" as const,
    intendedUse: "", countries: ["IN"] as string[],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function upd(field: string, value: string | string[]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function toggleCountry(code: string) {
    setForm((p) => ({
      ...p,
      countries: p.countries.includes(code) ? p.countries.filter((c) => c !== code) : [...p.countries, code],
    }));
  }

  function toggleRegion(region: string) {
    setCollapsed((p) => ({ ...p, [region]: !p[region] }));
  }

  function selectAllInRegion(codes: string[]) {
    setForm((p) => {
      const newCountries = new Set(p.countries);
      const allSelected = codes.every((c) => newCountries.has(c));
      if (allSelected) {
        codes.forEach((c) => newCountries.delete(c));
      } else {
        codes.forEach((c) => newCountries.add(c));
      }
      return { ...p, countries: [...newCountries] };
    });
  }

  const filteredRegions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return REGION_GROUPS;
    return REGION_GROUPS.map((rg) => ({
      ...rg,
      countries: rg.countries.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      ),
    })).filter((rg) => rg.countries.length > 0);
  }, [search]);

  async function uploadFiles(pId: string, files: FileList | File[]) {
    setUploading(true);
    const pending = Array.from(files).map((f) => ({
      fileId: crypto.randomUUID(), originalName: f.name, charCount: 0, status: "uploading" as const,
    }));
    setUploadedFiles((prev) => [...prev, ...pending]);

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));

    try {
      const res = await fetch(`/api/products/${pId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.files) {
        setUploadedFiles((prev) => {
          const withoutPending = prev.filter((p) => p.status !== "uploading");
          return [...withoutPending, ...data.files.map((f: { fileId: string; originalName: string; charCount: number }) => ({
            ...f, status: "done" as const,
          }))];
        });
      } else {
        setUploadedFiles((prev) => prev.map((p) => p.status === "uploading" ? { ...p, status: "error" as const } : p));
      }
    } catch {
      setUploadedFiles((prev) => prev.map((p) => p.status === "uploading" ? { ...p, status: "error" as const } : p));
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (productId && e.dataTransfer.files.length) uploadFiles(productId, e.dataTransfer.files);
  }

  async function handleCreateAndContinue(e: React.FormEvent) {
    e.preventDefault();
    if (productId) {
      router.push(`/dashboard/products/${productId}`);
      return;
    }
    if (form.countries.length === 0) { setError("Select at least one country"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setProductId(data.product._id);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const totalCountries = REGION_GROUPS.reduce((s, r) => s + r.countries.length, 0);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/products" className="text-sm text-muted hover:text-foreground transition mb-4 inline-block">&larr; Back to products</Link>
      <h1 className="text-2xl font-bold text-foreground mb-1">Register New Product</h1>
      <p className="text-sm text-muted mb-6">Add your medical device or IVD product, then select target markets from {totalCountries} countries</p>

      <form onSubmit={productId ? (e) => { e.preventDefault(); router.push(`/dashboard/products/${productId}`); } : handleCreateAndContinue} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* Step indicator */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className={`flex items-center gap-1.5 ${!productId ? "text-[var(--accent)] font-semibold" : "text-green-600"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${!productId ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-green-100 text-green-700"}`}>{productId ? "✓" : "1"}</span>
            Product Details
          </span>
          <span className="w-8 h-px bg-border" />
          <span className={`flex items-center gap-1.5 ${productId ? "text-[var(--accent)] font-semibold" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${productId ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-surface2 text-muted"}`}>2</span>
            Upload Documents
          </span>
        </div>

        {/* Product Info */}
        <div className={`bg-surface border border-border rounded-2xl p-6 space-y-4 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Product Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => upd("name", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition"
                placeholder="e.g. RapidTest HIV 1/2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Manufacturer *</label>
              <input type="text" required value={form.manufacturer} onChange={(e) => upd("manufacturer", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition"
                placeholder="e.g. MedTech Diagnostics Pvt Ltd" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => upd("description", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition resize-y"
              placeholder="Brief description of the device, its purpose and technology" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Intended Use</label>
            <textarea rows={2} value={form.intendedUse} onChange={(e) => upd("intendedUse", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition resize-y"
              placeholder="What the device is intended to diagnose, treat, or monitor" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Device Class *</label>
              <select value={form.deviceClass} onChange={(e) => upd("deviceClass", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition">
                <option value="A">Class A</option><option value="B">Class B</option>
                <option value="C">Class C</option><option value="D">Class D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Device Type *</label>
              <select value={form.deviceType} onChange={(e) => upd("deviceType", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition">
                <option value="ivd">In-Vitro Diagnostic (IVD)</option>
                <option value="medical-device">Medical Device</option>
              </select>
            </div>
          </div>
        </div>

        {/* Target Countries */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Target Markets *</h2>
              <p className="text-xs text-muted mt-0.5">
                {form.countries.length} of {totalCountries} countries selected
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3.5 py-2 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Region groups */}
          <div className="space-y-2">
            {filteredRegions.map((rg) => {
              const regionCodes = rg.countries.map((c) => c.code);
              const selectedInRegion = regionCodes.filter((c) => form.countries.includes(c)).length;
              const isCollapsed = collapsed[rg.region] ?? false;

              return (
                <div key={rg.region} className="border border-border rounded-xl overflow-hidden">
                  {/* Region header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-surface2">
                    <button type="button" onClick={() => toggleRegion(rg.region)} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <svg className={`w-3.5 h-3.5 text-muted transition-transform ${isCollapsed ? "" : "rotate-90"}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {rg.region}
                      <span className="text-xs text-muted font-normal">({rg.countries.length} countries)</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedInRegion > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full font-semibold">
                          {selectedInRegion} selected
                        </span>
                      )}
                      <button type="button" onClick={() => selectAllInRegion(regionCodes)}
                        className="text-[10px] px-2 py-0.5 text-muted hover:text-[var(--accent)] font-medium transition">
                        {regionCodes.every((c) => form.countries.includes(c)) ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                  </div>

                  {/* Countries */}
                  {!isCollapsed && (
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {rg.countries.map((c) => (
                        <button key={c.code} type="button" onClick={() => toggleCountry(c.code)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            form.countries.includes(c.code)
                              ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]"
                              : "bg-surface border-border text-muted hover:border-[var(--accent)]/30 hover:text-foreground"
                          }`}>
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                          {c.frameworkCount > 1 && (
                            <span className="text-[9px] bg-surface2 border border-border px-1 py-0.5 rounded font-semibold">
                              {c.frameworkCount} types
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Upload - visible after product created */}
        {productId && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upload Product Documents</h2>
              <p className="text-xs text-muted mt-1">Upload COA, clinical reports, IFU, SDS, stability studies, or any regulatory documents. The AI will use these to auto-fill all country forms.</p>
            </div>

            {/* Drag-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-border hover:border-[var(--accent)]/40 hover:bg-surface2"}`}
            >
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.csv,.xml,.json,.md,.doc,.docx" className="hidden"
                onChange={(e) => { if (e.target.files?.length) uploadFiles(productId, e.target.files); e.target.value = ""; }} />
              <div className="mb-2">
                <svg className="mx-auto w-10 h-10 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                {uploading ? "Uploading & extracting text..." : "Drop files here or click to browse"}
              </p>
              <p className="text-xs text-muted mt-1">PDF, TXT, CSV, XML, JSON, MD — up to 50MB each</p>
            </div>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">{uploadedFiles.filter((f) => f.status === "done").length} document{uploadedFiles.length !== 1 ? "s" : ""} uploaded</p>
                {uploadedFiles.map((f) => (
                  <div key={f.fileId} className="flex items-center gap-3 bg-surface2 border border-border rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{f.originalName}</p>
                      <p className="text-[10px] text-muted">
                        {f.status === "uploading" && "Extracting text..."}
                        {f.status === "done" && `${f.charCount.toLocaleString()} characters extracted`}
                        {f.status === "error" && "Failed to process"}
                      </p>
                    </div>
                    {f.status === "uploading" && <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
                    {f.status === "done" && <span className="text-green-600 text-xs">✓</span>}
                    {f.status === "error" && <span className="text-red-500 text-xs">✗</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-lg p-3">
              <p className="text-xs text-[var(--accent)] font-medium">How it works</p>
              <p className="text-[11px] text-muted mt-1">When you generate a regulatory form for any country, the AI will automatically analyze these documents and fill matching fields. You can also upload additional documents directly in the form editor chat.</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading || uploading}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
          {loading ? "Creating..." :
           productId ? (uploading ? "Uploading..." : `Continue to Product (${uploadedFiles.filter((f) => f.status === "done").length} docs uploaded)`) :
           `Create Product & Upload Docs (${form.countries.length} market${form.countries.length !== 1 ? "s" : ""})`}
        </button>
      </form>
    </div>
  );
}
