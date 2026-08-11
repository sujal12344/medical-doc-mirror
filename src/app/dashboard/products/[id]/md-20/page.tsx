"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Download, ChevronRight } from "lucide-react";

export default function MD20Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  // Load product from DB
  useEffect(() => {
    if (!docId) { setLoading(false); return; }

    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((prodData) => {
        setProduct(prodData.product || null);
      })
      .finally(() => setLoading(false));
  }, [docId, productId]);

  async function handleGenerate(docType: "form" | "declaration" | "prescription") {
    if (!docId) return;
    setStatusMsg(`Generating MD-20 ${docType}...`);
    setStatusType("info");
    
    try {
      const res = await fetch(`/api/documents/${docId}/generate-md20`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMsg(data.error || `Failed to generate document.`);
        setStatusType("error");
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product?.name || 'product'}_MD-20_${docType}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setStatusMsg(`MD-20 ${docType} generated successfully!`);
      setStatusType("success");
    } catch (err) {
      setStatusMsg("An unexpected error occurred.");
      setStatusType("error");
    } finally {
      setTimeout(() => setStatusMsg(""), 3000);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--ui-purple)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading MD-20 details...</p>
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
            <Link href={`/dashboard/products/${productId}`} className="hover:text-foreground transition flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Product
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">MD-20 Form</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--ui-purple)]/10 flex items-center justify-center text-[var(--ui-purple)]">
              <FileText className="w-4 h-4" />
            </div>
            MD-20 Form Generation
          </h1>
          <p className="text-sm text-muted mt-1">
            Application for Permission to Import Small Quantities. Download the required templates below.
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
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Generate Documents</h2>
            <p className="text-xs text-muted mb-6">Select a document below to download the pre-formatted template for this product.</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-surface2 border border-border rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">MD-20 Form</h3>
                  <p className="text-xs text-muted mt-0.5">Application for Permission to Import Small Quantities</p>
                </div>
                <button
                  onClick={() => handleGenerate("form")}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--ui-purple)] hover:bg-[var(--ui-purple-dark)] text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface2 border border-border rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Bona Fide Personal Use Declaration</h3>
                  <p className="text-xs text-muted mt-0.5">Declaration supporting MD-20</p>
                </div>
                <button
                  onClick={() => handleGenerate("declaration")}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--ui-purple)] hover:bg-[var(--ui-purple-dark)] text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface2 border border-border rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Registered Medical Practitioner Prescription</h3>
                  <p className="text-xs text-muted mt-0.5">Prescription supporting MD-20</p>
                </div>
                <button
                  onClick={() => handleGenerate("prescription")}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--ui-purple)] hover:bg-[var(--ui-purple-dark)] text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Product Context</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Product Name</label>
                <div className="p-2.5 bg-surface2 rounded-lg text-sm text-foreground border border-border">
                  {product?.name || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Manufacturer</label>
                <div className="p-2.5 bg-surface2 rounded-lg text-sm text-foreground border border-border">
                  {product?.manufacturer || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
