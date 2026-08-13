"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateMD20Button({ productId, productName }: { productId: string; productName: string }) {
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
          productId,
          countryCode: "IN",
          frameworkId: "IN_MD_20",
          title: `${productName} — MD-20`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/products/${productId}/md-20?docId=${data.document._id}`);
      } else {
        setStatus(data.message || "Failed to create document.");
        setTimeout(() => setStatus(""), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="flex flex-col text-left bg-surface border border-border rounded-xl p-4 hover:border-violet-500/50 hover:shadow-sm transition disabled:opacity-50 w-full"
    >
      <span className="text-sm font-semibold text-foreground">MD-20 Forms</span>
      <span className="text-xs text-muted mt-1 line-clamp-2">Application for Permission to Import Small Quantities</span>
      {loading && status && (
        <p className="text-[10px] text-violet-500 mt-2 font-medium animate-pulse">{status}</p>
      )}
      {!loading && status && (
        <p className="text-[10px] text-red-500 mt-2">{status}</p>
      )}
    </button>
  );
}
