"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { REGION_GROUPS } from "@/lib/frameworks";
import Phase1MiniFlowchart from "./Phase1MiniFlowchart";
import DeviceCharacterisation from "./DeviceCharacterisation";
import IVDCharacterisation from "./IVDCharacterisation";
import PredicatePathway from "./PredicatePathway";
import ClassificationLock from "./ClassificationLock";

type UploadedFile = { fileId: string; originalName: string; charCount: number; status: "done" | "uploading" | "error" };

const INDIA_ONLY_NOTICE =
  "India is the required primary market for MDR 2017 / CDSCO registration. Additional jurisdictions can be added after Phase 1 classification is locked.";

const DESCRIPTION_SUGGESTION_LABELS = [
  "Analytical method",
  "Product form",
  "Technology & purpose",
  "DMF-style summary",
  "From document",
  "Alternative",
] as const;

const UPCOMING_MARKETS = [
  { flag: "🇪🇺", name: "European Union" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇦🇺", name: "Australia" },
] as const;

const FIELD_INPUT_CLASS = "w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition";
const LABEL_CLASS = "block text-sm font-medium mb-1.5 text-foreground";

const DRAFT_KEY = "newproduct_draft";
const NS_KEY = "newproduct_namespace_id";

/** Normalise any deviceClass string to just the letter A/B/C/D */
function normalizeDeviceClass(raw: string | undefined): "A" | "B" | "C" | "D" | "" {
  if (!raw) return "";
  const m = raw.toUpperCase().match(/\b([ABCD])\b/);
  return m ? (m[1] as "A" | "B" | "C" | "D") : "";
}

function clearRegistrationDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(NS_KEY);
  } catch {}
}

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const makeNamespaceId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
    // Step 1.6 / 1.7 — CDSCO list & CLA clarification
    cdscoListStatus: "" as "" | "listed" | "ambiguous",
    claClarificationStatus: "not-submitted" as "not-submitted" | "submitted" | "clarified",
    claClarificationRefNo: "",
    claClarificationNotes: "",
    claClarificationSubmittedAt: "" as string,
    // Step 1.8 — Lock
    classificationLocked: false,
    classificationLockedBy: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillDocName, setAutofillDocName] = useState("");
  const [autofillDone, setAutofillDone] = useState(false);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [extractMeta, setExtractMeta] = useState<{
    method: string;
    charCount: number;
    pageCount?: number;
    ocrPages?: number;
  } | null>(null);
  // Multi-country picker (re-enable when markets beyond India are supported)
  // const [search, setSearch] = useState("");
  // const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [productNamespaceId, setProductNamespaceId] = useState<string>(() => makeNamespaceId());
  const [draftHydrated, setDraftHydrated] = useState(false);

  // ── Persist draft to localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const startFresh = searchParams.get("fresh") === "1";
      if (startFresh) {
        clearRegistrationDraft();
        setProductNamespaceId(makeNamespaceId());
        setDraftHydrated(true);
        return;
      }

      const saved = localStorage.getItem(DRAFT_KEY);
      const savedNs = localStorage.getItem(NS_KEY);
      if (saved && savedNs) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed, countries: ["IN"] }));
        setProductNamespaceId(savedNs);
      } else {
        // No in-progress draft — always use a new namespace for a new product
        clearRegistrationDraft();
        setProductNamespaceId(makeNamespaceId());
      }
    } catch {
      setProductNamespaceId(makeNamespaceId());
    } finally {
      setDraftHydrated(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!draftHydrated || productId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form, draftHydrated, productId]);

  useEffect(() => {
    if (!draftHydrated || !productNamespaceId || productId) return;
    try {
      localStorage.setItem(NS_KEY, productNamespaceId);
    } catch {}
  }, [productNamespaceId, draftHydrated, productId]);

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
    setExtractMeta(null);

    // Step 1: Extract text (pdf text layer, or Vision OCR for scanned PDFs)
    let text = "";
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      const d = await res.json();
      if (res.ok) {
        text = d.text;
        setExtractMeta({
          method: d.method ?? "pdf-text",
          charCount: d.charCount ?? d.text?.length ?? 0,
          pageCount: d.pageCount,
          ocrPages: d.ocrPages,
        });
      } else if (d.error) {
        throw new Error(d.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Text extraction failed";
      setError(msg);
      setAutofilling(false);
      return;
    }
    if (!text) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => { text = ev.target?.result as string ?? ""; resolve(); };
        reader.readAsText(file);
      });
    }

    // Step 2: Send to autofill API (chunk → embed → upsert → RAG query → GPT)
    try {
      const nsId = productNamespaceId || makeNamespaceId();
      if (!productNamespaceId) setProductNamespaceId(nsId);
      const res = await fetch("/api/products/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: text, scope: "product", productNamespaceId: nsId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Autofill failed");
      if (typeof data.productNamespaceId === "string" && data.productNamespaceId) {
        setProductNamespaceId(data.productNamespaceId);
      }
      const suggestions = Array.isArray(data.descriptionSuggestions)
        ? data.descriptionSuggestions.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
        : [];
      if (data.description?.trim() && !suggestions.some((s: string) => s.trim() === data.description.trim())) {
        suggestions.unshift(data.description.trim());
      }
      setDescriptionSuggestions(suggestions.slice(0, 6));

      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        manufacturer: data.manufacturer || prev.manufacturer,
        description: data.description || suggestions[0] || prev.description,
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

  const indiaMarket = useMemo(() => {
    for (const rg of REGION_GROUPS) {
      const india = rg.countries.find((c) => c.code === "IN");
      if (india) return india;
    }
    return { code: "IN", name: "India", flag: "🇮🇳", frameworkCount: 0 };
  }, []);

  // ── Country helpers (multi-market — commented until post–Phase 1 lock) ─────
  // function toggleCountry(code: string) { ... }
  // function toggleRegion(region: string) { ... }
  // function selectAllInRegion(codes: string[]) { ... }
  // const filteredRegions = useMemo(() => { ... }, [search]);

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
        body: JSON.stringify({ ...form, vectorNamespaceId: productNamespaceId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      clearRegistrationDraft();
      setProductId(data.product._id);
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  }

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
              Scanned/image PDFs use Vision OCR automatically when little text is detected.
            </p>
            {extractMeta && (
              <div className="text-[11px] px-3 py-2 rounded-lg border border-border bg-surface2 text-muted">
                Last extraction:{" "}
                <strong className="text-foreground">
                  {extractMeta.method === "ocr-vision" ? "OCR (Vision)" : "PDF text layer"}
                </strong>
                {" · "}
                {extractMeta.charCount.toLocaleString()} chars
                {extractMeta.pageCount != null && ` · ${extractMeta.pageCount} pages`}
                {extractMeta.ocrPages != null && extractMeta.method === "ocr-vision" && ` · OCR ${extractMeta.ocrPages} pages`}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Product document</p>
                <p className="text-[10px] text-muted mt-0.5">IFU, brochure, or technical file → product namespace</p>
              </div>
              <div className="shrink-0">
                {autofillDone ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                    ✅ {autofillDocName}
                    <button type="button" onClick={() => { setAutofillDone(false); setAutofillDocName(""); setExtractMeta(null); setDescriptionSuggestions([]); if (autofillInputRef.current) autofillInputRef.current.value = ""; }}
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
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className={LABEL_CLASS + " mb-0"}>Description</label>
              {descriptionSuggestions.length > 0 && (
                <span className="text-[10px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  {descriptionSuggestions.length} AI suggestions
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => upd("description", e.target.value)}
              className={FIELD_INPUT_CLASS}
              placeholder="Brief description of the device, its purpose and technology (CDSCO DMF §1.1b)"
            />
            {descriptionSuggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-muted leading-relaxed">
                  Pick a suggested description from your uploaded document, or edit the field above.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {descriptionSuggestions.map((suggestion, i) => {
                    const selected = form.description.trim() === suggestion.trim();
                    const label = DESCRIPTION_SUGGESTION_LABELS[i] ?? `Option ${i + 1}`;
                    return (
                      <button
                        key={`${i}-${suggestion.slice(0, 32)}`}
                        type="button"
                        onClick={() => upd("description", suggestion)}
                        className={`text-left p-3 rounded-xl border transition ${
                          selected
                            ? "border-accent bg-accent/5 ring-1 ring-accent/25"
                            : "border-border bg-surface2/50 hover:border-accent/35 hover:bg-accent/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${selected ? "text-accent" : "text-muted"}`}>
                            {label}
                          </span>
                          {selected && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                              Applied
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed line-clamp-4">{suggestion}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
        <div className={`bg-surface border border-border rounded-2xl p-6 min-w-0 overflow-hidden ${productId ? "opacity-60 pointer-events-none" : ""}`}>
          <PredicatePathway form={form} upd={upd} productId={productId} />
        </div>

        {/* Step 1.6 / 1.8 / 1.9 — Classification Confirmation & Lock */}
        {form.predicateExists !== null && (
          <div className={`bg-surface border border-border rounded-2xl p-6 ${productId ? "opacity-60 pointer-events-none" : ""}`}>
            <ClassificationLock form={form} upd={upd} />
          </div>
        )}

        {/* Target Markets — Phase 1: India only (MDR 2017 / CDSCO) */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Target Markets *</h2>
              <p className="text-xs text-muted mt-0.5">
                Primary regulatory jurisdiction for this product registration
              </p>
            </div>
            <span className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-surface2 border border-border text-muted font-semibold">
              1 active
            </span>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent/20 bg-accent/5 text-[11px] text-foreground leading-relaxed">
            <span className="shrink-0 mt-0.5 text-base" aria-hidden>🇮🇳</span>
            <p>{INDIA_ONLY_NOTICE}</p>
          </div>

          <div className="rounded-xl border-2 border-accent/35 bg-linear-to-br from-accent/6 via-surface to-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-accent/15 bg-accent/4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Primary market</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-14 h-14 shrink-0 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center text-3xl"
                  aria-hidden
                >
                  {indiaMarket.flag}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{indiaMarket.name}</h3>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface2 border border-border text-muted">
                      {indiaMarket.code}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">CDSCO · Medical Devices Rules, 2017 (India)</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-800 border border-green-200">
                      MDR 2017
                    </span>
                    {indiaMarket.frameworkCount > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface2 text-muted border border-border">
                        {indiaMarket.frameworkCount} dossier framework{indiaMarket.frameworkCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      Selected
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted font-semibold">Status</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">Ready for registration</div>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-border/80">
            <p className="text-[11px] font-medium text-muted mb-2">
              Additional markets
              <span className="font-normal text-muted/80"> — available after Phase 1 classification lock</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {UPCOMING_MARKETS.map((m) => (
                <span
                  key={m.name}
                  title="Available after Phase 1 classification is locked"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-surface2/80 text-xs text-muted opacity-60 cursor-not-allowed"
                >
                  <span aria-hidden>{m.flag}</span>
                  <span>{m.name}</span>
                  <span className="text-[9px] uppercase tracking-wide font-semibold">Soon</span>
                </span>
              ))}
            </div>
          </div>

          {/*
          Multi-country picker — restore when additional markets are enabled post–Phase 1 lock:
          - search / collapsed state
          - toggleCountry, toggleRegion, selectAllInRegion, filteredRegions
          - region accordion with filteredRegions.map(...)
          */}
        </div>


        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
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
