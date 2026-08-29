"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Upload, Loader2, FileText, AlertCircle, Pencil } from "lucide-react";

type CompanyData = {
  _id: string;
  companyName: string;
  companyEmail: string;
  companyNumber?: string;
  description?: string;
  country?: string;
};

type CoiData = {
  fileName: string;
  extractedAt: string;
  applicantName: string;
  bodyConstitution: string;
  registeredOfficeAddress: string;
  incorporationDate: string;
  cinNumber: string;
  signatories: { name: string; designation: string }[];
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [form, setForm] = useState({ companyName: "", companyNumber: "", description: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // COI state
  const [coiData, setCoiData] = useState<CoiData | null>(null);
  const [coiUploading, setCoiUploading] = useState(false);
  const [coiError, setCoiError] = useState("");
  const [coiDragOver, setCoiDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/companies/me").then((r) => r.json()).then((data) => {
        if (data.company) {
          setCompany(data.company);
          setForm({
            companyName: data.company.companyName || "",
            companyNumber: data.company.companyNumber || "",
            description: data.company.description || "",
            country: data.company.country || ""
          });
        }
      });
      // Load existing COI data
      fetch("/api/companies/me/coi").then((r) => r.json()).then((data) => {
        if (data.coiData) setCoiData(data.coiData);
      });
    }
  }, [status]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/companies/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) setMsg("Settings saved successfully");
      else setMsg("Failed to save");
    } catch {
      setMsg("Connection error");
    }
    setSaving(false);
  }

  async function handleCoiUpload(file: File) {
    setCoiUploading(true);
    setCoiError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/companies/me/coi", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoiData(data.coiData);
    } catch (err) {
      setCoiError((err as Error).message);
    } finally {
      setCoiUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleCoiUpload(file);
    e.target.value = ""; // reset so same file can be re-uploaded
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setCoiDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCoiUpload(file);
  }

  if (status === "loading" || !company) {
    return <div className="p-8"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Company Settings</h1>
        <p className="text-sm text-muted">Manage your company profile and regulatory identity documents</p>
      </div>

      {/* ─── Basic Info Form ────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
        <h2 className="text-base font-bold text-foreground mb-1">Basic Information</h2>

        {msg && (
          <div className={`text-sm rounded-lg px-4 py-3 ${msg.includes("success") ? "bg-green-500/10 border border-green-500/30 text-green-600" : "bg-red-500/10 border border-red-500/30 text-red-600"}`}>
            {msg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Company Email</label>
          <input type="email" disabled value={company.companyEmail}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm text-muted cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Company Name</label>
          <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Company Number</label>
            <input type="tel" value={form.companyNumber} onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Country</label>
            <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" placeholder="e.g. IN, US" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" rows={3} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* ─── COI / Company Identity Document ───────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-foreground">Certificate of Incorporation (COI)</h2>
            <p className="text-sm text-muted mt-1">
              Upload your company&apos;s registration document once. We&apos;ll extract your corporate details automatically
              and use them to pre-fill all regulatory forms (MD-3, MD-7, MD-14, etc.).
            </p>
          </div>
          {coiData && (
            <span className="shrink-0 ml-4 flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>

        {/* Upload zone */}
        {!coiData ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setCoiDragOver(true); }}
            onDragLeave={() => setCoiDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-5 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
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
          </div>
        ) : (
          /* Extracted data display */
          <div className="mt-5 space-y-4">
            {/* Source file */}
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

            {/* Extracted fields */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Company Name", value: coiData.applicantName },
                { label: "Legal Entity Type", value: coiData.bodyConstitution },
                { label: "CIN / Registration No.", value: coiData.cinNumber },
                { label: "Date of Incorporation", value: coiData.incorporationDate },
                { label: "Registered Office Address", value: coiData.registeredOfficeAddress },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border/60 bg-surface/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-foreground mt-0.5">{value || <span className="text-muted italic">Not found</span>}</p>
                  </div>
                </div>
              ))}

              {/* Signatories */}
              {coiData.signatories?.length > 0 && (
                <div className="px-4 py-3 rounded-xl border border-border/60 bg-surface/40">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Authorized Signatories</p>
                  <div className="space-y-1.5">
                    {coiData.signatories.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {s.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          {s.designation && <span className="text-xs text-muted ml-1.5">· {s.designation}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {coiError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {coiError}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
