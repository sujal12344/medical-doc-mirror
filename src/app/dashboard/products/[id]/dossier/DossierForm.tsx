"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SECTIONS = [
  { id: "sec1", label: "Device Description", ref: "Schedule V §1", icon: "🔬" },
  { id: "sec2", label: "Labelling & IFU", ref: "Schedule V §2, Rule 9", icon: "🏷️" },
  { id: "sec3", label: "Design & Manufacturing", ref: "Schedule V §3", icon: "🏭" },
  { id: "sec4", label: "Risk Management", ref: "Schedule V §4, ISO 14971", icon: "⚠️" },
  { id: "sec5", label: "Testing & Verification", ref: "Schedule V §5", icon: "🧪" },
  { id: "sec6", label: "Clinical Evaluation", ref: "Schedule V §6", icon: "🏥" },
  { id: "sec7", label: "Post-Market Surveillance", ref: "Schedule V §7", icon: "📊" },
];

const defaultDossier = {
  sec1: { deviceDescription: "", modelNumbers: "", variants: "", dimensions: "", materials: "", accessories: "", contraindications: "", completionPct: 0 },
  sec2: { labelText: "", ifuText: "", storageConditions: "", shelfLife: "", sterilityInfo: "", labelDocUrl: "", ifuDocUrl: "", completionPct: 0 },
  sec3: { manufacturingSite: "", manufacturerAddress: "", manufacturingProcess: "", sterilizationMethod: "", designControlsApplied: false, iso13485CertUrl: "", completionPct: 0 },
  sec4: { riskManagementStandard: "ISO 14971:2019", hazardsIdentified: "", riskControlMeasures: "", residualRiskAcceptable: false, riskBenefitSummary: "", rmfDocUrl: "", completionPct: 0 },
  sec5: { performanceTested: false, electricalSafetyStandard: "", biocompatibilityDone: false, biocompatibilityStandard: "ISO 10993", softwareLifecycleDone: false, sterilizationValidationDone: false, shelfLifeTested: false, standardsMatrix: [], completionPct: 0 },
  sec6: { clinicalEvalRequired: true, cerStatus: "not-started", clinicalDataSource: "", literatureReviewDone: false, clinicalTrialDone: false, cerDocUrl: "", completionPct: 0 },
  sec7: { pmsPlanRequired: true, pmsPlanStatus: "not-started", psurFrequency: "", vigilanceSetup: false, pmsPlanUrl: "", completionPct: 0 },
};

function mergeDeep(defaults: any, saved: any): any {
  const out = { ...defaults };
  if (!saved) return out;
  for (const k in saved) {
    if (saved[k] !== null && typeof saved[k] === "object" && !Array.isArray(saved[k])) {
      out[k] = mergeDeep(defaults[k] ?? {}, saved[k]);
    } else {
      out[k] = saved[k];
    }
  }
  return out;
}

export default function DossierForm({ productId, deviceClass, initialDossier }: {
  productId: string;
  deviceClass: string;
  initialDossier: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sec1");
  const [data, setData] = useState<any>(() => mergeDeep(defaultDossier, initialDossier));
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const setSection = (sec: string, field: string, value: any) =>
    setData((p: any) => ({ ...p, [sec]: { ...p[sec], [field]: value } }));

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/dossier`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicalDossier: data }),
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

  const ta = (sec: string, field: string, placeholder: string, rows = 3) => (
    <textarea
      rows={rows}
      value={data[sec][field]}
      onChange={(e) => setSection(sec, field, e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
    />
  );

  const inp = (sec: string, field: string, placeholder: string, type = "text") => (
    <input
      type={type}
      value={data[sec][field]}
      onChange={(e) => setSection(sec, field, e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
    />
  );

  const chk = (sec: string, field: string, label: string, desc?: string) => (
    <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface2 transition">
      <input
        type="checkbox"
        checked={data[sec][field]}
        onChange={(e) => setSection(sec, field, e.target.checked)}
        className="w-5 h-5 mt-0.5 accent-violet-600"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted mt-0.5">{desc}</p>}
      </div>
    </label>
  );

  const lbl = (text: string, required = false) => (
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const sectionPct = (sec: string) => data[sec]?.completionPct || 0;
  const overallPct = Math.round(
    SECTIONS.map((s) => sectionPct(s.id)).reduce((a, b) => a + b, 0) / SECTIONS.length
  );

  const classRequiresSec6 = ["B", "C", "D"].includes(deviceClass);
  const classRequiresSec7 = ["C", "D"].includes(deviceClass);

  return (
    <div>
      {/* Overall progress */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Overall Technical File Completion</span>
          <span className="text-sm font-bold text-violet-600">{overallPct}%</span>
        </div>
        <div className="w-full bg-surface2 rounded-full h-2">
          <div className="bg-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {SECTIONS.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-muted">
              <div className={`w-1.5 h-1.5 rounded-full ${sectionPct(s.id) === 100 ? "bg-green-500" : sectionPct(s.id) > 0 ? "bg-violet-400" : "bg-slate-300"}`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap mb-6 bg-surface border border-border rounded-xl p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`flex-1 min-w-[80px] px-2 py-2 text-xs font-semibold rounded-lg transition text-center ${
              activeTab === s.id
                ? "bg-violet-600 text-white"
                : "text-muted hover:text-foreground hover:bg-surface2"
            }`}
          >
            <span className="block mb-0.5">{s.icon}</span>
            {s.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Section ref badge */}
      {SECTIONS.filter((s) => s.id === activeTab).map((s) => (
        <div key={s.id} className="flex items-center gap-2 mb-5">
          <span className="text-lg">{s.icon}</span>
          <div>
            <h2 className="text-base font-bold text-foreground">{s.label}</h2>
            <p className="text-xs text-muted">{s.ref}</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-violet-600">{sectionPct(s.id)}% complete</span>
        </div>
      ))}

      {/* ── Section 1: Device Description ── */}
      {activeTab === "sec1" && (
        <div className="space-y-5">
          <div>{lbl("Device Description", true)}{ta("sec1", "deviceDescription", "Describe the device — its purpose, working principle, key components, and how it achieves its intended use…", 4)}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>{lbl("Model Numbers / Catalogue Nos.")} {inp("sec1", "modelNumbers", "e.g. OXI-200, OXI-200P")}</div>
            <div>{lbl("Variants / Configurations")} {inp("sec1", "variants", "e.g. Adult, Paediatric, Neonatal")}</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>{lbl("Dimensions & Weight")} {inp("sec1", "dimensions", "e.g. 65×35×25mm, 85g")}</div>
            <div>{lbl("Materials of Construction")} {inp("sec1", "materials", "e.g. ABS housing, silicone probe")}</div>
          </div>
          <div>{lbl("Accessories / Spare Parts")} {inp("sec1", "accessories", "e.g. SpO2 probe, USB cable, carrying case")}</div>
          <div>{lbl("Contra-indications")} {ta("sec1", "contraindications", "List any known contra-indications or populations for whom use is not recommended…")}</div>
        </div>
      )}

      {/* ── Section 2: Labelling & IFU ── */}
      {activeTab === "sec2" && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <strong>MDR Rule 9:</strong> Labels must include device name, manufacturer name & address, batch/lot number, manufacturing & expiry date, sterility status, and any warnings.
          </div>
          <div>{lbl("Label Text", true)}{ta("sec2", "labelText", "Paste or type the complete label text as it appears on the device/packaging…", 5)}</div>
          <div>{lbl("Instructions for Use (IFU)", true)}{ta("sec2", "ifuText", "Paste or summarise the IFU content — intended use, warnings, operating procedure, maintenance…", 6)}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>{lbl("Storage Conditions")} {inp("sec2", "storageConditions", "e.g. 15–30°C, <85% RH, keep dry")}</div>
            <div>{lbl("Shelf Life")} {inp("sec2", "shelfLife", "e.g. 3 years from manufacture date")}</div>
          </div>
          <div>{lbl("Sterility Information")} {inp("sec2", "sterilityInfo", "e.g. Non-sterile / EO sterilized / Sterile-single use")}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>{lbl("Label Document (GCS path)")} {inp("sec2", "labelDocUrl", "GCS path or URL to label artwork PDF")}</div>
            <div>{lbl("IFU Document (GCS path)")} {inp("sec2", "ifuDocUrl", "GCS path or URL to IFU PDF")}</div>
          </div>
        </div>
      )}

      {/* ── Section 3: Design & Manufacturing ── */}
      {activeTab === "sec3" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>{lbl("Manufacturing Site Name", true)} {inp("sec3", "manufacturingSite", "e.g. MedTech Diagnostics Pvt Ltd")}</div>
            <div>{lbl("Site Address")} {inp("sec3", "manufacturerAddress", "Full address with PIN code")}</div>
          </div>
          <div>{lbl("Manufacturing Process Overview", true)}{ta("sec3", "manufacturingProcess", "Describe key manufacturing steps, quality checkpoints, and final inspection process…", 4)}</div>
          <div>{lbl("Sterilization Method")} {inp("sec3", "sterilizationMethod", "e.g. EO sterilization, Gamma irradiation, or N/A")}</div>
          <div>{chk("sec3", "designControlsApplied", "Design Controls Applied (ISO 13485 §7.3)", "Design and development planning, inputs, outputs, verification, and validation are documented")}</div>
          <div>{lbl("ISO 13485 Certificate (GCS path)")} {inp("sec3", "iso13485CertUrl", "GCS path or URL to certificate PDF")}</div>
        </div>
      )}

      {/* ── Section 4: Risk Management ── */}
      {activeTab === "sec4" && (
        <div className="space-y-5">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <strong>MDR 2017 Rule 6:</strong> A risk management file per ISO 14971 is mandatory for all device classes.
          </div>
          <div>{lbl("Risk Management Standard", true)} {inp("sec4", "riskManagementStandard", "e.g. ISO 14971:2019")}</div>
          <div>{lbl("Hazards Identified", true)}{ta("sec4", "hazardsIdentified", "List identified hazards — electrical, biological, mechanical, software-related, use-error…", 4)}</div>
          <div>{lbl("Risk Control Measures", true)}{ta("sec4", "riskControlMeasures", "Describe risk control measures applied for each hazard category…", 4)}</div>
          <div>{lbl("Risk-Benefit Summary")}{ta("sec4", "riskBenefitSummary", "Summary statement that residual risks are outweighed by clinical benefits…")}</div>
          <div>{chk("sec4", "residualRiskAcceptable", "Residual risks are acceptable per ISO 14971 criteria", "All residual risks have been evaluated and found acceptable in relation to the benefits")}</div>
          <div>{lbl("Risk Management File (GCS path)")} {inp("sec4", "rmfDocUrl", "GCS path or URL to RMF document")}</div>
        </div>
      )}

      {/* ── Section 5: Testing & Verification ── */}
      {activeTab === "sec5" && (
        <div className="space-y-5">
          <div className="space-y-3">
            {chk("sec5", "performanceTested", "Performance / Functionality Testing Complete", "Bench tests demonstrating the device meets its performance specifications")}
            <div>
              {inp("sec5", "electricalSafetyStandard", "Electrical Safety Standard applied (e.g. IEC 60601-1, IEC 60601-1-2 EMC)")}
            </div>
            {chk("sec5", "biocompatibilityDone", "Biocompatibility Testing Complete (ISO 10993)", "Testing for cytotoxicity, sensitization, irritation for patient-contacting materials")}
            <div>
              {inp("sec5", "biocompatibilityStandard", "Biocompatibility standard (e.g. ISO 10993-1:2018)")}
            </div>
            {chk("sec5", "softwareLifecycleDone", "Software Lifecycle Documentation (IEC 62304)", "Applicable for SaMD or devices with embedded software")}
            {chk("sec5", "sterilizationValidationDone", "Sterilization Validation Complete", "Skip if device is non-sterile")}
            {chk("sec5", "shelfLifeTested", "Shelf-Life / Accelerated Aging Testing Complete")}
          </div>

          {/* Standards matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              {lbl("Standards Compliance Matrix")}
              <button
                type="button"
                onClick={() => setSection("sec5", "standardsMatrix", [...(data.sec5.standardsMatrix || []), { standard: "", applicability: "", status: "under-review", docRef: "" }])}
                className="text-xs text-violet-600 hover:underline font-semibold"
              >
                + Add standard
              </button>
            </div>
            {(data.sec5.standardsMatrix || []).length === 0 && (
              <p className="text-xs text-muted italic">No standards added. Click "+ Add standard" to build your compliance matrix.</p>
            )}
            {(data.sec5.standardsMatrix || []).map((row: any, i: number) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-center">
                <input value={row.standard} onChange={(e) => { const m = [...data.sec5.standardsMatrix]; m[i].standard = e.target.value; setSection("sec5", "standardsMatrix", m); }} placeholder="IEC 60601-1" className="text-xs border border-border rounded-lg px-2 py-1.5" />
                <input value={row.applicability} onChange={(e) => { const m = [...data.sec5.standardsMatrix]; m[i].applicability = e.target.value; setSection("sec5", "standardsMatrix", m); }} placeholder="Electrical safety" className="text-xs border border-border rounded-lg px-2 py-1.5" />
                <select value={row.status} onChange={(e) => { const m = [...data.sec5.standardsMatrix]; m[i].status = e.target.value; setSection("sec5", "standardsMatrix", m); }} className="text-xs border border-border rounded-lg px-2 py-1.5">
                  <option value="applicable">Applicable ✓</option>
                  <option value="not-applicable">N/A</option>
                  <option value="under-review">In Review</option>
                </select>
                <button onClick={() => { const m = data.sec5.standardsMatrix.filter((_: any, j: number) => j !== i); setSection("sec5", "standardsMatrix", m); }} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 6: Clinical Evaluation ── */}
      {activeTab === "sec6" && (
        <div className="space-y-5">
          {!classRequiresSec6 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              Class A devices are generally exempt from full clinical evaluation. You may still document equivalence data if available.
            </div>
          )}
          {classRequiresSec6 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              <strong>MDR 2017 Schedule V §6:</strong> Class {deviceClass} devices require a Clinical Evaluation Report (CER) demonstrating safety and performance through clinical data.
            </div>
          )}
          {chk("sec6", "clinicalEvalRequired", "Clinical Evaluation Required for this device")}
          <div>
            {lbl("CER Status")}
            <select value={data.sec6.cerStatus} onChange={(e) => setSection("sec6", "cerStatus", e.target.value)} className="w-full text-sm border border-border rounded-xl px-4 py-3">
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div>
            {lbl("Clinical Data Source")}
            <input value={data.sec6.clinicalDataSource} onChange={(e) => setSection("sec6", "clinicalDataSource", e.target.value)} placeholder="e.g. Literature review, clinical trial, substantial equivalence data" className="w-full text-sm border border-border rounded-xl px-4 py-3" />
          </div>
          <div className="space-y-3">
            {chk("sec6", "literatureReviewDone", "Literature Review Complete", "Systematic review of published clinical data for equivalent devices")}
            {chk("sec6", "clinicalTrialDone", "Clinical Trial / Study Data Available")}
          </div>
          <div>{lbl("CER Document (GCS path)")} <input value={data.sec6.cerDocUrl} onChange={(e) => setSection("sec6", "cerDocUrl", e.target.value)} placeholder="GCS path or URL to CER PDF" className="w-full text-sm border border-border rounded-xl px-4 py-3" /></div>
        </div>
      )}

      {/* ── Section 7: Post-Market Surveillance ── */}
      {activeTab === "sec7" && (
        <div className="space-y-5">
          {!classRequiresSec7 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              Class A/B devices require a basic PMS plan. Full PSUR is mandatory only for Class C/D.
            </div>
          )}
          {classRequiresSec7 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
              <strong>MDR 2017 Rule 30:</strong> Class {deviceClass} — A Post-Market Surveillance plan and Periodic Safety Update Report (PSUR) are mandatory.
            </div>
          )}
          {chk("sec7", "pmsPlanRequired", "Post-Market Surveillance Plan Required")}
          <div>
            {lbl("PMS Plan Status")}
            <select value={data.sec7.pmsPlanStatus} onChange={(e) => setSection("sec7", "pmsPlanStatus", e.target.value)} className="w-full text-sm border border-border rounded-xl px-4 py-3">
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div>
            {lbl("PSUR Frequency")}
            <input value={data.sec7.psurFrequency} onChange={(e) => setSection("sec7", "psurFrequency", e.target.value)} placeholder="e.g. Annual, Biennial" className="w-full text-sm border border-border rounded-xl px-4 py-3" />
          </div>
          {chk("sec7", "vigilanceSetup", "Vigilance Reporting System Established (MDR Rule 30 / Form MD-40)", "Adverse event reporting mechanism set up and staff trained")}
          <div>{lbl("PMS Plan Document (GCS path)")} <input value={data.sec7.pmsPlanUrl} onChange={(e) => setSection("sec7", "pmsPlanUrl", e.target.value)} placeholder="GCS path or URL to PMS plan PDF" className="w-full text-sm border border-border rounded-xl px-4 py-3" /></div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          {SECTIONS.findIndex((s) => s.id === activeTab) > 0 && (
            <button onClick={() => setActiveTab(SECTIONS[SECTIONS.findIndex((s) => s.id === activeTab) - 1].id)} className="text-sm px-5 py-2.5 border border-border rounded-xl hover:bg-surface2 transition">← Prev</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-green-600">Saved at {savedAt}</span>}
          <button onClick={save} disabled={isSaving} className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-60">
            {isSaving ? "Saving…" : "Save Section"}
          </button>
          {SECTIONS.findIndex((s) => s.id === activeTab) < SECTIONS.length - 1 && (
            <button onClick={() => setActiveTab(SECTIONS[SECTIONS.findIndex((s) => s.id === activeTab) + 1].id)} className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-violet-600 text-violet-600 hover:bg-violet-50 transition">Next →</button>
          )}
        </div>
      </div>
    </div>
  );
}
