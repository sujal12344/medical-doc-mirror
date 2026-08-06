"use client";

type FormState = {
  isActive: boolean; activeType: string; isInvasive: boolean;
  invasionType: string; contactDuration: string;
  directCNSContact: boolean; directHeartContact: boolean; lifeSupporting: boolean;
  isImplantable: boolean; ionizingRadiation: boolean; isDrugDeviceCombo: boolean;
  containsAnimalTissue: boolean; isContraceptive: boolean; absorbed: boolean;
  reusableSurgicalInstrument: boolean; oralCavityOrEarOrNasal: boolean;
  mucousMembraneAbsorption: boolean; drugAdministration: boolean;
};

type Upd = (field: string, value: string | boolean) => void;

// ── Classification preview logic ───────────────────────────────────────────────
function getPreviewClass(f: FormState): { cls: string; rule: string } | null {
  if (!f.invasionType && !f.isActive) return null;
  if (f.isDrugDeviceCombo) return { cls: "D", rule: "Rule 15 — drug-device combination" };
  if (f.containsAnimalTissue) return { cls: "D", rule: "Rule 16 — animal/human tissue" };
  if (f.isContraceptive && f.isImplantable) return { cls: "D", rule: "Rule 18 — implantable contraceptive" };
  if (f.isContraceptive) return { cls: "C", rule: "Rule 18 — contraceptive device" };
  if (f.directCNSContact || f.directHeartContact) return { cls: "D", rule: "Rules 9/10/11 — CNS or cardiac contact" };
  if (f.lifeSupporting && f.isImplantable) return { cls: "D", rule: "Rule 11 — life-supporting implant" };
  if (f.isImplantable && (f.absorbed || f.drugAdministration)) return { cls: "D", rule: "Rule 11 — active implant" };
  if (f.isImplantable) return { cls: "C", rule: "Rule 11 — implantable device (minimum Class C)" };
  if (f.invasionType === "surgically-invasive" && f.contactDuration === "transient") {
    if (f.ionizingRadiation || f.absorbed || f.drugAdministration) return { cls: "C", rule: "Rule 9 — surgically invasive, transient + special risk" };
    if (f.reusableSurgicalInstrument) return { cls: "A", rule: "Rule 9b — reusable surgical instrument" };
    return { cls: "B", rule: "Rule 9a — surgically invasive, transient" };
  }
  if (f.invasionType === "surgically-invasive" && f.contactDuration === "short-term") {
    if (f.directCNSContact || f.directHeartContact || f.absorbed) return { cls: "D", rule: "Rule 10 — short-term surgical + critical contact" };
    if (f.ionizingRadiation || f.drugAdministration) return { cls: "C", rule: "Rule 10 — short-term surgical + special risk" };
    return { cls: "B", rule: "Rule 10 — surgically invasive, short-term" };
  }
  if (f.invasionType === "surgically-invasive" && f.contactDuration === "long-term") return { cls: "C", rule: "Rule 11 — surgically invasive, long-term" };
  if (f.invasionType === "body-orifice" && f.contactDuration === "transient") {
    if (f.mucousMembraneAbsorption) return { cls: "B", rule: "Rule 5 — transient body-orifice + absorption" };
    return { cls: "A", rule: "Rule 5 — transient body-orifice" };
  }
  if (f.invasionType === "body-orifice" && f.contactDuration === "short-term") {
    if (f.oralCavityOrEarOrNasal && !f.mucousMembraneAbsorption) return { cls: "A", rule: "Rule 6 — short-term oral/ear/nasal" };
    return { cls: "B", rule: "Rule 6 — short-term body-orifice" };
  }
  if (f.invasionType === "body-orifice" && f.contactDuration === "long-term") {
    if (f.oralCavityOrEarOrNasal && !f.mucousMembraneAbsorption) return { cls: "B", rule: "Rule 7 — long-term oral/ear/nasal" };
    return { cls: "C", rule: "Rule 7 — long-term body-orifice" };
  }
  if (f.isActive && f.activeType === "therapeutic") {
    if (f.ionizingRadiation) return { cls: "C", rule: "Rule 12 — therapeutic active + ionizing radiation" };
    return { cls: "B", rule: "Rule 12 — therapeutic active device" };
  }
  if (f.isActive && f.activeType === "diagnostic") {
    if (f.ionizingRadiation) return { cls: "C", rule: "Rule 13 — diagnostic active + ionizing radiation" };
    return { cls: "B", rule: "Rule 13 — diagnostic active device" };
  }
  if (f.isActive && f.activeType === "other") return { cls: "A", rule: "Rule 14 — powered, non-therapeutic/diagnostic" };
  if (f.invasionType === "non-invasive") return { cls: "A", rule: "Rule 4 — non-invasive device" };
  return null;
}

const CLASS_COLORS: Record<string, string> = {
  A: "bg-[var(--class-a-bg)] text-[var(--class-a-text)] border-[var(--class-a-border)]",
  B: "bg-[var(--class-b-bg)] text-[var(--class-b-text)] border-[var(--class-b-border)]",
  C: "bg-[var(--class-c-bg)] text-[var(--class-c-text)] border-[var(--class-c-border)]",
  D: "bg-[var(--class-d-bg)] text-[var(--class-d-text)] border-[var(--class-d-border)]",
};
const TAG_COLORS: Record<string, string> = {
  "→ Class D": "bg-[var(--class-d-bg)] text-[var(--class-d)] border-[var(--class-d-border)]",
  "→ Class C": "bg-[var(--class-c-bg)] text-[var(--class-c)] border-[var(--class-c-border)]",
  "→ Class A": "bg-[var(--class-a-bg)] text-[var(--class-a)] border-[var(--class-a-border)]",
  "→ May downgrade": "bg-[var(--class-a-bg)] text-[var(--class-a)] border-[var(--class-a-border)]",
  "→ Upgrades": "bg-[var(--class-c-bg)] text-[var(--class-c)] border-[var(--class-c-border)]",
};

function tagColor(tag: string) {
  for (const [k, v] of Object.entries(TAG_COLORS)) {
    if (tag.startsWith(k)) return v;
  }
  return "bg-surface2 text-muted border-border";
}

function RadioGroup({ label, hint, name, value, options, onChange }: {
  label: string; hint?: string; name: string; value: string;
  options: { value: string; label: string; hint: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
      </div>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition ${value === o.value ? "bg-accent/8 border-accent/40" : "border-border hover:bg-surface2"}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value}
              onChange={() => onChange(o.value)} className="mt-0.5 accent-[var(--accent)]" />
            <div>
              <div className="text-xs font-semibold text-foreground">{o.label}</div>
              <div className="text-[11px] text-muted">{o.hint}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function FlagRow({ field, label, hint, tag, value, upd }: {
  field: string; label: string; hint: string; tag: string;
  value: boolean; upd: Upd;
}) {
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-border last:border-0 ${value ? "bg-[var(--status-warning-bg)]/50" : ""} -mx-3 px-3 rounded-lg`}>
      <button type="button" onClick={() => upd(field, !value)}
        className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${value ? "bg-accent" : "bg-surface2 border border-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted leading-tight">{hint}</div>
      </div>
      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${tagColor(tag)}`}>{tag}</span>
    </div>
  );
}

export default function DeviceCharacterisation({ form, upd, specialOpen, setSpecialOpen }:
  { form: FormState; upd: Upd; specialOpen: boolean; setSpecialOpen: (v: boolean) => void }) {

  const anySpecial = [
    form.directCNSContact, form.directHeartContact, form.lifeSupporting, form.isImplantable,
    form.ionizingRadiation, form.isDrugDeviceCombo, form.containsAnimalTissue, form.isContraceptive,
    form.absorbed, form.reusableSurgicalInstrument, form.oralCavityOrEarOrNasal,
    form.mucousMembraneAbsorption, form.drugAdministration,
  ].some(Boolean);

  const preview = getPreviewClass(form);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface2 border-b border-border">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wide">Device Characterisation</div>
        <div className="text-xs text-muted mt-0.5">Used by AI Classification engine — First Schedule Part I, MDR 2017</div>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* Group A: Energy source */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider">A — Energy Source</div>
          <div className="flex items-start justify-between gap-4 py-2 border-b border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Does the device use external energy?</div>
              <div className="text-xs text-muted">Electrical, thermal, radiation — not gravity or human body energy</div>
            </div>
            <button type="button" onClick={() => upd("isActive", !form.isActive)}
              className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-accent" : "bg-surface2 border border-border"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all ${form.isActive ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {form.isActive && (
            <div className="pl-4 border-l-2 border-accent/30">
              <RadioGroup label="Active device type" name="activeType" value={form.activeType}
                onChange={(v) => upd("activeType", v)}
                options={[
                  { value: "therapeutic", label: "Therapeutic", hint: "Delivers energy to treat — ventilator, infusion pump, laser, TENS" },
                  { value: "diagnostic",  label: "Diagnostic",  hint: "Gathers information — X-ray, ECG, ultrasound, pulse oximeter" },
                  { value: "other",       label: "Other",       hint: "Powered but not therapeutic/diagnostic — electric bed, powered wheelchair" },
                ]} />
            </div>
          )}
        </div>

        {/* Group B: Body interaction */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider">B — Body Interaction</div>
          <RadioGroup label="How does the device interact with the body?" name="invasionType" value={form.invasionType}
            onChange={(v) => upd("invasionType", v)}
            options={[
              { value: "non-invasive",       label: "Non-invasive",                     hint: "Stays on intact or injured skin surface — does not enter the body" },
              { value: "body-orifice",       label: "Invasive — body orifice",          hint: "Enters through natural opening — mouth, ear, nose, urethra, vagina, rectum" },
              { value: "surgically-invasive",label: "Invasive — surgically created opening", hint: "Penetrates body surface surgically — incision, puncture, trocar site" },
            ]} />

          {form.invasionType && form.invasionType !== "non-invasive" && (
            <div className="pl-4 border-l-2 border-accent/30">
              <RadioGroup label="Contact duration" name="contactDuration" value={form.contactDuration}
                onChange={(v) => upd("contactDuration", v)}
                options={[
                  { value: "transient",   label: "Transient",   hint: "Less than 60 minutes continuous use" },
                  { value: "short-term",  label: "Short-term",  hint: "60 minutes to 30 days continuous use" },
                  { value: "long-term",   label: "Long-term",   hint: "More than 30 days continuous use" },
                ]} />
            </div>
          )}
        </div>

        {/* Group C: Special risk flags */}
        <div className="space-y-2">
          <button type="button" onClick={() => setSpecialOpen(!specialOpen)}
            className="w-full flex items-center justify-between text-left">
            <div>
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                C — Special Risk Categories
                {anySpecial && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded font-bold">{[
                  form.directCNSContact, form.directHeartContact, form.lifeSupporting, form.isImplantable,
                  form.ionizingRadiation, form.isDrugDeviceCombo, form.containsAnimalTissue, form.isContraceptive,
                  form.absorbed, form.reusableSurgicalInstrument, form.oralCavityOrEarOrNasal,
                  form.mucousMembraneAbsorption, form.drugAdministration,
                ].filter(Boolean).length} active</span>}
              </div>
              <div className="text-[11px] text-muted">Expand if any apply — these trigger Class C or D classification</div>
            </div>
            <svg className={`w-4 h-4 text-muted transition-transform ${specialOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {(specialOpen || anySpecial) && (
            <div className="grid grid-cols-2 gap-x-4 border border-border rounded-xl p-3">
              <div>
                <FlagRow field="directCNSContact"    label="Direct CNS contact"              hint="Touches brain, spinal cord or CSF"             tag="→ Class D (Rules 9,10,11)" value={form.directCNSContact}    upd={upd} />
                <FlagRow field="directHeartContact"  label="Direct heart / central circulation" hint="Touches heart, aorta or central vessels"     tag="→ Class D (Rules 9,10,11)" value={form.directHeartContact}  upd={upd} />
                <FlagRow field="lifeSupporting"      label="Life supporting or sustaining"   hint="Patient depends on it to survive"               tag="→ Class D (Rule 11)"       value={form.lifeSupporting}      upd={upd} />
                <FlagRow field="isImplantable"       label="Implantable device"              hint="Intended to remain in body after procedure"     tag="→ Class C minimum (Rule 11)" value={form.isImplantable}     upd={upd} />
                <FlagRow field="ionizingRadiation"   label="Emits ionizing radiation"        hint="X-ray, gamma, beta or alpha radiation"          tag="→ Class C (Rules 9,10,13)" value={form.ionizingRadiation}   upd={upd} />
                <FlagRow field="isDrugDeviceCombo"   label="Drug-device combination"         hint="Contains medicinal product as integral part"    tag="→ Class D (Rule 15)"       value={form.isDrugDeviceCombo}   upd={upd} />
              </div>
              <div>
                <FlagRow field="containsAnimalTissue"       label="Contains animal or human tissue"  hint="Non-viable cells, tissues or derivatives"          tag="→ Class D (Rule 16)"       value={form.containsAnimalTissue}        upd={upd} />
                <FlagRow field="isContraceptive"            label="Contraceptive device"             hint="For contraception or STD prevention"                tag="→ Class C / D (Rule 18)"   value={form.isContraceptive}             upd={upd} />
                <FlagRow field="absorbed"                   label="Absorbed by the body"             hint="Wholly or mainly absorbed during or after use"      tag="→ Class C/D (Rules 9,10,11)" value={form.absorbed}                  upd={upd} />
                <FlagRow field="reusableSurgicalInstrument" label="Reusable surgical instrument"     hint="Reusable, non-implanted, used in surgery"           tag="→ Class A (Rule 9b)"       value={form.reusableSurgicalInstrument} upd={upd} />
                <FlagRow field="oralCavityOrEarOrNasal"     label="Oral / ear / nasal cavity only"  hint="Used only in mouth, ear or nose — not deeper"       tag="→ May downgrade to A/B"    value={form.oralCavityOrEarOrNasal}     upd={upd} />
                <FlagRow field="mucousMembraneAbsorption"   label="Absorbed by mucous membrane"     hint="Device or coating absorbed by mucosa"               tag="→ Upgrades to Class B"     value={form.mucousMembraneAbsorption}   upd={upd} />
                <FlagRow field="drugAdministration"         label="Administers medicinal product"    hint="Delivers drug as part of its function"              tag="→ Class C (Rules 9,10,11)" value={form.drugAdministration}         upd={upd} />
              </div>
            </div>
          )}
        </div>

        {/* Group D: Preview */}
        <div className="border border-border rounded-xl p-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">D — Preliminary Classification</div>
          {!preview ? (
            <div className="text-xs text-muted italic">— Complete fields above to see classification</div>
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
        </div>
      </div>
    </div>
  );
}
