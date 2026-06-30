import Link from "next/link";
import {
  computePhase0Completion,
  normalizeBusinessGenesis,
  type BusinessGenesisData,
} from "@/lib/businessGenesis";

export default function BusinessSetupWidget({ initialSetup }: { initialSetup?: Partial<BusinessGenesisData> }) {
  const bg = normalizeBusinessGenesis(initialSetup);
  const progressPercent = computePhase0Completion(bg);

  const secA = bg.secA;
  const secB = bg.secB;
  const secC = bg.secC;
  const secD = bg.secD;
  const secE = bg.secE;

  const items = [
    {
      done: !!(secE?.tamAnalysisDone && secE?.reimbursementLandscapeDone),
      label: "0.1 Market need",
    },
    {
      done: !!(secE?.competitorScanDone && secE?.patentLandscapeDone),
      label: "0.2 Market / patent scan",
    },
    {
      done: !!(secE?.regulatoryPathwayChosen && (secE?.targetCountries?.length ?? 0) > 0),
      label: "0.3 Pathway frozen",
    },
    {
      done: secB?.legalEntityExists !== null && secB?.legalEntityExists !== undefined,
      label: "0.4 Entity decision",
    },
    {
      done: !!(secC?.bankAccountOpened && secC?.adCodeObtained),
      label: "0.7 Bank & AD Code",
    },
    {
      done: secA?.gst?.status === "complete" && secA?.iec?.status === "complete",
      label: "0.8 GST + IEC",
    },
    {
      done: !!(secD?.domainRegistered || secD?.trademarkStatus),
      label: "0.9 IP & brand",
    },
  ];
  //u
  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Business Genesis </h2>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              Legal entity and statutory prerequisites before device registration.
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-accent shrink-0">{progressPercent}%</span>
        </div>

        <div className="w-full bg-surface2 rounded-full h-1 mb-4">
          <div
            className="bg-accent h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ul className="space-y-1.5 mb-5">
          {items.map((item) => {
            const [step, ...rest] = item.label.split(" ");
            const title = rest.join(" ");
            return (
              <li key={item.label} className="flex items-center gap-2 min-h-[1.25rem]">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? "bg-emerald-500" : "bg-border"}`}
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
        href="/dashboard/business-genesis"
        className="mt-auto inline-flex items-center justify-center w-full px-3 py-2 text-[11px] font-semibold tracking-wide uppercase rounded-lg border border-border text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition"
      >
        Open Genesis Portal
      </Link>
    </div>
  );
}
