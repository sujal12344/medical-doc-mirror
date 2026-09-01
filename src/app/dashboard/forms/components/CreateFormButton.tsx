"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export type FormSpec = {
  id: string;
  frameworkId: string;
  title: string;
  name: string;
  description: string;
  summary?: string;
  path: string;
  requiredContexts?: string[];
  requiresPmf?: boolean;
  requiresDmf?: boolean;
  allowedDeviceType?: 'medical-device' | 'ivd';
};

export function CreateFormButton({ 
  form, 
  templateCount, 
  onTriggerModal 
}: { 
  form: FormSpec; 
  templateCount: number; 
  onTriggerModal: (form: FormSpec) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function create() {
    if (form.requiredContexts?.includes('PRODUCT_MULTI') || form.requiredContexts?.includes('PRODUCT_SINGLE')) {
      onTriggerModal(form);
      return;
    }
    setLoading(true);
    setStatus("Generating Package...");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: "IN",
          frameworkId: form.frameworkId,
          title: form.title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`${form.path}?docId=${data.document._id}`);
      } else {
        setStatus(data.error || "Failed to create package.");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus("An error occurred");
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="group relative flex flex-col text-left bg-surface/40 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-[var(--accent)]/50 hover:shadow-2xl hover:shadow-[var(--accent)]/15 transition-all duration-500 disabled:opacity-50 w-full overflow-hidden h-full min-h-[220px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between w-full mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shadow-inner group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-500 ease-out">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">Form ID</span>
            <div className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold bg-surface2 text-foreground border border-border shadow-sm group-hover:border-[var(--accent)]/30 transition-colors">
              {form.title}
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted group-hover:text-white group-hover:bg-[var(--accent)] transition-all duration-300 transform group-hover:-rotate-45 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      
      <div className="relative mt-auto pt-3 flex flex-col h-full justify-between flex-1">
        <div>
          <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2 title-min-height">
            {form.description}
          </h3>
          {form.summary && (
            <p className="text-[12px] text-muted/90 mb-5 leading-relaxed line-clamp-3">
              {form.summary}
            </p>
          )}
        </div>
        
        {templateCount > 0 ? (
          <div className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-all duration-500 mt-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] shrink-0 animate-pulse group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all"></span>
              <span className="text-xs font-bold text-foreground group-hover:text-white transition-colors tracking-wide truncate">Generate Package</span>
            </div>
            <div className="flex items-center gap-1 bg-background/60 group-hover:bg-white/20 px-1.5 py-0.5 rounded-md transition-colors shadow-inner shrink-0 ml-1">
              <span className="text-[10px] font-bold text-muted group-hover:text-white/90 whitespace-nowrap">{templateCount} DOCS</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full px-3 py-2.5 rounded-xl bg-surface2/40 border border-border/50 border-dashed mt-2 opacity-70">
            <span className="text-xs font-semibold text-muted tracking-wide truncate">Templates Coming Soon</span>
          </div>
        )}
      </div>

      {loading && status && (
        <div className="relative w-full mt-5 bg-[var(--accent)]/10 rounded-xl p-3 flex items-center justify-center gap-3 border border-[var(--accent)]/20 shadow-inner">
          <svg className="animate-spin h-4 w-4 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-xs text-[var(--accent)] font-bold tracking-wide uppercase">{status}</p>
        </div>
      )}
      {!loading && status && (
        <p className="text-xs text-[var(--status-error)] font-medium mt-4 bg-[var(--status-error)]/10 p-2 rounded-lg text-center border border-[var(--status-error)]/20">{status}</p>
      )}
    </button>
  );
}
