"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type ClassificationResult = {
  genericName: string;
  isInvasive: boolean;
  invasionType: "body-orifice" | "surgically-invasive" | "na";
  isActive: boolean;
  isSterile: boolean;
  isImplantable: boolean;
  isIVD: boolean;
  contactDuration: "transient" | "short-term" | "long-term" | "na";
  isDrugDeviceCombo: boolean;
  containsAnimalTissue: boolean;
  isContraceptive: boolean;
  directCNSContact: boolean;
  directHeartContact: boolean;
  lifeSupporting: boolean;
  ionizingRadiation: boolean;
  confirmedClass: "A" | "B" | "C" | "D" | "";
  appliedRule: string;
  classificationRationale: string;
  confidence: "high" | "medium" | "low";
  aiWarnings: string[];
  wizardCompleted?: boolean;
  classConfirmedBy?: "ai" | "manual" | "";
  overallCompletionPct?: number;
  hasPredicate?: boolean;
  predicateDeviceName?: string;
  predicateLicenceNumber?: string;
  isNovel?: boolean;
};

type Props = {
  productId: string;
  productName: string;
  existingClassification?: ClassificationResult | null;
};

const CLASS_COLORS: Record<string, string> = {
  A: "text-green-600 bg-green-50 border-green-200",
  B: "text-yellow-600 bg-yellow-50 border-yellow-200",
  C: "text-orange-600 bg-orange-50 border-orange-200",
  D: "text-red-600 bg-red-50 border-red-200",
};

const CLASS_LABELS: Record<string, string> = {
  A: "Class A — Low Risk",
  B: "Class B — Low-Moderate Risk",
  C: "Class C — Moderate-High Risk",
  D: "Class D — High Risk",
};

const CLASS_AUTHORITY: Record<string, string> = {
  A: "Authority: SLA (State Licensing Authority) — No notified body audit needed.",
  B: "Authority: SLA (State). Notified Body audit required.",
  C: "Authority: CLA (DCGI). Clinical data may be required.",
  D: "Authority: CLA (DCGI). Clinical investigation mandatory.",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-red-100 text-red-700",
};

function BoolField({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${value ? "bg-red-50 text-red-600" : "bg-surface2 text-muted"}`}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

export default function ClassifyForm({ productId, productName, existingClassification }: Props) {
  const router = useRouter();

  // Step 1 state
  const [mode, setMode] = useState<"manual-description" | "pdf-upload">("manual-description");
  const [deviceDescription, setDeviceDescription] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2 state — predicate
  const [hasPredicate, setHasPredicate] = useState<boolean>(existingClassification?.hasPredicate ?? false);
  const [predicateDeviceName, setPredicateDeviceName] = useState(existingClassification?.predicateDeviceName ?? "");
  const [predicateLicenceNumber, setPredicateLicenceNumber] = useState(existingClassification?.predicateLicenceNumber ?? "");
  const [isNovel, setIsNovel] = useState(existingClassification?.isNovel ?? false);

  // Result + confirm state
  const [result, setResult] = useState<ClassificationResult | null>(existingClassification ?? null);
  const [confirming, setConfirming] = useState(false);

  // Step tracker: 'input' | 'predicate' | 'done'
  const [step, setStep] = useState<"input" | "predicate" | "done">(
    existingClassification?.wizardCompleted ? "done" : existingClassification ? "predicate" : "input"
  );

  // PDF extraction
  const handlePdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      if (res.ok) { const { text } = await res.json(); setPdfText(text); return; }
    } catch {}
    const reader = new FileReader();
    reader.onload = (ev) => setPdfText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }, []);

  // Run AI
  const handleClassify = async () => {
    if (mode === "manual-description" && !deviceDescription.trim()) { setError("Please enter a device description."); return; }
    if (mode === "pdf-upload" && !pdfText.trim()) { setError("Please upload a document first."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          deviceDescription: mode === "manual-description" ? deviceDescription : undefined,
          pdfText: mode === "pdf-upload" ? pdfText : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Classification failed.");
      setResult(data.classification);
      setStep("predicate");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm & Lock (sends predicate data too)
  const handleConfirmAndLock = async () => {
    if (!result) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/products/${productId}/classify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPredicate, predicateDeviceName, predicateLicenceNumber, isNovel: !hasPredicate }),
      });
      if (res.ok) {
        setStep("done");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to confirm.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const isAmbiguous = result && (result.confidence === "low" || result.confidence === "medium");

  return (
    <div className="space-y-6">

      {/* ─── STEP 1: INPUT ─── */}
      {step === "input" && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="text-base font-bold text-foreground">Device Characterisation</h2>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-2 mb-5">
            {(["manual-description", "pdf-upload"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition ${mode === m ? "bg-accent text-white border-accent" : "bg-surface2 text-muted border-border hover:border-accent/40"}`}>
                {m === "manual-description" ? "✏️ Manual Description" : "📄 Upload Document"}
              </button>
            ))}
          </div>

          {mode === "manual-description" ? (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Device Description</label>
              <textarea value={deviceDescription} onChange={(e) => setDeviceDescription(e.target.value)} rows={6}
                placeholder={`Describe your device:\n- Intended use & patient population\n- Is it invasive? Contact duration?\n- Active/passive? Sterile? IVD?\n- Any special features (CNS contact, ionizing radiation, etc.)`}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 transition" />
              <p className="text-xs text-muted mt-2">The more detail you provide, the higher the classification confidence.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Upload IFU / Brochure / Technical Document</label>
              <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/40 transition">
                <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handlePdfUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {pdfFileName ? (
                  <div className="text-sm font-semibold text-accent">📄 {pdfFileName}</div>
                ) : (
                  <><div className="text-3xl mb-2">📂</div><p className="text-sm font-semibold text-foreground">Click to upload</p><p className="text-xs text-muted mt-1">PDF, TXT, DOC supported</p></>
                )}
              </div>
              {pdfText && <p className="text-xs text-green-600 mt-2 font-medium">✓ Text extracted ({pdfText.length.toLocaleString()} chars)</p>}
            </div>
          )}

          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>}

          <button onClick={handleClassify} disabled={loading}
            className="mt-5 w-full py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analysing MDR 2017 rules…</>) : "🔬 Run AI Classification"}
          </button>
        </div>
      )}

      {/* ─── RESULT + STEPS 2 & 3 ─── */}
      {result && step !== "input" && (
        <div className="space-y-5">

          {/* Class Banner */}
          <div className={`border rounded-2xl p-6 flex items-start justify-between gap-4 ${CLASS_COLORS[result.confirmedClass] || "border-border bg-surface"}`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-70">MDR 2017 · First Schedule Classification</div>
              <div className="text-3xl font-black mb-1">{CLASS_LABELS[result.confirmedClass] || "Unclassified"}</div>
              <div className="text-sm font-medium opacity-80">{CLASS_AUTHORITY[result.confirmedClass]}</div>
              <div className="text-sm font-semibold mt-2 opacity-70">Rule Applied: {result.appliedRule || "—"}</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${CONFIDENCE_BADGE[result.confidence]}`}>{result.confidence} confidence</span>
              {step === "done" && <span className="text-xs font-bold text-green-600">🔒 Locked</span>}
            </div>
          </div>

          {/* Rationale */}
          {result.classificationRationale && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">AI Rationale (Step 1.3 — Rule Mapping)</h3>
              <p className="text-sm text-foreground leading-relaxed">{result.classificationRationale}</p>
            </div>
          )}

          {/* Device Characteristics grid */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">Device Characteristics (Step 1.1)</h3>
            <div className="grid md:grid-cols-2 gap-x-8">
              <div>
                <BoolField label="Active Device" value={result.isActive} />
                <BoolField label="Invasive" value={result.isInvasive} />
                <BoolField label="Implantable" value={result.isImplantable} />
                <BoolField label="Sterile" value={result.isSterile} />
                <BoolField label="IVD" value={result.isIVD} />
                <BoolField label="Drug-Device Combo" value={result.isDrugDeviceCombo} />
              </div>
              <div>
                <BoolField label="Contains Animal Tissue" value={result.containsAnimalTissue} />
                <BoolField label="Contraceptive" value={result.isContraceptive} />
                <BoolField label="Direct CNS Contact" value={result.directCNSContact} />
                <BoolField label="Direct Heart Contact" value={result.directHeartContact} />
                <BoolField label="Life Supporting" value={result.lifeSupporting} />
                <BoolField label="Ionizing Radiation" value={result.ionizingRadiation} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid md:grid-cols-3 gap-4">
              <div><div className="text-xs text-muted mb-1">Contact Duration</div><div className="text-sm font-semibold capitalize">{result.contactDuration}</div></div>
              <div><div className="text-xs text-muted mb-1">Invasion Type</div><div className="text-sm font-semibold capitalize">{result.invasionType}</div></div>
              <div><div className="text-xs text-muted mb-1">Generic Name</div><div className="text-sm font-semibold">{result.genericName || "—"}</div></div>
            </div>
          </div>

          {/* ── STEP 2: PREDICATE DEVICE (Step 1.5) ── */}
          {step !== "done" && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-base font-bold text-foreground">Predicate Device (Step 1.5)</h2>
              </div>
              <p className="text-xs text-muted mb-5 ml-8">
                Does a substantially equivalent device already hold a CDSCO licence? This determines if you follow the standard pathway or the Novel Device pathway (MD-26/MD-27).
              </p>

              {/* Toggle */}
              <div className="flex gap-2 mb-4">
                {[true, false].map((val) => (
                  <button key={String(val)} onClick={() => { setHasPredicate(val); if (!val) setIsNovel(true); else setIsNovel(false); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition ${hasPredicate === val ? (val ? "bg-green-600 text-white border-green-600" : "bg-orange-500 text-white border-orange-500") : "bg-surface2 text-muted border-border hover:border-accent/40"}`}>
                    {val ? "✅ Yes — Predicate exists" : "⚠️ No — Novel device"}
                  </button>
                ))}
              </div>

              {/* Predicate fields */}
              {hasPredicate && (
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Predicate Device Name</label>
                    <input value={predicateDeviceName} onChange={(e) => setPredicateDeviceName(e.target.value)}
                      placeholder="e.g. Accu-Sure Pulse Oximeter"
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">CDSCO Licence / MD Number</label>
                    <input value={predicateLicenceNumber} onChange={(e) => setPredicateLicenceNumber(e.target.value)}
                      placeholder="e.g. MD-12345"
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOVEL DEVICE PATHWAY (Step 1.5 — No branch) ── */}
          {!hasPredicate && step !== "done" && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="text-sm font-bold text-orange-800 mb-2">Novel Device Pathway Required (Step 1.5 — No Predicate)</div>
                  <p className="text-xs text-orange-700 leading-relaxed mb-3">
                    Since no predicate device exists, your product is classified as a <strong>Novel Medical Device</strong> under MDR 2017. You must follow additional regulatory filings before applying for a manufacturing/import licence.
                  </p>
                  <div className="space-y-2">
                    {[
                      { code: "MD-26", title: "Application for Permission for Clinical Investigation", body: "File to CDSCO / CLA with device details, investigational plan, and ethics committee approval." },
                      { code: "MD-27", title: "Grant of Permission for Clinical Investigation", body: "CLA (DCGI) reviews and grants approval. Timeline: 90 days. Required before any trial." },
                    ].map((f) => (
                      <div key={f.code} className="bg-white border border-orange-200 rounded-xl p-3">
                        <div className="text-xs font-bold text-orange-700">Form {f.code} — {f.title}</div>
                        <div className="text-xs text-orange-600 mt-0.5">{f.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── AMBIGUOUS CLASSIFICATION (Step 1.6 → 1.7) ── */}
          {isAmbiguous && step !== "done" && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔍</div>
                <div>
                  <div className="text-sm font-bold text-yellow-800 mb-1">Ambiguous Classification — Step 1.7: File CLA Clarification</div>
                  <p className="text-xs text-yellow-700 leading-relaxed mb-3">
                    The AI returned <strong>{result.confidence} confidence</strong>. Under MDR 2017, if classification is ambiguous, you must file a written clarification request to the Central Licensing Authority (DCGI/CLA) before proceeding to Phase 2.
                  </p>
                  <div className="bg-white border border-yellow-200 rounded-xl p-3 mb-3">
                    <div className="text-xs font-bold text-yellow-700">How to File Clarification</div>
                    <ol className="text-xs text-yellow-700 mt-1 space-y-1 list-decimal list-inside">
                      <li>Write to CLA at <strong>cdsco.hq@nic.in</strong></li>
                      <li>Include: Device description, intended use, technical specs</li>
                      <li>Attach: Draft classification rationale</li>
                      <li>Reference: First Schedule Rule no. applied</li>
                      <li>Response timeline: 30–60 days</li>
                    </ol>
                  </div>
                  {result.aiWarnings?.length > 0 && (
                    <ul className="space-y-1">
                      {result.aiWarnings.map((w, i) => <li key={i} className="text-xs text-yellow-800">• {w}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Warnings (non-ambiguous) */}
          {!isAmbiguous && result.aiWarnings?.length > 0 && step !== "done" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">⚠️ AI Notes</h3>
              <ul className="space-y-1">{result.aiWarnings.map((w, i) => <li key={i} className="text-xs text-yellow-800">• {w}</li>)}</ul>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>}

          {/* Actions */}
          {step === "predicate" && (
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-3">
              <button onClick={() => { setResult(null); setStep("input"); }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted hover:text-foreground hover:border-accent/40 transition">
                ↩ Re-run Classification
              </button>
              <button onClick={handleConfirmAndLock} disabled={confirming}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
                {confirming ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Locking…</>) : "🔒 Confirm & Lock Classification"}
              </button>
            </div>
          )}

          {/* Locked success */}
          {step === "done" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-bold text-green-700 mb-1">Classification Locked & Confirmed</div>
              {result.hasPredicate ? (
                <div className="text-xs text-green-600">Predicate: {result.predicateDeviceName} · Proceed to Phase 2</div>
              ) : (
                <div className="text-xs text-orange-600 font-semibold">⚠️ Novel device — complete MD-26/MD-27 before Phase 2</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
