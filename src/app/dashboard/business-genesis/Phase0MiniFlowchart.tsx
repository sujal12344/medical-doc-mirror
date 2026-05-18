type Status = "done" | "active" | "pending";

const DOT: Record<Status, string> = {
  done:    "bg-green-500 ring-green-200",
  active:  "bg-yellow-400 ring-yellow-200 animate-pulse",
  pending: "bg-gray-300 ring-gray-100",
};
const STEP_BG: Record<Status, string> = {
  done:    "bg-green-50 border-green-200",
  active:  "bg-yellow-50 border-yellow-300",
  pending: "bg-surface2 border-border",
};
const DECISION_BG: Record<Status, string> = {
  done:    "bg-orange-50 border-orange-300",
  active:  "bg-orange-50 border-orange-400",
  pending: "bg-surface2 border-border",
};
const ARROW_COLOR: Record<Status, string> = {
  done: "bg-green-400", active: "bg-yellow-400", pending: "bg-border",
};

function Arrow({ from }: { from: Status }) {
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className={`w-px h-3 ${ARROW_COLOR[from]}`} />
      <div className={`w-1.5 h-1.5 rotate-45 border-b border-r ${from === "done" ? "border-green-500" : from === "active" ? "border-yellow-500" : "border-border"}`} />
    </div>
  );
}

function MiniStep({ id, label, status, ticks }: { id: string; label: string; status: Status; ticks?: { label: string; done: boolean }[] }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 text-xs w-full transition-all ${STEP_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full ring-2 shrink-0 ${DOT[status]}`} />
        <span className="font-bold text-[9px] text-muted uppercase tracking-wide">{id}</span>
        {status === "done" && <span className="ml-auto text-[9px] text-green-700 font-bold">✓</span>}
        {status === "active" && <span className="ml-auto text-[9px] text-yellow-700 font-bold">…</span>}
      </div>
      <div className={`font-semibold text-[11px] leading-tight ${status === "pending" ? "text-muted" : "text-foreground"}`}>{label}</div>
      {ticks && status !== "pending" && (
        <div className="mt-1 space-y-0.5">
          {ticks.map((t, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`text-[9px] font-bold ${t.done ? "text-green-600" : "text-muted"}`}>{t.done ? "✓" : "·"}</span>
              <span className={`text-[9px] ${t.done ? "text-foreground" : "text-muted"}`}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniDecision({ id, label, status, badge }: { id: string; label: string; status: Status; badge?: string }) {
  return (
    <div className={`rounded-lg border-2 border-dashed px-2.5 py-2 text-xs w-full transition-all ${DECISION_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-sm ring-2 rotate-45 shrink-0 ${DOT[status]}`} />
        <span className="font-bold text-[9px] text-muted uppercase tracking-wide">{id} · ?</span>
      </div>
      <div className={`font-semibold text-[11px] ${status === "pending" ? "text-muted" : "text-foreground"}`}>{label}</div>
      {badge && status === "done" && (
        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold border border-orange-200">{badge}</span>
      )}
    </div>
  );
}

type BgData = {
  secA?: { gst?: { status?: string }; msme?: { status?: string }; iec?: { status?: string }; shopEstablishment?: { status?: string } };
  secB?: { entityType?: string; cin?: string; pan?: string };
  secC?: { bankAccountOpened?: boolean };
  secD?: { trademarkStatus?: string; domainRegistered?: boolean; patentFiled?: boolean };
  secE?: { tamAnalysisDone?: boolean; competitorScanDone?: boolean; regulatoryPathwayChosen?: boolean };
  overallCompletionPct?: number;
};

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

export default function Phase0MiniFlowchart({ data }: { data: BgData }) {
  const secA = data.secA || {};
  const secB = data.secB || {};
  const secC = data.secC || {};
  const secD = data.secD || {};
  const secE = data.secE || {};
  const pct = data.overallCompletionPct ?? 0;

  const s01 = calcStatus([secE.tamAnalysisDone, secE.competitorScanDone, secE.regulatoryPathwayChosen]);
  const s02 = calcStatus([secE.competitorScanDone]);
  const s03 = calcStatus([secE.regulatoryPathwayChosen]);
  const s04: Status = (secB.entityType && secB.entityType !== "") ? "done" : "pending";
  const entityExists = s04 === "done";
  const s05 = calcStatus([secB.entityType]);
  const s06 = calcStatus([secB.cin, secB.pan]);
  const s07 = calcStatus([secC.bankAccountOpened]);
  const s08 = calcStatus([secA.gst?.status, secA.msme?.status, secA.iec?.status, secA.shopEstablishment?.status]);
  const s09 = calcStatus([secD.trademarkStatus, secD.domainRegistered, secD.patentFiled]);
  const allDone = [s01, s02, s03, s04, s08, s09].every((s) => s === "done");

  return (
    <div className="w-52 shrink-0 sticky top-4 self-start">
      <div className="bg-surface border border-border rounded-2xl p-3 space-y-0.5">

        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">0</span>
          <div>
            <div className="text-[11px] font-bold text-foreground">Phase 0 Progress</div>
            <div className="text-[9px] text-muted">30–90 days</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-black text-violet-600">{pct}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface2 rounded-full h-1 mb-2">
          <div className="h-1 rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        {/* Start */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-700 text-white text-[9px] font-bold">💡 Device Idea</span>
        </div>
        <Arrow from="done" />

        {/* 0.1 */}
        <MiniStep id="0.1" label="Business Need" status={s01} ticks={[
          { label: "TAM/SAM analysis", done: !!secE.tamAnalysisDone },
          { label: "Competitor scan", done: !!secE.competitorScanDone },
          { label: "Regulatory path", done: !!secE.regulatoryPathwayChosen },
        ]} />
        <Arrow from={s01} />

        {/* 0.2 */}
        <MiniStep id="0.2" label="Competitor Scan" status={s02} ticks={[
          { label: "CDSCO DB reviewed", done: !!secE.competitorScanDone },
        ]} />
        <Arrow from={s02} />

        {/* 0.3 */}
        <MiniStep id="0.3" label="Regulatory Pathway" status={s03} ticks={[
          { label: "MDR 2017 confirmed", done: !!secE.regulatoryPathwayChosen },
        ]} />
        <Arrow from={s03} />

        {/* 0.4 Decision */}
        <MiniDecision id="0.4" label="Entity exists?" status={s04}
          badge={entityExists ? `→ Skip to 0.8` : ""} />

        {/* Branch: show active branch */}
        {s04 === "pending" && (
          <div className="grid grid-cols-2 gap-1 mt-0.5">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-px h-2 bg-border" />
              <span className="text-[8px] text-green-700 bg-green-100 px-1 rounded-full font-bold">Yes</span>
              <div className="text-[9px] text-muted italic text-center">→ 0.8</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-px h-2 bg-border" />
              <span className="text-[8px] text-orange-700 bg-orange-100 px-1 rounded-full font-bold">No</span>
              <div className="text-[9px] text-muted italic text-center">0.5-0.7</div>
            </div>
          </div>
        )}

        {/* Incorporation steps — only shown if no entity yet */}
        {!entityExists && (
          <>
            <Arrow from={s05} />
            <MiniStep id="0.5" label="Choose Entity Type" status={s05} ticks={[
              { label: secB.entityType || "Not selected", done: !!(secB.entityType && secB.entityType !== "") },
            ]} />
            <Arrow from={s06} />
            <MiniStep id="0.6" label="Incorporation" status={s06} ticks={[
              { label: "CIN obtained", done: !!(secB.cin && secB.cin.length > 0) },
              { label: "PAN obtained", done: !!(secB.pan && secB.pan.length > 0) },
            ]} />
            <Arrow from={s07} />
            <MiniStep id="0.7" label="Bank Account" status={s07} ticks={[
              { label: "Current account opened", done: !!secC.bankAccountOpened },
            ]} />
          </>
        )}

        {entityExists && <Arrow from={s04} />}

        {/* 0.8 */}
        <MiniStep id="0.8" label="Statutory Regs" status={s08} ticks={[
          { label: `GST — ${secA.gst?.status || "pending"}`, done: secA.gst?.status === "complete" },
          { label: `MSME — ${secA.msme?.status || "pending"}`, done: secA.msme?.status === "complete" },
          { label: `IEC — ${secA.iec?.status || "pending"}`, done: secA.iec?.status === "complete" },
          { label: `Shop Est — ${secA.shopEstablishment?.status || "pending"}`, done: secA.shopEstablishment?.status === "complete" },
        ]} />
        <Arrow from={s08} />

        {/* 0.9 */}
        <MiniStep id="0.9" label="IP & Brand" status={s09} ticks={[
          { label: `TM: ${secD.trademarkStatus || "not filed"}`, done: secD.trademarkStatus === "registered" || secD.trademarkStatus === "filed" },
          { label: "Domain", done: !!secD.domainRegistered },
          { label: "Patent", done: !!secD.patentFiled },
        ]} />
        <Arrow from={s09} />

        {/* End */}
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${allDone ? "bg-green-700 text-white" : "bg-surface2 text-muted border border-border"}`}>
            {allDone ? "✅ Phase 0 Complete" : "○ Phase 0 Complete"}
          </span>
        </div>
      </div>
    </div>
  );
}
