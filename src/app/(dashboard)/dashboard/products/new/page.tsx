"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGION_GROUPS } from "@/lib/frameworks";

type UploadedFile = { fileId: string; originalName: string; charCount: number; status: "done" | "uploading" | "error" };

const INDIA_ONLY_NOTICE = "India is pre-selected and required for MDR 2017 registration. Other markets can be added later once Phase 1 classification is locked.";

const FIELD_INPUT_CLASS = "w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition";
const LABEL_CLASS = "block text-sm font-medium mb-1.5 text-foreground";

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", manufacturer: "", description: "", intendedUse: "",
    deviceClass: "B" as "A" | "B" | "C" | "D",
    deviceType: "ivd" as "ivd" | "medical-device",
    countries: ["IN"] as string[],
    // New characterisation fields
    patientPopulation: "",
    isSterile: false,
    hasSoftware: false,
    isActive: false,
    isInvasive: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillDoc, setAutofillDoc] = useState("");
  const [autofillDocName, setAutofillDocName] = useState("");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function upd(field: string, value: string | boolean | string[]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  // ── Autofill via RAG ────────────────────────────────────────────────────────
  const handleAutofillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAutofillDocName(file.name);

    // Extract text from file
    let text = "";
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      if (res.ok) { const d = await res.json(); text = d.text; }
    } catch {}
    if (!text) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => { text = ev.target?.result as string ?? ""; resolve(); };
        reader.readAsText(file);
      });
    }
    setAutofillDoc(text);
  };

  const handleRunAutofill = async () => {
    if (!autofillDoc.trim()) { setError("Upload a document first to autofill."); return; }
    setError(""); setAutofilling(true);
    try {
      const res = await fetch("/api/products/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: autofillDoc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Autofill failed");
      // Merge AI output into form
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        manufacturer: data.manufacturer || prev.manufacturer,
        description: data.description || prev.description,
        intendedUse: data.intendedUse || prev.intendedUse,
        patientPopulation: data.patientPopulation || prev.patientPopulation,
        deviceClass: data.deviceClass || prev.deviceClass,
        deviceType: data.deviceType || prev.deviceType,
        isSterile: data.isSterile ?? prev.isSterile,
        hasSoftware: data.hasSoftware ?? prev.hasSoftware,
        isActive: data.isActive ?? prev.isActive,
        isInvasive: data.isInvasive ?? prev.isInvasive,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAutofilling(false);
    }
  };

  // ── Country helpers ─────────────────────────────────────────────────────────
  function toggleCountry(code: string) {
    if (code === "IN") return; // India locked
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
      const unlocked = codes.filter((c) => c !== "IN");
      const allSelected = unlocked.every((c) => newCountries.has(c));
      if (allSelected) { unlocked.forEach((c) => newCountries.delete(c)); }
      else { unlocked.forEach((c) => newCountries.add(c)); }
      return { ...p, countries: [...newCountries] };
    });
  }

  const filteredRegions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return REGION_GROUPS;
    return REGION_GROUPS.map((rg) => ({
      ...rg,
      countries: rg.countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
    })).filter((rg) => rg.countries.length > 0);
  }, [search]);

  // ── Doc upload (post-create) ─────────────────────────────────────────────
  async function uploadFiles(pId: string, files: FileList | File[]) {
    setUploading(true);
    const pending = Array.from(files).map((f) => ({ fileId: crypto.randomUUID(), originalName: f.name, charCount: 0, status: "uploading" as const }));
    setUploadedFiles((prev) => [...prev, ...pending]);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch(`/api/products/${pId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.files) {
        setUploadedFiles((prev) => {
          const withoutPending = prev.filter((p) => p.status !== "uploading");
          return [...withoutPending, ...data.files.map((f: any) => ({ ...f, status: "done" as const }))];
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
    e.preventDefault(); setDragOver(false);
    if (productId && e.dataTransfer.files.length) uploadFiles(productId, e.dataTransfer.files);
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleCreateAndContinue(e: React.FormEvent) {
    e.preventDefault();
    if (productId) { router.push(`/dashboard/products/${productId}`); return; }
    if (form.countries.length === 0) { setError("Select at least one country"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setProductId(data.product._id);
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  }

  const totalCountries = REGION_GROUPS.reduce((s, r) => s + r.countries.length, 0);

  function BoolToggle({ label, field, hint }: { label: string; field: "isSterile" | "hasSoftware" | "isActive" | "isInvasive"; hint: string }) {
    const val = form[field];
    return (
      <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted mt-0.5">{hint}</div>
        </div>
        <button type="button" onClick={() => upd(field, !val)}
          className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${val ? "bg-accent" : "bg-surface2 border border-border"}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/products" className="text-sm text-muted hover:text-foreground transition mb-4 inline-block">← Back to products</Link>
      <h1 className="text-2xl font-bold text-foreground mb-1">Register New Product</h1>
      <p className="text-sm text-muted mb-6">Add your medical device or IVD product for Phase 2 Technical Dossier generation.</p>

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
        <div className={`bg-surface border border-border rounded-2xl p-6 space-y-5 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Product Information</h2>
              <p className="text-xs text-muted mt-0.5">Upload an IFU or brochure to autofill all fields using AI.</p>
            </div>

            {/* Autofill zone */}
            <div className="shrink-0">
              {!autofillDoc ? (
                <button type="button" onClick={() => autofillInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent border border-accent/40 bg-accent/5 rounded-xl hover:bg-accent/10 transition">
                  🪄 Autofill from Document
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent font-medium truncate max-w-[120px]">📄 {autofillDocName}</span>
                  <button type="button" onClick={handleRunAutofill} disabled={autofilling}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-accent rounded-xl hover:bg-accent-hover transition disabled:opacity-60">
                    {autofilling ? <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Filling…</> : "✨ Fill Fields"}
                  </button>
                </div>
              )}
              <input ref={autofillInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleAutofillUpload} />
            </div>
          </div>

          {autofilling && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-accent font-medium">
              <span className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
              AI is reading the document and filling fields…
            </div>
          )}

          {/* Name + Manufacturer */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => upd("name", e.target.value)}
                className={FIELD_INPUT_CLASS} placeholder="e.g. RapidTest HIV 1/2" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Manufacturer *</label>
              <input type="text" required value={form.manufacturer} onChange={(e) => upd("manufacturer", e.target.value)}
                className={FIELD_INPUT_CLASS} placeholder="e.g. MedTech Diagnostics Pvt Ltd" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => upd("description", e.target.value)}
              className={FIELD_INPUT_CLASS} placeholder="Brief description of the device, its purpose and technology" />
          </div>

          {/* Intended Use */}
          <div>
            <label className={LABEL_CLASS}>Intended Use / Claims</label>
            <textarea rows={2} value={form.intendedUse} onChange={(e) => upd("intendedUse", e.target.value)}
              className={FIELD_INPUT_CLASS} placeholder="What the device is intended to diagnose, treat, or monitor" />
          </div>

          {/* Patient Population */}
          <div>
            <label className={LABEL_CLASS}>Patient Population</label>
            <input type="text" value={form.patientPopulation} onChange={(e) => upd("patientPopulation", e.target.value)}
              className={FIELD_INPUT_CLASS} placeholder="e.g. Adults ≥18 years, pregnant women, neonates" />
          </div>

          {/* Device Class + Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Device Class *</label>
              <select value={form.deviceClass} onChange={(e) => upd("deviceClass", e.target.value)} className={FIELD_INPUT_CLASS}>
                <option value="A">Class A — Low Risk</option>
                <option value="B">Class B — Low-Moderate Risk</option>
                <option value="C">Class C — Moderate-High Risk</option>
                <option value="D">Class D — High Risk</option>
              </select>
              <p className="text-xs text-muted mt-1">AI Classification (Phase 1) will auto-update this.</p>
            </div>
            <div>
              <label className={LABEL_CLASS}>Device Type *</label>
              <select value={form.deviceType} onChange={(e) => upd("deviceType", e.target.value)} className={FIELD_INPUT_CLASS}>
                <option value="ivd">In-Vitro Diagnostic (IVD)</option>
                <option value="medical-device">Medical Device</option>
              </select>
            </div>
          </div>

          {/* Characterisation toggles */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface2 border-b border-border">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide">Device Characterisation</div>
              <div className="text-xs text-muted mt-0.5">These are used by the AI Classification engine in Phase 1.</div>
            </div>
            <div className="px-4">
              <BoolToggle label="Sterile" field="isSterile" hint="Is the device supplied in a sterile state?" />
              <BoolToggle label="Software-Enabled" field="hasSoftware" hint="Does the device include embedded or companion software?" />
              <BoolToggle label="Active Device" field="isActive" hint="Does the device transform or use energy (electrical, thermal, etc.)?" />
              <BoolToggle label="Invasive" field="isInvasive" hint="Does the device penetrate the body through an orifice or surgically?" />
            </div>
          </div>
        </div>

        {/* Target Markets */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Target Markets *</h2>
              <p className="text-xs text-muted mt-0.5">{form.countries.length} of {totalCountries} countries selected</p>
            </div>
          </div>

          {/* India locked banner */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-blue-700">
            <span>🇮🇳</span>
            <span><strong>India is pre-selected and locked.</strong> {INDIA_ONLY_NOTICE}</span>
          </div>

          <div className="mb-4">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search countries..."
              className={FIELD_INPUT_CLASS} />
          </div>

          <div className="space-y-2">
            {filteredRegions.map((rg) => {
              const regionCodes = rg.countries.map((c) => c.code);
              const selectedInRegion = regionCodes.filter((c) => form.countries.includes(c)).length;
              const isCollapsed = collapsed[rg.region] ?? false;

              return (
                <div key={rg.region} className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-surface2">
                    <button type="button" onClick={() => toggleRegion(rg.region)} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <svg className={`w-3.5 h-3.5 text-muted transition-transform ${isCollapsed ? "" : "rotate-90"}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {rg.region}
                      <span className="text-xs text-muted font-normal">({rg.countries.length} countries)</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedInRegion > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full font-semibold">{selectedInRegion} selected</span>
                      )}
                      <button type="button" onClick={() => selectAllInRegion(regionCodes)}
                        className="text-[10px] px-2 py-0.5 text-muted hover:text-[var(--accent)] font-medium transition">
                        {regionCodes.filter(c => c !== "IN").every((c) => form.countries.includes(c)) ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {rg.countries.map((c) => {
                        const isIndia = c.code === "IN";
                        return (
                          <button key={c.code} type="button" onClick={() => toggleCountry(c.code)}
                            disabled={!isIndia}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              isIndia
                                ? "bg-blue-50 border-blue-300 text-blue-700 cursor-not-allowed"
                                : "bg-surface2 border-border text-muted opacity-40 cursor-not-allowed"
                            }`}>
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                            {isIndia && <span className="text-[9px] bg-blue-100 px-1 rounded font-bold">SELECTED</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Upload — visible after product created */}
        {productId && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upload Product Documents</h2>
              <p className="text-xs text-muted mt-1">Upload COA, IFU, clinical reports, SDS. The AI will use these during Phase 1 classification and Phase 2 dossier generation.</p>
            </div>

            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-border hover:border-[var(--accent)]/40 hover:bg-surface2"}`}>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.csv,.xml,.json,.md,.doc,.docx" className="hidden"
                onChange={(e) => { if (e.target.files?.length) uploadFiles(productId, e.target.files); e.target.value = ""; }} />
              <div className="mb-2">
                <svg className="mx-auto w-10 h-10 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
              </div>
              <p className="text-sm font-medium text-foreground">{uploading ? "Uploading & extracting text..." : "Drop files here or click to browse"}</p>
              <p className="text-xs text-muted mt-1">PDF, TXT, CSV, XML, JSON, MD — up to 50MB each</p>
            </div>

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
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading || uploading}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
          {loading ? "Creating..." :
            productId ? (uploading ? "Uploading..." : `Continue to Product →`) :
              `Create Product & Upload Docs (${form.countries.length} market${form.countries.length !== 1 ? "s" : ""})`}
        </button>
      </form>
    </div>
  );
}
