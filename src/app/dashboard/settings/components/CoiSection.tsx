"use client";

import { useState, useRef } from "react";
import { CheckCircle, Upload, Loader2, FileText, AlertCircle, Pencil, Building2, Briefcase, MapPin, Users } from "lucide-react";

export type CoiData = {
  fileName: string;
  extractedAt: string;
  applicantName: string;
  bodyConstitution: string;
  registeredOfficeAddress: string;
  pinCode?: string;
  state?: string;
  district?: string;
  rocLocation?: string;
  panNumber?: string;
  tanNumber?: string;
  incorporationDate: string;
  cinNumber: string;
  signatories: { name: string; designation: string }[];
};

type Props = {
  coiData: CoiData | null;
  onUploadSuccess: (data: CoiData) => void;
};

const TABS = [
  {
    id: "identity",
    label: "Identity",
    icon: Building2,
    getFields: (data: CoiData) => [
      { label: "Company Name", value: data.applicantName },
      { label: "Legal Entity Type", value: data.bodyConstitution },
      { label: "CIN / Registration No.", value: data.cinNumber },
      { label: "Date of Incorporation", value: data.incorporationDate },
    ].filter(item => item.value)
  },
  {
    id: "tax",
    label: "Tax & Reg",
    icon: Briefcase,
    getFields: (data: CoiData) => [
      { label: "RoC Location", value: data.rocLocation },
      { label: "PAN", value: data.panNumber },
      { label: "TAN", value: data.tanNumber },
    ].filter(item => item.value)
  },
  {
    id: "address",
    label: "Address",
    icon: MapPin,
    getFields: (data: CoiData) => [
      { label: "District / City", value: data.district },
      { label: "State", value: data.state },
      { label: "PIN Code", value: data.pinCode },
    ].filter(item => item.value)
  }
];

export default function CoiSection({ coiData, onUploadSuccess }: Props) {
  const [coiUploading, setCoiUploading] = useState(false);
  const [coiError, setCoiError] = useState("");
  const [coiDragOver, setCoiDragOver] = useState(false);
  const [coiActiveTab, setCoiActiveTab] = useState("identity");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCoiUpload(file: File) {
    setCoiUploading(true);
    setCoiError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/companies/me/coi", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploadSuccess(data.coiData);
    } catch (err) {
      setCoiError((err as Error).message);
    } finally {
      setCoiUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleCoiUpload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setCoiDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCoiUpload(file);
  }

  const activeTabConfig = TABS.find(t => t.id === coiActiveTab);

  return (
    <div className="w-full xl:w-[60%] bg-surface border border-border rounded-2xl p-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-foreground">Certificate of Incorporation (COI)</h2>
          <p className="text-sm text-muted mt-1">
            Upload your company&apos;s registration document once. We&apos;ll extract your corporate details automatically
            and use them to pre-fill all regulatory forms (MD-3, MD-7, MD-14, etc.).
          </p>
        </div>
        {coiData && (
          <span className="shrink-0 ml-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Extracted
          </span>
        )}
      </div>

      {!coiData ? (
        <button
          type="button"
          onDragOver={(e) => { e.preventDefault(); setCoiDragOver(true); }}
          onDragLeave={() => setCoiDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full mt-5 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${coiDragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-border hover:border-[var(--accent)]/50 hover:bg-surface2/60"}`}
        >
          {coiUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
              <p className="text-sm font-medium text-foreground">Extracting company details…</p>
              <p className="text-xs text-muted">This usually takes 5-10 seconds</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Drop your COI here or click to browse</p>
                <p className="text-xs text-muted mt-1">Accepts PDF, DOCX, or TXT · Certificate of Incorporation / Company Registration</p>
              </div>
            </>
          )}
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-surface2/60 rounded-xl border border-border/60">
            <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{coiData.fileName}</p>
              <p className="text-[11px] text-muted">
                Extracted {new Date(coiData.extractedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-surface2"
            >
              <Pencil className="w-3 h-3" /> Replace
            </button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface/30 overflow-hidden shadow-sm">
            <div className="flex border-b border-border/60 bg-surface/50 overflow-x-auto">
              {[...TABS, { id: "signatories", label: "Signatories", icon: Users }].map((tab) => {
                const Icon = tab.icon;
                const isActive = coiActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCoiActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap outline-none flex-1 justify-center ${
                      isActive 
                        ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-surface" 
                        : "text-muted hover:text-foreground hover:bg-surface2/40 border-b-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTabConfig && (
                <div className="space-y-5">
                  {coiActiveTab === "address" && coiData.registeredOfficeAddress && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Full Address</p>
                      <p className="text-sm text-foreground font-medium leading-relaxed">{coiData.registeredOfficeAddress}</p>
                    </div>
                  )}
                  {activeTabConfig.getFields(coiData).length > 0 ? (
                    activeTabConfig.getFields(coiData).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm text-foreground font-medium">{value}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted italic">No details extracted.</p>
                  )}
                </div>
              )}

              {coiActiveTab === "signatories" && (
                <div className="space-y-3">
                  {coiData.signatories?.length > 0 ? (
                    coiData.signatories.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface2/50 border border-border/40">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold flex items-center justify-center shrink-0">
                          {s.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                          {s.designation && <p className="text-[11px] text-muted truncate mt-0.5">{s.designation}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted italic">No signatories found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {coiError && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {coiError}
        </div>
      )}

      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={onFileChange} />
    </div>
  );
}
