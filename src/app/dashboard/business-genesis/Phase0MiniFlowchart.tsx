"use client";

import {
  type BusinessGenesisData,
  computePhase0Completion,
  isPhase0Complete,
  normalizeBusinessGenesis,
} from "@/lib/businessGenesis";

type Status = "done" | "active" | "pending";

const DOT: Record<Status, string> = {
  done: "bg-[var(--status-success)] ring-[var(--status-success-border)]",
  active: "bg-[var(--status-warning)] ring-[var(--status-warning-border)] animate-pulse",
  pending: "bg-[var(--status-pending)] ring-[var(--status-pending-border)]",
};
const STEP_BG: Record<Status, string> = {
  done: "bg-[var(--status-success-bg)] border-[var(--status-success-border)]",
  active: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]",
  pending: "bg-surface2 border-border",
};
const DECISION_BG: Record<Status, string> = {
  done: "bg-[var(--status-info-bg)] border-[var(--status-info-border)]",
  active: "bg-[var(--status-info-bg)] border-[var(--status-info-border)]",
  pending: "bg-surface2 border-border",
};
const ARROW_COLOR: Record<Status, string> = {
  done: "bg-[var(--status-success)]",
  active: "bg-[var(--status-warning)]",
  pending: "bg-border",
};

function Arrow({ from }: { from: Status }) {
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className={`w-px h-3 ${ARROW_COLOR[from]}`} />
      <div
        className={`w-1.5 h-1.5 rotate-45 border-b border-r ${from === "done" ? "border-[var(--status-success)]" : from === "active" ? "border-[var(--status-warning)]" : "border-border"}`}
      />
    </div>
  );
}

function MiniStep({
  id,
  label,
  status,
  ticks,
}: {
  id: string;
  label: string;
  status: Status;
  ticks?: { label: string; done: boolean }[];
}) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 text-xs w-full transition-all ${STEP_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full ring-2 shrink-0 ${DOT[status]}`} />
        <span className="font-bold text-[9px] text-muted uppercase tracking-wide">{id}</span>
        {status === "done" && <span className="ml-auto text-[9px] text-[var(--status-success)] font-bold">✓</span>}
        {status === "active" && <span className="ml-auto text-[9px] text-[var(--status-warning)] font-bold">…</span>}
      </div>
      <div
        className={`font-semibold text-[11px] leading-tight ${status === "pending" ? "text-muted" : "text-foreground"}`}
      >
        {label}
      </div>
      {ticks && ticks.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {ticks.map((t, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`text-[9px] font-bold ${t.done ? "text-[var(--status-success)]" : "text-muted"}`}>
                {t.done ? "✓" : "·"}
              </span>
              <span className={`text-[9px] ${t.done ? "text-foreground" : "text-muted"}`}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniDecision({
  id,
  label,
  status,
  badge,
}: {
  id: string;
  label: string;
  status: Status;
  badge?: string;
}) {
  return (
    <div
      className={`rounded-lg border-2 border-dashed px-2.5 py-2 text-xs w-full transition-all ${DECISION_BG[status]}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-sm ring-2 rotate-45 shrink-0 ${DOT[status]}`} />
        <span className="font-bold text-[9px] text-muted uppercase tracking-wide">{id} · ?</span>
      </div>
      <div className={`font-semibold text-[11px] ${status === "pending" ? "text-muted" : "text-foreground"}`}>
        {label}
      </div>
      {badge && <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-[var(--status-info-bg)] text-[var(--status-info)] font-bold border border-[var(--status-info-border)]">{badge}</span>}
    </div>
  );
}

function calcStatus(checks: unknown[]): Status {
  const mapped = checks.map((v) => {
    if (v === true || v === "complete" || v === "registered" || v === "filed") return "done";
    if (v === "in-progress") return "active";
    if (typeof v === "string" && v.trim() && v !== "pending" && v !== "") return "done";
    return "pending";
  });
  if (mapped.every((s) => s === "done")) return "done";
  if (mapped.some((s) => s === "done" || s === "active")) return "active";
  return "pending";
}

export default function Phase0MiniFlowchart({
  data,
}: {
  data: BusinessGenesisData | Partial<BusinessGenesisData>;
}) {
  const normalized = normalizeBusinessGenesis(data);
  const pct = data.overallCompletionPct ?? computePhase0Completion(normalized);
  const complete = data.phase0Complete ?? isPhase0Complete(normalized);

  const e = normalized.secE;
  const b = normalized.secB;
  const c = normalized.secC;
  const a = normalized.secA;
  const d = normalized.secD;

  const s01 = calcStatus([e.tamAnalysisDone, e.reimbursementLandscapeDone]);
  const s02 = calcStatus([e.competitorScanDone, e.patentLandscapeDone]);
  const s03 = calcStatus([
    e.pathwayIndia || e.pathwayCE || e.pathwayFDA,
    e.regulatoryPathwayChosen,
    e.trademarkPlanningDone,
  ]);
  const s04: Status = b.legalEntityExists !== null ? "done" : "pending";
  const skipIncorp = b.legalEntityExists === true;
  const s05 = skipIncorp ? "done" : calcStatus([b.entityType]);
  const s06 = skipIncorp
    ? "done"
    : calcStatus([
        b.runNameApproval,
        b.dscDinObtained,
        b.moaAoaDrafted,
        b.moaIncludesMedicalDeviceObject,
        b.cin,
        b.pan,
        b.incorporationDocUrl,
      ]);
  const s07 = calcStatus([
    c.bankAccountOpened,
    c.bankName,
    c.adCodeObtained,
    c.signatories.some((s) => s.name.trim()),
  ]);
  const s08 = calcStatus([
    a.gst.status,
    a.msme.status,
    a.iec.status,
    a.shopEstablishment.status,
  ]);
  const s09 = calcStatus([
    d.trademarkStatus,
    d.domainRegistered,
    d.ndaTemplateUrl || d.trademarkStatus === "not-filed",
  ]);

  return (
    <div className="w-52 shrink-0 sticky top-4 self-start">
      <div className="bg-surface border border-border rounded-2xl p-3 space-y-0.5">
        <div className="flex items-center gap-1.5 mb-2">
        
          <div>
            <div className="text-[11px] font-bold text-foreground">Phase 0 Progress</div>
            <div className="text-[9px] text-muted">30–90 days</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-black">{pct}%</div>
          </div>
        </div>

        <div className="w-full bg-surface2 rounded-full h-1 mb-2">
          <div className="h-1 rounded-full bg-[var(--status-success)] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--status-success)] text-white text-[9px] font-bold">
            Device Idea
          </span>
        </div>
        <Arrow from="done" />

        <MiniStep
          id="0.1"
          label="Business Need"
          status={s01}
          ticks={[
            { label: "TAM/SAM/SOM", done: e.tamAnalysisDone },
            { label: "Reimbursement", done: e.reimbursementLandscapeDone },
          ]}
        />
        <Arrow from={s01} />

        <MiniStep
          id="0.2"
          label="Competitor landscape"
          status={s02}
          ticks={[
            { label: "Market / competitors", done: e.competitorScanDone },
            { label: "Patent landscape", done: e.patentLandscapeDone },
          ]}
        />
        <Arrow from={s02} />

        <MiniStep
          id="0.3"
          label="Regulatory Pathway"
          status={s03}
          ticks={[
            {
              label: `Markets: ${[e.pathwayIndia && "IN", e.pathwayCE && "CE", e.pathwayFDA && "FDA"].filter(Boolean).join("+") || "—"}`,
              done: e.pathwayIndia || e.pathwayCE || e.pathwayFDA,
            },
            { label: "Path frozen", done: e.regulatoryPathwayChosen },
            { label: "TM planning", done: e.trademarkPlanningDone },
          ]}
        />
        <Arrow from={s03} />

        <MiniDecision
          id="0.4"
          label="Entity exists?"
          status={s04}
          badge={skipIncorp ? "Yes → skip 0.5–0.6" : b.legalEntityExists === false ? "No → incorporate" : undefined}
        />

        {!skipIncorp && b.legalEntityExists === false && (
          <>
            <Arrow from={s05} />
            <MiniStep id="0.5" label="Entity Type" status={s05 as Status} ticks={[{ label: b.entityType || "—", done: !!b.entityType }]} />
            <Arrow from={s06 as Status} />
            <MiniStep
              id="0.6"
              label="Incorporation"
              status={s06 as Status}
              ticks={[
                { label: "RUN / name", done: b.runNameApproval },
                { label: "DSC + DIN", done: b.dscDinObtained },
                { label: "MoA med-device object", done: b.moaIncludesMedicalDeviceObject },
                { label: "COI uploaded", done: !!b.incorporationDocUrl },
              ]}
            />
          </>
        )}

        {(skipIncorp || b.legalEntityExists === false) && <Arrow from={skipIncorp ? s04 : (s06 as Status)} />}

        <MiniStep
          id="0.7"
          label="Bank Account"
          status={s07}
          ticks={[
            { label: "Account opened", done: c.bankAccountOpened },
            { label: "AD Code", done: c.adCodeObtained },
            { label: "Signatories", done: c.signatories.some((s) => s.name.trim()) },
          ]}
        />
        <Arrow from={s07} />

        <MiniStep
          id="0.8"
          label="Statutory Regs"
          status={s08}
          ticks={[
            { label: `GST — ${a.gst.status}`, done: a.gst.status === "complete" },
            { label: `IEC — ${a.iec.status}`, done: a.iec.status === "complete" },
          ]}
        />
        <Arrow from={s08} />

        <MiniStep
          id="0.9"
          label="IP & Brand"
          status={s09}
          ticks={[
            { label: `TM: ${d.trademarkStatus || "—"}`, done: !!d.trademarkStatus },
            { label: "Domain", done: d.domainRegistered },
            { label: "NDA template", done: !!d.ndaTemplateUrl },
          ]}
        />
        <Arrow from={s09} />

        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${complete ? "bg-[var(--status-success)] text-white" : "bg-surface2 text-muted border border-border"}`}
          >
            {complete ? "✅ Phase 0 Complete" : "In-progress"}
          </span>
        </div>
      </div>
    </div>
  );
}
