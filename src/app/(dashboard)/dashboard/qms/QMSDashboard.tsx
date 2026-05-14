"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QMSDashboard({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("iso");
  const [data, setData] = useState({
    iso13485: initialData.iso13485 || {
      managementResponsibility: 0,
      resourceManagement: 0,
      productRealization: 0,
      measurementAnalysis: 0,
    },
    sops: initialData.sops || [],
    capas: initialData.capas || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/companies/me/qms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qms: data }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const setIso = (field: string, value: number) => {
    setData((p) => ({
      ...p,
      iso13485: { ...p.iso13485, [field]: value },
    }));
  };

  const addSop = () => {
    const newSop = { id: `sop-${Date.now()}`, title: "", status: "draft", version: "1.0", documentUrl: "" };
    setData((p) => ({ ...p, sops: [...p.sops, newSop] }));
  };

  const updateSop = (id: string, field: string, value: any) => {
    setData((p) => ({
      ...p,
      sops: p.sops.map((s: any) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSop = (id: string) => {
    setData((p) => ({ ...p, sops: p.sops.filter((s: any) => s.id !== id) }));
  };

  const addCapa = () => {
    const newCapa = { id: `capa-${Date.now()}`, title: "", description: "", status: "open", rootCause: "", actionTaken: "" };
    setData((p) => ({ ...p, capas: [...p.capas, newCapa] }));
  };

  const updateCapa = (id: string, field: string, value: any) => {
    setData((p) => ({
      ...p,
      capas: p.capas.map((c: any) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const removeCapa = (id: string) => {
    setData((p) => ({ ...p, capas: p.capas.filter((c: any) => c.id !== id) }));
  };

  const isoAvg = Math.round(
    (data.iso13485.managementResponsibility +
      data.iso13485.resourceManagement +
      data.iso13485.productRealization +
      data.iso13485.measurementAnalysis) /
      4
  );

  return (
    <div>
      {/* Top Nav */}
      <div className="flex gap-2 mb-6 border-b border-border pb-1">
        {[
          { id: "iso", label: "ISO 13485 Checklist", icon: "📋" },
          { id: "sops", label: `SOP Register (${data.sops.length})`, icon: "📚" },
          { id: "capas", label: `CAPA Tracker (${data.capas.length})`, icon: "⚠️" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
              activeTab === t.id
                ? "bg-surface border-t border-l border-r border-border text-emerald-600 -mb-[1px]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ISO 13485 Tab */}
      {activeTab === "iso" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 bg-surface border border-border rounded-xl">
            <div>
              <h2 className="text-base font-bold text-foreground">ISO 13485:2016 Readiness</h2>
              <p className="text-sm text-muted">Estimate your compliance level for each major clause.</p>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{isoAvg}%</div>
          </div>

          <div className="space-y-4">
            {[
              { id: "managementResponsibility", label: "Clause 5: Management Responsibility", desc: "Quality policy, objectives, management review" },
              { id: "resourceManagement", label: "Clause 6: Resource Management", desc: "HR, infrastructure, work environment, contamination control" },
              { id: "productRealization", label: "Clause 7: Product Realization", desc: "Design & dev, purchasing, production, sterilization" },
              { id: "measurementAnalysis", label: "Clause 8: Measurement, Analysis & Improvement", desc: "Feedback, complaint handling, internal audits, CAPA" },
            ].map((clause) => (
              <div key={clause.id} className="p-5 bg-surface border border-border rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{clause.label}</h3>
                    <p className="text-xs text-muted mt-0.5">{clause.desc}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {data.iso13485[clause.id as keyof typeof data.iso13485]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={data.iso13485[clause.id as keyof typeof data.iso13485]}
                  onChange={(e) => setIso(clause.id, parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-surface2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOP Tab */}
      {activeTab === "sops" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Standard Operating Procedures</p>
            <button onClick={addSop} className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">+ Add SOP</button>
          </div>
          {data.sops.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-dashed border-border rounded-xl text-muted text-sm">
              No SOPs added yet. Click "+ Add SOP" to start building your register.
            </div>
          ) : (
            data.sops.map((sop: any) => (
              <div key={sop.id} className="p-4 bg-surface border border-border rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <input
                      value={sop.title}
                      onChange={(e) => updateSop(sop.id, "title", e.target.value)}
                      placeholder="SOP Title (e.g. Design Control Procedure)"
                      className="w-full font-semibold text-sm border-b border-border bg-transparent focus:outline-none focus:border-emerald-500 pb-1"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Status</span>
                        <select
                          value={sop.status}
                          onChange={(e) => updateSop(sop.id, "status", e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-transparent"
                        >
                          <option value="draft">Draft</option>
                          <option value="in-review">In Review</option>
                          <option value="approved">Approved</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Version</span>
                        <input
                          value={sop.version}
                          onChange={(e) => updateSop(sop.id, "version", e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2 py-1 bg-transparent"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Document GCS URL</span>
                        <input
                          value={sop.documentUrl}
                          onChange={(e) => updateSop(sop.id, "documentUrl", e.target.value)}
                          placeholder="gs://..."
                          className="w-full text-xs border border-border rounded-lg px-2 py-1 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeSop(sop.id)} className="text-red-400 hover:text-red-600 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CAPA Tab */}
      {activeTab === "capas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Corrective and Preventive Actions (CAPA)</p>
            <button onClick={addCapa} className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">+ Log CAPA</button>
          </div>
          {data.capas.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-dashed border-border rounded-xl text-muted text-sm">
              No CAPAs logged.
            </div>
          ) : (
            data.capas.map((capa: any) => (
              <div key={capa.id} className="p-5 bg-surface border border-border rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <input
                    value={capa.title}
                    onChange={(e) => updateCapa(capa.id, "title", e.target.value)}
                    placeholder="Issue Title (e.g. Failure in seal integrity test)"
                    className="flex-1 font-semibold text-sm border-b border-border bg-transparent focus:outline-none focus:border-emerald-500 pb-1"
                  />
                  <select
                    value={capa.status}
                    onChange={(e) => updateCapa(capa.id, "status", e.target.value)}
                    className={`text-xs border border-border rounded-lg px-2 py-1 bg-transparent font-medium ${
                      capa.status === 'open' ? 'text-red-600 bg-red-50' :
                      capa.status === 'investigating' ? 'text-amber-600 bg-amber-50' :
                      capa.status === 'implemented' ? 'text-blue-600 bg-blue-50' :
                      'text-emerald-600 bg-emerald-50'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="implemented">Implemented</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => removeCapa(capa.id)} className="text-red-400 hover:text-red-600 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Issue Description</span>
                  <textarea
                    rows={2}
                    value={capa.description}
                    onChange={(e) => updateCapa(capa.id, "description", e.target.value)}
                    placeholder="Detail the non-conformance or potential issue..."
                    className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-transparent resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Root Cause Analysis</span>
                    <textarea
                      rows={2}
                      value={capa.rootCause}
                      onChange={(e) => updateCapa(capa.id, "rootCause", e.target.value)}
                      placeholder="Why did this happen?"
                      className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-transparent resize-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted font-semibold block mb-1">Action Taken (Corrective/Preventive)</span>
                    <textarea
                      rows={2}
                      value={capa.actionTaken}
                      onChange={(e) => updateCapa(capa.id, "actionTaken", e.target.value)}
                      placeholder="How was it fixed and prevented?"
                      className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer / Save */}
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-end gap-3">
        {savedAt && <span className="text-xs text-emerald-600">Saved at {savedAt}</span>}
        <button
          onClick={save}
          disabled={isSaving}
          className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save QMS"}
        </button>
      </div>
    </div>
  );
}
