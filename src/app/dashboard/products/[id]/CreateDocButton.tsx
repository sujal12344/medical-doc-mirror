"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RegulatoryFramework } from "@/lib/frameworks";

export default function CreateDocButton({
  framework, productId, productName, fieldCount, hasUploadedDocs,
}: {
  framework: RegulatoryFramework;
  productId: string;
  productName: string;
  fieldCount?: number;
  hasUploadedDocs?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function create() {
    setLoading(true);
    setStatus("Creating document...");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextPayload: { productId },
          countryCode: framework.countryCode,
          frameworkId: framework.id,
          title: `${productName} — ${framework.documentType} (${framework.countryName})`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const docId = data.document._id;

        if (hasUploadedDocs) {
          setStatus("AI auto-filling from your documents...");
          try {
            await fetch(`/api/documents/${docId}/autofill`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
          } catch { /* continue even if autofill fails */ }
        }

        router.push(`/dashboard/documents/${docId}`);
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <button onClick={create} disabled={loading}
      className="bg-surface border border-border rounded-xl p-4 hover:border-[var(--accent)]/40 hover:shadow-sm transition text-left disabled:opacity-50 w-full">
      <p className="font-semibold text-foreground text-sm leading-tight">{framework.documentType}</p>
      <p className="text-[10px] text-muted mt-1">{framework.authority} &middot; {framework.sections.length} sections</p>
      {fieldCount != null && (
        <p className="text-[10px] text-muted">{fieldCount} fields</p>
      )}
      {hasUploadedDocs && !loading && (
        <p className="text-[10px] text-[var(--accent)] mt-1 font-medium">Will auto-fill from uploaded docs</p>
      )}
      {loading && status && (
        <p className="text-[10px] text-[var(--accent)] mt-1 font-medium animate-pulse">{status}</p>
      )}
    </button>
  );
}
