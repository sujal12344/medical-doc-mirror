"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { FrameworkSection } from "@/lib/frameworks";

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
  const [chatDocContext, setChatDocContext] = useState("");
  const chatFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/documents/${id}`).then((r) => r.json()).then((data) => {
      if (data.document) {
        setDoc(data.document);
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

  async function triggerAutofill() {
    if (!doc) return;
    setAutofilling(true);
    setChatMessages((prev) => [...prev, { role: "bot", text: "Running AI auto-fill from uploaded documents..." }]);
    try {
      const r = await fetch(`/api/documents/${id}/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraText: chatDocContext }),
      });
      const data = await r.json();
      if (r.ok) {
        setChatMessages((prev) => [...prev, { role: "bot", text: `Auto-fill complete! ${data.filledCount} fields filled from ${data.totalParsed} extracted values. Refreshing...` }]);
        const refreshRes = await fetch(`/api/documents/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.document) setDoc(refreshData.document);
      } else {
        setChatMessages((prev) => [...prev, { role: "bot", text: `Auto-fill issue: ${data.error || "Unknown error"}` }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Auto-fill failed. Check connection." }]);
    }
    setAutofilling(false);
  }

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
    return <div className="p-8"><p className="text-muted">Loading document...</p></div>;
  }

  const currentSection: FrameworkSection | undefined = framework.sections.find((s) => s.id === activeSection);

  return (
    <div className="flex h-full">
      {/* Section Nav */}
      <div className="w-56 bg-surface border-r border-border overflow-y-auto shrink-0 p-3">
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
      <div className="flex-1 overflow-y-auto p-6">
        {currentSection ? (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-1">{currentSection.title}</h2>
            <p className="text-sm text-muted mb-6">{currentSection.description}</p>
            <div className="space-y-4">
              {currentSection.fields.map((field) => (
                <div key={field.id} className="bg-surface border border-border rounded-xl p-4">
                  <label className="block text-sm font-medium text-foreground mb-1">{field.label}</label>
                  <p className="text-xs text-muted mb-2">{field.hint}</p>
                  {field.textarea ? (
                    <textarea rows={4} value={getFieldValue(currentSection.id, field.id)}
                      onChange={(e) => setFieldValue(currentSection.id, field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition resize-y" />
                  ) : (
                    <input type="text" value={getFieldValue(currentSection.id, field.id)}
                      onChange={(e) => setFieldValue(currentSection.id, field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => saveSection(currentSection.id)} disabled={saving}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Section"}
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
            <button onClick={triggerAutofill} disabled={autofilling}
              className="text-[10px] px-2.5 py-1 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50">
              {autofilling ? "Filling..." : "Auto-fill"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.length === 0 && (
            <div className="text-[11px] text-muted p-3 bg-surface2 rounded-lg border border-border">
              <p className="font-medium text-foreground mb-1">Welcome!</p>
              <p className="mb-2">Upload documents using the 📎 button below, then click <strong>Auto-fill</strong> to let AI fill matching fields.</p>
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
