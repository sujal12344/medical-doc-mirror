"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RegulatoryFieldEditor } from "@/components/documents/RegulatoryFieldEditor";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { FrameworkSection } from "@/lib/frameworks";
import { countDocumentFieldCompletion, normalizeDocumentSections } from "@/lib/normalizeDocument";
import { downloadAsDoc } from "@/lib/downloadHelper";

type DocData = {
  _id: string;
  title: string;
  countryCode: string;
  frameworkId: string;
  productId: string;
  status: string;
  version: number;
  sections: Record<string, { fields: Record<string, string>; completionPct: number }>;
  updatedAt?: string | Date;
};

type ProductForIndex = {
  _id: string;
  vectorNamespaceId?: string;
  name?: string;
  description?: string;
  intendedUse?: string;
  uploadedDocs?: { originalName: string; extractedText: string }[];
  predDevice?: {
    predicateName?: string;
    predicateManufacturer?: string;
    predicateBasis?: string;
    predicateClass?: string;
  };
};

function buildProductIndexText(product: ProductForIndex, extraText: string): string {
  const pred = product.predDevice;
  return [
    ...(product.uploadedDocs || []).map((d) => `--- ${d.originalName} ---\n${d.extractedText}`),
    extraText ? `--- DMF chat upload ---\n${extraText}` : "",
    product.name ? `Product: ${product.name}` : "",
    product.description ? `Description: ${product.description}` : "",
    product.intendedUse ? `Intended use: ${product.intendedUse}` : "",
    pred?.predicateName ? `Predicate device: ${pred.predicateName}` : "",
    pred?.predicateManufacturer ? `Predicate manufacturer: ${pred.predicateManufacturer}` : "",
    pred?.predicateClass ? `Predicate class: Class ${pred.predicateClass}` : "",
    pred?.predicateBasis ? `Predicate rationale / distinguishing features: ${pred.predicateBasis}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function upsertProductKnowledgeIndex(
  productId: string,
  extraText: string,
): Promise<{ chunksIndexed: number; namespace: string } | null> {
  const pr = await fetch(`/api/products/${productId}`);
  if (!pr.ok) return null;
  const { product } = (await pr.json()) as { product?: ProductForIndex };
  if (!product) return null;

  const documentText = buildProductIndexText(product, extraText);
  if (!documentText.trim()) return null;

  const productNamespaceId = product.vectorNamespaceId || product._id;
  const r = await fetch("/api/products/autofill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText, productNamespaceId, indexOnly: true }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error as string) || "Pinecone index failed");
  return { chunksIndexed: data.chunksIndexed as number, namespace: data.namespace as string };
}

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [framework, setFramework] = useState<typeof FRAMEWORKS[0] | null>(null);
  const [activeSection, setActiveSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [initialAutofillDone, setInitialAutofillDone] = useState(false);
  const [chatDocContext, setChatDocContext] = useState("");
  const [coaLoading, setCoaLoading] = useState(false);
  const [coaDocContext, setCoaDocContext] = useState("");
  const coaFileRef = useRef<HTMLInputElement>(null);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [stabilityUploading, setStabilityUploading] = useState(false);
  const [stabilityUploadStatus, setStabilityUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [stabilityUploadMsg, setStabilityUploadMsg] = useState("");
  const [analyticalUploading, setAnalyticalUploading] = useState(false);
  const [analyticalUploadStatus, setAnalyticalUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [analyticalUploadMsg, setAnalyticalUploadMsg] = useState("");
  const [analyticalTargetFile, setAnalyticalTargetFile] = useState<File | null>(null);
  const [section5Uploading, setSection5Uploading] = useState(false);
  const [section5UploadStatus, setSection5UploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [section5UploadMsg, setSection5UploadMsg] = useState("");
  const [section6Generating, setSection6Generating] = useState(false);
  const [section6Status, setSection6Status] = useState<"idle" | "success" | "error">("idle");
  const [section6Msg, setSection6Msg] = useState("");
  const [chatFileRef] = [useRef<HTMLInputElement>(null)];
  const stabilityFileRef = useRef<HTMLInputElement>(null);
  const initialAutofillStarted = useRef(false);
  const [stabilityFiles, setStabilityFiles] = useState<File[]>([]);
  // Per-report loading / status
  const [inuseGenerating, setInuseGenerating] = useState(false);
  const [inuseStatus, setInuseStatus] = useState<"idle" | "success" | "error">("idle");
  const [inuseMsg, setInuseMsg] = useState("");
  const [accelGenerating, setAccelGenerating] = useState(false);
  const [accelStatus, setAccelStatus] = useState<"idle" | "success" | "error">("idle");
  const [accelMsg, setAccelMsg] = useState("");
  const [shippingGenerating, setShippingGenerating] = useState(false);
  const [shippingStatus, setShippingStatus] = useState<"idle" | "success" | "error">("idle");
  const [shippingMsg, setShippingMsg] = useState("");

  useEffect(() => {
    fetch(`/api/documents/${id}`).then((r) => r.json()).then((data) => {
      if (data.document) {
        const normalized = {
          ...data.document,
          sections: normalizeDocumentSections(data.document.sections),
        };
        setDoc(normalized);
        const fw = FRAMEWORKS.find((f) => f.id === data.document.frameworkId);
        setFramework(fw || null);
        if (fw) setActiveSection(fw.sections[0]?.id || "");
      }
    });
  }, [id]);

  const refetchDocument = useCallback(async () => {
    try {
      const r = await fetch(`/api/documents/${id}`);
      const data = await r.json();
      if (data.document) {
        setDoc((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: normalizeDocumentSections(data.document.sections),
            version: data.document.version,
            updatedAt: data.document.updatedAt,
          };
        });
      }
    } catch (err) {
      console.error("Failed to refetch document:", err);
    }
  }, [id]);

  const getFieldValue = useCallback((sectionId: string, fieldId: string) => {
    return doc?.sections?.[sectionId]?.fields?.[fieldId] || "";
  }, [doc]);

  function setFieldValue(sectionId: string, fieldId: string, value: string) {
    setDoc((prev) => {
      if (!prev) return prev;
      const sections = { ...prev.sections };
      if (!sections[sectionId]) sections[sectionId] = { fields: {}, completionPct: 0 };
      sections[sectionId] = { ...sections[sectionId], fields: { ...sections[sectionId].fields, [fieldId]: value } };
      return { ...prev, sections };
    });
  }

  async function saveSection(sectionId: string) {
    if (!doc || !framework) return;
    setSaving(true);
    const section = framework.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const fields: Record<string, string> = {};
    section.fields.forEach((f) => { fields[f.id] = getFieldValue(sectionId, f.id); });
    await fetch(`/api/documents/${id}/sections`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, fields }),
    });
    setSaving(false);
  }

  async function createVersion() {
    if (!doc || !framework) return;
    setSaving(true);
    // Save every section that has any field value before snapshotting the version
    await Promise.all(
      framework.sections.map((s) => {
        const fields: Record<string, string> = {};
        s.fields.forEach((f) => { fields[f.id] = getFieldValue(s.id, f.id); });
        const hasContent = Object.values(fields).some((v) => v.trim());
        if (!hasContent) return Promise.resolve();
        return fetch(`/api/documents/${id}/sections`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: s.id, fields }),
        });
      }),
    );
    setSaving(false);
    const note = prompt("Version note (optional):");
    await fetch(`/api/documents/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeNote: note || "" }),
    });
    const r = await fetch(`/api/documents/${id}`);
    const data = await r.json();
    if (data.document) {
      setDoc({
        ...data.document,
        sections: normalizeDocumentSections(data.document.sections),
      });
    }
  }

  const runAutofill = useCallback(async (opts?: { isInitial?: boolean }) => {
    if (!doc || autofilling) return;
    setAutofilling(true);
    const startMsg = opts?.isInitial
      ? "Opening document — auto-filling from your registered product and uploaded IFU…"
      : "Indexing product knowledge to Pinecone, then running DMF auto-fill…";
    setChatMessages((prev) => [...prev, { role: "bot", text: startMsg }]);
    try {
      if (!opts?.isInitial && doc.productId) {
        try {
          const indexed = await upsertProductKnowledgeIndex(doc.productId, chatDocContext);
          if (indexed) {
            setChatMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: `Indexed ${indexed.chunksIndexed} chunk(s) to ${indexed.namespace} (product RAG namespace).`,
              },
            ]);
          }
        } catch (indexErr) {
          setChatMessages((prev) => [
            ...prev,
            { role: "bot", text: `Pinecone index skipped: ${indexErr instanceof Error ? indexErr.message : "failed"}` },
          ]);
        }
      }

      const r = await fetch(`/api/documents/${id}/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraText: chatDocContext + (coaDocContext ? `\n\n=== COA DATA ===\n${coaDocContext}` : "") }),
      });
      const data = await r.json();
      if (r.ok) {
        if (opts?.isInitial && typeof window !== "undefined") {
          sessionStorage.setItem(`dmf_autofill_open_${id}`, "1");
        }
        const detail = opts?.isInitial
          ? `Auto-fill complete on open — ${data.filledCount} fields filled (${data.productPrefillCount ?? 0} from Phase 1 product).`
          : `Auto-fill complete! ${data.filledCount} fields filled (${data.totalParsed} GPT values parsed).`;
        setChatMessages((prev) => [...prev, { role: "bot", text: detail }]);
        const refreshRes = await fetch(`/api/documents/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.document) {
          setDoc({
            ...refreshData.document,
            sections: normalizeDocumentSections(refreshData.document.sections),
          });
        }
      } else {
        setChatMessages((prev) => [...prev, { role: "bot", text: `Auto-fill issue: ${data.error || "Unknown error"}` }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Auto-fill failed. Check connection." }]);
    }
    setAutofilling(false);
    setInitialAutofillDone(true);
  }, [autofilling, chatDocContext, doc, id]);

  useEffect(() => {
    if (!doc || !framework || initialAutofillStarted.current) return;

    const totalFields = framework.sections.reduce((n, s) => n + s.fields.length, 0);
    const { filled, pct } = countDocumentFieldCompletion(doc.sections, totalFields);
    const sessionKey = `dmf_autofill_open_${id}`;
    const alreadyRan = typeof window !== "undefined" && sessionStorage.getItem(sessionKey) === "1";

    // Auto-fill on first open when document is new/empty, or once per browser session
    const shouldAutofill = !alreadyRan && (filled === 0 || pct < 15);
    if (!shouldAutofill) {
      setInitialAutofillDone(true);
      return;
    }

    initialAutofillStarted.current = true;
    void runAutofill({ isInitial: true });
  }, [doc, framework, id, runAutofill]);

  async function handleChatFileUpload(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    setChatMessages((prev) => [...prev, { role: "user", text: `Uploading ${file.name}...` }]);
    setChatLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const r = await fetch(`/api/documents/${id}/chat-upload`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok) {
        setChatDocContext((prev) => prev + "\n\n" + data.extractedText);
        setChatMessages((prev) => [...prev, {
          role: "bot",
          text: `Uploaded "${data.fileName}" (${data.charCount.toLocaleString()} chars extracted). You can now:\n• Click "Auto-fill" to fill form fields\n• Ask questions about the document`,
        }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "bot", text: data.error || "Upload failed" }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Upload failed" }]);
    }
    setChatLoading(false);
  }

  async function handleStabilityGenerate(type: "inuse" | "accelerated" | "shipping") {
    if (!doc) return;
    if (stabilityFiles.length === 0) {
      const setter = type === "inuse" ? setInuseMsg : type === "accelerated" ? setAccelMsg : setShippingMsg;
      const statusSetter = type === "inuse" ? setInuseStatus : type === "accelerated" ? setAccelStatus : setShippingStatus;
      setter("Please select at least one file first.");
      statusSetter("error");
      return;
    }

    const setGenerating = type === "inuse" ? setInuseGenerating : type === "accelerated" ? setAccelGenerating : setShippingGenerating;
    const setStatus = type === "inuse" ? setInuseStatus : type === "accelerated" ? setAccelStatus : setShippingStatus;
    const setMsg = type === "inuse" ? setInuseMsg : type === "accelerated" ? setAccelMsg : setShippingMsg;
    const label = type === "inuse" ? "In-Use" : type === "accelerated" ? "Accelerated (Shelf Life)" : "Shipping";
    const docLabel = type === "inuse" ? "In-Use_Stability_Study_Report" : type === "accelerated" ? "Accelerated_Stability_Study_Report" : "Shipping_Stability_Study_Report";
    const fieldKey = type === "inuse" ? "sr_inuse" : type === "accelerated" ? "sr_accelerated" : "sr_shipping";

    setGenerating(true);
    setStatus("idle");
    setMsg(`Generating ${label} Stability Report… This may take a minute.`);

    const fd = new FormData();
    for (const file of stabilityFiles) fd.append("file", file);
    fd.append("type", type);

    try {
      const r = await fetch(`/api/documents/${id}/stability-all`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.success) {
        const results = data.results as Record<string, string>;

        // Update the stability report field in local state
        if (results[fieldKey]) setFieldValue("s_stability_reports", fieldKey, results[fieldKey]);

        // Update concise DMF summary sections
        if (type === "inuse" && results["inuse_desc"]) setFieldValue("s17_inuse", "17.0a", results["inuse_desc"]);
        if (type === "accelerated" && results["shelf_desc"]) setFieldValue("s16_shelf", "16.0a", results["shelf_desc"]);
        if (type === "shipping" && results["shipping_desc"]) setFieldValue("s18_shipping", "18.0a", results["shipping_desc"]);
        if (results["overview"]) setFieldValue("s14_stability", "15.0a", results["overview"]);

        // Auto-download the full report
        if (results[fieldKey]) {
          downloadAsDoc({ label: docLabel, fieldId: fieldKey, safeValue: results[fieldKey] });
        }

        setStatus("success");
        setMsg(`✅ ${label} Stability Report generated and downloaded!`);
      } else {
        setStatus("error");
        setMsg(data.error || `Failed to generate ${label} report.`);
      }
    } catch {
      setStatus("error");
      setMsg("Network error: failed to connect to generation service.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAnalyticalAllUpload(files: FileList) {
    if (!files.length || !doc) return;
    setAnalyticalUploading(true);
    setAnalyticalUploadStatus("idle");
    setAnalyticalUploadMsg(`Processing ${files.length} file(s)... Generating all analytical and sensitivity reports…`);

    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("file", file);
    }
    // Attach target file if the user uploaded one
    if (analyticalTargetFile) {
      fd.append("targetFile", analyticalTargetFile);
    }

    try {
      const r = await fetch(`/api/documents/${id}/analytical-all`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.success) {
        // Update local state for all fields
        const fieldMap: Record<string, { sectionId: string; fieldId: string }> = {
          "7": { sectionId: "s7", fieldId: "7" },
          "7.1": { sectionId: "s7", fieldId: "7.1" },
          "7.1a": { sectionId: "s7", fieldId: "7.1a" },
          "7.2": { sectionId: "s7", fieldId: "7.2" },
          "7.3": { sectionId: "s7", fieldId: "7.3" },
          "8.1": { sectionId: "s8", fieldId: "8.1" },
          "9.1": { sectionId: "s9", fieldId: "9.1" },
          "10.0a": { sectionId: "s10_sensitivity", fieldId: "10.0a" },
          "10.1": { sectionId: "s10_sensitivity", fieldId: "10.1" },
          "11.0a": { sectionId: "s11_specificity", fieldId: "11.0a" },
          "11.1": { sectionId: "s11_specificity", fieldId: "11.1" },
        };
        for (const [fieldId, mapping] of Object.entries(fieldMap)) {
          const content = (data.results as Record<string, string>)[fieldId];
          if (content !== undefined) setFieldValue(mapping.sectionId, mapping.fieldId, content);
        }

        setAnalyticalUploadStatus("success");
        setAnalyticalUploadMsg(
          `✅ Generated analytical, specimen type, reproducibility and sensitivity studies from "${data.filesUploaded}" successfully.`
        );
      } else {
        setAnalyticalUploadStatus("error");
        setAnalyticalUploadMsg(data.error || "Failed to generate analytical reports.");
      }
    } catch {
      setAnalyticalUploadStatus("error");
      setAnalyticalUploadMsg("Network error: failed to connect to analytical upload service.");
    } finally {
      setAnalyticalUploading(false);
    }
  }

  async function handleSection6Generate() {
    if (!doc) return;
    setSection6Generating(true);
    setSection6Status("idle");
    setSection6Msg("Generating Section 6 — Product Validation & Verification from Pinecone knowledge and existing sections…");
    try {
      const r = await fetch(`/api/documents/${id}/section6`, { method: "POST" });
      const data = await r.json();
      if (r.ok && data.success) {
        const fieldMap: Record<string, { sectionId: string; fieldId: string }> = {
          "6.1": { sectionId: "s6", fieldId: "6.1" },
          "6.2": { sectionId: "s6", fieldId: "6.2" },
          "6.3": { sectionId: "s6", fieldId: "6.3" },
          "6.4": { sectionId: "s6", fieldId: "6.4" },
          "6.5": { sectionId: "s6", fieldId: "6.5" },
        };
        for (const [fieldId, mapping] of Object.entries(fieldMap)) {
          const content = (data.results as Record<string, string>)[fieldId];
          if (content !== undefined) setFieldValue(mapping.sectionId, mapping.fieldId, content);
        }
        setSection6Status("success");
        setSection6Msg("✅ Section 6 generated successfully — all 5 fields auto-filled from product knowledge and study data.");
      } else {
        setSection6Status("error");
        setSection6Msg(data.error || "Failed to generate Section 6.");
      }
    } catch {
      setSection6Status("error");
      setSection6Msg("Network error: failed to connect to Section 6 generation service.");
    } finally {
      setSection6Generating(false);
    }
  }

  async function handleSection5Upload(files: FileList) {
    if (!files.length || !doc) return;
    setSection5Uploading(true);
    setSection5UploadStatus("idle");
    setSection5UploadMsg(`Processing ${files.length} file(s)… Generating Section 5 design & manufacturing content…`);

    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("file", file);
    }

    try {
      // Field 5.0 triggers generation of all section 5 fields (5.0–5.4)
      const r = await fetch(`/api/documents/${id}/fields/5.0/upload`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.success) {
        // The backend stores generatedValues for all 5.x fields; refresh doc from server
        const refreshRes = await fetch(`/api/documents/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.document) {
          const { normalizeDocumentSections } = await import("@/lib/normalizeDocument");
          setDoc({
            ...refreshData.document,
            sections: normalizeDocumentSections(refreshData.document.sections),
          });
        }
        setSection5UploadStatus("success");
        setSection5UploadMsg(`✅ Section 5 generated from "${data.fileName}" successfully.`);
      } else {
        setSection5UploadStatus("error");
        setSection5UploadMsg(data.error || "Failed to generate Section 5 content.");
      }
    } catch {
      setSection5UploadStatus("error");
      setSection5UploadMsg("Network error: failed to connect to upload service.");
    } finally {
      setSection5Uploading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const ctx = doc ? `Document: ${doc.title}\nFramework: ${doc.frameworkId}\nCountry: ${doc.countryCode}` : "";
      const docCtx = chatDocContext ? `\n\nUploaded document content (use this to answer questions and suggest field values):\n${chatDocContext.slice(0, 30000)}` : "";
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system", content: `You are a regulatory documentation expert. Help the user fill out their ${framework?.documentType || "regulatory"} document for ${framework?.countryName || "their target market"}. ${ctx}${docCtx}

IMPORTANT: When the user asks to fill a specific field, respond with the exact value AND include this machine-readable tag at the end: [FILL:sectionId:fieldId:value]. For example: [FILL:sec1:field1:HIV-1/2 Antibody]` },
            { role: "user", content: msg },
          ],
          max_tokens: 1200,
        }),
      });
      const data = await r.json();
      const content = data.content || "No response";

      const fillMatch = content.match(/\[FILL:([^:]+):([^:]+):([^\]]+)\]/);
      if (fillMatch) {
        const [, sectionId, fieldId, value] = fillMatch;
        setFieldValue(sectionId, fieldId, value);
        const cleanText = content.replace(/\[FILL:[^\]]+\]/, "").trim();
        setChatMessages((prev) => [...prev, { role: "bot", text: `${cleanText}\n\n✅ Field updated!` }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "bot", text: content }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Connection error" }]);
    }
    setChatLoading(false);
  }

  if (!doc || !framework) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading document…</p>
          <p className="text-xs text-muted mt-1">Preparing regulatory sections</p>
        </div>
      </div>
    );
  }

  const currentSection: FrameworkSection | undefined = framework.sections.find((s) => s.id === activeSection);
  const sectionPct = currentSection ? (doc.sections?.[currentSection.id]?.completionPct ?? 0) : 0;
  const sectionFilled = currentSection
    ? currentSection.fields.filter((f) => String(getFieldValue(currentSection.id, f.id)).trim().length > 0).length
    : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0">
      {/* Section Nav */}
      <div className="w-60 bg-surface border-r border-border overflow-y-auto shrink-0 p-3">
        <Link href={`/dashboard/products`} className="text-xs text-muted hover:text-foreground mb-3 block">&larr; Back</Link>
        <p className="text-xs font-semibold text-foreground mb-1 truncate">{doc.title}</p>
        <p className="text-[10px] text-muted mb-4">v{doc.version} &middot; {doc.status}</p>
        <div className="space-y-0.5">
          {framework.sections.map((s) => {
            const pct = doc.sections?.[s.id]?.completionPct || 0;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${activeSection === s.id ? "bg-accent/10 text-accent font-semibold border border-accent/20" : "text-muted hover:bg-surface2"}`}>
                <span className="block truncate">{s.title}</span>
                {pct > 0 && <span className="text-[10px] opacity-70">{pct}% complete</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <button
            onClick={createVersion}
            disabled={saving}
            className="w-full text-xs px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold transition disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving…" : "Save Document"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto min-w-0 relative">
        {autofilling && !initialAutofillDone ? (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 border-b border-accent/20 bg-accent/5 px-4 py-2.5 text-xs text-foreground">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Auto-filling from Phase 1 product data and documents…
          </div>
        ) : null}
        {currentSection ? (
          <div className={`max-w-4xl mx-auto p-6 pb-24 ${autofilling && !initialAutofillDone ? "pt-14" : ""}`}>

            {/* Global Document Upload (Knowledge Base) */}
            <div className="mb-6 border border-border rounded-2xl bg-surface overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setKnowledgeBaseOpen((o) => !o)}
                  className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition"
                >
                  <span className="text-sm font-semibold text-foreground">Knowledge Base</span>
                  {chatDocContext && (
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
                    + Add document
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
                    Auto-populate document fields using your Phase 1 Product Data (IFU, Brochures, etc) or upload additional reference documents below.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">IFU Auto-fill</p>
                      <p className="text-[10px] text-muted mt-0.5">Use existing IFU & product registration data from phase 1</p>
                    </div>
                    <div className="shrink-0">
                      <button type="button" onClick={() => {
                        if (!autofilling) {
                          runAutofill({ isInitial: false });
                        }
                      }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition ${autofilling ? "text-muted border-border bg-surface" : "text-accent border-accent/40 bg-accent/5 hover:bg-accent/10"}`}>
                        {autofilling ? "Running…" : "🪄 Run Auto-fill"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">COA document</p>
                      <p className="text-[10px] text-muted mt-0.5">.pdf, .docx, .doc, .png, .jpg</p>
                    </div>
                    <div className="shrink-0">
                      {coaLoading ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent bg-accent/5 border border-accent/20 rounded-xl">
                          <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                          Processing…
                        </div>
                      ) : coaDocContext ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                            ✅ Uploaded
                            <button type="button" onClick={() => setCoaDocContext("")}
                              className="ml-1 text-muted hover:text-foreground">✕</button>
                          </div>
                          {/* Autofill button is shared with Source Document, so no need for a duplicate autofill button here */}
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => coaFileRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent border border-accent/40 bg-accent/5 rounded-xl hover:bg-accent/10 transition">
                            Upload COA
                          </button>
                          <input ref={coaFileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => {
                            if (e.target.files?.length) handleChatFileUpload(e.target.files);
                            e.target.value = "";
                          }} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-border bg-surface2/60 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                    {framework.documentType}
                  </p>
                  <h2 className="text-xl font-bold text-foreground">{currentSection.title}</h2>
                  {currentSection.description ? (
                    <p className="text-sm text-muted mt-1 max-w-2xl">{currentSection.description}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{sectionPct}%</p>
                  <p className="text-[10px] text-muted">
                    {sectionFilled} of {currentSection.fields.length} fields
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${sectionPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-5">
              {/* Section 5 combined upload panel */}
              {currentSection.id === "s5" && (
                <div className="rounded-xl border border-dashed border-violet-400/50 bg-violet-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-400/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Generate Section 5 — Design & Manufacturing</p>
                      <p className="text-xs text-muted">Upload your IFU, COA or manufacturing documents to auto-generate all §5 fields: the Essential Requirements Checklist, Device Design, Manufacturing Process, QC Flow Chart, and Manufacturing Site.</p>
                    </div>
                  </div>
                  {section5UploadMsg && (
                    <p className={`text-xs mb-3 font-medium rounded-lg px-3 py-2 ${section5UploadStatus === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : section5UploadStatus === "error"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        : "bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20"
                      }`}>
                      {section5UploadMsg}
                    </p>
                  )}
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition shadow-sm ${section5Uploading
                    ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60"
                    : "border-violet-400/40 text-violet-600 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/60"
                    }`}>
                    {section5Uploading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating Section 5 content…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        Upload Design & Manufacturing Documents (.pdf, .docx)
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      multiple
                      className="hidden"
                      disabled={section5Uploading}
                      onChange={(e) => {
                        if (e.target.files?.length) handleSection5Upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Section 6 — Product Validation & Verification AI Generation Panel */}
              {currentSection.id === "s6" && (
                <div className="rounded-xl border border-dashed border-teal-400/50 bg-teal-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-400/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Generate Section 6 — Product Validation &amp; Verification</p>
                      <p className="text-xs text-muted">Uses Pinecone product knowledge, uploaded documents, and already-generated §7–§11 study data to auto-fill all five §6 fields: COA Summary, Detailed Information, Validation Protocol, Results, and Conclusion.</p>
                    </div>
                  </div>
                  {section6Msg && (
                    <p className={`text-xs mb-3 font-medium rounded-lg px-3 py-2 ${section6Status === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : section6Status === "error"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        : "bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20"
                      }`}>
                      {section6Msg}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={section6Generating}
                    onClick={handleSection6Generate}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition shadow-sm ${section6Generating
                      ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60"
                      : "border-teal-400/40 text-teal-600 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 hover:border-teal-400/60"
                      }`}
                  >
                    {section6Generating ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating Section 6…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Generate §6 Product Validation &amp; Verification
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-[10px] text-muted">Tip: Run this after generating §7 Analytical Studies for the most complete output. Results are drawn from Pinecone RAG and already-saved section data.</p>
                </div>
              )}

              {/* Combined Analytical Studies Upload Panel — shown ONLY on Section 7 */}
              {currentSection.id === "s7" && (
                <div className="rounded-xl border border-dashed border-indigo-400/50 bg-indigo-500/5 p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Generate Analytical Studies, Specimen Type, Reproducibility &amp; Sensitivity Reports</p>
                      <p className="text-xs text-muted">Upload your performance validation data. Sections §7, §8, §9 and §10 are auto-filled with precise tables.</p>
                    </div>
                  </div>

                  {/* Two-step workflow */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/5 p-3">
                      <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide mb-2">Upload Lab / Performance Study Reports</p>
                      <p className="text-[11px] text-muted mb-3">Upload the raw study data or performance validation report (can select multiple files).</p>
                      {analyticalUploadMsg && (
                        <p className={`text-xs mb-3 font-medium rounded-lg px-3 py-2 ${analyticalUploadStatus === "success"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : analyticalUploadStatus === "error"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20"
                          }`}>
                          {analyticalUploadMsg}
                        </p>
                      )}
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition shadow-sm ${analyticalUploading
                        ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60"
                        : "border-indigo-400/40 text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400/60"
                        }`}>
                        {analyticalUploading ? (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generating all analytical reports…
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            Upload Analytical Study Files (.pdf, .docx)
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          multiple
                          className="hidden"
                          disabled={analyticalUploading}
                          onChange={(e) => {
                            if (e.target.files?.length) handleAnalyticalAllUpload(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}


              {/* Combined Stability Upload Panel — shown ONLY on the Stability Reports section */}
              {currentSection.id === "s_stability_reports" && (
                <div className="rounded-xl border border-dashed border-blue-400/50 bg-blue-500/5 p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                        {stabilityUploadMsg}
                      </p>
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition shadow-sm ${stabilityUploading
                        ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60"
                        : "border-blue-400/40 text-blue-600 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60"
                        }`}>
                        {stabilityUploading && (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-semibold text-foreground">
                              Generate Stability Reports
                            </p>
                            <p className="text-xs text-muted">
                              Upload your IFU and COA documents once, then generate each report independently.
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Step 1: File picker */}
                  <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-3">
                    <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-2">Step 1 — Select Document Files</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-blue-400/40 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60 transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        {stabilityFiles.length > 0 ? `${stabilityFiles.length} file(s) selected` : "Choose Files (.pdf, .docx)"}
                        <input
                          ref={stabilityFileRef}
                          type="file"
                          accept=".pdf,.docx"
                          multiple
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.length) setStabilityFiles(Array.from(e.target.files)); }}
                        />
                      </label>
                      {stabilityFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {stabilityFiles.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-400/20 text-[10px] text-blue-400">
                              📄 {f.name}
                              <button type="button" onClick={() => setStabilityFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-red-400 transition">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Three generate buttons */}
                  <div>
                    <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-3">Step 2 — Generate Individual Reports</p>
                    <div className="grid grid-cols-1 gap-3">

                      {/* In-Use */}
                      <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">🔬 In-Use Stability Report</p>
                            <p className="text-[11px] text-muted mt-0.5">One table per week (Day 0, Week 1–4). Fills §17 DMF section.</p>
                          </div>
                          <button type="button" disabled={inuseGenerating} onClick={() => handleStabilityGenerate("inuse")}
                            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition shadow-sm flex-shrink-0 ${inuseGenerating ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60" : "border-blue-400/40 text-blue-600 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60"}`}>
                            {inuseGenerating ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating…</> : "Generate"}
                          </button>
                        </div>
                        {inuseMsg && <p className={`text-[11px] mt-2 font-medium rounded-lg px-2.5 py-1.5 ${inuseStatus === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : inuseStatus === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>{inuseMsg}</p>}
                        {getFieldValue("s_stability_reports", "sr_inuse") && (
                          <button type="button" onClick={() => downloadAsDoc({ label: "In-Use_Stability_Study_Report", fieldId: "sr_inuse", safeValue: getFieldValue("s_stability_reports", "sr_inuse") })}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-blue-400/30 bg-blue-500/10 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 transition">
                            ⬇ Download In-Use Report (.doc)
                          </button>
                        )}
                      </div>

                      {/* Accelerated */}
                      <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/5 p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">⚗️ Accelerated (Shelf Life) Report</p>
                            <p className="text-[11px] text-muted mt-0.5">3 lots × 6 time points = 18 tables (Day 0, Week 1–5 per lot). Fills §16 DMF section.</p>
                          </div>
                          <button type="button" disabled={accelGenerating} onClick={() => handleStabilityGenerate("accelerated")}
                            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition shadow-sm flex-shrink-0 ${accelGenerating ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60" : "border-indigo-400/40 text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400/60"}`}>
                            {accelGenerating ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating…</> : "Generate"}
                          </button>
                        </div>
                        {accelMsg && <p className={`text-[11px] mt-2 font-medium rounded-lg px-2.5 py-1.5 ${accelStatus === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : accelStatus === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"}`}>{accelMsg}</p>}
                        {getFieldValue("s_stability_reports", "sr_accelerated") && (
                          <button type="button" onClick={() => downloadAsDoc({ label: "Accelerated_Stability_Study_Report", fieldId: "sr_accelerated", safeValue: getFieldValue("s_stability_reports", "sr_accelerated") })}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 transition">
                            ⬇ Download Accelerated Report (.doc)
                          </button>
                        )}
                      </div>

                      {/* Shipping */}
                      <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">🚚 Shipping Stability Report</p>
                            <p className="text-[11px] text-muted mt-0.5">One table per day (Day 0–7). Fills §18 DMF section.</p>
                          </div>
                          <button type="button" disabled={shippingGenerating} onClick={() => handleStabilityGenerate("shipping")}
                            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition shadow-sm flex-shrink-0 ${shippingGenerating ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60" : "border-cyan-400/40 text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400/60"}`}>
                            {shippingGenerating ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating…</> : "Generate"}
                          </button>
                        </div>
                        {shippingMsg && <p className={`text-[11px] mt-2 font-medium rounded-lg px-2.5 py-1.5 ${shippingStatus === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : shippingStatus === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"}`}>{shippingMsg}</p>}
                        {getFieldValue("s_stability_reports", "sr_shipping") && (
                          <button type="button" onClick={() => downloadAsDoc({ label: "Shipping_Stability_Study_Report", fieldId: "sr_shipping", safeValue: getFieldValue("s_stability_reports", "sr_shipping") })}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/20 transition">
                            ⬇ Download Shipping Report (.doc)
                          </button>
                        )}
                      </div>

                    </div>
                    <p className="mt-3 text-[10px] text-muted">Each report auto-downloads as a complete .doc file. §14, §16, §17, §18 DMF sections are also auto-filled.</p>
                  </div>
                </div>
              )}

              {currentSection.fields.map((field) => (
                <RegulatoryFieldEditor
                  key={field.id}
                  fieldId={field.id}
                  label={field.label}
                  hint={field.hint}
                  textarea={field.textarea}
                  allowUpload={field.allowUpload}
                  fieldType={field.fieldType}
                  documentId={doc._id}
                  value={getFieldValue(currentSection.id, field.id)}
                  onChange={(v) => setFieldValue(currentSection.id, field.id, v)}
                  onUploadComplete={refetchDocument}
                  allFields={doc?.sections?.[currentSection.id]?.fields || {}}
                  documentVersion={doc?.version}
                  documentUpdatedAt={doc?.updatedAt}
                  documentTitle={doc?.title}
                  redirectSectionId={field.redirectSectionId}
                  redirectLabel={field.redirectLabel}
                  onRedirect={(s) => setActiveSection(s)}
                />
              ))}

            </div>
          </div>
        ) : (
          <p className="text-muted">Select a section from the left</p>
        )}
      </div>

      {/* Chat */}
      <div className="w-80 bg-surface border-l border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-foreground">AI Assistant</h3>
              <p className="text-[10px] text-muted">Upload docs or ask questions</p>
            </div>
            <button onClick={() => runAutofill()} disabled={autofilling}
              className="text-[10px] px-2.5 py-1 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50">
              {autofilling ? "Filling..." : "Auto-fill"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.length === 0 && (
            <div className="text-[11px] text-muted p-3 bg-surface2 rounded-lg border border-border">
              <p className="font-medium text-foreground mb-1">Welcome!</p>
              <p className="mb-2">New documents auto-fill on open from your registered product. Upload IFU with 📎 and click <strong>Auto-fill</strong> to refresh from documents.</p>
              <p>You can also ask questions about any field or type &quot;fill [field] = [value]&quot; to update directly.</p>
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} className={`text-xs p-2.5 rounded-lg whitespace-pre-wrap ${m.role === "user" ? "bg-surface2 ml-6 text-foreground" : "bg-[var(--accent)]/5 border border-[var(--accent)]/10 text-foreground mr-4"}`}>
              {m.text}
            </div>
          ))}
          {chatLoading && <div className="text-xs text-muted p-2 animate-pulse">Thinking...</div>}
        </div>
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <input ref={chatFileRef} type="file" accept=".pdf,.txt,.csv,.xml,.json,.md,.doc,.docx" className="hidden"
              onChange={(e) => { if (e.target.files?.length) handleChatFileUpload(e.target.files); e.target.value = ""; }} />
            <button onClick={() => chatFileRef.current?.click()} disabled={chatLoading}
              className="px-2.5 py-2 border border-border rounded-lg hover:bg-surface2 transition text-muted disabled:opacity-50" title="Upload document">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
            </button>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Ask or upload a document..."
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition" />
            <button onClick={sendChat} disabled={chatLoading}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-[var(--accent-hover)] transition">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
