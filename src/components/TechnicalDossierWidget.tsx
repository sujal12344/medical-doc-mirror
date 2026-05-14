"use client";
import Link from "next/link";

export default function TechnicalDossierWidget({ productCount, docCount }: { productCount: number, docCount: number }) {
  const hasProducts = productCount > 0;
  
  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Phase 2: Technical Dossier</h2>
            <p className="text-xs text-muted mt-1">Product registry & MDR Schedule V docs</p>
          </div>
          {hasProducts && <span className="text-sm font-semibold text-violet-600">Active</span>}
        </div>

        {/* Progress bar (conceptual for phase 2 since it's continuous) */}
        <div className="w-full bg-surface2 rounded-full h-1.5 mb-5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${hasProducts ? 'bg-violet-600 w-full' : 'bg-surface2 w-0'}`}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span className="text-sm font-medium text-foreground">Registered Products</span>
            </div>
            <span className="text-sm font-bold text-foreground">{productCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span className="text-sm font-medium text-foreground">Regulatory Documents</span>
            </div>
            <span className="text-sm font-bold text-foreground">{docCount}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <Link
          href="/dashboard/products"
          className="mt-auto inline-flex items-center justify-center gap-2 w-full px-2 py-2.5 text-sm font-semibold rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/8 transition"
        >
          {hasProducts ? "Manage Dossiers \u2192" : "Technical Dossier \u2192"}
        </Link>
      </div>
    </div>
  );
}
