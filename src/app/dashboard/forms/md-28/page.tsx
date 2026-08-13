"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Download, ChevronRight } from "lucide-react";

export default function MD28Page() {
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
    setStatusMsg(`Generating MD-28 documents archive...`);
    setStatusType("info");
    
    try {
      const res = await fetch(`/api/documents/${docId}/generate-md28`, {
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
      
      setStatusMsg(`MD-28 documents generated successfully! Click Download ZIP to save.`);
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
    a.download = "MD-28_Documents.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading MD-28 details...</p>
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
            <span className="text-foreground font-medium">MD-28 Form</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <FileText className="w-4 h-4" />
            </div>
            MD-28 Form Generation
          </h1>
          <p className="text-sm text-muted mt-1">
            Grant of permission to sale of an in vitro diagnostic medical device. Download the required templates below.
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
          This will generate a complete set of MD-28 IVD device registration application templates bundled into a single ZIP archive.
        </p>
        
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Included Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "01_MD-28_Cover_Letter_Template.docx",
              "02_Official_Form_MD-28_Template.docx",
              "03_MD-28_Fifth_Schedule_Compliance_Undertaking_Template.docx",
              "04_MD-28_Site_or_Plant_Master_File_Template.docx",
              "05_MD-28_IVD_Device_Master_File_Template.docx",
              "06_MD-28_Device_Data_and_Validation_Report_Template.docx",
              "07_MD-28_Risk_Management_Report_Template.docx",
              "08_MD-28_Clinical_Performance_Evaluation_Data_Report_Template.docx",
              "09_MD-28_Regulatory_Status_and_Restrictions_Statement_Template.docx",
              "10_MD-28_Essential_Principles_Checklist_Template.docx",
              "11_MD-28_Product_Insert_Template.docx",
              "12_MD-28_Labelling_and_Pack_Size_Specification_Template.docx",
              "13_MD-28_Stability_Study_Report_Template.docx",
              "14_MD-28_Power_of_Attorney_Import_Only_Template.docx",
              "15_MD-28_Authorised_Agent_Undertaking_Import_Only_Template.docx",
              "16_MD-28_to_FSC_Product_Correlation_Chart_Import_Only_Template.docx",
              "17_MD-28_CPE_Waiver_Request_Conditional_Template.docx"
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
