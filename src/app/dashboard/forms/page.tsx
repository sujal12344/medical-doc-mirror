"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CDSCO_FORM_GROUPS } from "@/lib/frameworks/asia/india-forms";
import { ProductMultiSelectorModal } from "@/components/forms/ProductMultiSelectorModal";

import { CreateFormButton, type FormSpec } from "./components/CreateFormButton";

export default function FormsDashboard() {
  const router = useRouter();
  const [activeFormForModal, setActiveFormForModal] = useState<FormSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModalContinue = async (payload: { productIds: string[] }) => {
    if (!activeFormForModal) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: "IN",
          frameworkId: activeFormForModal.frameworkId,
          title: activeFormForModal.title,
          contextPayload: payload
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`${activeFormForModal.path}?docId=${data.document._id}`);
      } else {
        setError(data.error || "Failed to create package.");
      }
    } catch (e) {
      setError("An error occurred");
    } finally {
      setIsGenerating(false);
      setActiveFormForModal(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {activeFormForModal && (
        <ProductMultiSelectorModal
          formTitle={activeFormForModal.title}
          onClose={() => setActiveFormForModal(null)}
          onContinue={handleModalContinue}
          generating={isGenerating}
          isMultiSelect={activeFormForModal.requiredContexts?.includes('PRODUCT_MULTI')}
          requiresPmf={activeFormForModal.requiresPmf}
          requiresDmf={activeFormForModal.requiresDmf}
          allowedDeviceType={activeFormForModal.allowedDeviceType}
        />
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium border bg-red-500/10 text-red-500 border-red-500/20 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

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
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {group.forms.map((form) => {
                const spec: FormSpec = {
                  id: form.id.toLowerCase(),
                  frameworkId: `IN_${form.id.replace("-", "_")}`,
                  title: form.id,
                  name: `${form.id} Form`,
                  description: form.description || "Regulatory Application Form",
                  summary: form.summary,
                  path: `/dashboard/forms/${form.id.toLowerCase()}`,
                  requiredContexts: form.requiredContexts,
                  requiresPmf: form.documents.some(d => d.source === 'PMF'),
                  requiresDmf: form.documents.some(d => d.source === 'DMF'),
                  allowedDeviceType: form.allowedDeviceType,
                };
                
                return (
                  <CreateFormButton 
                    key={form.id} 
                    form={spec} 
                    templateCount={form.documents.length}
                    onTriggerModal={setActiveFormForModal}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
