"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REGION_GROUPS } from "@/lib/frameworks";
import Phase1MiniFlowchart from "./Phase1MiniFlowchart";
import DeviceCharacterisation from "./DeviceCharacterisation";
import IVDCharacterisation from "./IVDCharacterisation";
import PredicatePathway from "./PredicatePathway";
import ClassificationLock from "./ClassificationLock";

type UploadedFile = { fileId: string; originalName: string; charCount: number; status: "done" | "uploading" | "error" };

const INDIA_ONLY_NOTICE = "India is pre-selected and required for MDR 2017 registration. Other markets can be added later once Phase 1 classification is locked.";

const FIELD_INPUT_CLASS = "w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition";
const LABEL_CLASS = "block text-sm font-medium mb-1.5 text-foreground";

const DRAFT_KEY = "newproduct_draft";

/** Normalise any deviceClass string to just the letter A/B/C/D */
function normalizeDeviceClass(raw: string | undefined): "A" | "B" | "C" | "D" | "" {
  if (!raw) return "";
  const m = raw.toUpperCase().match(/\b([ABCD])\b/);
  return m ? (m[1] as "A" | "B" | "C" | "D") : "";
}

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", manufacturer: "", description: "", intendedUse: "",
    deviceClass: "B" as "A" | "B" | "C" | "D",
    deviceType: "ivd" as "ivd" | "medical-device",
    countries: ["IN"] as string[],
    patientPopulation: "",
    isSterile: false,
    hasSoftware: false,
    // Part I fields
    isActive: false,
    activeType: "" as "therapeutic" | "diagnostic" | "other" | "",
    isInvasive: false,
    invasionType: "" as "non-invasive" | "body-orifice" | "surgically-invasive" | "",
    contactDuration: "" as "transient" | "short-term" | "long-term" | "",
    // Special risk flags
    directCNSContact: false,
    directHeartContact: false,
    lifeSupporting: false,
    isImplantable: false,
    ionizingRadiation: false,
    isDrugDeviceCombo: false,
    containsAnimalTissue: false,
    isContraceptive: false,
    absorbed: false,
    reusableSurgicalInstrument: false,
    oralCavityOrEarOrNasal: false,
    mucousMembraneAbsorption: false,
    drugAdministration: false,
    // IVD Part II fields
    ivdSelfTest: false,
    ivdNearPatient: false,
    ivdBloodDonorScreening: false,
    ivdBloodGrouping: false,
    ivdForKnownCondition: false,
    ivdTargetsHIV: false,
    ivdTargetsHBV: false,
    ivdTargetsHCV: false,
    ivdTargetsHTLV: false,
    ivdTargetsMalaria: false,
    ivdTargetsSyphilis: false,
    ivdTargetsCMV: false,
    ivdTargetsSTI: false,
    ivdGeneticTesting: false,
    ivdDrugMonitoring: false,
    ivdHLATyping: false,
    ivdCongenitalScreening: false,
    ivdCancerMarkers: false,
    ivdFertility: false,
    // Predicate device & novel pathway (Step 1.5)
    predicateExists: null as null | boolean,
    predicateName: "",
    predicateManufacturer: "",
    predicateRegNo: "",
    predicateBasis: "",
    predicateClass: "" as "A" | "B" | "C" | "D" | "",
    // Novel pathway (when predicateExists === false)
    md26Status: "not-filed" as "not-filed" | "filed" | "approved",
    md26RefNo: "",
    md27Status: "not-filed" as "not-filed" | "filed" | "approved",
    md27RefNo: "",
    clinicalSiteCount: "",
    novelPathwayAcknowledged: false,
    // Step 1.6 — Classification confirmation
    classificationConfirmed: false,
    classificationOverride: "" as "A" | "B" | "C" | "D" | "",
    classificationNote: "",
    classificationConfirmedBy: "",
    // Step 1.8 — Lock
    classificationLocked: false,
    classificationLockedBy: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillDocName, setAutofillDocName] = useState("");
  const [autofillDone, setAutofillDone] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);

  // ── Persist draft to localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  function upd(field: string, value: string | boolean | string[] | null) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  // ── Autofill via RAG — upload triggers chunk → embed → upsert → query → fill ──
  const handleAutofillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAutofillDocName(file.name);
    setAutofilling(true);
    setError("");
    setAutofillDone(false);

    // Step 1: Extract text
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

    // Step 2: Send to autofill API (chunk → embed → upsert → RAG query → GPT)
    try {
      const res = await fetch("/api/products/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: text, scope: "product" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Autofill failed");
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        manufacturer: data.manufacturer || prev.manufacturer,
        description: data.description || prev.description,
        intendedUse: data.intendedUse || prev.intendedUse,
        patientPopulation: data.patientPopulation || prev.patientPopulation,
        deviceClass: normalizeDeviceClass(data.deviceClass) || prev.deviceClass,
        deviceType: data.deviceType || prev.deviceType,
        isSterile: data.isSterile ?? prev.isSterile,
        hasSoftware: data.hasSoftware ?? prev.hasSoftware,
        isActive: data.isActive ?? prev.isActive,
        activeType: data.activeType || prev.activeType,
        isInvasive: data.isInvasive ?? prev.isInvasive,
        invasionType: data.invasionType || prev.invasionType,
        contactDuration: data.contactDuration || prev.contactDuration,
        directCNSContact: data.directCNSContact ?? prev.directCNSContact,
        directHeartContact: data.directHeartContact ?? prev.directHeartContact,
        lifeSupporting: data.lifeSupporting ?? prev.lifeSupporting,
        isImplantable: data.isImplantable ?? prev.isImplantable,
        ionizingRadiation: data.ionizingRadiation ?? prev.ionizingRadiation,
        isDrugDeviceCombo: data.isDrugDeviceCombo ?? prev.isDrugDeviceCombo,
        containsAnimalTissue: data.containsAnimalTissue ?? prev.containsAnimalTissue,
        isContraceptive: data.isContraceptive ?? prev.isContraceptive,
        absorbed: data.absorbed ?? prev.absorbed,
        reusableSurgicalInstrument: data.reusableSurgicalInstrument ?? prev.reusableSurgicalInstrument,
        oralCavityOrEarOrNasal: data.oralCavityOrEarOrNasal ?? prev.oralCavityOrEarOrNasal,
        mucousMembraneAbsorption: data.mucousMembraneAbsorption ?? prev.mucousMembraneAbsorption,
        drugAdministration: data.drugAdministration ?? prev.drugAdministration,
        // IVD Part II
        ivdSelfTest:             data.ivdSelfTest             ?? prev.ivdSelfTest,
        ivdNearPatient:          data.ivdNearPatient          ?? prev.ivdNearPatient,
        ivdBloodDonorScreening:  data.ivdBloodDonorScreening  ?? prev.ivdBloodDonorScreening,
        ivdBloodGrouping:        data.ivdBloodGrouping        ?? prev.ivdBloodGrouping,
        ivdForKnownCondition:    data.ivdForKnownCondition    ?? prev.ivdForKnownCondition,
        ivdTargetsHIV:           data.ivdTargetsHIV           ?? prev.ivdTargetsHIV,
        ivdTargetsHBV:           data.ivdTargetsHBV           ?? prev.ivdTargetsHBV,
        ivdTargetsHCV:           data.ivdTargetsHCV           ?? prev.ivdTargetsHCV,
        ivdTargetsHTLV:          data.ivdTargetsHTLV          ?? prev.ivdTargetsHTLV,
        ivdTargetsMalaria:       data.ivdTargetsMalaria       ?? prev.ivdTargetsMalaria,
        ivdTargetsSyphilis:      data.ivdTargetsSyphilis      ?? prev.ivdTargetsSyphilis,
        ivdTargetsCMV:           data.ivdTargetsCMV           ?? prev.ivdTargetsCMV,
        ivdTargetsSTI:           data.ivdTargetsSTI           ?? prev.ivdTargetsSTI,
        ivdGeneticTesting:       data.ivdGeneticTesting       ?? prev.ivdGeneticTesting,
        ivdDrugMonitoring:       data.ivdDrugMonitoring       ?? prev.ivdDrugMonitoring,
        ivdHLATyping:            data.ivdHLATyping            ?? prev.ivdHLATyping,
        ivdCongenitalScreening:  data.ivdCongenitalScreening  ?? prev.ivdCongenitalScreening,
        ivdCancerMarkers:        data.ivdCancerMarkers        ?? prev.ivdCancerMarkers,
        ivdFertility:            data.ivdFertility            ?? prev.ivdFertility,
      }));
      setAutofillDone(true);
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link href="/dashboard/products" className="text-sm text-muted hover:text-foreground transition mb-4 inline-block">← Back to products</Link>
      <h1 className="text-2xl font-bold text-foreground mb-1">Register New Product</h1>
      <p className="text-sm text-muted mb-4">Add your medical device or IVD product for Phase 2 Technical Dossier generation.</p>

      {/* Knowledge base — product document upload for RAG autofill */}
      <div className={`mb-6 border border-border rounded-2xl bg-surface overflow-hidden ${productId ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setKnowledgeBaseOpen((o) => !o)}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition"
          >
            <span className="text-sm font-semibold text-foreground">Knowledge Base</span>
            {autofillDone && (
              <span className="text-[10px] font-medium text-muted px-2 py-0.5 rounded-full bg-surface2 border border-border">
                1 doc
              </span>
            )}
            <span className={`text-muted text-xs transition-transform ${knowledgeBaseOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {!knowledgeBaseOpen ? (
            <button
              type="button"
              onClick={() => setKnowledgeBaseOpen(true)}
              className="text-xs font-semibold text-accent px-3 py-1.5 border border-accent/40 bg-accent/5 rounded-lg hover:bg-accent/10 transition shrink-0"
            >
              + Add knowledge
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setKnowledgeBaseOpen(false)}
              className="text-xs text-muted hover:text-foreground shrink-0"
            >
              Collapse
            </button>
          )}
        </div>

        {knowledgeBaseOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-4">
            <p className="text-xs text-muted">
              Upload an IFU or brochure to index for AI autofill of Step 1 product fields.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Product document</p>
                <p className="text-[10px] text-muted mt-0.5">IFU, brochure, or technical file → product namespace</p>
              </div>
              <div className="shrink-0">
                {autofillDone ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                    ✅ {autofillDocName}
                    <button type="button" onClick={() => { setAutofillDone(false); setAutofillDocName(""); if (autofillInputRef.current) autofillInputRef.current.value = ""; }}
                      className="ml-1 text-muted hover:text-foreground">✕</button>
                  </div>
                ) : autofilling ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent bg-accent/5 border border-accent/20 rounded-xl">
                    <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                    {autofillDocName ? `Processing ${autofillDocName}…` : "Processing…"}
                  </div>
                ) : (
                  <button type="button" onClick={() => autofillInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent border border-accent/40 bg-accent/5 rounded-xl hover:bg-accent/10 transition">
                    🪄 Autofill Product from Document
                  </button>
                )}
                <input ref={autofillInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleAutofillUpload} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Form column */}
        <div className="flex-1 min-w-0">
        <form onSubmit={productId ? (e) => { e.preventDefault(); router.push(`/dashboard/products/${productId}`); } : handleCreateAndContinue} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}



        {/* Product Info */}
        <div className={`bg-surface border border-border rounded-2xl p-6 space-y-5 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Product Information</h2>
            <p className="text-xs text-muted mt-0.5">Core identity and characterisation fields for your device.</p>
          </div>

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

          {/* isSterile + hasSoftware — inline compact toggles */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-start justify-between gap-3 px-3 py-2.5 border border-border rounded-xl">
              <div>
                <div className="text-xs font-semibold text-foreground">Supplied sterile</div>
                <div className="text-[10px] text-muted leading-tight">Affects labelling (MDR 2017 Rule 44) — not used for classification</div>
              </div>
              <button type="button" onClick={() => upd("isSterile", !form.isSterile)}
                className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${form.isSterile ? "bg-accent" : "bg-surface2 border border-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isSterile ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            <div className="flex items-start justify-between gap-3 px-3 py-2.5 border border-border rounded-xl">
              <div>
                <div className="text-xs font-semibold text-foreground">Has embedded software</div>
                <div className="text-[10px] text-muted leading-tight">Software inherits class of parent device (First Schedule Basic Principle iii)</div>
              </div>
              <button type="button" onClick={() => upd("hasSoftware", !form.hasSoftware)}
                className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${form.hasSoftware ? "bg-accent" : "bg-surface2 border border-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.hasSoftware ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
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

          {/* Device Characterisation — Part I for medical-device, Part II for IVD */}
          {form.deviceType === "medical-device" ? (
            <DeviceCharacterisation form={form} upd={upd} specialOpen={specialOpen} setSpecialOpen={setSpecialOpen} />
          ) : (
            <IVDCharacterisation form={form} upd={(f, v) => upd(f, v)} />
          )}
        </div>

        {/* Step 1.5 — Predicate Device & Regulatory Pathway */}
        <div className={`bg-surface border border-border rounded-2xl p-6 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
          <PredicatePathway form={form} upd={upd} productId={productId} />
        </div>

        {/* Step 1.6 / 1.8 / 1.9 — Classification Confirmation & Lock */}
        {form.predicateExists !== null && (
          <div className={`bg-surface border border-border rounded-2xl p-6 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
            <ClassificationLock form={form} upd={upd} />
          </div>
        )}

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


        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
          {loading ? "Creating..." : productId ? "Continue to Product →" : `Save & Continue (${form.countries.length} market${form.countries.length !== 1 ? "s" : ""})`}
        </button>

        </form>
        </div>{/* end form column */}

        {/* Phase 1 Mini Flowchart sidebar */}
        <Phase1MiniFlowchart form={form} />
      </div>
    </div>
  );
}
