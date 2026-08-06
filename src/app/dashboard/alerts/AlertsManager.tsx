"use client";

import { useState } from "react";
import { UploadCloud, Trash2, FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface License {
  _id: string;
  fileName: string;
  documentUrl: string;
  licenseType: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedAt: string;
}

export default function AlertsManager({ initialLicenses, companyId, mode = "vault" }: { initialLicenses: License[], companyId: string, mode?: "vault" | "alerts" }) {
  const [licenses, setLicenses] = useState<License[]>(initialLicenses);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const filteredLicenses = mode === "alerts" 
    ? licenses.filter(l => {
        if (!l.expiryDate) return false;
        const daysUntilExpiry = Math.floor((new Date(l.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        return daysUntilExpiry <= 90;
      })
    : licenses;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".docx") && !file.name.toLowerCase().endsWith(".doc")) {
      setError("Please upload a valid PDF or Word Document (.docx, .doc).");
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/companies/${companyId}/licenses`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      setLicenses((prev) => [...prev, data.license]);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = "";
    }
  };

  const handleDelete = async (licenseId: string) => {
    if (!confirm("Are you sure you want to remove this license?")) return;

    try {
      const res = await fetch(`/api/companies/${companyId}/licenses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });

      if (!res.ok) throw new Error("Delete failed");
      setLicenses((prev) => prev.filter((l) => l._id !== licenseId));
    } catch (err) {
      alert("Failed to delete license.");
    }
  };

  const getStatusBadge = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-surface2 text-muted">
          <FileText className="w-3 h-3 shrink-0" /> Perpetual / Unknown
        </span>
      );
    }

    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / msInDay);

    if (daysUntilExpiry < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[var(--status-error-bg)] text-[var(--status-error)] border border-[var(--status-error-border)] shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-error)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--status-error)]"></span>
          </span>
          Expired ({Math.abs(daysUntilExpiry)} days ago)
        </span>
      );
    } else if (daysUntilExpiry <= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] shadow-[0_0_15px_rgba(234,179,8,0.15)]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-warning)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--status-warning)]"></span>
          </span>
          Expiring Soon ({daysUntilExpiry} days)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle2 className="w-3 h-3 shrink-0" /> Valid
        </span>
      );
    }
  };

  const getValidityDuration = (issue?: string, expiry?: string) => {
    if (!issue || !expiry) return "Perpetual";
    const diffTime = Math.abs(new Date(expiry).getTime() - new Date(issue).getTime());
    const diffYears = Math.round(diffTime / (1000 * 60 * 60 * 24 * 365));
    return `${diffYears} Years`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Box (Hidden in Alerts mode) */}
      {mode === "vault" && (
        <div className="bg-surface border border-border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">Upload Regulatory License</h3>
          <p className="text-sm text-muted max-w-md mb-6">
            Upload a PDF or DOCX of your MD-9, MD-17, or any CDSCO license. Our AI will automatically detect the license type and expiry date to alert you before it expires.
          </p>

          <label className="relative cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
            <span>{isUploading ? "Extracting Data with AI..." : "Select Document"}</span>
            <input 
              type="file" 
              accept="application/pdf,.docx,.doc" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading} 
            />
          </label>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        </div>
      )}

      {/* Licenses Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface2/50">
          <h3 className="text-sm font-bold text-foreground">
            {mode === "alerts" ? "Licenses Requiring Attention" : "Your Licenses"}
          </h3>
        </div>
        
        {filteredLicenses.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            {mode === "alerts" ? "No urgent alerts! All your licenses are valid." : "No licenses uploaded yet. Upload one above to see your alerts."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface2/30 text-muted text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">License Type</th>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">Issue Date</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3">Validity</th>
                  <th className="px-6 py-3">Status / Alerts</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLicenses.map((license) => (
                  <tr key={license._id} className="hover:bg-surface2/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--accent)]">
                      {license.licenseType}
                    </td>
                    <td className="px-6 py-4">
                      <a href={license.documentUrl} target="_blank" rel="noreferrer" className="text-foreground hover:underline flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted" />
                        <span className="truncate max-w-[150px] inline-block" title={license.fileName}>{license.fileName}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {license.issueDate ? new Date(license.issueDate).toLocaleDateString('en-GB') : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('en-GB') : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted font-medium">
                      {getValidityDuration(license.issueDate, license.expiryDate)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(license.expiryDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(license._id)}
                        className="text-muted hover:text-red-500 transition-colors p-1"
                        title="Remove License"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
