"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// MDR 2017 Schedule III — simplified rule engine
// Returns suggested class based on questionnaire answers
function suggestMDRClass(data: any): { cls: string; rationale: string } {
  if (data.isIVD) {
    if (data.isImplantable) return { cls: "D", rationale: "IVD used for life-threatening conditions — Schedule III Rule 4(d)" };
    return { cls: "B", rationale: "In Vitro Diagnostic device — Schedule III Rule 4(b)" };
  }
  if (data.isImplantable) return { cls: "D", rationale: "Long-term implantable device — Schedule III Rule 3(d)" };
  if (data.isSoftware) return { cls: "B", rationale: "Software as Medical Device (SaMD) — Schedule III Rule 3(b)" };
  return { cls: "A", rationale: "Non-invasive device with low individual/public risk — Schedule III Rule 3(a)" };
}

const STEPS = [
  { id: 1, label: "Device Identity" },
  { id: 2, label: "MDR Classification" },
  { id: 3, label: "Regulatory Targets" },
  { id: 4, label: "Predicate & HS Code" },
];

const REGULATION_OPTIONS = [
  { key: "CDSCO", label: "CDSCO (India)", flag: "🇮🇳", desc: "MDR 2017 — Class A/B/C/D" },
  { key: "FDA-510k", label: "FDA 510(k)", flag: "🇺🇸", desc: "Class I/II cleared devices" },
  { key: "FDA-PMA", label: "FDA PMA", flag: "🇺🇸", desc: "Class III high-risk devices" },
  { key: "EU-MDR", label: "EU MDR", flag: "🇪🇺", desc: "CE Mark — Regulation 2017/745" },
  { key: "CE-IVD", label: "EU IVDR", flag: "🇪🇺", desc: "CE Mark — Regulation 2017/746" },
  { key: "TGA", label: "TGA (Australia)", flag: "🇦🇺", desc: "Therapeutic Goods Administration" },
  { key: "ANVISA", label: "ANVISA (Brazil)", flag: "🇧🇷", desc: "Brazilian Health Regulatory Agency" },
];

const CLASS_INFO: Record<string, { color: string; bg: string; risk: string; examples: string }> = {
  A: { color: "text-[var(--class-a)]", bg: "bg-[var(--class-a-bg)] border-[var(--class-a-border)]", risk: "Low Risk", examples: "Tongue depressors, bandages, stethoscopes" },
  B: { color: "text-[var(--class-b)]", bg: "bg-[var(--class-b-bg)] border-[var(--class-b-border)]", risk: "Low-Moderate Risk", examples: "Syringes, blood glucose meters, hearing aids" },
  C: { color: "text-[var(--class-c)]", bg: "bg-[var(--class-c-bg)] border-[var(--class-c-border)]", risk: "Moderate-High Risk", examples: "Ventilators, bone fixation plates, dialysis machines" },
  D: { color: "text-[var(--class-d)]", bg: "bg-[var(--class-d-bg)] border-[var(--class-d-border)]", risk: "Highest Risk", examples: "Heart valves, implantable defibrillators, HIV test kits" },
};

export default function ClassificationWizard({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const [data, setData] = useState({
    deviceName: initialData?.deviceName || "",
    intendedUse: initialData?.intendedUse || "",
    isIVD: initialData?.isIVD || false,
    isSoftware: initialData?.isSoftware || false,
    isImplantable: initialData?.isImplantable || false,
    mdrClass: initialData?.mdrClass || "",
    mdrClassRationale: initialData?.mdrClassRationale || "",
    targetRegulations: initialData?.targetRegulations || [],
    predicateDeviceName: initialData?.predicateDeviceName || "",
    predicateDeviceNumber: initialData?.predicateDeviceNumber || "",
    hsCode: initialData?.hsCode || "",
    classificationLocked: initialData?.classificationLocked || false,
  });

  const set = (field: string, value: any) => setData((p) => ({ ...p, [field]: value }));

  const toggleRegulation = (key: string) => {
    setData((p) => ({
      ...p,
      targetRegulations: p.targetRegulations.includes(key)
        ? p.targetRegulations.filter((r: string) => r !== key)
        : [...p.targetRegulations, key],
    }));
  };

  const autoClassify = () => {
    const { cls, rationale } = suggestMDRClass(data);
    setData((p) => ({ ...p, mdrClass: cls, mdrClassRationale: rationale }));
  };

  const completionPct = Math.round(
    ([
      data.deviceName,
      data.intendedUse,
      data.mdrClass,
      data.targetRegulations.length > 0,
    ].filter(Boolean).length / 4) * 100
  );

  const save = async (lock = false) => {
    lock ? setIsLocking(true) : setIsSaving(true);
    try {
      const payload: any = {
        deviceClassification: {
          ...data,
          completionPct,
          lastUpdated: new Date(),
        },
      };
      if (lock) {
        payload.deviceClassification.classificationLocked = true;
        payload.deviceClassification.lockedAt = new Date();
      }
      const res = await fetch("/api/companies/me/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      if (lock) {
        setData((p) => ({ ...p, classificationLocked: true }));
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
      setIsLocking(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return data.deviceName.trim() !== "" && data.intendedUse.trim() !== "";
    if (step === 2) return data.mdrClass !== "";
    if (step === 3) return data.targetRegulations.length > 0;
    return true;
  };

  const classInfo = data.mdrClass ? CLASS_INFO[data.mdrClass] : null;

  return (
    <div>
      {/* Locked banner */}
      {data.classificationLocked && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-xl text-sm text-[var(--status-success)]">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span><strong>Classification Locked.</strong> This classification has been frozen and will be used across all regulatory submissions.</span>
          <button onClick={() => setData((p) => ({ ...p, classificationLocked: false }))} className="ml-auto text-xs underline text-[var(--status-success)] hover:opacity-80">Unlock to Edit</button>
        </div>
      )}

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                step === s.id
                  ? "bg-[var(--accent)] text-white"
                  : step > s.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "bg-surface2 text-muted"
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {step > s.id ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                ) : s.id}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px w-6 ${step > s.id ? "bg-[var(--accent)]/40" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Device Identity */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Device Name <span className="text-[var(--status-error)]">*</span></label>
            <input
              type="text"
              value={data.deviceName}
              onChange={(e) => set("deviceName", e.target.value)}
              placeholder="e.g. Pulse Oximeter, Surgical Stapler, HIV Rapid Test Kit"
              className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              disabled={data.classificationLocked}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Intended Use <span className="text-[var(--status-error)]">*</span></label>
            <textarea
              value={data.intendedUse}
              onChange={(e) => set("intendedUse", e.target.value)}
              placeholder="Describe the device's intended use, indications, and target patient population (as per MDR 2017 Rule 2 definition)…"
              rows={4}
              className="w-full text-sm border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              disabled={data.classificationLocked}
            />
            <p className="text-xs text-muted mt-1">This text will be used verbatim in your CDSCO Form MD-14 and Technical File.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Device Characteristics</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { key: "isIVD", label: "In Vitro Diagnostic", desc: "Test performed outside the body (blood, urine, swab tests)", icon: "🧪" },
                { key: "isSoftware", label: "Software (SaMD)", desc: "Software intended for diagnostic or therapeutic use", icon: "💻" },
                { key: "isImplantable", label: "Implantable", desc: "Placed inside or on the surface of the body ≥30 days", icon: "🫀" },
              ].map(({ key, label, desc, icon }) => (
                <button
                  key={key}
                  onClick={() => !data.classificationLocked && set(key, !(data as any)[key])}
                  className={`text-left p-4 border rounded-xl transition text-sm ${
                    (data as any)[key]
                      ? "border-[var(--accent)] bg-[var(--accent)]/8 ring-1 ring-[var(--accent)]/30"
                      : "border-border hover:border-[var(--accent)]/40"
                  } ${data.classificationLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="text-2xl block mb-2">{icon}</span>
                  <p className="font-semibold text-foreground text-xs">{label}</p>
                  <p className="text-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: MDR Classification */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">MDR 2017 Device Class</h3>
              <p className="text-xs text-muted mt-0.5">Select based on Schedule III risk classification rules</p>
            </div>
            <button
              onClick={autoClassify}
              disabled={data.classificationLocked}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition disabled:opacity-50"
            >
              ✨ Auto-suggest
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((cls) => {
              const info = CLASS_INFO[cls];
              return (
                <button
                  key={cls}
                  onClick={() => !data.classificationLocked && set("mdrClass", cls)}
                  className={`text-left p-5 border rounded-xl transition ${
                    data.mdrClass === cls
                      ? `${info.bg} border-current ring-2 ring-offset-1 ring-[var(--accent)]/30`
                      : "border-border hover:border-[var(--accent)]/40"
                  } ${data.classificationLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-lg ${info.bg} ${info.color} border`}>{cls}</span>
                    <div>
                      <p className={`text-sm font-bold ${info.color}`}>Class {cls}</p>
                      <p className={`text-xs font-medium ${info.color} opacity-80`}>{info.risk}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{info.examples}</p>
                </button>
              );
            })}
          </div>

          {data.mdrClass && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Classification Rationale</label>
              <textarea
                value={data.mdrClassRationale}
                onChange={(e) => set("mdrClassRationale", e.target.value)}
                placeholder="Cite the specific Schedule III rule that applies, e.g. 'Rule 3(a) — non-invasive device intended to contact intact skin only'…"
                rows={3}
                className="w-full text-sm border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                disabled={data.classificationLocked}
              />
              <p className="text-xs text-muted mt-1">This justification will appear in your Technical Documentation (Annex II CDSCO).</p>
            </div>
          )}

          {classInfo && data.mdrClass && (
            <div className={`p-4 rounded-xl border text-sm ${classInfo.bg} ${classInfo.color}`}>
              <p className="font-semibold mb-1">Class {data.mdrClass} — {classInfo.risk}</p>
              <p className="text-xs opacity-80">
                {data.mdrClass === "A" && "Exempt from full technical file. CDSCO registration required. Low conformity burden."}
                {data.mdrClass === "B" && "Technical documentation, design control, and QMS per ISO 13485 required."}
                {data.mdrClass === "C" && "Clinical evaluation mandatory. Third-party audit by a CDSCO-recognized Notified Body required."}
                {data.mdrClass === "D" && "Strictest requirements: pre-market approval, clinical trials, post-market surveillance plan, and CDSCO inspection."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Regulatory Targets */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Target Regulatory Markets</h3>
            <p className="text-xs text-muted mt-0.5">Select all markets you intend to commercialize in. Your dossier will be structured accordingly.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {REGULATION_OPTIONS.map(({ key, label, flag, desc }) => {
              const selected = data.targetRegulations.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => !data.classificationLocked && toggleRegulation(key)}
                  className={`flex items-start gap-3 text-left p-4 border rounded-xl transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/8 ring-1 ring-[var(--accent)]/30"
                      : "border-border hover:border-[var(--accent)]/40"
                  } ${data.classificationLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="text-2xl leading-none">{flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                  {selected && (
                    <svg className="w-4 h-4 text-[var(--accent)] ml-auto shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Predicate & HS Code */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Predicate Device (for 510k / Substantial Equivalence)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Predicate Device Name</label>
                <input
                  type="text"
                  value={data.predicateDeviceName}
                  onChange={(e) => set("predicateDeviceName", e.target.value)}
                  placeholder="e.g. Nellcor N-595 Pulse Oximeter"
                  className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  disabled={data.classificationLocked}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">510(k) / CDSCO Predicate Number</label>
                <input
                  type="text"
                  value={data.predicateDeviceNumber}
                  onChange={(e) => set("predicateDeviceNumber", e.target.value)}
                  placeholder="e.g. K981062"
                  className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  disabled={data.classificationLocked}
                />
              </div>
            </div>
            <p className="text-xs text-muted mt-2">Leave blank if filing for novel classification. Required for FDA 510(k) and CDSCO substantial equivalence route.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">ITC-HS Code (Customs Tariff)</label>
            <input
              type="text"
              value={data.hsCode}
              onChange={(e) => set("hsCode", e.target.value)}
              placeholder="e.g. 9018.19.90 (Electro-diagnostic instruments)"
              className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              disabled={data.classificationLocked}
            />
            <p className="text-xs text-muted mt-1">Required for import of components under DGFT/IEC. Chapter 90 covers most medical devices.</p>
          </div>

          {/* Summary card */}
          {data.mdrClass && (
            <div className="p-5 bg-surface2 border border-border rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-foreground">Classification Summary</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div><span className="text-muted">Device:</span> <span className="font-medium text-foreground ml-1">{data.deviceName || "—"}</span></div>
                <div><span className="text-muted">MDR Class:</span> <span className={`font-bold ml-1 ${CLASS_INFO[data.mdrClass]?.color}`}>Class {data.mdrClass} — {CLASS_INFO[data.mdrClass]?.risk}</span></div>
                <div><span className="text-muted">IVD:</span> <span className="font-medium text-foreground ml-1">{data.isIVD ? "Yes" : "No"}</span></div>
                <div><span className="text-muted">Implantable:</span> <span className="font-medium text-foreground ml-1">{data.isImplantable ? "Yes" : "No"}</span></div>
                <div className="col-span-2"><span className="text-muted">Markets:</span> <span className="font-medium text-foreground ml-1">{data.targetRegulations.join(", ") || "—"}</span></div>
                {data.hsCode && <div className="col-span-2"><span className="text-muted">HS Code:</span> <span className="font-medium text-foreground ml-1">{data.hsCode}</span></div>}
              </div>
            </div>
          )}

          {!data.classificationLocked && data.mdrClass && (
            <button
              onClick={() => save(true)}
              disabled={isLocking}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
            >
              {isLocking ? "Locking…" : "🔒 Lock Classification"}
            </button>
          )}
          {data.classificationLocked && (
            <div className="text-center text-xs text-[var(--status-success)] font-semibold">✅ Classification locked and ready for regulatory submission.</div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="text-sm font-medium px-5 py-2.5 rounded-xl border border-border hover:bg-surface2 transition disabled:opacity-30"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => save(false)}
            disabled={isSaving}
            className="text-sm font-medium px-5 py-2.5 rounded-xl border border-border hover:bg-surface2 transition disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save Draft"}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-40"
            >
              Continue →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
