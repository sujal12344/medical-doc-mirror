"use client";

type LockForm = {
  deviceClass: "A" | "B" | "C" | "D";
  deviceType: string;
  predicateExists: null | boolean;
  predicateName: string;
  classificationConfirmed: boolean;
  classificationOverride: "A" | "B" | "C" | "D" | "";
  classificationNote: string;
  classificationConfirmedBy: string;
  classificationLocked: boolean;
  classificationLockedBy: string;
};

type Upd = (field: string, value: string | boolean) => void;

const CLASS_META: Record<string, { color: string; badge: string; risk: string; desc: string }> = {
  A: { color: "bg-green-100 border-green-300 text-green-900", badge: "bg-green-600", risk: "Low Risk", desc: "General-purpose lab instruments, specimen receptacles, specific IVD reagents" },
  B: { color: "bg-blue-100 border-blue-300 text-blue-900",   badge: "bg-blue-600",  risk: "Low-Moderate Risk", desc: "Non-invasive devices, active diagnostic devices, short-term body-orifice devices" },
  C: { color: "bg-orange-100 border-orange-300 text-orange-900", badge: "bg-orange-500", risk: "Moderate-High Risk", desc: "Implantables, blood grouping, infection diagnostic reagents, surgical invasive short-term" },
  D: { color: "bg-red-100 border-red-300 text-red-900",     badge: "bg-red-600",   risk: "High Risk", desc: "Blood donor screening (HIV/HBV/HCV), life-supporting implants, CNS contact devices" },
};

const FIELD = "w-full px-3 py-2 border border-border rounded-xl bg-surface2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition";

export default function ClassificationLock({ form, upd }: { form: LockForm; upd: Upd }) {
  const finalClass = (form.classificationOverride || form.deviceClass) as "A" | "B" | "C" | "D";
  const meta = CLASS_META[finalClass] || CLASS_META["A"];
  const isHighRisk = ["C", "D"].includes(finalClass);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Classification Confirmation &amp; Lock</h2>
          <p className="text-xs text-muted mt-0.5">Steps 1.6 → 1.8 → 1.9 — Confirm, lock, and record final MDR 2017 device class</p>
        </div>
        <span className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-surface2 border border-border text-muted font-semibold">1.6 → 1.9</span>
      </div>

      {/* Step 1.6 — Confirm classification */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-sm bg-orange-100 text-orange-700 text-[9px] font-black flex items-center justify-center border border-orange-300 rotate-45 shrink-0" />
          <span className="text-xs font-bold text-foreground">1.6 · Is the AI-suggested classification correct?</span>
        </div>

        {/* AI-suggested class display */}
        <div className={`flex items-center gap-4 p-3 rounded-xl border-2 ${CLASS_META[form.deviceClass]?.color}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white ${CLASS_META[form.deviceClass]?.badge}`}>
            {form.deviceClass}
          </div>
          <div>
            <div className="text-xs font-bold">AI-suggested: Class {form.deviceClass} — {CLASS_META[form.deviceClass]?.risk}</div>
            <div className="text-[11px] opacity-75">{CLASS_META[form.deviceClass]?.desc}</div>
            <div className="text-[10px] mt-1 opacity-60">
              {form.predicateExists ? `Predicate pathway · ${form.predicateName}` : "Novel device pathway"}
              {" · "}{form.deviceType === "ivd" ? "IVD (Part II)" : "Medical Device (Part I)"}
            </div>
          </div>
        </div>

        {/* Override option */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted">Override classification (if AI reasoning is incorrect):</div>
          <div className="flex gap-1.5">
            {(["A", "B", "C", "D"] as const).map((cls) => (
              <button key={cls} type="button"
                onClick={() => upd("classificationOverride", form.classificationOverride === cls ? "" : cls)}
                className={`w-10 h-10 rounded-xl border-2 text-sm font-black transition ${
                  form.classificationOverride === cls
                    ? CLASS_META[cls].color + " ring-2 ring-offset-1 ring-current"
                    : "border-border bg-surface2 text-muted hover:bg-surface"
                }`}>
                {cls}
              </button>
            ))}
            {form.classificationOverride && (
              <button type="button" onClick={() => upd("classificationOverride", "")}
                className="px-3 text-xs text-muted border border-border rounded-xl hover:bg-surface2 transition">
                Reset
              </button>
            )}
          </div>
          {form.classificationOverride && (
            <div>
              <textarea rows={2} value={form.classificationNote}
                onChange={(e) => upd("classificationNote", e.target.value)}
                className={FIELD} placeholder="Reason for override — cite specific MDR 2017 rule or regulatory rationale (required for Class C/D)" />
            </div>
          )}
        </div>

        {/* Confirming person */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Confirmed by (regulatory affairs officer / RA consultant)</label>
          <input type="text" value={form.classificationConfirmedBy}
            onChange={(e) => upd("classificationConfirmedBy", e.target.value)}
            className={FIELD} placeholder="Full name — person responsible for this classification decision" />
        </div>

        {/* Confirm toggle */}
        <div className={`flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border transition ${
          form.classificationConfirmed ? "bg-green-50 border-green-300" : "border-border hover:bg-surface2"
        }`}>
          <div>
            <div className="text-xs font-semibold text-foreground">Confirm classification as Class {finalClass}</div>
            <div className="text-[11px] text-muted">
              {form.classificationConfirmedBy
                ? `Confirming as: ${form.classificationConfirmedBy}`
                : "Enter confirming person name above first"}
            </div>
          </div>
          <button type="button" disabled={!form.classificationConfirmedBy}
            onClick={() => upd("classificationConfirmed", !form.classificationConfirmed)}
            className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${
              form.classificationConfirmed ? "bg-green-600" : "bg-surface2 border border-border"
            } disabled:opacity-40`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.classificationConfirmed ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Divider */}
      {form.classificationConfirmed && (
        <>
          <div className="border-t border-dashed border-border" />

          {/* Step 1.8 — Lock classification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black flex items-center justify-center border border-purple-300">1.8</span>
              <span className="text-xs font-bold text-foreground">Lock Classification</span>
            </div>

            {isHighRisk && !form.classificationLocked && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <span className="text-sm shrink-0">⚠️</span>
                <div className="text-[11px] text-red-800">
                  <strong>Class {finalClass}:</strong> Locking classification will trigger mandatory Phase 2 Technical Dossier requirements including clinical evaluation report (CER), risk management file (ISO 14971), and performance/safety data submission.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Locked by</label>
              <input type="text" value={form.classificationLockedBy}
                onChange={(e) => upd("classificationLockedBy", e.target.value)}
                className={FIELD} placeholder="Name of authorised person locking this classification" />
            </div>

            <button type="button" disabled={!form.classificationLockedBy}
              onClick={() => upd("classificationLocked", !form.classificationLocked)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                form.classificationLocked
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}>
              {form.classificationLocked ? "🔒 Classification Locked" : "🔓 Lock Classification"}
            </button>
          </div>

          {/* Step 1.9 — Final class display */}
          {form.classificationLocked && (
            <>
              <div className="border-t border-dashed border-border" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-sm bg-orange-100 text-orange-700 text-[9px] font-black flex items-center justify-center border border-orange-300 rotate-45 shrink-0" />
                  <span className="text-xs font-bold text-foreground">1.9 · Final Classification</span>
                </div>

                <div className={`flex items-center gap-5 p-4 rounded-xl border-2 ${meta.color}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg ${meta.badge}`}>
                    {finalClass}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-foreground">Class {finalClass} — {meta.risk}</div>
                    <div className="text-[11px] text-muted mt-0.5">{meta.desc}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/70 border border-current font-semibold">🔒 LOCKED</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/70 border border-current font-semibold">By: {form.classificationLockedBy}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/70 border border-current font-semibold">{form.deviceType === "ivd" ? "Part II" : "Part I"}</span>
                      {form.classificationOverride && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/70 border border-current font-semibold">⚠ Overridden from {form.deviceClass}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-3 py-2 text-[11px] text-muted">
                  <span>✅</span>
                  Phase 1 Classification complete.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
