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

function CreateFormButton({ form }: { form: FormSpec }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function create() {
    setLoading(true);
    setStatus("Creating document...");
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
        setStatus(data.message || "Failed to create document.");
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
      className="flex flex-col text-left bg-surface border border-border rounded-xl p-5 hover:border-[var(--accent)] hover:shadow-sm transition disabled:opacity-50 w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
          <FileText className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-foreground">{form.name}</span>
      </div>
      <span className="text-xs text-muted line-clamp-2">{form.description}</span>
      {loading && status && (
        <p className="text-[10px] text-[var(--accent)] mt-3 font-medium animate-pulse">{status}</p>
      )}
      {!loading && status && (
        <p className="text-[10px] text-[var(--status-error)] mt-3">{status}</p>
      )}
    </button>
  );
}

export default function FormsDashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forms Library</h1>
          <p className="text-sm text-muted mt-1">
            Generate supporting documents for application forms
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {CDSCO_FORM_GROUPS.map((group) => (
          <section key={group.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
              <p className="text-sm text-muted">{group.description}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.forms.map((form) => {
                const spec: FormSpec = {
                  id: form.id.toLowerCase(),
                  frameworkId: `IN_${form.id.replace("-", "_")}`,
                  title: form.id,
                  name: `${form.id} Form`,
                  description: form.name,
                  path: `/dashboard/forms/${form.id.toLowerCase()}`,
                };
                
                return <CreateFormButton key={form.id} form={spec} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
