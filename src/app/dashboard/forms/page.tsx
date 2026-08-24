"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { CDSCO_FORM_GROUPS } from "@/lib/frameworks/asia/india-forms";

type FormSpec = {
  id: string;
  frameworkId: string;
  title: string;
  name: string;
  description: string;
  path: string;
};

function CreateFormButton({ form, templateCount }: { form: FormSpec, templateCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function create() {
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
        setStatus(data.message || "Failed to create package.");
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
      className="group relative flex flex-col text-left bg-surface/40 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/10 transition-all duration-300 disabled:opacity-50 w-full overflow-hidden min-h-[160px]"
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
      
      <div className="relative mt-auto pt-2">
        <h3 className="text-base font-bold text-foreground mb-3 group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
          {form.description}
        </h3>
        
        {templateCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 w-fit transition-colors group-hover:bg-green-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.8)] animate-pulse"></span>
            <span className="text-[11px] font-semibold text-green-500 uppercase tracking-wide">{templateCount} required documents</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/10 border border-border w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-muted"></span>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Templates coming soon</span>
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

export default function FormsDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
          Forms Library
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          Select an application form to automatically generate the complete regulatory package, including foundational templates like DMFs, PMFs, and legal undertakings.
        </p>
      </div>

      <div className="space-y-16">
        {CDSCO_FORM_GROUPS.map((group) => (
          <section key={group.id} className="relative pl-6 py-2">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--accent)]/80 via-[var(--accent)]/20 to-transparent rounded-full" />
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">{group.name}</h2>
              <p className="text-sm text-muted mt-1.5 max-w-3xl leading-relaxed">{group.description}</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {group.forms.map((form) => {
                const spec: FormSpec = {
                  id: form.id.toLowerCase(),
                  frameworkId: `IN_${form.id.replace("-", "_")}`,
                  title: form.id,
                  name: `${form.id} Form`,
                  description: form.description || "Regulatory Application Form",
                  path: `/dashboard/forms/${form.id.toLowerCase()}`,
                };
                
                return <CreateFormButton key={form.id} form={spec} templateCount={form.documents.length} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
