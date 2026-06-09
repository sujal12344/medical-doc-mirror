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
    const note = prompt("Version note (optional):");
    await fetch(`/api/documents/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeNote: note || "" }),
    });
    const r = await fetch(`/api/documents/${id}`);
    const data = await r.json();
    if (data.document) setDoc(data.document);
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
        body: JSON.stringify({ extraText: chatDocContext }),
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
          <button onClick={createVersion} className="w-full text-xs px-3 py-2 bg-surface2 border border-border rounded-lg hover:border-accent/30 transition text-muted font-medium">
            Save Version
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
              {currentSection.fields.map((field) => (
                <RegulatoryFieldEditor
                  key={field.id}
                  fieldId={field.id}
                  label={field.label}
                  hint={field.hint}
                  textarea={field.textarea}
                  value={getFieldValue(currentSection.id, field.id)}
                  onChange={(v) => setFieldValue(currentSection.id, field.id, v)}
                />
              ))}
            </div>

            <div className="sticky bottom-0 mt-8 -mx-6 px-6 py-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent border-t border-border/80">
              <button
                onClick={() => saveSection(currentSection.id)}
                disabled={saving}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving…" : `Save ${currentSection.title}`}
              </button>
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
