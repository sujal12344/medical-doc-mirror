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

  const deviceName = dc.name as string | undefined;
  const intendedUse = dc.intendedUse as string | undefined;
  const mdrClass = dc.deviceClass as string | undefined;
  const targetRegulations = dc.countries as string[] | undefined;
  const predDevice = dc.predDevice as Record<string, unknown> | undefined;
  const classLock = dc.classLock as Record<string, unknown> | undefined;

  const locked = !!classLock?.classificationLocked;

  const steps = [
    { label: "1.1 Device identity", done: true },
    { label: "1.2 MDR classification", done: true },
    {
      label: "1.3 Regulatory targets",
      done: Array.isArray(targetRegulations) && targetRegulations.length > 0,
    },
    {
      label: "1.5 Predicate pathway",
      done: !!(predDevice?.predicateName || predDevice?.predicateExists),
    },
  ];
  const doneCt = steps.filter((s) => s.done).length;
  const completionPct = Object.keys(dc).length === 0 ? 0 : Math.round((doneCt / steps.length) * 100);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

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
            className="bg-accent h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPct}%` }}
          />
        </div>



        <p className="text-[11px] text-muted mb-3 leading-snug">No classification recorded yet.</p>

        <ul className="space-y-1.5 mb-5">
          {steps.map((item) => {
            const [step, ...rest] = item.label.split(" ");
            const title = rest.join(" ");
            return (
              <li key={item.label} className="flex items-center gap-2 min-h-5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? "bg-green-500" : "bg-border"}`}
                  aria-hidden
                />
                <span className="text-[11px] leading-tight tracking-tight">
                  <span className={`font-medium tabular-nums ${item.done ? "text-muted" : "text-muted/80"}`}>
                    {step}
                  </span>{" "}
                  <span className={item.done ? "text-foreground font-medium" : "text-muted"}>{title}</span>
                </span>
                {item.done && (
                  <svg className="w-3 h-3 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
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
