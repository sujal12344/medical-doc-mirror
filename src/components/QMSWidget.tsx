"use client";
import Link from "next/link";

export default function QMSWidget({ initialData }: { initialData: any }) {
  const qms = initialData || {};
  const completionPct = qms.completionPct || 0;
  
  const isoCompletion = Math.round(
    ((qms.iso13485?.managementResponsibility || 0) +
     (qms.iso13485?.resourceManagement || 0) +
     (qms.iso13485?.productRealization || 0) +
     (qms.iso13485?.measurementAnalysis || 0)) / 4
  );

  const activeSops = qms.sops?.length || 0;
  const openCapas = qms.capas?.filter((c: any) => c.status !== 'closed').length || 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Phase 3: Quality Management</h2>
            <p className="text-xs text-muted mt-1">ISO 13485, SOPs, and CAPAs</p>
          </div>
          <span className="text-sm font-semibold text-emerald-600">{completionPct}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface2 rounded-full h-1.5 mb-5">
          <div
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-surface2 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">ISO 13485</p>
            <p className="text-sm font-medium text-foreground">{isoCompletion}% Setup</p>
          </div>
          <div className="bg-surface2 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">SOPs</p>
            <p className="text-sm font-medium text-foreground">{activeSops} Active</p>
          </div>
          <div className="bg-surface2 rounded-lg p-3 col-span-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">CAPA Tracker</p>
              <p className="text-sm font-medium text-foreground">{openCapas} Open issues</p>
            </div>
            {openCapas > 0 ? (
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <Link
          href="/dashboard/qms"
          className="mt-auto inline-flex items-center justify-center gap-2 w-full px-2 py-2.5 text-sm font-semibold rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/8 transition"
        >
          Manage QMS &rarr;
        </Link>
      </div>
    </div>
  );
}
