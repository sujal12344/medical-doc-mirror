type FormState = {
  name: string;
  description: string;
  intendedUse: string;
  patientPopulation: string;
  deviceType: "ivd" | "medical-device";
  deviceClass: "A" | "B" | "C" | "D";
  isSterile: boolean;
  hasSoftware: boolean;
  isActive: boolean;
  activeType: string;
  isInvasive: boolean;
  invasionType: string;
  contactDuration: string;
  // IVD Part II
  ivdBloodDonorScreening: boolean;
  ivdBloodGrouping: boolean;
  ivdSelfTest: boolean;
  ivdNearPatient: boolean;
  ivdTargetsHIV: boolean;
  ivdTargetsHBV: boolean;
  ivdTargetsHCV: boolean;
  // Predicate pathway
  predicateExists: null | boolean;
  predicateName: string;
  md26Status: string;
  md27Status: string;
  classificationConfirmed: boolean;
  classificationOverride: string;
  classificationLocked: boolean;
  classificationLockedBy: string;
};

type Status = "done" | "active" | "pending";

const DOT: Record<Status, string> = {
  done:    "bg-green-500 ring-green-200",
  active:  "bg-yellow-400 ring-yellow-200 animate-pulse",
  pending: "bg-gray-300 ring-gray-100",
};

const STEP_BG: Record<Status, string> = {
  done:    "bg-green-50 border-green-200 text-green-800",
  active:  "bg-yellow-50 border-yellow-300 text-yellow-800",
  pending: "bg-surface2 border-border text-muted",
};

const DECISION_BG: Record<Status, string> = {
  done:    "bg-orange-50 border-orange-300 text-orange-800",
  active:  "bg-orange-50 border-orange-400 text-orange-800",
  pending: "bg-surface2 border-border text-muted",
};

const ARROW: Record<Status, string> = {
  done:    "bg-green-400",
  active:  "bg-yellow-400",
  pending: "bg-border",
};

function Arrow({ status }: { status: Status }) {
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className={`w-px h-4 ${ARROW[status]}`} />
      <div className={`w-1.5 h-1.5 rotate-45 border-b border-r ${status === "done" ? "border-green-500" : status === "active" ? "border-yellow-500" : "border-border"}`} />
    </div>
  );
}

function StepBox({ id, label, status, bullets }: { id: string; label: string; status: Status; bullets?: string[] }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs transition-all ${STEP_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-2 h-2 rounded-full ring-2 shrink-0 ${DOT[status]}`} />
        <span className="font-bold text-[10px] opacity-70">{id}</span>
        {status === "done" && <span className="ml-auto text-[9px] font-bold text-green-700">✓</span>}
        {status === "active" && <span className="ml-auto text-[9px] font-bold text-yellow-700">Filling…</span>}
      </div>
      <div className="font-semibold text-[11px] leading-tight">{label}</div>
      {bullets && status !== "pending" && (
        <ul className="mt-1 space-y-0.5">
          {bullets.map((b, i) => (
            <li key={i} className="text-[10px] opacity-80 flex items-start gap-1">
              <span>•</span>{b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DecisionBox({ id, label, status, options }: { id: string; label: string; status: Status; options?: string[] }) {
  return (
    <div className={`rounded-xl border-2 border-dashed px-3 py-2 text-xs transition-all ${DECISION_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-2 h-2 rounded-sm ring-2 shrink-0 rotate-45 ${DOT[status]}`} />
        <span className="font-bold text-[10px] opacity-70">{id} · DECISION</span>
      </div>
      <div className="font-semibold text-[11px]">{label}</div>
      {options && status === "done" && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {options.map((o) => (
            <span key={o} className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold border border-orange-200">{o}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Branch({ left, right, leftLabel, rightLabel, arrowStatus }: {
  left: React.ReactNode; right: React.ReactNode;
  leftLabel: string; rightLabel: string; arrowStatus: Status;
}) {
  return (
    <div className="w-full">
      {/* horizontal split */}
      <div className="flex items-start justify-center relative">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-px ${ARROW[arrowStatus]}`} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-1">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 rounded-full border border-green-200">{leftLabel}</span>
          <div className="w-px h-2 bg-border" />
          {left}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 rounded-full border border-blue-200">{rightLabel}</span>
          <div className="w-px h-2 bg-border" />
          {right}
        </div>
      </div>
    </div>
  );
}

export default function Phase1MiniFlowchart({ form }: { form: FormState }) {
  const { name, description, intendedUse, patientPopulation, isSterile, hasSoftware,
    isActive, activeType, isInvasive, invasionType, deviceType, deviceClass,
    ivdBloodDonorScreening, ivdBloodGrouping, ivdSelfTest, ivdNearPatient,
    ivdTargetsHIV, ivdTargetsHBV, ivdTargetsHCV,
    predicateExists, predicateName, md26Status, md27Status,
    classificationConfirmed, classificationOverride, classificationLocked, classificationLockedBy } = form;

  // Step 1.1 — core text fields
  const char11done = !!(name && description && intendedUse && patientPopulation);
  const char11active = !!(name || description || intendedUse || patientPopulation);
  const s11: Status = char11done ? "done" : char11active ? "active" : "pending";

  // Step 1.2 — IVD vs MD decision
  const s12: Status = s11 === "done" ? "done" : s11 === "active" ? "active" : "pending";

  // Step 1.3 — schedule branch
  const s13: Status = s12 === "done" ? "done" : s12 === "active" ? "active" : "pending";

  // Step 1.4 — risk rule mapping
  // IVD: done as soon as deviceType is confirmed (all-false flags = Class A general chemistry — valid)
  // Medical device: needs invasionType OR isActive to be set
  const s14: Status = s13 === "done"
    ? (deviceType === "ivd"
        ? "done"
        : (invasionType || isActive ? "done" : "active"))
    : s13 !== "pending" ? "active" : "pending";

  const sLater: Status = "pending";
  const isIVD = deviceType === "ivd";

  // Step 1.5 — predicate decision
  const s15: Status = predicateExists !== null
    ? (predicateExists
        ? (predicateName ? "done" : "active")
        : (md26Status !== "not-filed" || md27Status !== "not-filed" ? "active" : "active"))
    : s14 === "done" ? "active" : "pending";
  // Novel pathway is "done" when both MD-26 and MD-27 are approved
  const s15done: Status = predicateExists === false && md26Status === "approved" && md27Status === "approved"
    ? "done" : predicateExists === true && predicateName ? "done" : s15;

  // Step 1.6 — classification confirmed
  const s16: Status = s15done === "done"
    ? (classificationConfirmed ? "done" : "active")
    : s15done === "active" ? "active" : "pending";

  // Step 1.8 — locked
  const s18: Status = s16 === "done"
    ? (classificationLocked ? "done" : "active")
    : "pending";

  // Step 1.9 — final class known when locked
  const s19: Status = s18 === "done" ? "done" : s18 === "active" ? "active" : "pending";
  const finalClass = classificationOverride || form.deviceClass;

  // IVD context summary for bullet
  const ivdContextSummary = [
    ivdBloodDonorScreening && "Donor screen",
    ivdBloodGrouping && "Blood grouping",
    ivdSelfTest && "Self-test",
    ivdNearPatient && "Near-patient",
    ivdTargetsHIV && "HIV",
    ivdTargetsHBV && "HBV",
    ivdTargetsHCV && "HCV",
  ].filter(Boolean);

  return (
    <div className="w-64 shrink-0 sticky top-6 self-start">
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-black flex items-center justify-center">1</span>
          <div>
            <div className="text-xs font-bold text-foreground">Phase 1 — Classification</div>
            <div className="text-[10px] text-muted">Fill form to progress</div>
          </div>
        </div>

        {/* Start */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-700 text-white text-[10px] font-bold">
            📦 Device Concept Ready
          </span>
        </div>

        <Arrow status={s11} />

        {/* 1.1 */}
        <StepBox id="1.1" label="Device Characterisation" status={s11} bullets={[
          `Name${name ? " ✓" : ""}`,
          `Intended use${intendedUse ? " ✓" : ""}`,
          `Patient pop.${patientPopulation ? " ✓" : ""}`,
          `Description${description ? " ✓" : ""}`,
        ]} />

        <Arrow status={s12} />

        {/* 1.2 Decision */}
        <DecisionBox id="1.2" label="IVD or Medical Device?" status={s12}
          options={[isIVD ? "→ IVD" : "→ Medical Device"]} />

        <Arrow status={s13} />

        {/* 1.3 Branch */}
        <Branch
          arrowStatus={s13}
          leftLabel={isIVD ? "✓ IVD" : "MD"}
          rightLabel={isIVD ? "MD" : "✓ IVD"}
          left={
            <StepBox id={isIVD ? "1.3b" : "1.3a"} status={s13}
              label={isIVD ? "First Schedule Part II" : "First Schedule Part I"}
              bullets={[isIVD ? "7 IVD rules" : "22 MD rules"]} />
          }
          right={
            <StepBox id={isIVD ? "1.3a" : "1.3b"} status="pending"
              label={isIVD ? "First Schedule Part I" : "First Schedule Part II"}
              bullets={[isIVD ? "22 MD rules" : "7 IVD rules"]} />
          }
        />

        <Arrow status={s14} />

        {/* 1.4 */}
        <StepBox id="1.4" label="Risk Rule Mapping" status={s14} bullets={
          isIVD
            ? [
                `Type: IVD ✓`,
                `Class: ${deviceClass || "—"}`,
                ivdContextSummary.length > 0
                  ? `Flags: ${ivdContextSummary.join(", ")}`
                  : "Flags: none → Rule 2(v) Class A",
              ]
            : [
                `Active: ${isActive ? `Yes (${activeType || "—"})` : "No"}`,
                `Invasion: ${invasionType || "—"}`,
                `Duration: ${form.contactDuration || "—"}`,
                `Sterile: ${isSterile ? "Yes" : "No"}`,
              ]
        } />

        <Arrow status={sLater} />

        {/* Divider — classify page */}
        <div className="border-t border-dashed border-border pt-2 mt-1">
          <div className="text-[10px] text-muted text-center mb-2 font-semibold">
            ↓ Continues on Classify Page ↓
          </div>
        </div>

        <DecisionBox id="1.5" label="Predicate device exists?" status={s15done}
          options={
            predicateExists === true
              ? ["→ Predicate pathway"]
              : predicateExists === false
              ? ["→ Novel — MD-26 / MD-27"]
              : []
          } />
        <Arrow status={s15done} />

        {/* Novel pathway sub-status */}
        {predicateExists === false && (
          <div className="pl-2 border-l-2 border-orange-300 ml-2 space-y-1">
            <div className={`text-[10px] px-2 py-1 rounded-lg border ${md27Status === "approved" ? "bg-green-50 border-green-200 text-green-700" : md27Status === "filed" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-surface2 border-border text-muted"}`}>
              MD-27 (IEC): {md27Status === "approved" ? "✓ Approved" : md27Status === "filed" ? "⏳ Filed" : "Not filed"}
            </div>
            <div className={`text-[10px] px-2 py-1 rounded-lg border ${md26Status === "approved" ? "bg-green-50 border-green-200 text-green-700" : md26Status === "filed" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-surface2 border-border text-muted"}`}>
              MD-26 (CDSCO): {md26Status === "approved" ? "✓ Approved" : md26Status === "filed" ? "⏳ Filed" : "Not filed"}
            </div>
          </div>
        )}

        <Arrow status={sLater} />
        <DecisionBox id="1.6" label="Classification confirmed?" status={s16}
          options={classificationConfirmed ? [`→ Class ${finalClass} confirmed`] : []} />
        <Arrow status={s18} />
        <StepBox id="1.8" label="Lock Classification" status={s18}
          bullets={classificationLocked ? [`Locked by: ${classificationLockedBy}`] : undefined} />
        <Arrow status={s19} />
        <DecisionBox id="1.9" label={`Final Class ${s19 === "done" ? finalClass : "A / B / C / D"}`} status={s19}
          options={s19 === "done" ? [`Class ${finalClass}`, form.deviceType === "ivd" ? "Part II" : "Part I"] : []} />
        <Arrow status={sLater} />

        {/* End */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold">
            ○ Phase 1 Complete
          </span>
        </div>
      </div>
    </div>
  );
}
