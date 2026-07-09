"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UploadedDoc = {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
};

type TestLicenseDoc = {
  _id: string;
  title: string;
  status: string;
  uploadedDocs?: UploadedDoc[];
};

export default function TestLicensePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const docId = searchParams.get("docId");

  const [doc, setDoc] = useState<TestLicenseDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  // Stores the object URL of the generated ZIP so user can re-download without re-generating
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke old object URLs on unmount
  useEffect(() => {
    return () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); };
  }, [downloadUrl]);

  // Load document from DB
  useEffect(() => {
    if (!docId) { setLoading(false); return; }
    fetch(`/api/documents/${docId}`)
      .then((r) => r.json())
      .then((data) => { setDoc(data.document || null); })
      .finally(() => setLoading(false));
  }, [docId]);

  // Upload IFU / reference doc
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !docId) return;
    // Reset any previous generation when new file is uploaded
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }
    setUploading(true);
    setStatusMsg("Uploading file...");
    setStatusType("info");
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`/api/documents/${docId}/upload-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setDoc(data.document);
        setStatusMsg("File uploaded successfully.");
        setStatusType("success");
      } else {
        setStatusMsg(data.message || "Upload failed.");
        setStatusType("error");
      }
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  // Delete uploaded doc
  async function handleDelete(fileName: string) {
    if (!docId) return;
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }
    const res = await fetch(`/api/documents/${docId}/upload-doc`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });
    const data = await res.json();
    if (res.ok) setDoc(data.document);
  }

  // Generate ZIP — stores URL in state, does NOT auto-download
  async function handleGenerate() {
    if (!docId) return;
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }
    setGenerating(true);
    setStatusMsg("Extracting data and generating documents — this may take up to 30 seconds...");
    setStatusType("info");
    try {
      const res = await fetch(`/api/documents/${docId}/generate-test-license`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMsg(data.message || "Generation failed.");
        setStatusType("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatusMsg("Documents generated successfully! Click Download ZIP to save.");
      setStatusType("success");
    } catch {
      setStatusMsg("An unexpected error occurred. Please try again.");
      setStatusType("error");
    } finally {
      setGenerating(false);
    }
  }

  // Trigger browser download of the already-generated ZIP
  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "test-license-docs.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (!docId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted text-sm">No document ID found. Go back and click Test License again.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-violet-500 hover:underline">&larr; Back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted text-sm animate-pulse">Loading document...</p>
      </div>
    );
  }

  const uploadedCount = (doc?.uploadedDocs ?? []).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-foreground mb-4 inline-block">
          &larr; Back to Product
        </button>
        <h1 className="text-2xl font-bold text-foreground">Test License Application</h1>
        <p className="text-muted text-sm mt-1">{doc?.title}</p>
      </div>

      {/* Upload Section */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Reference Documents</h2>
            <p className="text-xs text-muted mt-0.5">Upload the IFU or any reference document to auto-generate the Test License forms.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "+ Upload File"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          className="hidden"
          onChange={handleUpload}
        />

        {/* Clickable drop zone */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-500/5 transition mb-4"
        >
          <svg className="w-8 h-8 mx-auto mb-2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm text-muted">{uploading ? "Uploading..." : "Click or drop a file here — any format supported"}</p>
          <p className="text-xs text-muted/60 mt-1">PDF, DOCX, DOC, XLSX, images, etc.</p>
        </div>

        {/* Uploaded Docs List */}
        {uploadedCount > 0 ? (
          <ul className="space-y-2">
            {(doc?.uploadedDocs ?? []).map((d) => (
              <li key={d.fileName} className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.fileName}</p>
                    <p className="text-xs text-muted">{new Date(d.uploadedAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.fileName)}
                  className="text-xs text-red-500 hover:text-red-400 transition shrink-0 ml-4"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted text-sm">
            No files uploaded yet. Upload the IFU to generate documents.
          </div>
        )}
      </div>

      {/* Generate & Download Section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Generate Documents</h2>
            <p className="text-xs text-muted mt-0.5">
              Generates all 8 Test License forms as a downloadable ZIP by extracting data from your uploaded documents using AI.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Download button — only shown after successful generation */}
            {downloadUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-sm px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ZIP
              </button>
            )}
            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || uploadedCount === 0}
              className="text-sm px-5 py-2 bg-foreground text-background hover:opacity-80 rounded-lg font-medium transition disabled:opacity-30"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating...
                </span>
              ) : downloadUrl ? "Re-generate" : "Generate"}
            </button>
          </div>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
            statusType === "success" ? "bg-green-500/10 text-green-600" :
            statusType === "error"   ? "bg-red-500/10 text-red-500" :
                                       "bg-violet-500/10 text-violet-500"
          }`}>
            {statusType === "success" && (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {statusType === "error" && (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {statusType === "info" && (
              <svg className="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
