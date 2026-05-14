"use client";
import Link from "next/link";

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-50 text-green-700 border-green-200",
  B: "bg-yellow-50 text-yellow-700 border-yellow-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-red-50 text-red-700 border-red-200",
};

export default function ClassificationWidget({ initialData }: { initialData: any }) {
  const dc = initialData || {};
  const completionPct = dc.completionPct || 0;
  const locked = dc.classificationLocked;

  const steps = [
    { label: "Device Identity", done: !!(dc.deviceName && dc.intendedUse) },
    { label: "MDR Classification", done: !!dc.mdrClass },
    { label: "Regulatory Targets", done: dc.targetRegulations?.length > 0 },
    { label: "Predicate & HS Code", done: !!(dc.predicateDeviceName || dc.hsCode) },
  ];
  const doneCt = steps.filter((s) => s.done).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Phase 1: Device Classification</h2>
            <p className="text-xs text-muted mt-1">MDR 2017 Schedule III wizard</p>
          </div>
          <span className="text-sm font-semibold text-blue-600">{completionPct}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface2 rounded-full h-1.5 mb-5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* If classified, show badge */}
        {dc.mdrClass ? (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold mb-4 ${CLASS_COLORS[dc.mdrClass]}`}>
            <span className="text-base">🏷️</span>
            Class {dc.mdrClass} — {dc.deviceName || "Device"}
            {locked && <span className="ml-1 text-green-600">🔒</span>}
          </div>
        ) : (
          <p className="text-xs text-muted mb-4 italic">No classification yet. Complete the wizard below.</p>
        )}

        {/* Step list */}
        <ul className="space-y-2.5 mb-6 text-sm">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.done ? "bg-blue-500" : "bg-slate-300"}`} />
              <span className={s.done ? "text-foreground" : "text-muted"}>{s.label}</span>
              {s.done && <svg className="w-3 h-3 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard/classification"
        className="mt-auto inline-flex items-center justify-center gap-2 w-full px-2 py-2.5 text-sm font-semibold rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/8 transition"
      >
        {doneCt === 4 ? "Review →" : "Classification →"}
      </Link>
    </div>
  );
}
