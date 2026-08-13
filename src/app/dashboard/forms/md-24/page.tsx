"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Download, ChevronRight } from "lucide-react";

export default function MD24Page() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); };
  }, [downloadUrl]);

  async function handleGenerate() {
    if (!docId) return;
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }
    setStatusMsg(`Generating MD-24 documents archive...`);
    setStatusType("info");
    
    try {
      const res = await fetch(`/api/documents/${docId}/generate-md24`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMsg(data.error || `Failed to generate documents.`);
        setStatusType("error");
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      setStatusMsg(`MD-24 documents generated successfully! Click Download ZIP to save.`);
      setStatusType("success");
    } catch (err) {
      setStatusMsg("An unexpected error occurred.");
      setStatusType("error");
    } finally {
      setTimeout(() => setStatusMsg(""), 3000);
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "MD-24_Documents.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading MD-24 details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Link href="/dashboard/forms" className="hover:text-foreground transition flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Forms
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">MD-24 Form</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <FileText className="w-4 h-4" />
            </div>
            MD-24 Form Generation
          </h1>
          <p className="text-sm text-muted mt-1">
            Grant of permission to conduct performance evaluation of an in vitro diagnostic medical device. Download the required templates below.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${
          statusType === "success" ? "bg-green-500/10 text-green-500 border-green-500/20" :
          statusType === "error" ? "bg-red-500/10 text-red-500 border-red-500/20" :
          "bg-blue-500/10 text-blue-500 border-blue-500/20"
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Generate Documents</h2>
        <p className="text-sm text-muted mb-6">
          This will generate a complete set of MD-24 performance evaluation application templates bundled into a single ZIP archive.
        </p>
        
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Included Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "01_Cover_Letter_MD24.docx",
              "02_Form_MD24_with_Annexure.docx",
              "03_IVD_Device_Description_IFU_and_Labels.docx",
              "04_In_House_Performance_Evaluation_Report.docx",
              "05_Clinical_Performance_Evaluation_Plan.docx",
              "06_Case_Report_Form.docx",
              "07_Investigator_Undertaking.docx",
              "08_Device_Conformity_and_Safety_Undertaking.docx"
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
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background hover:opacity-80 text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            Generate ZIP Archive
          </button>
          
          {downloadUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-lg shadow-sm transition animate-in fade-in"
            >
              <Download className="w-4 h-4" />
              Download ZIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
