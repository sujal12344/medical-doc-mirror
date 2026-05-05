"use client";

import { useState } from "react";

export default function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3 p-6">
      {faqs.map((f, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={f.q}
            className={`bg-surface border rounded-2xl transition ${
              isOpen ? "border-[var(--accent)]/25 shadow-sm" : "border-border hover:border-[var(--accent)]/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <p className="text-sm font-semibold text-foreground">{f.q}</p>
              <span
                className={`w-8 h-8 rounded-xl border border-border bg-surface2 flex items-center justify-center text-muted transition ${
                  isOpen ? "rotate-45 text-[var(--accent)] border-[var(--accent)]/25 bg-[var(--accent)]/5" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm text-muted leading-relaxed">{f.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

