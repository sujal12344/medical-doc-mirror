"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RegulatoryFieldEditor } from "@/components/documents/RegulatoryFieldEditor";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { FrameworkSection } from "@/lib/frameworks";
import { countDocumentFieldCompletion, normalizeDocumentSections } from "@/lib/normalizeDocument";

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
  const chatFileRef = useRef<HTMLInputElement>(null);
  const initialAutofillStarted = useRef(false);

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

  async function handleCoaFileUpload(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    setChatMessages((prev) => [...prev, { role: "user", text: `Uploading COA for Global Context and Label OCR: ${file.name}...` }]);
    setCoaLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      // Find the appropriate label upload field based on the framework
      const labelUploadId = framework?.sections.some(s => s.id === "s20") ? "20.upload" : "8.upload";

      // Run sequentially to prevent MongoDB VersionError race conditions on parallel saves
      const chatRes = await fetch(`/api/documents/${id}/chat-upload`, { method: "POST", body: fd });
      const labelRes = await fetch(`/api/documents/${id}/fields/${labelUploadId}/upload`, { method: "POST", body: fd });

      const chatData = await chatRes.json();
      const labelData = await labelRes.json();

      if (chatRes.ok && labelRes.ok) {
        setCoaDocContext((prev) => prev + "\n" + chatData.extractedText);
        setChatMessages((prev) => [...prev, {
          role: "bot",
          text: `Uploaded COA "${chatData.fileName}". \n\n1. Global Context: ${chatData.charCount.toLocaleString()} chars added for Auto-fill.\n2. Label OCR: Successfully populated your Labelling section fields and cropped the Company Logo!`,
        }]);
        // Refresh the document data so the UI reflects the newly filled Labelling fields
        refetchDocument();
      } else {
        setChatMessages((prev) => [...prev, { role: "bot", text: chatData.error || labelData.error || "Upload failed" }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Upload failed" }]);
    }
    setCoaLoading(false);
  }

  async function handleStabilityAllUpload(files: FileList) {
    if (!files.length || !doc) return;
    setStabilityUploading(true);
    setStabilityUploadStatus("idle");
    setStabilityUploadMsg(`Processing ${files.length} file(s)... Generating all 3 stability reports…`);

    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("file", file);
    }

    try {
      const r = await fetch(`/api/documents/${id}/stability-all`, { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.success) {
        // Update stability reports section fields
        const reportFieldMap: Record<string, { sectionId: string; fieldId: string }> = {
          sr_inuse:      { sectionId: "s_stability_reports", fieldId: "sr_inuse" },
          sr_accelerated:{ sectionId: "s_stability_reports", fieldId: "sr_accelerated" },
          sr_shipping:   { sectionId: "s_stability_reports", fieldId: "sr_shipping" },
          // DMF auto-fill sections also updated by backend
        };
        for (const [fieldId, mapping] of Object.entries(reportFieldMap)) {
          const content = (data.results as Record<string, string>)[fieldId];
          if (content) setFieldValue(mapping.sectionId, mapping.fieldId, content);
        }
        // Also update DMF textbox sections in local state
        const dmfMap: Record<string, { sectionId: string; fieldId: string; sourceKey: string }> = {
          "17.0a": { sectionId: "s17_inuse",  fieldId: "17.0a", sourceKey: "sr_inuse" },
          "16.0a": { sectionId: "s16_shelf",  fieldId: "16.0a", sourceKey: "sr_accelerated" },
          "18.0a": { sectionId: "s18_shipping",fieldId: "18.0a", sourceKey: "sr_shipping" },
        };
        for (const mapping of Object.values(dmfMap)) {
          const content = (data.results as Record<string, string>)[mapping.sourceKey];
          if (content) setFieldValue(mapping.sectionId, mapping.fieldId, content);
        }
        // Auto-fill overview section
        const overview = (data.results as Record<string, string>)["overview"];
        if (overview) setFieldValue("s14_stability", "15.0a", overview);

        setStabilityUploadStatus("success");
        setStabilityUploadMsg(
          `✅ Generated ${data.reportsGenerated} stability report(s) from "${data.filesUploaded}" and auto-filled §14, §16, §17, §18 DMF sections.`
        );
      } else {
        setStabilityUploadStatus("error");
        setStabilityUploadMsg(data.error || "Failed to generate stability reports.");
      }
    } catch {
      setStabilityUploadStatus("error");
      setStabilityUploadMsg("Network error: failed to connect to upload service.");
    } finally {
      setStabilityUploading(false);
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
            { role: "system", content: `You are a regulatory documentation expert. Help the user fill out their ${framework?.documentType || "regulatory"} document for ${framework?.countryName || "their target market"}. ${ctx}${docCtx}

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
    ? currentSection.fields.filter((f) => getFieldValue(currentSection.id, f.id).trim()).length
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
                    Upload an IFU, brochure, or technical file to auto-populate the document fields via AI extraction.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">IFU document</p>
                      <p className="text-[10px] text-muted mt-0.5">.pdf, .docx, .png, .jpg</p>
                    </div>
                    <div className="shrink-0">
                      {chatLoading ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent bg-accent/5 border border-accent/20 rounded-xl">
                          <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                          Processing…
                        </div>
                      ) : chatDocContext ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                            ✅ Uploaded
                            <button type="button" onClick={() => setChatDocContext("")}
                              className="ml-1 text-muted hover:text-foreground">✕</button>
                          </div>
                          <button type="button" onClick={() => {
                            if (!autofilling) {
                              runAutofill({ isInitial: false });
                            }
                          }}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition ${autofilling ? "text-muted border-border bg-surface" : "text-accent border-accent/40 bg-accent/5 hover:bg-accent/10"}`}>
                            {autofilling ? "Running…" : "🪄 Run Auto-fill"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => chatFileRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent border border-accent/40 bg-accent/5 rounded-xl hover:bg-accent/10 transition">
                            Upload IFU
                          </button>
                          <input ref={chatFileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" multiple className="hidden" onChange={(e) => {
                            if (e.target.files?.length) handleChatFileUpload(e.target.files);
                            e.target.value = "";
                          }} />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border bg-surface2/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">COA document</p>
                      <p className="text-[10px] text-muted mt-0.5">.pdf, .docx, .png, .jpg</p>
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
                          <input ref={coaFileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => {
                            if (e.target.files?.length) handleCoaFileUpload(e.target.files);
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
              {/* Combined Stability Upload Panel — shown ONLY on the Stability Reports section */}
              {currentSection.id === "s_stability_reports" && (
                <div className="rounded-xl border border-dashed border-blue-400/50 bg-blue-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Generate All 3 Stability Reports at Once</p>
                      <p className="text-xs text-muted">Upload your IFU and COA documents to auto-generate In-Use, Accelerated (Shelf Life), and Shipping stability reports simultaneously. The §14, §16, §17 and §18 DMF sections are also auto-filled.</p>
                    </div>
                  </div>
                  {stabilityUploadMsg && (
                    <p className={`text-xs mb-3 font-medium rounded-lg px-3 py-2 ${
                      stabilityUploadStatus === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : stabilityUploadStatus === "error"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20"
                    }`}>
                      {stabilityUploadMsg}
                    </p>
                  )}
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition shadow-sm ${
                    stabilityUploading
                      ? "border-border text-muted bg-surface2 cursor-not-allowed opacity-60"
                      : "border-blue-400/40 text-blue-600 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60"
                  }`}>
                    {stabilityUploading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating all stability reports…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        Upload Stability Study Files (.pdf, .docx)
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      multiple
                      className="hidden"
                      disabled={stabilityUploading}
                      onChange={(e) => {
                        if (e.target.files?.length) handleStabilityAllUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-2 text-[10px] text-muted">The §14 (Overview), §16 (Shelf Life), §17 (In-Use) and §18 (Shipping) DMF sections are also auto-filled from the generated reports. You can still upload files individually per field below.</p>
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
