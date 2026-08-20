"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Download, ChevronRight } from "lucide-react";
import { COMMERCIAL_MANUFACTURING_GROUP } from "@/lib/frameworks/asia/india-forms";

export default function MD4Page() {
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
    setStatusMsg(`Generating MD-4 documents...`);
    setStatusType("info");
    setLoading(true);
    
    try {
      const res = await fetch(`/api/documents/${docId}/generate-md4`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMsg(data.error || `Failed to generate documents.`);
        setStatusType("error");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatusMsg(`MD-4 documents generated successfully!`);
      setStatusType("success");
    } catch (err) {
      setStatusMsg("An unexpected error occurred.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "MD-4_Documents.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const md4Form = COMMERCIAL_MANUFACTURING_GROUP.forms.find(f => f.id === 'MD-4');
  const documents = md4Form?.documents || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Link href="/dashboard/forms" className="hover:text-foreground transition flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Forms
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">MD-4 Form</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <FileText className="w-4 h-4" />
            </div>
            MD-4 Form Generation
          </h1>
          <p className="text-sm text-muted mt-1">
            Application for grant of loan licence to manufacture for sale or for distribution of Class A or Class B medical device. Generate and download the required templates in a ZIP archive.
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

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Generate Documents</h2>
        <p className="text-sm text-muted mb-6">
          This will generate the MD-4 templates.
        </p>

        {documents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Included Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background hover:opacity-80 text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate ZIP Archive"}
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
