"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Phase0MiniFlowchart from "./Phase0MiniFlowchart";
import {
  type BusinessGenesisData,
  buildInitialBusinessGenesis,
  computePhase0Completion,
  isPhase0Complete,
  PATHWAY_MARKET_OPTIONS,
  REGULATORY_PATHWAY_OPTIONS,
  INDIA_ONLY_NOTICE,
  enforceIndiaOnlySecE,
} from "@/lib/businessGenesis";

/** Flowchart order: 0.1–0.3 → 0.4–0.6 → 0.7 → 0.8 → 0.9 */
const SECTIONS = [
  { id: "E", label: "E · Market Research", step: "Steps 0.1 – 0.3" },
  { id: "B", label: "B · Incorporation", step: "Steps 0.4 – 0.6" },
  { id: "C", label: "C · Bank", step: "Step 0.7" },
  { id: "A", label: "A · Statutory", step: "Step 0.8" },
  { id: "D", label: "D · IP & Brand", step: "Step 0.9" },
];

const INPUT = "w-full text-sm border border-border rounded-md px-3 py-2 bg-surface";
const CHECK =
  "flex items-start gap-3 p-3 border border-accent/10 rounded-lg cursor-pointer hover:bg-accent/5 transition";
const STEP_BLOCK = "p-4 border border-accent/20 bg-accent/5 rounded-xl space-y-3";
const STEP_BLOCK_LOOSE = "p-4 border border-accent/20 bg-accent/5 rounded-xl space-y-4";
const STEP_DECISION = "p-4 border-2 border-dashed border-accent/35 bg-accent/5 rounded-xl space-y-3";
const STEP_TITLE = "text-xs font-semibold text-accent";
const STEP_HINT = "text-[11px] text-muted leading-relaxed";
const MARKET_CHIP =
  "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs";
const MARKET_CHIP_ON = "bg-accent/10 border-accent/40";
const MARKET_CHIP_OFF = "border-border/60 bg-surface2/80 text-muted opacity-60 cursor-not-allowed";
const MARKET_CHECKBOX = "w-4 h-4 shrink-0 accent-accent";
const CALLOUT = "flex items-start gap-2 p-4 rounded-xl border border-accent/20 bg-accent/5 text-[11px] text-foreground leading-relaxed";
const SUCCESS_BANNER = "p-3 rounded-xl border border-accent/25 bg-accent/10 text-[11px] text-foreground";

function StepHeader({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">{step}</p>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted mt-1">{desc}</p>
    </div>
  );
}

function StepBlock({
  title,
  children,
  className = "",
  loose,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  loose?: boolean;
}) {
  return (
    <div className={`${loose ? STEP_BLOCK_LOOSE : STEP_BLOCK} ${className}`}>
      <p className={STEP_TITLE}>{title}</p>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
}) {
  return (
    <label className={CHECK}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 mt-0.5 text-accent shrink-0" />
      <div>
        <p className="font-medium text-sm text-foreground">{title}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

function MarketCheckboxChip({
  label,
  checked,
  locked,
  soon,
}: {
  label: string;
  checked: boolean;
  locked?: boolean;
  soon?: boolean;
}) {
  const chipClass = `${MARKET_CHIP} ${checked || locked ? MARKET_CHIP_ON : "border-border"} ${
    locked ? "cursor-default" : soon ? MARKET_CHIP_OFF : "cursor-pointer hover:bg-accent/5"
  }`;

  if (soon) {
    return (
      <span className={`${MARKET_CHIP} ${MARKET_CHIP_OFF}`} title="Available when multi-market support is enabled">
        <input type="checkbox" disabled className={`${MARKET_CHECKBOX} opacity-50`} />
        {label}
        <span className="text-[9px] uppercase tracking-wide">Soon</span>
      </span>
    );
  }

  return (
    <label className={chipClass}>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        readOnly={locked}
        className={MARKET_CHECKBOX}
      />
      {label}
    </label>
  );
}

export default function BusinessGenesisForm({ initialData }: { initialData?: Record<string, unknown> }) {
  const [activeTab, setActiveTab] = useState("E");
  const [data, setData] = useState<BusinessGenesisData>(() => buildInitialBusinessGenesis(initialData));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const displayData = useMemo(() => {
    const pct = computePhase0Completion(data);
    return { ...data, overallCompletionPct: pct, phase0Complete: isPhase0Complete(data) };
  }, [data]);

  const handleUpdateNested = (sectionKey: keyof BusinessGenesisData, fieldKey: string, propKey: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] as Record<string, unknown>),
        [fieldKey]: {
          ...((prev[sectionKey] as Record<string, Record<string, unknown>>)[fieldKey]),
          [propKey]: value,
        },
      },
    }));
  };

  const handleUpdate = <K extends keyof BusinessGenesisData>(
    sectionKey: K,
    field: string,
    value: unknown,
  ) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] as object), [field]: value },
    }));
  };

  const uploadFile = async (file: File, uploadKey: string, onComplete: (url: string) => void) => {
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const resUrl = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!resUrl.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, gcsPath } = await resUrl.json();
      const resUpload = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!resUpload.ok) throw new Error("Upload failed");
      onComplete(gcsPath);
    } catch {
      alert("Failed to upload file");
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const renderDocUpload = (
    uploadKey: string,
    url: string,
    onUrl: (u: string) => void,
    label: string,
  ) => (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {url ? (
        <div className="flex items-center gap-2">
          <a
            href={`/api/download?path=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline truncate max-w-[220px]"
          >
            View document
          </a>
          <button type="button" onClick={() => onUrl("")} className="text-xs text-red-500 hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            disabled={uploadingState[uploadKey]}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, uploadKey, onUrl);
            }}
            className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-accent file:text-white"
          />
          {uploadingState[uploadKey] && <span className="text-xs text-accent animate-pulse">Uploading…</span>}
        </div>
      )}
    </div>
  );

  const renderRegBlock = (key: keyof BusinessGenesisData["secA"], label: string, hasNumber = false) => {
    const val = data.secA[key];
    return (
      <div className={`${STEP_BLOCK} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">{label}</h3>
          <select
            value={val.status}
            onChange={(e) => handleUpdateNested("secA", key, "status", e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-1 bg-surface"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        {val.status === "complete" && (
          <div className="space-y-3">
            {hasNumber && (
              <div>
                <label className="block text-xs text-muted mb-1">Registration number</label>
                <input
                  type="text"
                  value={val.number ?? ""}
                  onChange={(e) => handleUpdateNested("secA", key, "number", e.target.value)}
                  className={INPUT}
                />
              </div>
            )}
            {renderDocUpload(key, val.documentUrl, (url) => handleUpdateNested("secA", key, "documentUrl", url), "Certificate / proof")}
          </div>
        )}
      </div>
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pct = computePhase0Completion(data);
      const payload = {
        businessGenesis: {
          ...data,
          secE: enforceIndiaOnlySecE(data.secE),
          secB: {
            ...data.secB,
            incorporationDate: data.secB.incorporationDate ? new Date(data.secB.incorporationDate) : undefined,
          },
          secC: {
            ...data.secC,
            signatories: data.secC.signatories.filter((s) => s.name.trim() || s.designation.trim()),
          },
          overallCompletionPct: pct,
          phase0Complete: isPhase0Complete({ ...data, secE: enforceIndiaOnlySecE(data.secE) }),
        },
      };
      const res = await fetch("/api/companies/me/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const skipIncorp = data.secB.legalEntityExists === true;
  const needsIncorp = data.secB.legalEntityExists === false;

  return (
    <div className="flex gap-5 items-start">
      <div className="flex-1 min-w-0 bg-surface border border-border rounded-xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-64 border-r border-border bg-surface2/50 flex flex-col p-4 gap-2">
          <p className="text-[10px] text-muted px-2 mb-1">Follow MDR Phase 0 order</p>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === sec.id ? "bg-accent text-white" : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <span className="block">{sec.label}</span>
              <span className={`text-[10px] ${activeTab === sec.id ? "text-white/80" : "text-muted"}`}>{sec.step}</span>
            </button>
          ))}
         
        </div>

        <div className="flex-1 flex flex-col min-h-[560px]">
          <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {/* ── E: 0.1–0.3 ── */}
            {activeTab === "E" && (
              <div className="space-y-4 max-w-2xl">
                <StepHeader
                  step="Steps 0.1 – 0.3"
                  title="Market Research & Regulatory Strategy"
                  desc="Business need, competitor landscape, and pathway freeze before incorporation. Product-specific predicate matching is in Phase 1."
                />

                <StepBlock title="0.1 — Business need">
                  <CheckRow
                    checked={data.secE.tamAnalysisDone}
                    onChange={(v) => handleUpdate("secE", "tamAnalysisDone", v)}
                    title="TAM / SAM / SOM analysis done"
                    hint="Market sizing and revenue projections established"
                  />
                  <CheckRow
                    checked={data.secE.reimbursementLandscapeDone}
                    onChange={(v) => handleUpdate("secE", "reimbursementLandscapeDone", v)}
                    title="Reimbursement landscape reviewed"
                    hint="CGHS, PM-JAY, private payer coverage for your device category"
                  />
                  {data.secE.reimbursementLandscapeDone && (
                    <textarea
                      rows={2}
                      value={data.secE.reimbursementNotes}
                      onChange={(e) => handleUpdate("secE", "reimbursementNotes", e.target.value)}
                      className={INPUT}
                      placeholder="Key reimbursement codes, payers, or gaps (optional notes)"
                    />
                  )}
                </StepBlock>

                <StepBlock title="0.2 — Competitor & market landscape">
                  <p className={STEP_HINT}>
                    High-level scan only — who sells similar devices, pricing, and market gaps.{" "}
                    <strong>CDSCO predicate lookup per product</strong> is done in Phase 1 (Register Product → Auto Find Predicate).
                  </p>
                  <CheckRow
                    checked={data.secE.competitorScanDone}
                    onChange={(v) => handleUpdate("secE", "competitorScanDone", v)}
                    title="Competitor & market landscape reviewed"
                    hint="Competitive products, market share, and positioning — not device-by-device CDSCO matching"
                  />
                  <CheckRow
                    checked={data.secE.patentLandscapeDone}
                    onChange={(v) => handleUpdate("secE", "patentLandscapeDone", v)}
                    title="Patent landscape reviewed"
                    hint="FTO search — patents that may block your technology"
                  />
                  {data.secE.patentLandscapeDone && (
                    <textarea
                      rows={2}
                      value={data.secE.patentLandscapeNotes}
                      onChange={(e) => handleUpdate("secE", "patentLandscapeNotes", e.target.value)}
                      className={INPUT}
                      placeholder="Key patents, assignees, expiry (optional)"
                    />
                  )}
                </StepBlock>

                <StepBlock title="0.3 — Regulatory pathway & IP planning" loose>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/25 bg-accent/10 text-[11px] text-foreground">
                    <span>🇮🇳</span>
                    <span>{INDIA_ONLY_NOTICE}</span>
                  </div>

                  <p className={STEP_HINT}>Regulatory pathway (India only for now):</p>
                  <div className="flex flex-wrap gap-2">
                    {REGULATORY_PATHWAY_OPTIONS.map((opt) => (
                      <MarketCheckboxChip
                        key={opt.id}
                        label={opt.label}
                        checked={opt.indiaOnly ? true : !!data.secE[opt.id as keyof typeof data.secE]}
                        locked={opt.indiaOnly}
                        soon={!opt.indiaOnly}
                      />
                    ))}
                  </div>

                  <p className={STEP_HINT}>Target market (India only for now):</p>
                  <div className="flex flex-wrap gap-2">
                    {PATHWAY_MARKET_OPTIONS.map((m) => (
                      <MarketCheckboxChip
                        key={m.code}
                        label={m.label}
                        checked={m.indiaOnly ? true : data.secE.targetCountries.includes(m.code)}
                        locked={m.indiaOnly}
                        soon={!m.indiaOnly}
                      />
                    ))}
                  </div>

                  <CheckRow
                    checked={data.secE.trademarkPlanningDone}
                    onChange={(v) => handleUpdate("secE", "trademarkPlanningDone", v)}
                    title="Trademark / brand strategy planned"
                    hint="Class 10 TM search and filing plan before device labelling (Rule 44)"
                  />

                  <CheckRow
                    checked={data.secE.regulatoryPathwayChosen}
                    onChange={(v) => handleUpdate("secE", "regulatoryPathwayChosen", v)}
                    title="Regulatory pathway frozen"
                    hint="Lead market, regulatory priority (India / CE / FDA), and timeline agreed by leadership"
                  />

                  <textarea
                    rows={2}
                    value={data.secE.pathwayNotes}
                    onChange={(e) => handleUpdate("secE", "pathwayNotes", e.target.value)}
                    className={INPUT}
                    placeholder="Pathway summary: e.g. India first (MDR 2017), CE in year 2…"
                  />
                </StepBlock>
              </div>
            )}

            {/* ── B: 0.4–0.6 ── */}
            {activeTab === "B" && (
              <div className="space-y-6 max-w-2xl">
                <StepHeader
                  step="Steps 0.4 – 0.6"
                  title="Company Incorporation"
                  desc="Legal entity decision and MCA incorporation (if not already registered)."
                />

                <div className={STEP_DECISION}>
                  <p className={STEP_TITLE}>0.4 — Does a legal entity already exist?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: true, label: "Yes — entity exists", hint: "Skip to bank (0.7) and statutory (0.8)" },
                      { value: false, label: "No — incorporate now", hint: "Complete 0.5–0.6 below" },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => handleUpdate("secB", "legalEntityExists", data.secB.legalEntityExists === opt.value ? null : opt.value)}
                        className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs transition ${
                          data.secB.legalEntityExists === opt.value
                            ? "border-accent bg-accent/15 text-foreground"
                            : "border-border/80 bg-surface text-muted hover:border-accent/30"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="mt-0.5 opacity-80">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(skipIncorp || needsIncorp || data.secB.legalEntityExists === null) && (
                  <StepBlock title="0.5 — Entity type">
                    <select
                      value={data.secB.entityType}
                      onChange={(e) => handleUpdate("secB", "entityType", e.target.value)}
                      className={INPUT}
                    >
                      <option value="">Select entity type…</option>
                      <option value="pvt-ltd">Private Limited (Pvt Ltd)</option>
                      <option value="llp">Limited Liability Partnership (LLP)</option>
                      <option value="opc">One Person Company (OPC)</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole-prop">Sole Proprietorship</option>
                    </select>
                  </StepBlock>
                )}

                {needsIncorp && (
                  <StepBlock title="0.6 — Incorporation checklist (MCA)">
                    <CheckRow checked={data.secB.runNameApproval} onChange={(v) => handleUpdate("secB", "runNameApproval", v)} title="RUN name approval obtained" />
                    <CheckRow checked={data.secB.dscDinObtained} onChange={(v) => handleUpdate("secB", "dscDinObtained", v)} title="DSC + DIN for directors" />
                    <CheckRow checked={data.secB.moaAoaDrafted} onChange={(v) => handleUpdate("secB", "moaAoaDrafted", v)} title="MoA & AoA drafted" />
                    <CheckRow
                      checked={data.secB.moaIncludesMedicalDeviceObject}
                      onChange={(v) => handleUpdate("secB", "moaIncludesMedicalDeviceObject", v)}
                      title="MoA includes medical device manufacture / import object"
                      hint="Wrong business object → costly MCA amendment later"
                    />
                    <CheckRow checked={data.secB.spicePlusFiled} onChange={(v) => handleUpdate("secB", "spicePlusFiled", v)} title="SPICe+ filed with MCA" />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">CIN</label>
                        <input type="text" value={data.secB.cin} onChange={(e) => handleUpdate("secB", "cin", e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">PAN</label>
                        <input type="text" value={data.secB.pan} onChange={(e) => handleUpdate("secB", "pan", e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">TAN</label>
                        <input type="text" value={data.secB.tan} onChange={(e) => handleUpdate("secB", "tan", e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Incorporation date</label>
                        <input
                          type="date"
                          value={data.secB.incorporationDate}
                          onChange={(e) => handleUpdate("secB", "incorporationDate", e.target.value)}
                          className={INPUT}
                        />
                      </div>
                    </div>
                    {renderDocUpload(
                      "incorporationDocUrl",
                      data.secB.incorporationDocUrl,
                      (url) => handleUpdate("secB", "incorporationDocUrl", url),
                      "Certificate of Incorporation (COI)",
                    )}
                  </StepBlock>
                )}

                {skipIncorp && (
                  <div className={SUCCESS_BANNER}>
                    Existing entity recorded. Complete <strong className="text-accent">0.7 Bank</strong> and{" "}
                    <strong className="text-accent">0.8 Statutory</strong> tabs next.
                  </div>
                )}
              </div>
            )}

            {/* ── C: 0.7 ── */}
            {activeTab === "C" && (
              <div className="space-y-6 max-w-2xl">
                <StepHeader
                  step="Step 0.7"
                  title="Bank Account"
                  desc="Corporate current account, AD Code for imports, and authorised signatories."
                />
                <StepBlock title="0.7 — Corporate bank account">
                  <CheckRow
                    checked={data.secC.bankAccountOpened}
                    onChange={(v) => handleUpdate("secC", "bankAccountOpened", v)}
                    title="Corporate bank account opened"
                  />
                  {data.secC.bankAccountOpened && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Bank name</label>
                        <input type="text" value={data.secC.bankName} onChange={(e) => handleUpdate("secC", "bankName", e.target.value)} className={INPUT} placeholder="HDFC, ICICI…" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Account number</label>
                        <input type="text" value={data.secC.accountNumber} onChange={(e) => handleUpdate("secC", "accountNumber", e.target.value)} className={INPUT} />
                      </div>
                    </div>
                  )}
                </StepBlock>

                <div className={CALLOUT}>
                  <span className="shrink-0 text-accent">ℹ️</span>
                  <p>
                    <strong className="text-accent">AD Code</strong> must be registered with customs for import of devices/components. IEC activation and clearance depend on your AD bank branch.
                  </p>
                </div>

                <StepBlock title="0.7 — AD Code & signatories">
                  <CheckRow checked={data.secC.adCodeObtained} onChange={(v) => handleUpdate("secC", "adCodeObtained", v)} title="AD Code obtained from bank" />
                  <p className={`${STEP_HINT} pt-1`}>Authorised signatories</p>
                  {data.secC.signatories.map((sig, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 p-3 border border-accent/15 rounded-lg bg-surface">
                      <input
                        type="text"
                        placeholder="Name"
                        value={sig.name}
                        onChange={(e) => {
                          const next = [...data.secC.signatories];
                          next[idx] = { ...next[idx], name: e.target.value };
                          handleUpdate("secC", "signatories", next);
                        }}
                        className={INPUT}
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={sig.designation}
                        onChange={(e) => {
                          const next = [...data.secC.signatories];
                          next[idx] = { ...next[idx], designation: e.target.value };
                          handleUpdate("secC", "signatories", next);
                        }}
                        className={INPUT}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate("secC", "signatories", [...data.secC.signatories, { name: "", designation: "" }])
                    }
                    className="text-xs text-accent font-semibold hover:underline"
                  >
                    + Add signatory
                  </button>
                </StepBlock>
              </div>
            )}

            {/* ── A: 0.8 ── */}
            {activeTab === "A" && (
              <div className="space-y-6">
                <StepHeader
                  step="Step 0.8"
                  title="Statutory Registrations"
                  desc="GST, MSME, IEC (critical for imports), Shop & Establishment, PT, ESIC/EPFO if 10+ employees."
                />
                <div className="grid md:grid-cols-2 gap-4">
                  {renderRegBlock("gst", "GST Registration", true)}
                  {renderRegBlock("msme", "MSME / Udyam", true)}
                  {renderRegBlock("iec", "Importer-Exporter Code (IEC)", true)}
                  {renderRegBlock("shopEstablishment", "Shop & Establishment")}
                  {renderRegBlock("professionalTax", "Professional Tax (PT)")}
                  {renderRegBlock("esicEpfo", "ESIC / EPFO (if 10+ staff)")}
                </div>
              </div>
            )}

            {/* ── D: 0.9 ── */}
            {activeTab === "D" && (
              <div className="space-y-6 max-w-2xl">
                <StepHeader
                  step="Step 0.9"
                  title="IP & Brand"
                  desc="Trademark, domain, patent/design if novel, NDA templates for partners."
                />
                <StepBlock title="0.9 — Trademark (TM-A)" loose>
                  <select
                    value={data.secD.trademarkStatus}
                    onChange={(e) => handleUpdate("secD", "trademarkStatus", e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select status…</option>
                    <option value="not-filed">Not filed</option>
                    <option value="filed">Filed</option>
                    <option value="registered">Registered</option>
                  </select>
                  {["filed", "registered"].includes(data.secD.trademarkStatus) && (
                    <>
                      <input
                        type="text"
                        value={data.secD.trademarkNumber}
                        onChange={(e) => handleUpdate("secD", "trademarkNumber", e.target.value)}
                        className={INPUT}
                        placeholder="Application / registration number"
                      />
                      {renderDocUpload(
                        "trademarkDocUrl",
                        data.secD.trademarkDocUrl,
                        (url) => handleUpdate("secD", "trademarkDocUrl", url),
                        "TM certificate / acknowledgement",
                      )}
                    </>
                  )}
                </StepBlock>

                <StepBlock title="0.9 — Domain, patent & design">
                  <CheckRow checked={data.secD.domainRegistered} onChange={(v) => handleUpdate("secD", "domainRegistered", v)} title="Website domain registered" />
                  {data.secD.domainRegistered && (
                    <input
                      type="text"
                      value={data.secD.domainName}
                      onChange={(e) => handleUpdate("secD", "domainName", e.target.value)}
                      className={INPUT}
                      placeholder="e.g. www.yourcompany.com"
                    />
                  )}
                  <CheckRow checked={data.secD.patentFiled} onChange={(v) => handleUpdate("secD", "patentFiled", v)} title="Patent filed (if applicable)" />
                  <CheckRow checked={data.secD.designFiled} onChange={(v) => handleUpdate("secD", "designFiled", v)} title="Design registration filed (Designs Act 2000)" />
                </StepBlock>

                <StepBlock title="0.9 — NDA templates">
                  {renderDocUpload(
                    "ndaTemplateUrl",
                    data.secD.ndaTemplateUrl,
                    (url) => handleUpdate("secD", "ndaTemplateUrl", url),
                    "NDA template (for CROs, distributors, consultants)",
                  )}
                </StepBlock>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-surface flex items-center justify-between gap-4">
            <p className="text-xs text-muted">
              {displayData.phase0Complete ? (
                <span className="text-accent font-semibold">Phase 0 ready for Phase 1 →</span>
              ) : (
                <>Complete all steps to unlock full Phase 1 readiness ({displayData.overallCompletionPct}%)</>
              )}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save progress"}
            </button>
          </div>
        </div>
      </div>

      <Phase0MiniFlowchart data={displayData} />
    </div>
  );
}
