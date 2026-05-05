"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Plan = {
  name: string;
  monthly: string;
  yearly: string;
  desc: string;
  features: string[];
  popular?: boolean;
};

export default function PricingInteractive({ plans }: { plans: Plan[] }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const computed = useMemo(() => {
    return plans.map((p) => ({
      ...p,
      price: billing === "monthly" ? p.monthly : p.yearly,
      period: billing === "monthly" ? "/mo" : "/yr",
      note: billing === "yearly" ? "Best value" : "",
    }));
  }, [plans, billing]);

  return (
    <div>
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              billing === "monthly" ? "bg-[var(--accent)] text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              billing === "yearly" ? "bg-[var(--accent)] text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Yearly
          </button>
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/15 ml-1">
            Save up to 20%
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {computed.map((p) => (
          <div
            key={p.name}
            className={`group relative bg-surface border rounded-2xl p-6 transition hover:-translate-y-0.5 ${
              p.popular
                ? "border-[var(--accent)] shadow-xl shadow-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20"
                : "border-border hover:border-[var(--accent)]/25 hover:shadow-sm"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                Most popular
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <p className="text-xs text-muted mt-1">{p.desc}</p>
              </div>
              {p.note && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/15">
                  {p.note}
                </span>
              )}
            </div>

            <div className="mt-5 mb-5">
              <span className="text-4xl font-bold text-foreground">{p.price}</span>
              <span className="text-sm text-muted">{p.period}</span>
              {billing === "yearly" && p.name !== "Enterprise" && (
                <div className="text-[10px] text-muted mt-1">Billed annually</div>
              )}
            </div>

            <Link
              href="/register"
              className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                p.popular
                  ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  : "bg-surface2 border border-border hover:border-[var(--accent)]/40 text-foreground"
              }`}
            >
              Get started
            </Link>

            <div className="mt-6 space-y-2.5">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-muted">
                  <svg
                    className="w-3.5 h-3.5 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

