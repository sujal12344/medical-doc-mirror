"use client";

import { useState } from "react";

type PathwayForm = {
  intendedUse: string;
  deviceType: string;
  deviceClass: string;
  predicateExists: null | boolean;
  predicateName: string;
  predicateManufacturer: string;
  predicateRegNo: string;
  predicateBasis: string;
  predicateClass: string;
  md26Status: "not-filed" | "filed" | "approved";
  md26RefNo: string;
  md27Status: "not-filed" | "filed" | "approved";
  md27RefNo: string;
  clinicalSiteCount: string;
  novelPathwayAcknowledged: boolean;
};

type Upd = (field: string, value: string | boolean | null) => void;

type PredicateSuggestion = {
  rank: number;
  reason: string;
  name: string;
  manufacturer: string;
  regNo: string;
  intendedUse: string;
  deviceClass: string;
};

const FIELD = "w-full px-3 py-2 border border-border rounded-xl bg-surface2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition";
const LABEL = "block text-xs font-medium text-foreground mb-1";

const STATUS_OPTS = [
  { value: "not-filed", label: "Not yet filed", color: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "filed", label: "Filed / pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-700 border-green-200" },
];

function StatusSelect({ field, value, upd }: { field: string; value: string; upd: Upd }) {
  return (
    <div className="flex gap-1.5">
      {STATUS_OPTS.map((o) => (
        <button key={o.value} type="button" onClick={() => upd(field, o.value)}
          className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition ${value === o.value ? o.color + " ring-1 ring-offset-0 ring-current" : "bg-surface2 text-muted border-border"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function PredicatePathway({ form, upd, productId }: { form: PathwayForm; upd: Upd, productId: string | null }) {
  const { predicateExists } = form;
  const isHighRisk = ["C", "D"].includes(form.deviceClass);
  const [predicateLoading, setPredicateLoading] = useState(false);
  const [searchImportList, setSearchImportList] = useState(false);
  const [predicateSuggestions, setPredicateSuggestions] = useState<PredicateSuggestion[]>([]);
  const [predicateSearchMeta, setPredicateSearchMeta] = useState<{
    keyword: string;
    total: number;
    listType: "import" | "manufacturer";
  } | null>(null);

  function applyPredicateSuggestion(suggestion: PredicateSuggestion) {
    upd("predicateExists", true);
    upd("predicateName", suggestion.name);
    upd("predicateManufacturer", suggestion.manufacturer);
    upd("predicateRegNo", suggestion.regNo);
    upd("predicateClass", suggestion.deviceClass);
    upd("predicateBasis", suggestion.reason || "Auto-matched using intended use similarity");
  }

  async function handleAutoFindPredicate() {
    let intendedUse = form.intendedUse?.trim();
    if (!intendedUse) {
      try {
        const draft = localStorage.getItem("newproduct_draft");
        if (draft) {
          const parsed = JSON.parse(draft);
          intendedUse = (parsed.intendedUse || "").trim();
        }
      } catch {}
    }

    if (!intendedUse) {
      alert("Please enter the Intended Use/Claims above first.");
      return;
    }

    setPredicateLoading(true);
    setPredicateSuggestions([]);
    setPredicateSearchMeta(null);
    try {
      const res = await fetch("/api/products/predicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intendedUse,
          cdscoListType: searchImportList ? "import" : "manufacturer",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "No match found");
        return;
      }

      const suggestions: PredicateSuggestion[] = Array.isArray(data.matches) && data.matches.length > 0
        ? data.matches
        : data.match
          ? [{
              rank: 1,
              reason: data.matchReason || "Best CDSCO match",
              name: data.match.name,
              manufacturer: data.match.manufacturer,
              regNo: data.match.regNo,
              intendedUse: data.match.intendedUse || "",
              deviceClass: data.match.deviceClass,
            }]
          : [];

      if (suggestions.length === 0) {
        alert("No predicate suggestions returned");
        return;
      }

      setPredicateSuggestions(suggestions);
      setPredicateSearchMeta({
        keyword: data.searchKeyword || "",
        total: data.totalDevicesScraped ?? 0,
        listType: data.cdscoListType === "import" ? "import" : "manufacturer",
      });
      applyPredicateSuggestion(suggestions[0]);
    } catch (error) {
      console.error(error);
      alert("Failed to auto-fill predicate device");
    } finally {
      setPredicateLoading(false);
    }
  }

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Predicate Device &amp; Regulatory Pathway</h2>
          <p className="text-xs text-muted mt-0.5">Step 1.5 — Determines whether predicate pathway or novel device pathway applies (MDR 2017)</p>
        </div>
        <span className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-surface2 border border-border text-muted font-semibold">1.5</span>
      </div>

      <div className="space-y-3 min-w-0 max-w-full">
        <div className="flex items-start justify-between gap-4 px-3 py-2.5 rounded-xl border border-border bg-surface2/40">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">CDSCO Import list</p>
            <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
              {searchImportList
                ? "Search approved devices under Import (loadAppsImport / #impPre)."
                : "Search approved devices under Manufacturer (default)."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={searchImportList}
            disabled={predicateLoading}
            onClick={() => {
              setSearchImportList((v) => !v);
              setPredicateSuggestions([]);
              setPredicateSearchMeta(null);
            }}
            className={`relative shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
              searchImportList ? "bg-accent" : "bg-surface2 border border-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                searchImportList ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAutoFindPredicate}
          disabled={predicateLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 text-gray-500 text-xs font-semibold hover:bg-white border border-gray-400 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-surface2"
        >
          {predicateLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
              Searching CDSCO list…
            </>
          ) : (
            <>🔍 Auto Find Predicate ({searchImportList ? "Import" : "Manufacturer"})</>
          )}
        </button>
        {predicateLoading && (
          <p className="text-[11px] text-muted flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-muted/40 border-t-muted rounded-full animate-spin shrink-0" />
            Scraping CDSCO {searchImportList ? "Import" : "Manufacturer"} list and matching by intended use — this may take a minute.
          </p>
        )}

        {predicateSuggestions.length > 0 && !predicateLoading && (
          <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-green-200 bg-green-50/30 p-3 space-y-2">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold text-green-800 break-words">
                Top {predicateSuggestions.length} CDSCO predicate suggestion{predicateSuggestions.length !== 1 ? "s" : ""}
              </p>
              {predicateSearchMeta && (
                <p className="text-[10px] text-muted break-words">
                  List:{" "}
                  <strong className="text-foreground">
                    {predicateSearchMeta.listType === "import" ? "Import" : "Manufacturer"}
                  </strong>
                  {" · "}
                  Keyword: <strong className="text-foreground">{predicateSearchMeta.keyword}</strong>
                  {" · "}
                  {predicateSearchMeta.total} device{predicateSearchMeta.total !== 1 ? "s" : ""} scraped
                </p>
              )}
            </div>
            <p className="text-[10px] text-green-700/90 break-words">
              Select the best predicate for substantial equivalence. Rank #1 is pre-applied to the form below.
            </p>
            <div className="grid gap-2 min-w-0 max-w-full">
              {predicateSuggestions.map((s) => {
                const selected =
                  form.predicateRegNo === s.regNo &&
                  form.predicateName === s.name;
                return (
                  <button
                    key={`${s.rank}-${s.regNo}`}
                    type="button"
                    onClick={() => applyPredicateSuggestion(s)}
                    className={`block w-full min-w-0 max-w-full overflow-hidden text-left p-3 rounded-xl border transition ${
                      selected
                        ? "border-green-500 bg-green-50 ring-1 ring-green-400/30"
                        : "border-border bg-surface hover:border-green-300 hover:bg-green-50/50"
                    }`}
                  >
                    <div className="flex gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center ${
                          selected ? "bg-green-600 text-white" : "bg-surface2 text-muted border border-border"
                        }`}
                      >
                        {s.rank}
                      </span>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-semibold text-foreground break-words">{s.name}</p>
                        <p className="text-[10px] text-muted mt-0.5 break-words">{s.manufacturer}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface2 border border-border text-muted">
                            Class {s.deviceClass || "—"}
                          </span>
                          {s.regNo && (
                            <span className="text-[10px] font-mono text-muted break-all">{s.regNo}</span>
                          )}
                          {selected && (
                            <span className="text-[9px] font-semibold text-green-700">Applied</span>
                          )}
                        </div>
                        {s.reason && (
                          <p className="text-[11px] text-foreground/90 mt-2 leading-relaxed break-words line-clamp-3">
                            {s.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Decision */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground">Does a predicate device exist?</div>
        <p className="text-[11px] text-muted">
          A predicate is a CDSCO-registered device of the same type, same intended use, and same or lower risk class
          — it provides the regulatory basis for expedited approval without clinical investigations.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: true, label: "✅ Yes — predicate exists", hint: "Predicate pathway → submit substantial equivalence", color: "border-green-300 bg-green-50 text-green-800" },
            { value: false, label: "⚠️ No — novel device", hint: "Novel pathway → MD-26 clinical investigation required", color: "border-orange-300 bg-orange-50 text-orange-800" },
          ].map((opt) => (
            <button key={String(opt.value)} type="button"
              onClick={() => upd("predicateExists", predicateExists === opt.value ? null : opt.value)}
              className={`text-left px-3 py-2.5 rounded-xl border-2 transition ${predicateExists === opt.value ? opt.color : "border-border bg-surface2 text-muted hover:bg-surface"
                }`}>
              <div className="text-xs font-semibold">{opt.label}</div>
              <div className="text-[10px] mt-0.5 opacity-80">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Branch A: Predicate EXISTS ───────────────────────────────────── */}
      {predicateExists === true && (
        <div className="border border-green-200 bg-green-50/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[9px] font-black flex items-center justify-center">A</span>
            <div className="text-xs font-bold text-green-800">Predicate Device Details</div>
          </div>
          <p className="text-[11px] text-green-700">
            Enter the CDSCO-registered predicate device. This will be used to establish substantial equivalence
            during Phase 2 Technical Dossier generation (Form MD-7 / MD-9).
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Predicate Device Name *</label>
              <input type="text" value={form.predicateName}
                onChange={(e) => upd("predicateName", e.target.value)}
                className={FIELD} placeholder="e.g. AlbuTrace Assay Kit" />
            </div>
            <div>
              <label className={LABEL}>Predicate Manufacturer</label>
              <input type="text" value={form.predicateManufacturer}
                onChange={(e) => upd("predicateManufacturer", e.target.value)}
                className={FIELD} placeholder="e.g. Randox Laboratories Ltd" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>CDSCO Registration / MD Number</label>
              <input type="text" value={form.predicateRegNo}
                onChange={(e) => upd("predicateRegNo", e.target.value)}
                className={FIELD} placeholder="e.g. MD-2024-XXXX" />
            </div>
            <div>
              <label className={LABEL}>Predicate Device Class</label>
              <select value={form.predicateClass} onChange={(e) => upd("predicateClass", e.target.value)} className={FIELD}>
                <option value="">— Select class —</option>
                <option value="A">Class A — Low Risk</option>
                <option value="B">Class B — Low-Moderate</option>
                <option value="C">Class C — Moderate-High</option>
                <option value="D">Class D — High Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Basis of Equivalence</label>
            <textarea rows={2} value={form.predicateBasis}
              onChange={(e) => upd("predicateBasis", e.target.value)}
              className={FIELD} placeholder="Describe how the predicate is equivalent — same intended use, same specimen type, same analytical principle (e.g. bromocresol green colorimetric)" />
          </div>

          {form.predicateName && (
            <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-[11px] text-green-800">
              <span>✓</span>
              <span>Predicate device recorded. AI will verify substantial equivalence during Phase 2 dossier generation.</span>
            </div>
          )}
        </div>
      )}


      {/* ── Branch B: Novel device — NO predicate ───────────────────────── */}
      {predicateExists === false && (
        <div className="border border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">B</span>
            <div className="text-xs font-bold text-orange-800">Novel Device Pathway — MDR 2017</div>
          </div>

          {/* Warning for high-risk */}
          {isHighRisk && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <span className="text-sm shrink-0">🔴</span>
              <div className="text-[11px] text-red-800">
                <strong>Class {form.deviceClass} novel device:</strong> Mandatory clinical investigation required before CDSCO grant of import/manufacture licence.
                Both MD-26 (Clinical Investigation Application) and MD-27 (Ethics Committee approval) must be completed.
              </div>
            </div>
          )}

          {/* Novel pathway flowchart */}
          <div className="space-y-3">

            {/* Step B1: Acknowledge */}
            <div className={`rounded-xl border px-3 py-2.5 ${form.novelPathwayAcknowledged ? "bg-green-50 border-green-200" : "bg-surface border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-foreground">Acknowledge novel device pathway</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Confirm that no predicate exists and clinical investigation will be required per MDR 2017 Rule 59.
                  </div>
                </div>
                <button type="button" onClick={() => upd("novelPathwayAcknowledged", !form.novelPathwayAcknowledged)}
                  className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${form.novelPathwayAcknowledged ? "bg-accent" : "bg-surface2 border border-border"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.novelPathwayAcknowledged ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Step B2: MD-27 — Ethics Committee */}
            <div className="rounded-xl border border-border px-3 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black flex items-center justify-center border border-blue-300">1</span>
                <div>
                  <div className="text-xs font-semibold text-foreground">MD-27 — Ethics Committee (IEC) Approval</div>
                  <div className="text-[10px] text-muted">Independent Ethics Committee registration &amp; approval before clinical investigation begins</div>
                </div>
              </div>
              <StatusSelect field="md27Status" value={form.md27Status} upd={upd} />
              {form.md27Status !== "not-filed" && (
                <input type="text" value={form.md27RefNo}
                  onChange={(e) => upd("md27RefNo", e.target.value)}
                  className={FIELD} placeholder="IEC registration / reference number" />
              )}
            </div>

            {/* Step B3: MD-26 — Clinical Investigation Application */}
            <div className="rounded-xl border border-border px-3 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black flex items-center justify-center border border-orange-300">2</span>
                <div>
                  <div className="text-xs font-semibold text-foreground">MD-26 — Clinical Investigation Application (CDSCO)</div>
                  <div className="text-[10px] text-muted">Application to CDSCO for permission to conduct clinical investigation (MDR 2017 Rule 59 &amp; Schedule Y)</div>
                </div>
              </div>
              <StatusSelect field="md26Status" value={form.md26Status} upd={upd} />
              {form.md26Status !== "not-filed" && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={form.md26RefNo}
                    onChange={(e) => upd("md26RefNo", e.target.value)}
                    className={FIELD} placeholder="MD-26 application reference no." />
                  <input type="text" value={form.clinicalSiteCount}
                    onChange={(e) => upd("clinicalSiteCount", e.target.value)}
                    className={FIELD} placeholder="No. of clinical sites" />
                </div>
              )}
            </div>

            {/* Step B4: MD-27 approval → Clinical investigation → MD-6/9 submission */}
            <div className="rounded-xl border border-dashed border-border px-3 py-2.5 space-y-1 opacity-60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-black flex items-center justify-center border border-gray-300">3</span>
                <div className="text-xs font-semibold text-muted">Conduct Clinical Investigation</div>
              </div>
              <p className="text-[10px] text-muted pl-7">After MD-26 approval — conduct investigation per approved protocol, collect safety &amp; performance data</p>
            </div>

            <div className="rounded-xl border border-dashed border-border px-3 py-2.5 space-y-1 opacity-60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-black flex items-center justify-center border border-gray-300">4</span>
                <div className="text-xs font-semibold text-muted">Submit Clinical Data → MD-6 / MD-9 licence application</div>
              </div>
              <p className="text-[10px] text-muted pl-7">Submit completed clinical investigation report with import/manufacture licence application to CDSCO</p>
            </div>

            {/* Summary status chip */}
            <div className="pt-1">
              {form.md26Status === "approved" && form.md27Status === "approved" ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-800">
                  <span>✓</span> Both MD-26 and MD-27 approved — clinical investigation can begin.
                </div>
              ) : form.md26Status === "filed" || form.md27Status === "filed" ? (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-[11px] text-yellow-800">
                  <span className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  Applications pending — awaiting CDSCO / IEC decisions.
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-[11px] text-orange-800">
                  <span>⚠️</span> No applications filed yet. MD-27 (IEC) must be filed before MD-26 (CDSCO).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unset — hint */}
      {predicateExists === null && (
        <div className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-3 py-2 text-[11px] text-muted">
          <span>💡</span>
          Select above — this determines whether you follow the predicate pathway (expedited) or novel device pathway (clinical investigation required).
        </div>
      )}
    </div>
  );
}
