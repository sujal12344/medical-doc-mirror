"use client";

type IVDForm = {
  ivdSelfTest: boolean; ivdNearPatient: boolean;
  ivdBloodDonorScreening: boolean; ivdBloodGrouping: boolean;
  ivdForKnownCondition: boolean;
  ivdTargetsHIV: boolean; ivdTargetsHBV: boolean; ivdTargetsHCV: boolean;
  ivdTargetsHTLV: boolean; ivdTargetsMalaria: boolean;
  ivdTargetsSyphilis: boolean; ivdTargetsCMV: boolean; ivdTargetsSTI: boolean;
  ivdGeneticTesting: boolean; ivdDrugMonitoring: boolean; ivdHLATyping: boolean;
  ivdCongenitalScreening: boolean; ivdCancerMarkers: boolean; ivdFertility: boolean;
};
type Upd = (field: string, value: boolean) => void;

// ── IVD Part II classification logic (MDR 2017 First Schedule Part II) ─────────
function getIVDClass(f: IVDForm): { cls: string; rule: string } | null {
  // Rule 1 — Blood donor screening (highest priority)
  if (f.ivdBloodDonorScreening) {
    if (f.ivdTargetsHIV || f.ivdTargetsHBV || f.ivdTargetsHCV || f.ivdTargetsHTLV || f.ivdTargetsMalaria)
      return { cls: "D", rule: "Rule 1 — Blood donor screening for HIV/HBV/HCV/HTLV/Malaria" };
    if (f.ivdTargetsSyphilis || f.ivdTargetsCMV)
      return { cls: "C", rule: "Rule 1 — Blood donor screening for Syphilis/CMV" };
    return { cls: "C", rule: "Rule 1 — Blood donor screening reagent" };
  }
  // Rule 2 — Blood grouping / blood banking
  if (f.ivdBloodGrouping)
    return { cls: "C", rule: "Rule 2 — Blood grouping (ABO/Rh/Kell/Kidd/Duffy/Lewis)" };
  // Rule 3 — Self-testing
  if (f.ivdSelfTest) {
    if (f.ivdTargetsHIV) return { cls: "D", rule: "Rule 3 — Self-test for HIV" };
    if (f.ivdTargetsHBV || f.ivdTargetsHCV || f.ivdTargetsSTI)
      return { cls: "C", rule: "Rule 3 — Self-test for infectious disease" };
    if (f.ivdForKnownCondition || f.ivdFertility || f.ivdDrugMonitoring)
      return { cls: "B", rule: "Rule 3 — Self-test for monitoring known condition / fertility" };
    return { cls: "C", rule: "Rule 3 — Self-testing device" };
  }
  // Rule 4 — Near-patient / Point of care
  if (f.ivdNearPatient) {
    if (f.ivdForKnownCondition || f.ivdDrugMonitoring)
      return { cls: "B", rule: "Rule 4 — Near-patient testing for monitoring known condition" };
    return { cls: "C", rule: "Rule 4 — Near-patient / point-of-care testing" };
  }
  // Rule 5 — Infection markers
  if (f.ivdTargetsHIV) return { cls: "C", rule: "Rule 5 — Diagnosis of HIV (non-donor screening)" };
  if (f.ivdTargetsHBV || f.ivdTargetsHCV) return { cls: "C", rule: "Rule 5 — Diagnosis of HBV/HCV" };
  if (f.ivdTargetsSTI || f.ivdTargetsSyphilis) return { cls: "C", rule: "Rule 5 — Diagnosis of sexually transmitted infection" };
  // Rule 6 — Genetic testing
  if (f.ivdGeneticTesting) return { cls: "C", rule: "Rule 6 — Genetic testing for heritable disorder" };
  // Rule 6 — Congenital / prenatal
  if (f.ivdCongenitalScreening) return { cls: "C", rule: "Rule 6 — Prenatal/congenital disorder screening" };
  // Rule 6 — HLA
  if (f.ivdHLATyping) return { cls: "C", rule: "Rule 6 — HLA tissue typing" };
  // Rule 7 — Drug monitoring / cancer markers
  if (f.ivdDrugMonitoring) return { cls: "C", rule: "Rule 7 — Monitoring of drug treatment" };
  if (f.ivdCancerMarkers) return { cls: "C", rule: "Rule 7 — Tumour markers / cancer markers" };
  return null;
}

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-orange-100 text-orange-800 border-orange-300",
  D: "bg-red-100 text-red-800 border-red-300",
};

function Toggle({ field, label, hint, badge, badgeColor, value, upd }: {
  field: string; label: string; hint: string;
  badge?: string; badgeColor?: string;
  value: boolean; upd: Upd;
}) {
  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-xl border transition ${value ? "bg-yellow-50 border-yellow-200" : "border-transparent hover:bg-surface2"}`}>
      <button type="button" onClick={() => upd(field, !value)}
        className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${value ? "bg-accent" : "bg-surface2 border border-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted leading-tight">{hint}</div>
      </div>
      {badge && (
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor || "bg-surface2 text-muted border-border"}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

const D_TAG = "bg-red-50 text-red-700 border-red-200";
const C_TAG = "bg-orange-50 text-orange-700 border-orange-200";
const B_TAG = "bg-blue-50 text-blue-700 border-blue-200";
const A_TAG = "bg-green-50 text-green-700 border-green-200";

export default function IVDCharacterisation({ form, upd }: { form: IVDForm; upd: Upd }) {
  const preview = getIVDClass(form);

  const showPathogens = form.ivdBloodDonorScreening || form.ivdTargetsHIV || form.ivdTargetsHBV ||
    form.ivdTargetsHCV || form.ivdTargetsHTLV || form.ivdTargetsMalaria ||
    form.ivdTargetsSyphilis || form.ivdTargetsCMV || form.ivdTargetsSTI;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface2 border-b border-border">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wide">IVD Characterisation</div>
        <div className="text-xs text-muted mt-0.5">First Schedule Part II, MDR 2017 — Rules 1–7</div>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* Group A: Testing context */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">A — Testing Context</div>
          <Toggle field="ivdBloodDonorScreening" label="Blood donation screening" upd={upd} value={form.ivdBloodDonorScreening}
            hint="Used to screen donated blood/plasma/cells before transfusion" badge="Rule 1" badgeColor={D_TAG} />
          <Toggle field="ivdBloodGrouping" label="Blood grouping / blood banking" upd={upd} value={form.ivdBloodGrouping}
            hint="ABO, Rh, Kell, Kidd, Duffy, Lewis, MNS — typing or antibody screening" badge="Rule 2 → Class C" badgeColor={C_TAG} />
          <Toggle field="ivdSelfTest" label="Self-testing device" upd={upd} value={form.ivdSelfTest}
            hint="Intended for lay users to perform and interpret without professional assistance" badge="Rule 3" badgeColor={C_TAG} />
          <Toggle field="ivdNearPatient" label="Near-patient / point-of-care testing" upd={upd} value={form.ivdNearPatient}
            hint="Used outside central lab — GP surgery, clinic, bedside, pharmacy" badge="Rule 4" badgeColor={C_TAG} />

          {/* Conditional: if self-test or near-patient, ask about known condition */}
          {(form.ivdSelfTest || form.ivdNearPatient) && (
            <div className="pl-4 border-l-2 border-accent/30 ml-1">
              <Toggle field="ivdForKnownCondition" label="For monitoring a known / pre-existing condition" upd={upd} value={form.ivdForKnownCondition}
                hint="Patient already has a confirmed diagnosis — e.g. blood glucose for diabetics, INR for warfarin" badge="→ Class B" badgeColor={B_TAG} />
            </div>
          )}
        </div>

        {/* Group B: Pathogen / target */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">B — Target Pathogen / Analyte</div>
          <div className="grid grid-cols-2 gap-x-3">
            <div className="space-y-1">
              <Toggle field="ivdTargetsHIV" label="HIV 1 / HIV 2" upd={upd} value={form.ivdTargetsHIV}
                hint="Antibody, antigen, NAT detection" badge="→ Class D (donor) / C (clinical)" badgeColor={D_TAG} />
              <Toggle field="ivdTargetsHBV" label="Hepatitis B (HBsAg / anti-HBc)" upd={upd} value={form.ivdTargetsHBV}
                hint="Hepatitis B surface antigen or antibody" badge="→ Class D (donor) / C" badgeColor={D_TAG} />
              <Toggle field="ivdTargetsHCV" label="Hepatitis C (HCV)" upd={upd} value={form.ivdTargetsHCV}
                hint="Hepatitis C antibody or antigen" badge="→ Class D (donor) / C" badgeColor={D_TAG} />
              <Toggle field="ivdTargetsHTLV" label="HTLV I / HTLV II" upd={upd} value={form.ivdTargetsHTLV}
                hint="Human T-lymphotropic virus" badge="→ Class D (donor)" badgeColor={D_TAG} />
              <Toggle field="ivdTargetsMalaria" label="Malaria (Plasmodium)" upd={upd} value={form.ivdTargetsMalaria}
                hint="Blood donation malaria screening" badge="→ Class D (donor)" badgeColor={D_TAG} />
            </div>
            <div className="space-y-1">
              <Toggle field="ivdTargetsSyphilis" label="Syphilis (Treponema pallidum)" upd={upd} value={form.ivdTargetsSyphilis}
                hint="RPR, TPPA, anti-treponemal" badge="→ Class C" badgeColor={C_TAG} />
              <Toggle field="ivdTargetsCMV" label="CMV (Cytomegalovirus)" upd={upd} value={form.ivdTargetsCMV}
                hint="Blood donor CMV screening" badge="→ Class C" badgeColor={C_TAG} />
              <Toggle field="ivdTargetsSTI" label="Other STI markers" upd={upd} value={form.ivdTargetsSTI}
                hint="Chlamydia, gonorrhoea, HSV, etc." badge="→ Class C" badgeColor={C_TAG} />
              <Toggle field="ivdFertility" label="Fertility / ovulation / pregnancy" upd={upd} value={form.ivdFertility}
                hint="hCG, LH, FSH, fertility hormones" badge="→ Class B / C" badgeColor={B_TAG} />
            </div>
          </div>
        </div>

        {/* Group C: Special applications */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">C — Special Applications</div>
          <div className="grid grid-cols-2 gap-x-3">
            <div className="space-y-1">
              <Toggle field="ivdGeneticTesting" label="Genetic / genomic testing" upd={upd} value={form.ivdGeneticTesting}
                hint="Detection of heritable genetic disorders or mutations" badge="Rule 6 → Class C" badgeColor={C_TAG} />
              <Toggle field="ivdCongenitalScreening" label="Prenatal / congenital screening" upd={upd} value={form.ivdCongenitalScreening}
                hint="Foetal abnormalities, NTD, Down syndrome screening" badge="Rule 6 → Class C" badgeColor={C_TAG} />
              <Toggle field="ivdHLATyping" label="HLA tissue typing" upd={upd} value={form.ivdHLATyping}
                hint="Human leucocyte antigen typing for transplantation" badge="Rule 6 → Class C" badgeColor={C_TAG} />
            </div>
            <div className="space-y-1">
              <Toggle field="ivdDrugMonitoring" label="Drug / therapeutic monitoring" upd={upd} value={form.ivdDrugMonitoring}
                hint="Monitoring drug levels — anticoagulants, immunosuppressants, antibiotics" badge="Rule 7 → Class C" badgeColor={C_TAG} />
              <Toggle field="ivdCancerMarkers" label="Cancer / tumour markers" upd={upd} value={form.ivdCancerMarkers}
                hint="PSA, CA-125, AFP, CEA, HER2, etc." badge="Rule 7 → Class C" badgeColor={C_TAG} />
            </div>
          </div>
        </div>

        {/* Group D: Preview */}
        {/* <div className="border border-border rounded-xl p-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">D — Preliminary Classification (Part II)</div>
          {!preview ? (
            <div className="space-y-1">
              <div className="text-xs text-muted italic">No special context selected — applying Rule 2(v)</div>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black bg-green-100 text-green-800 border-green-300">A</div>
                <div>
                  <div className="text-sm font-bold text-foreground">Class A</div>
                  <div className="text-xs text-muted">Rule 2(v) — Specific-purpose IVD reagent / instrument</div>
                  <div className="text-[10px] text-muted mt-1 italic">Preliminary only — confirmed by AI Classification wizard after saving</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${CLASS_COLORS[preview.cls]}`}>
                {preview.cls}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Class {preview.cls}</div>
                <div className="text-xs text-muted">{preview.rule}</div>
                <div className="text-[10px] text-muted mt-1 italic">Preliminary only — confirmed by AI Classification wizard after saving</div>
              </div>
            </div>
          )}
        </div> */}

        {/* Reminder: general chemistry goes Class A */}
        {/* <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <span className="text-sm">ℹ️</span>
          <div className="text-[11px] text-green-800">
            <strong>General chemistry reagents</strong> (albumin, glucose, cholesterol, urea, enzymes, electrolytes) are <strong>Class A — Rule 2(v)</strong> by default. Only toggle fields above if they genuinely apply.
          </div>
        </div> */}
      </div>
    </div>
  );
}
