"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GlobePanel from "@/components/landing/GlobePanel";

type MarketKey = "IN" | "US" | "EU" | "CN";

type Market = {
  key: MarketKey;
  flag: string;
  name: string;
  tag: string;
  docTitle: string;
  docSubtitle: string;
  questions: string[];
  docSignals: { label: string; status: string }[];
};

export default function HeroInteractive({
  totalCountries,
  totalFrameworks,
  totalRegions,
  metrics,
  coveredCountries,
}: {
  totalCountries: number;
  totalFrameworks: number;
  totalRegions: number;
  metrics: { value: string; label: string }[];
  coveredCountries: { code: string; name: string; flag: string; frameworkCount: number }[];
}) {
  const markets: Market[] = useMemo(
    () => [
      {
        key: "IN",
        flag: "🇮🇳",
        name: "India",
        tag: "CDSCO • DMF",
        docTitle: "Device Master File (IVD)",
        docSubtitle: "CDSCO-aligned sections with AI-assisted drafting.",
        questions: [
          "Auto-fill from COA + IFU + SDS",
          "What fields are pending in Section 2?",
          "Generate A4 export for submission",
        ],
        docSignals: [
          { label: "COA / Batch release", status: "Extracted" },
          { label: "IFU / Labelling", status: "Mapped" },
          { label: "SDS", status: "Parsed" },
          { label: "Clinical report", status: "Referenced" },
        ],
      },
      {
        key: "US",
        flag: "🇺🇸",
        name: "United States",
        tag: "FDA • 510(k)",
        docTitle: "510(k) Summary Workspace",
        docSubtitle: "Predicate mapping, testing evidence, and labeling.",
        questions: [
          "Do we need a new 510(k) for changes?",
          "Summarize performance testing results",
          "Draft substantial equivalence statement",
        ],
        docSignals: [
          { label: "Predicate comparison", status: "Linked" },
          { label: "Performance testing", status: "Attached" },
          { label: "Biocompatibility", status: "Verified" },
          { label: "Labeling review", status: "Queued" },
        ],
      },
      {
        key: "EU",
        flag: "🇪🇺",
        name: "European Union",
        tag: "MDR/IVDR • CE",
        docTitle: "EU MDR Technical File",
        docSubtitle: "Annex II/III structure + PMS/PSUR readiness.",
        questions: [
          "What goes into Annex II for this class?",
          "Create PMS plan skeleton",
          "Generate SSCP draft (if applicable)",
        ],
        docSignals: [
          { label: "Risk management (ISO 14971)", status: "Aligned" },
          { label: "Clinical evaluation (CER)", status: "Drafted" },
          { label: "PMS / PSUR", status: "Prepared" },
          { label: "UDI / EUDAMED", status: "Planned" },
        ],
      },
      {
        key: "CN",
        flag: "🇨🇳",
        name: "China",
        tag: "NMPA • CMDE",
        docTitle: "NMPA Registration Dossier",
        docSubtitle: "Testing-first workflow with localized requirements.",
        questions: [
          "Which GB/YY standards apply here?",
          "Build a China testing checklist",
          "Prepare CER / trial exemption logic",
        ],
        docSignals: [
          { label: "China testing plan", status: "Generated" },
          { label: "Chinese labeling", status: "Outlined" },
          { label: "Clinical evaluation", status: "Reviewed" },
          { label: "Agent package", status: "Ready" },
        ],
      },
    ],
    [],
  );

  const [active, setActive] = useState<MarketKey>("IN");
  const m = markets.find((x) => x.key === active) || markets[0]!;

  return (
    <section className="relative overflow-hidden">
      {/* animated gradient + grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1200px] h-[620px] opacity-90 blur-2xl bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_58%)]" />
        <div className="absolute -top-56 right-[-180px] w-[620px] h-[620px] opacity-80 blur-2xl bg-[radial-gradient(circle,rgba(43,108,176,0.20),transparent_62%)] heroFloat" />
        <div className="absolute bottom-[-320px] left-[-260px] w-[820px] h-[820px] opacity-70 blur-2xl bg-[radial-gradient(circle,rgba(43,108,176,0.12),transparent_60%)] heroFloat2" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Corner globe decor (subtle, partial) */}
      <div className="absolute right-[-70px] top-[70px] md:right-[-60px] md:top-[80px] lg:right-[-80px] lg:top-[70px] pointer-events-none">
        <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden bg-surface/20 backdrop-blur-sm shadow-[0_30px_90px_rgba(15,23,42,0.10)] opacity-95">
          {/* outer ring */}
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-[-1px] rounded-full border border-[var(--accent)]/10" />

          {/* soft fade mask so it feels embedded */}
          <div className="absolute inset-0 [mask-image:radial-gradient(circle,black_62%,transparent_76%)] opacity-90">
            <GlobePanel countries={coveredCountries} variant="background" />
          </div>

          {/* lighting + depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.72),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_78%,rgba(14,165,233,0.10),transparent_55%)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/35" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-surface/70 border border-border rounded-full text-xs text-muted backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="font-semibold text-[var(--accent)]">{totalCountries}+ countries</span>
              <span className="text-border">/</span>
              <span>{totalFrameworks} frameworks</span>
              <span className="text-border">/</span>
              <span>{totalRegions} regions</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.06]">
              The compliance workspace for{" "}
              <span className="relative inline-block">
                global submissions
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-[var(--accent)]/15 -z-10 rounded-full blur-[0.5px]" />
              </span>
              .
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
              Replace scattered Word templates with structured frameworks + AI auto-fill — from COA/IFU/SDS to regulator-ready PDFs across {totalCountries}+ markets.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start free trial
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 bg-surface/80 border border-border hover:border-[var(--accent)]/40 text-foreground font-semibold rounded-xl text-sm transition backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                View demo (sign in)
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto lg:mx-0">
              {metrics.map((x) => (
                <div
                  key={x.label}
                  className="bg-surface/75 border border-border rounded-xl py-3.5 px-3 backdrop-blur-sm hover:border-[var(--accent)]/30 transition hover:-translate-y-0.5"
                >
                  <p className="text-xl md:text-2xl font-bold text-foreground">{x.value}</p>
                  <p className="text-[10px] text-muted mt-1 font-semibold uppercase tracking-widest">{x.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive preview */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-2xl opacity-70 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(43,108,176,0.18),transparent_55%)]" />

            <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface/60 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    <span className="ml-2 text-xs font-semibold text-foreground">Submission Workspace</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold border border-[var(--accent)]/15">
                    Interactive
                  </span>
                </div>

                <div className="p-5">
                  {/* Market tabs */}
                  <div className="flex flex-wrap gap-2">
                    {markets.map((x) => (
                      <button
                        key={x.key}
                        type="button"
                        onClick={() => setActive(x.key)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                          active === x.key
                            ? "bg-[var(--accent)]/10 border-[var(--accent)]/25 text-[var(--accent)]"
                            : "bg-surface2 border-border text-muted hover:text-foreground hover:border-[var(--accent)]/25"
                        }`}
                        aria-pressed={active === x.key}
                      >
                        <span className="mr-1.5">{x.flag}</span>
                        {x.name}
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface text-muted">
                          {x.tag}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="col-span-1 bg-surface2 border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">Now viewing</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-foreground font-semibold truncate">{m.flag} {m.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted bg-surface">{m.key}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {m.questions.map((q) => (
                          <div key={q} className="text-[11px] text-muted bg-surface border border-border rounded-lg px-2.5 py-2 hover:border-[var(--accent)]/25 transition">
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 bg-background border border-border rounded-xl p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Document</p>
                          <p className="text-sm font-bold text-foreground mt-1">{m.docTitle}</p>
                          <p className="text-xs text-muted mt-1">{m.docSubtitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Completion</p>
                          <p className="text-sm font-bold text-foreground mt-1">
                            {active === "IN" ? "62%" : active === "US" ? "54%" : active === "EU" ? "68%" : "49%"}
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">Versioned</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-surface2 border border-border rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-[linear-gradient(90deg,var(--accent),rgba(14,165,233,0.85))] transition-all duration-500 ${
                            active === "IN" ? "w-[62%]" : active === "US" ? "w-[54%]" : active === "EU" ? "w-[68%]" : "w-[49%]"
                          }`}
                        />
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 gap-2">
                        {m.docSignals.map((r) => (
                          <div key={r.label} className="flex items-center justify-between gap-2 bg-surface2 border border-border rounded-lg px-3 py-2 hover:border-[var(--accent)]/25 transition">
                            <span className="text-[11px] text-foreground font-medium truncate">{r.label}</span>
                            <span className="text-[10px] font-bold text-[var(--accent)]">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-xl p-3">
                    <p className="text-[11px] text-foreground font-semibold">Try it</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      “Show pending fields and auto-fill from uploaded COA.”
                    </p>
                  </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[11px] text-muted">
              <span className="px-2.5 py-1 rounded-full border border-border bg-surface/80 backdrop-blur-sm hover:border-[var(--accent)]/25 transition">
                Secure vault + access controls
              </span>
              <span className="px-2.5 py-1 rounded-full border border-border bg-surface/80 backdrop-blur-sm hover:border-[var(--accent)]/25 transition">
                Versioning + audit trail
              </span>
              <span className="px-2.5 py-1 rounded-full border border-border bg-surface/80 backdrop-blur-sm hover:border-[var(--accent)]/25 transition">
                Print-ready exports
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes heroFloat {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-10px, 12px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes heroFloat2 {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(12px, -10px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .heroFloat { animation: heroFloat 14s ease-in-out infinite; }
        .heroFloat2 { animation: heroFloat2 18s ease-in-out infinite; }
      `}</style>
    </section>
  );
}

