"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Download, ChevronRight } from "lucide-react";
import { CDSCO_FORM_GROUPS } from "@/lib/frameworks/asia/india-forms";
import { DocumentSourceList } from "@/components/forms/DocumentSourceList";
import { DynamicExtractionModal } from "@/components/forms/DynamicExtractionModal";

export default function DynamicFormPage() {
  const params = useParams<{ formId: string }>();
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const formId = params.formId || "";
  const formIdUpper = formId.toUpperCase();
  const apiRouteId = formId.toLowerCase().replace("-", "");

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [contextProducts, setContextProducts] = useState<any[]>([]);

  // Dynamic Extraction States
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    if (!docId) return;
    try {
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      if (data.products) setContextProducts(data.products);
      if (data.prefillData) {
        setOverrides(prev => ({ ...data.prefillData, ...prev }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [docId]);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  let matchedForm = null;
  for (const group of CDSCO_FORM_GROUPS) {
    const f = group.forms.find((f) => f.id === formIdUpper);
    if (f) {
      matchedForm = f;
      break;
    }
  }

  const documents = matchedForm?.documents || [];

  async function handleGenerate(ignoreMissing = false) {
    if (!docId) return;
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setStatusMsg(ignoreMissing ? `Generating ${formIdUpper} documents anyway...` : `Generating ${formIdUpper} documents...`);
    setStatusType("info");
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${docId}/forms/${formIdUpper}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides, ignoreMissing }),
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatusMsg(data.error || `Failed to generate documents.`);
          setStatusType("error");
          return;
        }
        if (data.requiresUpload) {
          setMissingKeys(data.missingKeys);
          setShowUploadModal(true);
          setStatusMsg("Missing clinical fields detected. Please upload source documents.");
          setStatusType("info");
          return;
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatusMsg(`${formIdUpper} documents generated successfully!`);
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
    a.download = `${formIdUpper}_Documents.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDynamicUpload() {
    if (!docId || uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append("files", file));
      formData.append("missingKeys", JSON.stringify(missingKeys));

      const res = await fetch(`/api/documents/${docId}/extract-dynamic`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to extract data");
      }

      // Close modal and generate again automatically
      setShowUploadModal(false);
      setUploadFiles([]);
      
      // Refresh the page data so the Preview UI shows the newly extracted fields
      await loadData();
      
      await handleGenerate(false); // Try generating normally again
    } catch (err: any) {
      alert("Extraction failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!matchedForm) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-foreground">Form Not Found</h1>
        <p className="text-muted mt-2">The form {formIdUpper} does not exist.</p>
        <Link href="/dashboard/forms" className="text-[var(--accent)] hover:underline mt-4 inline-block">
          Return to Forms Library
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Link href="/dashboard/forms" className="hover:text-foreground transition flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Forms
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{formIdUpper} Form</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <FileText className="w-4 h-4" />
            </div>
            {formIdUpper} Form Generation
          </h1>
          <p className="text-sm text-muted mt-1">
            {matchedForm.name}. Generate and download the required templates in a ZIP archive.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${
            statusType === "success"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : statusType === "error"
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
          }`}
        >
          {statusMsg}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Generate Documents</h2>
        <p className="text-sm text-muted mb-6">This will generate the {formIdUpper} templates.</p>

        {/* Note: pass down the overrides state and setter */}
        <DocumentSourceList 
           documents={documents} 
           formId={formIdUpper} 
           overrides={overrides}
           setOverrides={setOverrides} 
           contextProducts={contextProducts}
        />

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleGenerate(false)}
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

      {/* Dynamic Extraction Modal */}
      <DynamicExtractionModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        missingKeys={missingKeys}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        uploading={uploading}
        onExtract={handleDynamicUpload}
        onGenerateAnyway={() => {
          setShowUploadModal(false);
          setUploadFiles([]);
          handleGenerate(true); // true = force generate regardless of missing fields
        }}
      />
    </div>
  );
}
