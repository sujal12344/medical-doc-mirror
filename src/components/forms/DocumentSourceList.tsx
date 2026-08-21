"use client";

import React, { useState } from "react";
import { FileText, X, Loader2 } from "lucide-react";
import type { DocumentTemplate } from "@/lib/frameworks/form-types";

interface DocumentSourceListProps {
  documents: DocumentTemplate[];
  formId?: string;
  overrides?: Record<string, string>;
  setOverrides?: (overrides: Record<string, string>) => void;
}

export function DocumentSourceList({ documents, formId, overrides, setOverrides }: DocumentSourceListProps) {
  const [previewDoc, setPreviewDoc] = useState<DocumentTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewPlaceholders, setPreviewPlaceholders] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  if (!documents || documents.length === 0) return null;

  const grouped = documents.reduce((acc, doc) => {
    const s = doc.source || 'EXTERNAL';
    if (!acc[s]) acc[s] = [];
    acc[s].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const getLabel = (source: string, count: number) => {
    const plural = count === 1 ? '' : 's';
    switch(source) {
      case 'FORM': 
        return `Generating ${count} form template${plural} specifically for this application`;
      case 'LEGAL': 
        return `Extracting ${count} file${plural} from your corporate and legal records`;
      case 'QMS': 
        return `Pulling ${count} document${plural} from your Quality Management System (QMS)`;
      case 'PMF': 
        return `Including ${count} document${plural} from your manufacturing site's Plant Master File (PMF)`;
      case 'DMF': 
        return `Attaching ${count} technical file${plural} from your product's Device Master File (DMF)`;
      case 'CLINICAL': 
        return `Gathering ${count} record${plural} from your clinical trials and performance evaluations`;
      case 'EXTERNAL': 
        return `Adding ${count} certificate${plural} provided by regulatory or third-party bodies`;
      default: 
        return `Extracting ${count} document${plural}`;
    }
  };

  const handlePreview = async (doc: DocumentTemplate) => {
    if (!formId) return;
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewHtml("");
    setPreviewPlaceholders([]);

    try {
      const res = await fetch(`/api/preview/docx?formId=${formId}&fileName=${doc.fileName}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load preview");
      
      const cleanPlaceholders = Array.isArray(data.placeholders) 
        ? data.placeholders.map((p: string) => p.replace(/[{}]/g, ''))
        : [];
      setPreviewPlaceholders(cleanPlaceholders);

      // Inject contenteditable spans into HTML for inline editing
      let html = data.html;
      for (const p of cleanPlaceholders) {
         // Safe replacement of `{placeholder}` with an editable span
         const regex = new RegExp(`\\{${p}\\}`, 'g');
         const defaultVal = overrides?.[p] !== undefined ? overrides[p] : `{${p}}`;
         html = html.replace(
           regex, 
           `<span class="inline-editor text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded cursor-text outline-none border-b border-dashed border-[var(--accent)] min-w-[20px] inline-block transition hover:bg-[var(--accent)]/20 focus:bg-[var(--accent)]/20" contenteditable="true" spellcheck="false" data-placeholder="${p}">${defaultVal}</span>`
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
        let val = (span as HTMLElement).innerText.trim();
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
      <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {(Object.entries(grouped) as [string, DocumentTemplate[]][]).map(([source, docs]) => (
          <div key={source}>
            <h3 className="text-xs font-semibold text-muted mb-3 tracking-wider">
              {getLabel(source, docs.length)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((doc, i) => (
                <button 
                  key={i} 
                  onClick={() => handlePreview(doc)}
                  disabled={!formId}
                  className={`flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl text-left w-full transition ${formId ? 'hover:border-[var(--accent)] hover:shadow-sm cursor-pointer' : 'opacity-80'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
