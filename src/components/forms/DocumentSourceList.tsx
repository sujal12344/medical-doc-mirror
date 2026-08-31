"use client";

import React, { useState } from "react";
import { FileText, X, Loader2 } from "lucide-react";
import type { DocumentTemplate } from "@/lib/frameworks/form-types";

interface DocumentSourceListProps {
  documents: DocumentTemplate[];
  formId?: string;
  overrides?: Record<string, string>;
  setOverrides?: (overrides: Record<string, string>) => void;
  contextProducts?: any[];
  docId?: string | null;
  filledSummary?: { Field: string; Source: string; Value: string }[];
}

export function DocumentSourceList({ documents, formId, overrides, setOverrides, contextProducts = [], docId, filledSummary = [] }: DocumentSourceListProps) {
  const [previewDoc, setPreviewDoc] = useState<DocumentTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewPlaceholders, setPreviewPlaceholders] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  if (!documents || documents.length === 0) return null;

  // Filter documents based on conditionRule against all context products
  const filteredDocuments = documents.filter(doc => {
    if (!doc.conditionRule) return true;
    if (contextProducts.length === 0) return true; // Show all if we don't have products to evaluate against

    // It matches if at least one selected product satisfies the condition
    return contextProducts.some(product => {
      try {
        const context = { product };
        // eslint-disable-next-line no-new-func
        const conditionFn = new Function('context', `return ${doc.conditionRule};`);
        return conditionFn(context);
      } catch (e) {
        console.error("Error evaluating condition in UI:", e);
        return true;
      }
    });
  });

  const grouped = filteredDocuments.reduce((acc, doc) => {
    const s = doc.source || 'EXTERNAL';
    if (!acc[s]) acc[s] = [];
    acc[s].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const SOURCE_INFO: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
    'FORM': { title: 'Application Forms', desc: 'Auto-filled official forms and cover letters.', icon: <FileText className="w-5 h-5 text-blue-500" /> },
    'LEGAL': { title: 'Corporate Records', desc: 'Legal structure, POA, and undertakings.', icon: <FileText className="w-5 h-5 text-purple-500" /> },
    'QMS': { title: 'Quality Management (QMS)', desc: 'ISO certificates and quality manuals.', icon: <FileText className="w-5 h-5 text-emerald-500" /> },
    'PMF': { title: 'Plant Master File (PMF)', desc: 'Site layouts, equipment, and facility details.', icon: <FileText className="w-5 h-5 text-orange-500" /> },
    'DMF': { title: 'Device Master File (DMF)', desc: 'Technical specifications, risk, and IFUs.', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
    'CLINICAL': { title: 'Clinical Records', desc: 'Trial data and performance evaluations.', icon: <FileText className="w-5 h-5 text-rose-500" /> },
    'EXTERNAL': { title: 'External Certificates', desc: 'Third-party approvals like FSC or CE.', icon: <FileText className="w-5 h-5 text-slate-500" /> }
  };

  const handlePreview = async (doc: DocumentTemplate) => {
    if (!formId) return;
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewHtml("");
    setPreviewPlaceholders([]);

    try {
      const docIdParam = docId ? `&docId=${docId}` : '';
      const res = await fetch(`/api/preview/docx?formId=${formId}&fileName=${doc.fileName}${docIdParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load preview");
      
      const cleanPlaceholders = Array.isArray(data.placeholders) 
        ? data.placeholders.map((p: string) => p.replace(/[{}]/g, ''))
        : [];
      setPreviewPlaceholders(cleanPlaceholders);

      // Clean up raw array tags so they don't look ugly in the preview
      let html = data.html;
      html = html.replace(/\{#[^}]+\}/g, '');
      html = html.replace(/\{\/[^}]+\}/g, '');
      html = html.replace(/\{slNo\}/g, '1'); // Fallback to 1 for preview
      
      // Inject contenteditable spans into HTML for inline editing
      for (const p of cleanPlaceholders) {
         // Safe replacement of `{placeholder}` with an editable span
         const regex = new RegExp(`\\{${p}\\}`, 'g');
         const defaultVal = overrides?.[p] !== undefined ? overrides[p] : `{${p}}`;
         
         const summaryObj = filledSummary.find(s => s.Field === p);
         const titleAttr = summaryObj ? `title="Source: ${summaryObj.Source.replace(/"/g, '&quot;')}"` : '';

         html = html.replace(
           regex, 
           `<span class="inline-editor text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded cursor-text outline-none border-b border-dashed border-[var(--accent)] min-w-[20px] inline-block transition hover:bg-[var(--accent)]/20 focus:bg-[var(--accent)]/20" contenteditable="true" spellcheck="false" data-placeholder="${p}" ${titleAttr}>${defaultVal}</span>`
         );
      }
      setPreviewHtml(html);

    } catch (err: any) {
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveOverrides = () => {
    if (!setOverrides) {
      setPreviewDoc(null);
      return;
    }
    const newOverrides = { ...overrides };
    const editorSpans = document.querySelectorAll('.inline-editor');
    editorSpans.forEach(span => {
      const p = span.getAttribute('data-placeholder');
      if (p) {
        const val = (span as HTMLElement).innerText.trim();
        // If they didn't touch it, and it just says "{placeholder}", don't save the literal brace string
        if (val === `{${p}}`) {
          return;
        }
        newOverrides[p] = val;
      }
    });
    setOverrides(newOverrides);
    setPreviewDoc(null); // Close modal on save
  };

  return (
    <>
      <div className="mb-12 space-y-10">
        {(Object.entries(grouped) as [string, DocumentTemplate[]][]).map(([source, docs], idx) => {
          const info = SOURCE_INFO[source] || { title: 'Other Documents', desc: 'Additional required files.', icon: <FileText className="w-5 h-5 text-muted-foreground" /> };
          
          return (
            <div key={source} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 rounded-lg border border-border bg-surface2 shadow-sm shrink-0">
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{info.title}</h3>
                    <span className="text-xs font-semibold text-muted-foreground bg-surface2 border border-border px-2 py-0.5 rounded-full">{docs.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                </div>
              </div>
              
              <div className="pl-9 border-l-2 border-border/50 ml-4 space-y-2">
                {docs.map((doc) => (
                  <button
                    key={doc.fileName}
                    onClick={() => handlePreview(doc)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-surface/30 hover:bg-surface/80 hover:border-[var(--accent)]/40 transition-all group text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 group-hover:border-[var(--accent)]/30 transition-all">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                      {formId
                        ? (doc.name || doc.fileName).replace(new RegExp(`^${formId}\\s+`, 'i'), '')
                        : (doc.name || doc.fileName)}
                    </span>
                    {source === 'DMF' && contextProducts.length > 1 && (
                      (() => {
                        let matchingCount = contextProducts.length;
                        if (doc.conditionRule) {
                          matchingCount = contextProducts.filter(product => {
                            try {
                              const conditionFn = new Function('context', `return ${doc.conditionRule};`);
                              return conditionFn({ product });
                            } catch { return true; }
                          }).length;
                        }
                        return matchingCount > 1 ? (
                          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                            &times;{matchingCount}
                          </span>
                        ) : null;
                      })()
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 group-hover:text-[var(--accent)] transition-colors shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewDoc(null);
            }
          }}
        >
          <div className="bg-surface border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface2/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{previewDoc.fileName}</h3>
              </div>
              <div className="flex items-center gap-3">
                {previewPlaceholders.length > 0 && setOverrides && (
                  <button 
                    onClick={handleSaveOverrides} 
                    className="px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition shadow-sm"
                  >
                    Save Custom Values
                  </button>
                )}
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-muted hover:text-foreground" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-background/50">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                  <p className="text-sm">Generating document preview...</p>
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  <p className="text-sm font-medium">{previewError}</p>
                </div>
              ) : (
                <div 
                  className="bg-surface mx-auto shadow-lg min-h-[1056px] w-full max-w-[816px] p-12 text-foreground text-sm border border-border [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>p]:mb-4 [&>table]:w-full [&>table]:border-collapse [&>table]:mb-4 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-surface2 [&_th]:text-left [&_th]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.classList.contains('inline-editor')) {
                      if (target.dataset.focused !== 'true') {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(target);
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                        target.dataset.focused = 'true';
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.classList.contains('inline-editor')) {
                      target.dataset.focused = 'false';
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
