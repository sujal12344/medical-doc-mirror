"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BusinessSetupProps {
  initialSetup: {
    gstNumber: string;
    msmeNumber: string;
    iecCode: string;
    trademarkStatus: string;
    domainName: string;
  };
}

const CHECKLIST_ITEMS = [
  { key: "gstNumber", label: "GST Registration", description: "Tax registration for trading and manufacturing in India", placeholder: "Enter GST Number" },
  { key: "msmeNumber", label: "MSME / Udyam Aadhaar", description: "Registration for micro, small and medium enterprises", placeholder: "Enter MSME Number" },
  { key: "iecCode", label: "Importer-Exporter Code (IEC)", description: "Required if importing raw materials or exporting finished goods", placeholder: "Enter IEC Code" },
  { key: "trademarkStatus", label: "Trademark Filing (TM-A)", description: "Brand name and logo protection status", placeholder: "Enter Trademark Status" },
  { key: "domainName", label: "Domain Name", description: "Company website domain registration", placeholder: "Enter Domain Name" },
] as const;

export default function BusinessSetupWidget({ initialSetup }: BusinessSetupProps) {
  const [setup, setSetup] = useState(initialSetup || {
    gstNumber: "",
    msmeNumber: "",
    iecCode: "",
    trademarkStatus: "",
    domainName: "",
  });
  
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleSave = async (key: keyof typeof setup) => {
    const newValue = editValue.trim();
    setSetup({ ...setup, [key]: newValue });
    setIsUpdating(true);

    try {
      const res = await fetch("/api/companies/me/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSetup: { [key]: newValue } }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch (error) {
      console.error(error);
      // Revert on error
      setSetup({ ...setup, [key]: initialSetup[key] });
    } finally {
      setIsUpdating(false);
      setEditingKey(null);
    }
  };

  const completedCount = Object.values(setup).filter((v) => typeof v === 'string' && v.trim() !== "").length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden h-full">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Phase 0: Business Setup</h2>
            <p className="text-xs text-muted mt-1">Prerequisites before starting the medical device registration.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--accent)]">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface2 rounded-full h-1.5 mb-6">
          <div 
            className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const value = typeof setup[item.key] === 'string' ? setup[item.key] : "";
            const isCompleted = value.trim() !== "";
            const isEditing = editingKey === item.key;

            return (
              <div 
                key={item.key} 
                className={`p-3 rounded-lg border transition-all ${
                  isCompleted && !isEditing
                    ? "bg-[var(--accent)]/5 border-[var(--accent)]/30" 
                    : isEditing
                    ? "bg-white border-[var(--accent)] ring-1 ring-[var(--accent)]/50"
                    : "bg-surface hover:bg-surface2 border-border"
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={item.placeholder}
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(item.key)}
                      />
                      <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                        <button 
                          onClick={() => handleSave(item.key)}
                          disabled={isUpdating}
                          className="px-4 py-1.5 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingKey(null)}
                          className="px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => {
                    setEditingKey(item.key);
                    setEditValue(value);
                  }}>
                    <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                        isCompleted ? "bg-[var(--accent)] border-[var(--accent)]" : "border-slate-300 bg-white"
                      }`}>
                        {isCompleted && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition-colors ${isCompleted ? "text-foreground" : "text-foreground"}`}>
                        {item.label}
                      </p>
                      {isCompleted ? (
                        <p className="text-xs font-mono text-[var(--accent)] mt-0.5 truncate bg-[var(--accent)]/10 inline-block px-1.5 py-0.5 rounded max-w-full">
                          {value}
                        </p>
                      ) : (
                        <p className="text-xs text-muted mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
