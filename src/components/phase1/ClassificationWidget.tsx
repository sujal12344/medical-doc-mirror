"use client";

import Link from "next/link";

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-50 text-green-700 border-green-200",
  B: "bg-yellow-50 text-yellow-700 border-yellow-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-red-50 text-red-700 border-red-200",
};

export default function ClassificationWidget({ initialData }: { initialData: Record<string, unknown> }) {
  const dc = initialData || {};
  const completionPct = (dc.completionPct as number) || 0;
  const locked = !!dc.classificationLocked;
  const mdrClass = dc.mdrClass as string | undefined;
  const deviceName = dc.deviceName as string | undefined;

  const steps = [
    { label: "1.1 Device identity", done: !!(dc.deviceName && dc.intendedUse) },
    { label: "1.2 MDR classification", done: !!dc.mdrClass },
    {
      label: "1.3 Regulatory targets",
      done: Array.isArray(dc.targetRegulations) && (dc.targetRegulations as unknown[]).length > 0,
    },
    {
      label: "1.5 Predicate pathway",
      done: !!(dc.predicateDeviceName || dc.hsCode),
    },
  ];
  const doneCt = steps.filter((s) => s.done).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Device Classification</h2>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              Per-product registration, class lock, and predicate on Register Product.
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-accent shrink-0">{completionPct}%</span>
        </div>

        <div className="w-full bg-surface2 rounded-full h-1 mb-4">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {mdrClass ? (
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-semibold mb-3 ${CLASS_COLORS[mdrClass] ?? "bg-surface2 text-foreground border-border"}`}
          >
            <span>Class {mdrClass}</span>
            {deviceName && <span className="font-normal opacity-90">· {deviceName}</span>}
            {locked && <span className="text-[10px] text-emerald-600 font-medium">Locked</span>}
          </div>
        ) : (
          <p className="text-[11px] text-muted mb-3 leading-snug">No classification recorded yet.</p>
        )}

        <ul className="space-y-1.5 mb-5">
          {steps.map((item) => {
            const [step, ...rest] = item.label.split(" ");
            const title = rest.join(" ");
            return (
              <li key={item.label} className="flex items-center gap-2 min-h-5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? "bg-blue-600" : "bg-border"}`}
                  aria-hidden
                />
                <span className="text-[11px] leading-tight tracking-tight flex-1">
                  <span className={`font-medium tabular-nums ${item.done ? "text-muted" : "text-muted/80"}`}>
                    {step}
                  </span>{" "}
                  <span className={item.done ? "text-foreground font-medium" : "text-muted"}>{title}</span>
                </span>
                {item.done && (
                  <svg className="w-3 h-3 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        href="/dashboard/products/new"
        className="mt-auto inline-flex items-center justify-center w-full px-3 py-2 text-[11px] font-semibold tracking-wide uppercase rounded-lg border border-border text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition"
      >
        {doneCt === steps.length ? "Review registration" : "Register product"}
      </Link>
    </div>
  );
}
