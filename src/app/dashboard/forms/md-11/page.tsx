"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

type MD11Doc = {
  _id: string;
  title: string;
  sections?: Record<string, { fields: Record<string, string> }>;
};

type ProductDetails = {
  _id: string;
  name: string;
  manufacturer: string;
  intendedUse: string;
  deviceClass: string;
};

export default function MD11Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const [doc, setDoc] = useState<MD11Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  const [generating, setGenerating] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    manufacturerName: "",
    productName: "",
    intendedUse: "",
    productClass: "",
    manufacturerAddress: "",
    shelfLife: "",
    applicationNumber: "",
    applicationDate: "",
    videNumber: "",
    videDate: "",
    inspectionDate: "",
  });

  // Load document from DB
  useEffect(() => {
    if (!docId) { setLoading(false); return; }

    fetch(`/api/documents/${docId}`)
      .then((r) => r.json())
      .then((docData) => {
        setDoc(docData.document || null);

        // Pre-fill form from saved section fields if they exist
        const savedFields = docData.document?.sections?.["md-11"]?.fields || {};
        setFormData((prev) => ({ 
          ...prev, 
          ...savedFields 
        }));
      })
      .finally(() => setLoading(false));
  }, [docId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSave() {
    if (!docId) return;
    setSaving(true);
    setStatusMsg("Saving details...");
    setStatusType("info");
    
    try {
      const res = await fetch(`/api/documents/${docId}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: "md-11",
          fields: formData,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("Details saved successfully!");
        setStatusType("success");
      } else {
        setStatusMsg(data.error || "Failed to save details.");
        setStatusType("error");
      }
    } catch (err) {
      setStatusMsg("An unexpected error occurred.");
      setStatusType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
  }

  async function handleGenerate() {
    if (!docId) return;
    setGenerating(true);
    setStatusMsg("Generating MD-11 document...");
    setStatusType("info");
    
    try {
      const res = await fetch(`/api/documents/${docId}/generate-md11`, {
        method: "POST",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMsg(data.error || "Failed to generate document.");
        setStatusType("error");
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData?.productName || 'product'}_MD-11_Inspection_Book.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatusMsg("Document generated successfully!");
      setStatusType("success");
    } catch (err) {
      setStatusMsg("An unexpected error occurred.");
      setStatusType("error");
    } finally {
      setGenerating(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
  }

  if (!docId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted text-sm">No document ID found. Go back and click MD-11 Form again.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[var(--accent)] hover:underline">&larr; Back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted text-sm animate-pulse">Loading MD-11 details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/forms" className="text-sm text-muted hover:text-foreground mb-4 inline-block">
            &larr; Back to Forms
          </Link>
          <h1 className="text-2xl font-bold text-foreground">MD-11 Application Details</h1>
          <p className="text-muted text-sm mt-1">{doc?.title}</p>
        </div>
        <div>
          <button
            onClick={handleSave}
            disabled={saving || generating}
            className="text-sm px-6 py-2 bg-surface text-foreground border border-border hover:bg-surface2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Details"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={saving || generating}
            className="text-sm px-6 py-2 bg-foreground text-background hover:opacity-80 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate ZIP Archive"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`mb-6 flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-lg ${
          statusType === "success" ? "bg-[var(--status-success-bg)] text-[var(--status-success)]" :
          statusType === "error"   ? "bg-[var(--status-error-bg)] text-[var(--status-error)]" :
                                     "bg-[var(--accent)]/10 text-[var(--accent)]"
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Included Documents */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Included Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "MD-11_Inspection_Book.docx",
          ].map((filename, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-foreground truncate" title={filename}>
                {filename}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Product & Manufacturer Details (Auto-filled from Product) */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Product & Manufacturer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Manufacturer Name</label>
            <input
              type="text"
              name="manufacturerName"
              value={formData.manufacturerName}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="Enter Manufacturer Name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Manufacturer Address</label>
            <input
              type="text"
              name="manufacturerAddress"
              value={formData.manufacturerAddress}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="e.g. 123 Industrial Park, City"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted mb-1">Product Name</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="Enter Product Name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted mb-1">Intended Use</label>
            <textarea
              name="intendedUse"
              value={formData.intendedUse}
              onChange={(e: any) => handleInputChange(e)}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition min-h-[80px]"
              placeholder="Enter Intended Use"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Product Class</label>
            <select
              name="productClass"
              value={formData.productClass}
              onChange={(e: any) => handleInputChange(e)}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
            >
              <option value="">Select Class</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
              <option value="D">Class D</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Shelf Life (Months)</label>
            <input
              type="text"
              name="shelfLife"
              value={formData.shelfLife}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="e.g. 24 Months"
            />
          </div>
        </div>
      </div>

      {/* Documents Section (Manual Inputs) */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Application & Inspection Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Application Number</label>
            <input
              type="text"
              name="applicationNumber"
              value={formData.applicationNumber}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="Enter Application Number"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Application Date</label>
            <input
              type="date"
              name="applicationDate"
              value={formData.applicationDate}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Vide Number</label>
            <input
              type="text"
              name="videNumber"
              value={formData.videNumber}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
              placeholder="Enter Vide Number"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Vide Date</label>
            <input
              type="date"
              name="videDate"
              value={formData.videDate}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Inspection Date</label>
            <input
              type="date"
              name="inspectionDate"
              value={formData.inspectionDate}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-background rounded-lg text-sm text-foreground border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
