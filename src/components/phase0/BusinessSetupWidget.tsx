import Link from "next/link";

export default function BusinessSetupWidget({ initialSetup }: { initialSetup: any }) {
  // Compute completion percentage based on the deeply nested fields
  
  // Define required fields to count for completion
  const requirements = [
    initialSetup?.secA?.gst?.status === 'complete',
    initialSetup?.secA?.msme?.status === 'complete',
    initialSetup?.secA?.iec?.status === 'complete', 
    initialSetup?.secB?.entityType !== '' && initialSetup?.secB?.entityType !== undefined,
    initialSetup?.secB?.cin !== '' && initialSetup?.secB?.cin !== undefined,
    initialSetup?.secB?.pan !== '' && initialSetup?.secB?.pan !== undefined,
    initialSetup?.secC?.bankAccountOpened === true,
    initialSetup?.secD?.trademarkStatus === 'filed' || initialSetup?.secD?.trademarkStatus === 'registered',
    initialSetup?.secD?.domainRegistered === true,
    initialSetup?.secE?.tamAnalysisDone === true,
    initialSetup?.secE?.competitorScanDone === true,
    initialSetup?.secE?.regulatoryPathwayChosen === true,
  ];

  const completedCount = requirements.filter(Boolean).length;
  const totalCount = requirements.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Phase 0: Business Genesis</h2>
            <p className="text-xs text-muted mt-1">Prerequisites before starting the medical device registration.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--accent)]">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface2 rounded-full h-1.5 mb-6">
          <div 
            className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Summary List */}
        <ul className="space-y-3 mb-6 text-sm">
          <li className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${initialSetup?.secA?.gst?.status === 'complete' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className={initialSetup?.secA?.gst?.status === 'complete' ? 'text-foreground' : 'text-muted'}>Statutory Registrations</span>
          </li>
          <li className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${initialSetup?.secB?.entityType ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className={initialSetup?.secB?.entityType ? 'text-foreground' : 'text-muted'}>Company Incorporation</span>
          </li>
          <li className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${initialSetup?.secC?.bankAccountOpened ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className={initialSetup?.secC?.bankAccountOpened ? 'text-foreground' : 'text-muted'}>Bank Details</span>
          </li>
          <li className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${initialSetup?.secD?.domainRegistered ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className={initialSetup?.secD?.domainRegistered ? 'text-foreground' : 'text-muted'}>IP & Brand</span>
          </li>
          <li className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${initialSetup?.secE?.regulatoryPathwayChosen ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className={initialSetup?.secE?.regulatoryPathwayChosen ? 'text-foreground' : 'text-muted'}>Market Research</span>
          </li>
        </ul>
      </div>

      <Link href="/dashboard/business-genesis" className="mt-auto inline-flex items-center justify-center gap-2 w-full px-2 py-2.5 text-sm font-semibold rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/8 transition">
        Open Genesis Portal &rarr;
      </Link>
    </div>
  );
}
